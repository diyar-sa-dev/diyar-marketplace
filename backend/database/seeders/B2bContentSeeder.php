<?php

namespace Database\Seeders;

use App\Enums\B2bPublicationStatus;
use App\Enums\B2bVerificationStatus;
use App\Models\B2bCategory;
use App\Models\B2bCompany;
use App\Models\B2bTag;
use App\Models\Project;
use Illuminate\Database\Seeder;

class B2bContentSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $furniture = B2bCategory::query()->updateOrCreate(
            ['slug' => 'furniture-manufacturing'],
            ['name' => 'تصنيع أثاث', 'description' => 'مصانع وتفصيل الأثاث بالجملة.'],
        );

        $design = B2bCategory::query()->updateOrCreate(
            ['slug' => 'interior-design'],
            ['name' => 'تصميم داخلي', 'description' => 'تصميم وتنفيذ المساحات التجارية والسكنية.'],
        );

        $materials = B2bCategory::query()->updateOrCreate(
            ['slug' => 'raw-materials'],
            ['name' => 'توريد مواد خام', 'description' => 'موردو المواد الخام والإكسسوارات.'],
        );

        $tags = collect([
            ['slug' => 'sofa', 'name' => 'كنب'],
            ['slug' => 'majlis', 'name' => 'مجالس'],
            ['slug' => 'wholesale', 'name' => 'جملة'],
            ['slug' => 'office-design', 'name' => 'تصميم مكاتب'],
            ['slug' => 'fabrics', 'name' => 'أقمشة'],
            ['slug' => 'office-furniture', 'name' => 'أثاث مكتبي'],
        ])->mapWithKeys(fn (array $tag) => [
            $tag['slug'] => B2bTag::query()->updateOrCreate(['slug' => $tag['slug']], ['name' => $tag['name']]),
        ]);

        $companies = [
            [
                'slug' => 'modernwood',
                'name' => 'مصنع الأخشاب الحديثة',
                'category' => $furniture,
                'location' => 'الرياض، الصناعية الثانية',
                'description' => 'متخصصون في تصنيع الكنب والمجالس العربية بأعلى معايير الجودة للشركات والفنادق.',
                'about' => 'متخصصون في تصنيع الكنب والمجالس العربية بأعلى معايير الجودة للشركات والفنادق والمشاريع الكبرى.',
                'cover' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600',
                'years' => 12,
                'team' => 75,
                'projects' => 300,
                'rating' => 4.8,
                'reviews' => 124,
                'tag_slugs' => ['sofa', 'majlis', 'wholesale'],
                'services' => ['تفصيل أثاث حسب الطلب', 'تأثيث الفنادق والمنتجعات', 'بيع بالجملة للمعارض', 'صيانة وتجديد الأثاث'],
            ],
            [
                'slug' => 'rowad-decor',
                'name' => 'مؤسسة رواد الديكور',
                'category' => $design,
                'location' => 'جدة، شارع التحلية',
                'description' => 'نقدم خدمات التصميم الداخلي المبتكر للمكاتب والمطاعم والمعارض التجارية.',
                'about' => 'نقدم خدمات التصميم الداخلي المبتكر للمكاتب والمطاعم والمعارض التجارية، مع فريق من المصممين المعتمدين.',
                'cover' => 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=1600',
                'years' => 9,
                'team' => 35,
                'projects' => 180,
                'rating' => 4.9,
                'reviews' => 86,
                'tag_slugs' => ['office-design'],
                'services' => ['تصميم المساحات السكنية والتجارية', 'تصميم المكاتب والمعارض', 'مخططات ثلاثية الأبعاد', 'الإشراف على التنفيذ'],
            ],
            [
                'slug' => 'global-fabrics',
                'name' => 'الشركة العالمية للأقمشة',
                'category' => $materials,
                'location' => 'الدمام، الخالدية',
                'description' => 'موردون معتمدون لأرقى أنواع الأقمشة والإسفنج لمصانع الأثاث في المملكة.',
                'about' => 'موردون معتمدون لأرقى أنواع الأقمشة والإسفنج لمصانع الأثاث في المملكة، مع مخزون دائم وأسعار جملة تنافسية.',
                'cover' => 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=1600',
                'years' => 18,
                'team' => 150,
                'projects' => 500,
                'rating' => 4.7,
                'reviews' => 210,
                'tag_slugs' => ['fabrics', 'wholesale'],
                'services' => ['توريد بالجملة للمصانع', 'عقود توريد طويلة الأمد', 'شحن وتوصيل للمشاريع', 'عيّنات مجانية للعملاء'],
                'featured' => true,
            ],
        ];

        $draftCompany = [
            'slug' => 'draft-b2b-company',
            'name' => 'شركة مسودة — غير منشورة',
            'category' => $furniture,
            'location' => 'الرياض',
            'description' => 'مسودة للاختبار.',
            'about' => 'يجب ألا تظهر علناً.',
            'cover' => null,
            'years' => 1,
            'team' => 5,
            'projects' => 0,
            'rating' => 0,
            'reviews' => 0,
            'tag_slugs' => [],
            'services' => [],
            'draft' => true,
        ];

        $allCompanies = [...$companies, $draftCompany];
        $publishedProjects = Project::query()->published()->limit(6)->pluck('id');

        foreach ($allCompanies as $index => $data) {
            $isDraft = (bool) ($data['draft'] ?? false);

            $company = B2bCompany::query()->updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'b2b_category_id' => $data['category']->id,
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'about' => $data['about'],
                    'logo' => 'https://ui-avatars.com/api/?name='.urlencode($data['name']).'&background=F3ECDB&color=947961&size=200',
                    'cover_image' => $data['cover'],
                    'location' => $data['location'],
                    'phone' => '+966501234567',
                    'email' => 'info@'.$data['slug'].'.sa',
                    'website' => 'https://www.'.$data['slug'].'.sa',
                    'years_experience' => $data['years'],
                    'team_size' => $data['team'],
                    'completed_projects' => $data['projects'],
                    'rating' => $data['rating'],
                    'reviews_count' => $data['reviews'],
                    'publication_status' => $isDraft ? B2bPublicationStatus::Draft : B2bPublicationStatus::Published,
                    'verification_status' => $isDraft ? B2bVerificationStatus::Pending : B2bVerificationStatus::Verified,
                    'featured' => (bool) ($data['featured'] ?? false),
                    'published_at' => $isDraft ? null : now()->subDays(30 - $index),
                ],
            );

            $company->tags()->sync(
                collect($data['tag_slugs'])->map(fn (string $slug) => $tags[$slug]->id ?? null)->filter()->values()->all(),
            );

            $company->services()->delete();
            foreach ($data['services'] as $sort => $serviceName) {
                $company->services()->create([
                    'name' => $serviceName,
                    'sort_order' => $sort,
                ]);
            }

            if (! $isDraft && $publishedProjects->isNotEmpty()) {
                $sync = $publishedProjects->take(3)->values()->mapWithKeys(
                    fn (string $projectId, int $sort) => [$projectId => ['sort_order' => $sort]],
                )->all();
                $company->projects()->sync($sync);
            }

            if (! $isDraft && $index === 0) {
                $company->testimonials()->delete();
                $company->testimonials()->createMany([
                    [
                        'author_name' => 'شركة الواحة للضيافة',
                        'author_role' => 'عميل أعمال',
                        'rating' => 5,
                        'content' => 'تعاملنا معهم في تجهيز فرعين كاملين، الالتزام بالمواعيد والجودة كان ممتازاً.',
                        'sort_order' => 0,
                    ],
                    [
                        'author_name' => 'مجموعة الأفق العقارية',
                        'author_role' => 'مقاول',
                        'rating' => 5,
                        'content' => 'أسعار الجملة تنافسية والتعامل احترافي.',
                        'sort_order' => 1,
                    ],
                ]);
            }
        }
    }
}
