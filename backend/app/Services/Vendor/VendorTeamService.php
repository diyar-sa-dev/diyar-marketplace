<?php

namespace App\Services\Vendor;

use App\Enums\VendorTeamRole;
use App\Enums\VendorTeamStatus;
use App\Events\Domain\TeamInvitationReceived;
use App\Events\Domain\TeamMemberAdded;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorTeamMember;
use App\Services\Mail\DiyarPhpMailer;
use App\Services\Media\MediaUploadService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

final class VendorTeamService
{
    public function __construct(
        private readonly VendorAccessService $access,
        private readonly VendorTeamRoleSync $roleSync,
        private readonly DiyarPhpMailer $mailer,
        private readonly MediaUploadService $media,
    ) {}

    /**
     * @return array{items: list<array<string, mixed>>, pagination: array<string, int|null>}
     */
    public function list(User $actor, int $page = 1, int $perPage = 10, ?string $status = null): array
    {
        $vendorAccount = $this->access->requireOwner($actor);
        $owner = $vendorAccount->user()->first();
        $effectiveStatus = $status ?? 'active';

        $membersQuery = VendorTeamMember::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->whereNotIn('status', [VendorTeamStatus::Removed, VendorTeamStatus::Rejected])
            ->with('user')
            ->orderByDesc('created_at');

        if ($effectiveStatus === 'invited') {
            $membersQuery->where('status', VendorTeamStatus::Invited);
        } elseif ($effectiveStatus === 'active') {
            $membersQuery->where('status', VendorTeamStatus::Active);
        }

        $members = $membersQuery->paginate($perPage, ['*'], 'page', $page);

        $items = $effectiveStatus === 'invited'
            ? $members->getCollection()->map(fn (VendorTeamMember $member) => $this->memberPayload($member))
            : collect([
                $this->ownerPayload($owner, $vendorAccount),
            ])->merge(
                $members->getCollection()->map(fn (VendorTeamMember $member) => $this->memberPayload($member)),
            );

        $total = $effectiveStatus === 'invited'
            ? $members->total()
            : $members->total() + 1;

        return [
            'items' => $items->values()->all(),
            'pagination' => [
                'current_page' => $members->currentPage(),
                'last_page' => $members->lastPage(),
                'per_page' => $members->perPage(),
                'total' => $total,
            ],
        ];
    }

    public function invite(User $actor, string $email, VendorTeamRole $role, string $locale = 'ar'): VendorTeamMember
    {
        if ($role === VendorTeamRole::Owner) {
            throw new InvalidArgumentException(__('diyar.vendor.team.owner_not_invitable'));
        }

        $vendorAccount = $this->access->requireOwner($actor);
        $normalizedEmail = strtolower(trim($email));

        if ($vendorAccount->user?->email !== null && strtolower($vendorAccount->user->email) === $normalizedEmail) {
            throw ValidationException::withMessages([
                'email' => [__('diyar.vendor.team.cannot_invite_owner')],
            ]);
        }

        $existing = VendorTeamMember::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->where('email', $normalizedEmail)
            ->first();

        if ($existing !== null) {
            if (in_array($existing->status, [VendorTeamStatus::Removed, VendorTeamStatus::Rejected], true)) {
                return $this->reinvite($actor, $vendorAccount, $existing, $role, $locale);
            }

            throw ValidationException::withMessages([
                'email' => [__('diyar.vendor.team.already_invited')],
            ]);
        }

        return DB::transaction(function () use ($actor, $vendorAccount, $normalizedEmail, $role, $locale) {
            $matchedUser = User::query()->whereRaw('LOWER(email) = ?', [$normalizedEmail])->first();
            $token = Str::random(48);

            $member = VendorTeamMember::query()->create([
                'vendor_account_id' => $vendorAccount->id,
                'user_id' => $matchedUser?->id,
                'email' => $normalizedEmail,
                'role' => $role,
                'status' => VendorTeamStatus::Invited,
                'invite_token' => $token,
                'invited_at' => now(),
                'accepted_at' => null,
                'invited_by_user_id' => $actor->id,
            ]);

            $this->sendInviteEmail($member, $vendorAccount, $locale, $matchedUser === null);

            $freshMember = $member->fresh('user');
            if ($matchedUser !== null) {
                DB::afterCommit(fn () => event(new TeamInvitationReceived($freshMember)));
            }

            return $freshMember;
        });
    }

