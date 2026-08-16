<?php

namespace App\Services\Profile;

use App\Models\User;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class ProfileService
{
    public function __construct(
        private readonly MediaUploadService $media,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(User $user, array $attributes): User
    {
        $updates = [];

        if (array_key_exists('name', $attributes)) {
            $updates['name'] = $attributes['name'];
        }

        if (array_key_exists('email', $attributes)) {
            $updates['email'] = $attributes['email'];
        }

        if (array_key_exists('bio', $attributes)) {
            $updates['bio'] = $attributes['bio'];
        }

        if (array_key_exists('preferences', $attributes)) {
            $updates['preferences'] = $attributes['preferences'];
        }

        if ($updates !== []) {
            $user->fill($updates)->save();
        }

        return $user->fresh('roles');
    }

    public function updatePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, (string) $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => [__('diyar.profile.current_password_invalid')],
            ]);
        }

        $user->forceFill(['password' => $newPassword])->save();

        if (request()->hasSession()) {
            request()->session()->regenerate();
        }
    }

    public function uploadAvatar(User $user, UploadedFile $file): User
    {
        return DB::transaction(function () use ($user, $file) {
            $previousPath = $user->avatar_path;
            $newPath = $this->media->storeUserAvatar($user, $file);

            $user->forceFill(['avatar_path' => $newPath])->save();
            $this->media->deletePath($previousPath);

            return $user->fresh('roles');
        });
    }

    public function deleteAvatar(User $user): User
    {
        $previousPath = $user->avatar_path;
        $user->forceFill(['avatar_path' => null])->save();
        $this->media->deletePath($previousPath);

        return $user->fresh('roles');
    }
}
