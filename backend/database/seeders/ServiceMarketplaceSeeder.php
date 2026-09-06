<?php

namespace Database\Seeders;

use App\Enums\ProviderAccountStatus;
use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\ServiceBookingMode;
use App\Enums\ServicePricingMode;
use App\Enums\UserStatus;
use App\Models\ProviderAccount;
use App\Models\ProviderWorkPolicy;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServicePortfolioItem;
use App\Models\User;
use Database\Seeders\Concerns\UsesDemoPassword;
use Illuminate\Database\Seeder;

class ServiceMarketplaceSeeder extends Seeder
{
    use UsesDemoPassword;

    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $providerRole = Role::query()->where('name', RoleName::Provider->value)->firstOrFail();

        $categories = [
            ['slug' => 'interior-design', 'name_ar' => 'تصميم داخلي', 'name_en' => 'Interior Design', 'icon_key' => 'palette', 'sort' => 1],
            ['slug' => 'maintenance', 'name_ar' => 'تركيب وصيانة', 'name_en' => 'Installation & Maintenance', 'icon_key' => 'wrench', 'sort' => 2],
            ['slug' => 'upholstery', 'name_ar' => 'تنجيد وتجديد', 'name_en' => 'Upholstery & Renewal', 'icon_key' => 'pen-tool', 'sort' => 3],
            ['slug' => 'floor-plan', 'name_ar' => 'مخططات معمارية', 'name_en' => 'Architectural Plans', 'icon_key' => 'layout-dashboard', 'sort' => 4],
            ['slug' => 'moving', 'name_ar' => 'نقل وتغليف', 'name_en' => 'Moving & Packing', 'icon_key' => 'truck', 'sort' => 5],
            ['slug' => 'other', 'name_ar' => 'أخرى', 'name_en' => 'Other', 'icon_key' => 'message-square', 'sort' => 6],
        ];

        $categoryMap = [];
        foreach ($categories as $category) {
            $categoryMap[$category['slug']] = ServiceCategory::query()->updateOrCreate(
                ['slug' => $category['slug']],
                [
                    'name_ar' => $category['name_ar'],
                    'name_en' => $category['name_en'],
                    'icon_key' => $category['icon_key'],
                    'sort_order' => $category['sort'],
                    'is_active' => true,
                ],
            );
        }

        $providers = [
            [
                'phone' => '966500000101',
                'name' => 'Eiwan Provider',
                'email' => 'eiwan@diyar.local',
                'business' => 'إيوان للتصميم',
                'slug' => 'eiwan-design',
                'bio' => 'نقدم خدمات التصميم الداخلي الشاملة للقصور والفلل والشقق السكنية. نصمم مساحات تعكس هويتك وتلبي احتياجاتك بدقة واحترافية عالية.',
                'location' => 'الرياض، ونقدم استشارات عن بعد',
                'remote' => true,
                'verified' => true,
                'rating' => 4.9,
                'reviews' => 84,
                'projects' => 120,
                'avatar' => 'https://images.unsplash.com/photo-1600121848594-d8641e576d13?auto=format&fit=crop&q=80&w=200',
                'cover' => 'https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?auto=format&fit=crop&q=80&w=1200',
                'badges' => ['مزود موثق', 'تقييم عالي', 'مشاريع مكتملة بنجاح'],
            ],
            [
                'phone' => '966500000102',
                'name' => 'Diyar Design Provider',
                'email' => 'diyar-design@diyar.local',
                'business' => 'ديار ديزاين',
                'slug' => 'diyar-design',
                'bio' => 'حلول تصميم داخلي عصرية للمنازل والمكاتب.',
                'location' => 'الرياض',
                'remote' => true,
                'verified' => true,
                'rating' => 4.8,
                'reviews' => 124,
                'projects' => 95,
                'avatar' => 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200',
                'cover' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
                'badges' => ['مزود موثق'],
            ],
            [
                'phone' => '966500000103',
                'name' => 'Enjaz Workshop Provider',
                'email' => 'enjaz@diyar.local',
                'business' => 'ورشة الإنجاز',
                'slug' => 'enjaz-workshop',
                'bio' => 'تركيب وصيانة الأثاث المنزلي باحترافية.',
                'location' => 'جدة',
                'remote' => false,
                'verified' => true,
                'rating' => 4.5,
                'reviews' => 86,
                'projects' => 210,
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
                'cover' => 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
                'badges' => ['تركيب معتمد'],
            ],
        ];

