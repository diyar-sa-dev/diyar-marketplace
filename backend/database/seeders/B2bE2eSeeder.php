<?php

namespace Database\Seeders;

use App\Enums\B2bPublicationStatus;
use App\Enums\B2bVerificationStatus;
use App\Models\B2bCategory;
use App\Models\B2bCompany;
use App\Support\Cache\B2bCache;
use Illuminate\Database\Seeder;

class B2bE2eSeeder extends Seeder
{
    public function run(): void
    {
        $category = B2bCategory::query()->firstOrCreate(
            ['slug' => 'furniture-manufacturing'],
            ['name' => 'تصنيع أثاث', 'description' => 'E2E category'],
        );

        B2bCompany::query()->updateOrCreate(
            ['slug' => 'e2e-b2b-company'],
            [
                'b2b_category_id' => $category->id,
                'name' => 'E2E B2B Company',
                'description' => 'Deterministic published B2B company for end-to-end tests.',
                'about' => 'E2E company profile body.',
                'logo' => 'https://ui-avatars.com/api/?name=E2E&background=F3ECDB&color=947961&size=200',
                'cover_image' => 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600',
                'location' => 'الرياض',
                'phone' => '+966501111111',
                'email' => 'e2e-b2b@diyar.local',
                'website' => 'https://e2e-b2b.example.com',
                'years_experience' => 5,
                'team_size' => 25,
                'completed_projects' => 40,
                'rating' => 4.5,
                'reviews_count' => 12,
                'publication_status' => B2bPublicationStatus::Published,
                'verification_status' => B2bVerificationStatus::Verified,
                'featured' => true,
                'published_at' => now()->subDay(),
            ],
        );

        B2bCompany::query()->updateOrCreate(
            ['slug' => 'e2e-b2b-draft'],
            [
                'b2b_category_id' => $category->id,
                'name' => 'E2E B2B Draft Company',
                'description' => 'Draft company hidden from public directory.',
                'publication_status' => B2bPublicationStatus::Draft,
                'verification_status' => B2bVerificationStatus::Pending,
                'featured' => false,
                'published_at' => null,
            ],
        );

        app(B2bCache::class)->forget();
    }
}