    private function reinvite(
        User $actor,
        VendorAccount $vendorAccount,
        VendorTeamMember $member,
        VendorTeamRole $role,
        string $locale,
    ): VendorTeamMember {
        return DB::transaction(function () use ($actor, $vendorAccount, $member, $role, $locale) {
            $matchedUser = User::query()
                ->whereRaw('LOWER(email) = ?', [strtolower($member->email)])
                ->first();
            $token = Str::random(48);

            $member->update([
                'user_id' => $matchedUser?->id,
                'role' => $role,
                'status' => VendorTeamStatus::Invited,
                'invite_token' => $token,
                'invited_at' => now(),
                'accepted_at' => null,
                'invited_by_user_id' => $actor->id,
            ]);

            $this->sendInviteEmail($member->fresh(), $vendorAccount, $locale, $matchedUser === null);

            $freshMember = $member->fresh('user');
            if ($matchedUser !== null) {
                DB::afterCommit(fn () => event(new TeamInvitationReceived($freshMember)));
            }

            return $freshMember;
        });
    }

    public function updateRole(User $actor, VendorTeamMember $member, VendorTeamRole $role): VendorTeamMember
    {
        $vendorAccount = $this->access->requireOwner($actor);

        if ($member->vendor_account_id !== $vendorAccount->id || $role === VendorTeamRole::Owner) {
            throw new InvalidArgumentException(__('diyar.auth.forbidden'));
        }

        $member->update(['role' => $role]);

        return $member->fresh('user');
    }

