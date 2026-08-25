<?php

namespace Database\Seeders;

use App\Enums\ProjectPublicationStatus;
use App\Models\Project;
use App\Models\ProjectImage;
use Illuminate\Database\Seeder;

class ProjectContentSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $project1 = Project::query()->updateOrCreate(
            ['slug' => 'alfursan-luxury-majlis'],
            [
                'title' => 'مجلس الفرسان الفاخر',
                'description' => 'مجلس رسمي على الطراز الأندلسي الفخم مع استخدام أخشاب الزان الطبيعية والنقش اليدوي المذهب، مغطى بالمخمل الإيطالي المتين ليناسب تجهيزات الضيافة الراقية.',
                'category' => 'تصميم وتجهيز كلي',
                'location' => 'الرياض - حي حطين',
                'year' => 2024,
                'status' => ProjectPublicationStatus::Published,
                'cover_image' => 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=600',
                'published_at' => now()->subMonths(2),
            ],
        );
        $this->syncImages($project1, [
            [
                'image_url' => 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1200',
                'alt' => 'مجلس الفرسان الفاخر',
                'sort_order' => 0,
            ],
        ]);

        $project2 = Project::query()->updateOrCreate(
            ['slug' => 'neoclassic-living-suite'],
            [
                'title' => 'صالون نيوكلاسيك متكامل',
                'description' => 'تصميم داخلي لغرفة معيشة مفتوحة تعزز الضوء الطبيعي، بلمسات نيوكلاسيك كلاسيكية دافئة وتوزيع دقيق لطاولات الخدمة ووحدات الإضاءة الجانبية.',
                'category' => 'تنسيق أثاث وديكور',
                'location' => 'جدة - أبحر الشمالية',
                'year' => 2023,
                'status' => ProjectPublicationStatus::Published,
                'cover_image' => 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&q=80&w=600',
                'published_at' => now()->subMonths(4),
            ],
        );
        $this->syncImages($project2, [
            [
                'image_url' => 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&q=80&w=1200',
                'alt' => 'صالون نيوكلاسيك متكامل',
                'sort_order' => 0,
            ],
        ]);

        $project3 = Project::query()->updateOrCreate(
            ['slug' => 'wadi-hanifa-hospitality-suite'],
            [
                'title' => 'جناح ضيافة وادي حنيفة',
                'description' => 'مشروع دمج بين التراث النجدي العريق والأثاث المعاصر المعزز بتفاصيل السدو المحلي، مما شكل تحفة معمارية حازت على تقييمات استثنائية.',
                'category' => 'استشارات ومخططات ثلاثية الأبعاد',
                'location' => 'الدرعية التاريخية',
                'year' => 2023,
                'status' => ProjectPublicationStatus::Published,
                'cover_image' => 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=600',
                'published_at' => now()->subMonths(6),
            ],
        );
        $this->syncImages($project3, [
            [
                'image_url' => 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1200',
                'alt' => 'جناح ضيافة وادي حنيفة',
                'sort_order' => 0,
            ],
        ]);

        Project::query()->updateOrCreate(
            ['slug' => 'draft-showroom-concept'],
            [
                'title' => 'مسودة: مفهوم صالة عرض',
                'description' => 'مشروع تجريبي غير منشور.',
                'category' => 'تصميم وتجهيز كلي',
                'location' => 'الرياض',
                'year' => 2025,
                'status' => ProjectPublicationStatus::Draft,
                'cover_image' => null,
                'published_at' => null,
            ],
        );
    }

    /**
     * @param  list<array{image_url: string, alt?: string|null, sort_order?: int}>  $images
     */
    private function syncImages(Project $project, array $images): void
    {
        $project->images()->delete();

        foreach ($images as $index => $image) {
            ProjectImage::query()->create([
                'project_id' => $project->id,
                'image_url' => $image['image_url'],
                'alt' => $image['alt'] ?? null,
                'sort_order' => $image['sort_order'] ?? $index,
            ]);
        }
    }
}