        $providerMap = [];
        foreach ($providers as $providerData) {
            $user = User::query()->firstOrCreate(
                ['phone' => $providerData['phone']],
                [
                    'name' => $providerData['name'],
                    'email' => $providerData['email'],
                    'email_verified_at' => now(),
                    'password' => $this->demoPassword(),
                    'status' => UserStatus::Active,
                    'phone_verified_at' => now(),
                ],
            );

            if (! $user->roles()->where('roles.id', $providerRole->id)->exists()) {
                $user->roles()->attach($providerRole->id, [
                    'id' => (string) str()->uuid(),
                    'status' => RoleStatus::Active->value,
                ]);
            }

            $providerMap[$providerData['slug']] = ProviderAccount::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'business_name' => $providerData['business'],
                    'slug' => $providerData['slug'],
                    'bio' => $providerData['bio'],
                    'avatar_path' => $providerData['avatar'],
                    'cover_path' => $providerData['cover'],
                    'location' => $providerData['location'],
                    'remote_available' => $providerData['remote'],
                    'verified' => $providerData['verified'],
                    'badges' => $providerData['badges'],
                    'status' => ProviderAccountStatus::Active,
                    'completed_projects_count' => $providerData['projects'],
                    'rating_average' => $providerData['rating'],
                    'reviews_count' => $providerData['reviews'],
                    'joined_at' => now()->subYears(4),
                    'working_hours' => $this->defaultWorkingHours(),
                ],
            );
        }

        foreach ($providerMap as $provider) {
            ProviderWorkPolicy::query()->updateOrCreate(
                ['provider_account_id' => $provider->id],
                [
                    'policy_enabled' => true,
                    'initial_delivery_days' => 7,
                    'free_revisions_included' => 2,
                    'timeline_by_project_scope' => true,
                    'cancellation_notice_hours' => 24,
                    'custom_terms' => [],
                ],
            );
        }

        $services = [
            ['provider' => 'eiwan-design', 'category' => 'interior-design', 'slug' => 'integrated-apartment-design', 'title' => 'تصميم داخلي متكامل للشقق', 'price' => 50, 'mode' => ServicePricingMode::PerSqm, 'type' => 'استشارة ومخطط', 'rating' => 4.8, 'reviews' => 124, 'requests' => 340, 'cover' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400', 'features' => ['تصميم 3D', 'مخططات تنفيذية', 'إشراف هندسي', 'استشارات مجانية']],
            ['provider' => 'eiwan-design', 'category' => 'interior-design', 'slug' => 'office-3d-design', 'title' => 'تصميم 3D للمكاتب وإخراج الصور', 'price' => 1500, 'mode' => ServicePricingMode::Fixed, 'type' => 'سعر ثابت', 'rating' => 4.9, 'reviews' => 210, 'requests' => 180, 'cover' => 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=400', 'features' => ['نماذج واقعية', 'تعديلات مجانية', 'ملفات مصدر']],
            ['provider' => 'eiwan-design', 'category' => 'interior-design', 'slug' => 'architectural-lighting', 'title' => 'توزيع وتصميم الإضاءة المعمارية', 'price' => 600, 'mode' => ServicePricingMode::PerProject, 'type' => 'مخططات فنية', 'rating' => 4.7, 'reviews' => 156, 'requests' => 95, 'cover' => 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=400', 'features' => ['حسابات الإضاءة', 'اختيار التجهيزات']],
            ['provider' => 'eiwan-design', 'category' => 'interior-design', 'slug' => 'online-design-consultation', 'title' => 'جلسة استشارة تصميم أونلاين', 'price' => 300, 'mode' => ServicePricingMode::Hourly, 'type' => 'بالساعة', 'rating' => 5.0, 'reviews' => 64, 'requests' => 220, 'cover' => 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=400', 'features' => ['جلسة مرئية', 'ملخص مكتوب']],
        ];

        foreach ($services as $serviceData) {
            $provider = $providerMap[$serviceData['provider']];
            $category = $categoryMap[$serviceData['category']];
            $supportsDirectBooking = in_array($serviceData['mode'], [
                ServicePricingMode::Fixed,
                ServicePricingMode::Hourly,
            ], true);

            Service::query()->updateOrCreate(
                [
                    'provider_account_id' => $provider->id,
                    'slug' => $serviceData['slug'],
                ],
                [
                    'service_category_id' => $category->id,
                    'title' => $serviceData['title'],
                    'description' => $provider->bio,
                    'pricing_mode' => $serviceData['mode'],
                    'booking_mode' => $supportsDirectBooking
                        ? ServiceBookingMode::Direct
                        : ServiceBookingMode::Request,
                    'duration_minutes' => $supportsDirectBooking ? 60 : null,
                    'starting_price' => $serviceData['price'],
                    'currency' => 'SAR',
                    'delivery_type_label' => $serviceData['type'],
                    'location' => $provider->location,
                    'remote_available' => $provider->remote_available,
                    'features' => $serviceData['features'],
                    'cover_path' => $serviceData['cover'],
                    'is_active' => true,
                    'requests_count' => $serviceData['requests'],
                    'rating_average' => $serviceData['rating'],
                    'reviews_count' => $serviceData['reviews'],
                ],
            );
        }

        $eiwan = $providerMap['eiwan-design'];
        $gallery = [
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1600607688969-a5bfcd64bd9b?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=800',
        ];

        $mainService = Service::query()
            ->where('provider_account_id', $eiwan->id)
            ->where('slug', 'integrated-apartment-design')
            ->first();

        foreach ($gallery as $index => $url) {
            ServicePortfolioItem::query()->updateOrCreate(
                [
                    'provider_account_id' => $eiwan->id,
                    'media_path' => $url,
                ],
                [
                    'service_id' => $mainService?->id,
                    'title' => 'مشروع #'.($index + 1),
                    'sort_order' => $index + 1,
                ],
            );
        }
    }

    /**
     * @return list<array{day: string, is_closed: bool, opens_at: string|null, closes_at: string|null, closes_next_day: bool}>
     */
    private function defaultWorkingHours(): array
    {
        $days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

        return array_map(function (string $day) {
            $isFriday = $day === 'friday';

            return [
                'day' => $day,
                'is_closed' => $isFriday,
                'opens_at' => $isFriday ? null : '09:00',
                'closes_at' => $isFriday ? null : '18:00',
                'closes_next_day' => false,
            ];
        }, $days);
    }
}