    public function remove(User $actor, VendorTeamMember $member): void
    {
        $vendorAccount = $this->access->requireOwner($actor);

        if ($member->vendor_account_id !== $vendorAccount->id) {
            throw new InvalidArgumentException(__('diyar.auth.forbidden'));
        }

        DB::transaction(function () use ($member) {
            $lockedMember = VendorTeamMember::query()
                ->whereKey($member->id)
                ->lockForUpdate()
                ->firstOrFail();

            $userId = $lockedMember->user_id;
            $wasActive = $lockedMember->status === VendorTeamStatus::Active;

            $lockedMember->update([
                'status' => VendorTeamStatus::Removed,
                'invite_token' => null,
            ]);

            if ($wasActive && $userId !== null) {
                $user = User::query()->whereKey($userId)->lockForUpdate()->first();

                if ($user !== null) {
                    $this->roleSync->onMembershipDeactivated($user);
                }
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function previewInvite(string $token): array
    {
        $member = VendorTeamMember::query()
            ->where('invite_token', $token)
            ->with('vendorAccount')
            ->first();

        if ($member === null) {
            throw new InvalidArgumentException(__('diyar.vendor.team.invite_not_found'));
        }

        $vendorAccount = $member->vendorAccount;
        $base = [
            'store_name' => $vendorAccount?->business_name,
            'store_slug' => $vendorAccount?->slug,
            'role' => $member->role->value,
            'email' => $member->email,
        ];

        return match ($member->status) {
            VendorTeamStatus::Invited => array_merge($base, [
                'status' => 'pending',
                'can_accept' => true,
                'can_reject' => true,
            ]),
            VendorTeamStatus::Active => array_merge($base, [
                'status' => 'accepted',
                'can_accept' => false,
                'can_reject' => false,
            ]),
            VendorTeamStatus::Rejected => array_merge($base, [
                'status' => 'rejected',
                'can_accept' => false,
                'can_reject' => false,
            ]),
            default => array_merge($base, [
                'status' => 'expired',
                'can_accept' => false,
                'can_reject' => false,
            ]),
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function acceptInvite(User $user, string $token): array
    {
        $member = $this->findInviteByToken($token);

        if ($member->status === VendorTeamStatus::Active) {
            throw new InvalidArgumentException(__('diyar.vendor.team.invite_already_accepted'));
        }

        if ($member->status === VendorTeamStatus::Rejected) {
            throw new InvalidArgumentException(__('diyar.vendor.team.invite_rejected_state'));
        }

        if ($member->status !== VendorTeamStatus::Invited) {
            throw new InvalidArgumentException(__('diyar.vendor.team.invite_expired'));
        }

        if (strtolower(trim($user->email)) !== strtolower($member->email)) {
            throw new InvalidArgumentException(__('diyar.vendor.team.invite_email_mismatch'));
        }

        $user->loadMissing('vendorAccount');
        if ($user->vendorAccount !== null) {
            throw new InvalidArgumentException(__('diyar.vendor.team.invite_owner_conflict'));
        }

        return DB::transaction(function () use ($user, $member) {
            $this->roleSync->onMembershipActivated($user, $member);

            $member->update([
                'user_id' => $user->id,
                'status' => VendorTeamStatus::Active,
                'accepted_at' => now(),
                'invite_token' => null,
            ]);

            $freshMember = $member->fresh('user');
            DB::afterCommit(fn () => event(new TeamMemberAdded($freshMember, $user)));

            return $this->memberPayload($freshMember);
        });
    }

    public function rejectInvite(User $user, string $token): void
    {
        $member = $this->findInviteByToken($token);

        if ($member->status === VendorTeamStatus::Rejected) {
            return;
        }

        if ($member->status === VendorTeamStatus::Active) {
            throw new InvalidArgumentException(__('diyar.vendor.team.invite_already_accepted'));
        }

        if ($member->status !== VendorTeamStatus::Invited) {
            throw new InvalidArgumentException(__('diyar.vendor.team.invite_expired'));
        }

        if (strtolower(trim($user->email)) !== strtolower($member->email)) {
            throw new InvalidArgumentException(__('diyar.vendor.team.invite_email_mismatch'));
        }

        $member->update([
            'status' => VendorTeamStatus::Rejected,
        ]);
    }

    private function findInviteByToken(string $token): VendorTeamMember
    {
        $member = VendorTeamMember::query()
            ->where('invite_token', $token)
            ->first();

        if ($member === null) {
            throw new InvalidArgumentException(__('diyar.vendor.team.invite_not_found'));
        }

        return $member;
    }

    /**
     * @return array<string, mixed>
     */
    private function ownerPayload(?User $owner, VendorAccount $vendorAccount): array
    {
        return [
            'id' => 'owner-'.$vendorAccount->id,
            'user_id' => $owner?->id,
            'name' => $owner?->name ?? $vendorAccount->business_name,
            'email' => $owner?->email,
            'avatar_url' => $this->avatarUrl($owner),
            'role' => VendorTeamRole::Owner->value,
            'status' => VendorTeamStatus::Active->value,
            'is_owner' => true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function memberPayload(VendorTeamMember $member): array
    {
        return [
            'id' => $member->id,
            'user_id' => $member->user_id,
            'name' => $member->user?->name,
            'email' => $member->email,
            'avatar_url' => $this->avatarUrl($member->user),
            'role' => $member->role->value,
            'status' => $member->status->value,
            'is_owner' => false,
        ];
    }

    private function sendInviteEmail(
        VendorTeamMember $member,
        VendorAccount $vendorAccount,
        string $locale,
        bool $needsRegistration,
    ): void {
        $storeName = $vendorAccount->business_name;
        $frontendUrl = rtrim((string) config('diyar.frontend_url', 'http://localhost:5173'), '/');
        $acceptUrl = $frontendUrl.'/team-invite?token='.urlencode((string) $member->invite_token);

        $title = $locale === 'ar' ? 'دعوة للانضمام إلى فريق المتجر' : 'Store team invitation';
        $subject = $locale === 'ar'
            ? "دعوة للانضمام إلى {$storeName} على ديار"
            : "Invitation to join {$storeName} on Diyar";

        $roleLabel = match ($member->role) {
            VendorTeamRole::Manager => $locale === 'ar' ? 'مدير المتجر' : 'Store manager',
            VendorTeamRole::CustomerService => $locale === 'ar' ? 'خدمة العملاء' : 'Customer service',
            default => $member->role->value,
        };

        $body = $locale === 'ar'
            ? "<p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">تمت دعوتك للانضمام إلى فريق متجر <strong>{$storeName}</strong> على منصة ديار.</p>
               <p style=\"margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;\">الصلاحية: <strong>{$roleLabel}</strong></p>
               <p style=\"margin:0;font-size:14px;line-height:1.7;color:#6b7280;\">".($needsRegistration
                ? 'أنشئ حسابك أو سجّل الدخول بنفس البريد الإلكتروني، ثم اقبل الدعوة أو ارفضها من صفحة الدعوة.'
                : 'سجّل الدخول بنفس البريد الإلكتروني، ثم اقبل الدعوة أو ارفضها من صفحة الدعوة.').'</p>'
            : "<p style=\"margin:0 0 16px;font-size:16px;line-height:1.7;\">You have been invited to join the <strong>{$storeName}</strong> team on Diyar.</p>
               <p style=\"margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;\">Role: <strong>{$roleLabel}</strong></p>
               <p style=\"margin:0;font-size:14px;line-height:1.7;color:#6b7280;\">".($needsRegistration
                ? 'Create an account or sign in with this email address, then accept or decline the invitation.'
                : 'Sign in with this email address, then accept or decline the invitation.').'</p>';

        $this->mailer->send(
            $member->email,
            $subject,
            $locale,
            $title,
            $body,
            [
                'cta_label' => $locale === 'ar' ? 'عرض الدعوة' : 'View invitation',
                'cta_url' => $acceptUrl,
            ],
        );
    }

    private function avatarUrl(?User $user): ?string
    {
        if ($user === null || $user->avatar_path === null) {
            return null;
        }

        return $this->media->url($user->avatar_path);
    }
}
