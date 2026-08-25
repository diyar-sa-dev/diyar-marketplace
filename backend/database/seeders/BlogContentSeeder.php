<?php

namespace Database\Seeders;

use App\Enums\BlogArticleStatus;
use App\Models\BlogArticle;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use Illuminate\Database\Seeder;

class BlogContentSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $decorTips = BlogCategory::query()->updateOrCreate(
            ['slug' => 'decor-tips'],
            [
                'name' => 'نصائح ديكور',
                'description' => 'أفكار ونصائح لتنسيق منزلك.',
            ],
        );

        $designIdeas = BlogCategory::query()->updateOrCreate(
            ['slug' => 'design-ideas'],
            [
                'name' => 'أفكار تصميمية',
                'description' => 'إلهام وتوجهات التصميم الداخلي.',
            ],
        );

        $homeEssentials = BlogCategory::query()->updateOrCreate(
            ['slug' => 'home-essentials'],
            [
                'name' => 'أساسيات المنزل',
                'description' => 'قطع أساسية لا غنى عنها في أي منزل.',
            ],
        );

        $interiorDesign = BlogTag::query()->updateOrCreate(
            ['slug' => 'interior-design'],
            ['name' => 'تصميم داخلي'],
        );

        $decor2024 = BlogTag::query()->updateOrCreate(
            ['slug' => 'decor-2024'],
            ['name' => 'ديكور 2024'],
        );

        $sustainability = BlogTag::query()->updateOrCreate(
            ['slug' => 'sustainability'],
            ['name' => 'مستدامة'],
        );

        $homeFurniture = BlogTag::query()->updateOrCreate(
            ['slug' => 'home-furniture'],
            ['name' => 'أثاث منزلي'],
        );

        $lighting = BlogTag::query()->updateOrCreate(
            ['slug' => 'lighting'],
            ['name' => 'إضاءة'],
        );

        $mainArticle = BlogArticle::query()->updateOrCreate(
            ['slug' => 'interior-design-trends-2024'],
            [
                'blog_category_id' => $designIdeas->id,
                'title' => 'أحدث اتجاهات التصميم الداخلي لعام 2024: العودة إلى الطبيعة',
                'excerpt' => 'اكتشف كيف يغير التصميم المستدام والألوان الترابية والمواد الطبيعية شكل منازلنا في العام الجديد.',
                'content' => '<p>يشهد عام 2024 تحولاً جذرياً في مفاهيم التصميم الداخلي، حيث نتجه بخطوات متسارعة نحو دمج الطبيعة في مساحاتنا المعيشية.</p><h2>1. لوحة الألوان الترابية الدافئة</h2><p>ترحب تصاميم هذا العام بالدرجات الدافئة المستوحاة من الطبيعة.</p><img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&amp;fit=crop&amp;q=80&amp;w=1200" alt="تصميم يسوده الألوان الترابية" /><blockquote>التصميم الناجح في 2024 هو الذي يجعلك تشعر وكأنك في ملاذ آمن.</blockquote>',
                'hero_image' => 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1600',
                'author_name' => 'فريق ديار',
                'author_avatar' => 'https://ui-avatars.com/api/?name=Diyar&background=F3F4F6&color=4B5563',
                'author_role' => 'خبراء التصميم والمفروشات',
                'reading_time_minutes' => 4,
                'published_at' => now()->subDays(10),
                'status' => BlogArticleStatus::Published,
                'seo_title' => 'اتجاهات التصميم الداخلي 2024 | مدونة ديار',
                'seo_description' => 'اكتشف أحدث اتجاهات التصميم الداخلي لعام 2024 من مدونة ديار.',
            ],
        );
        $mainArticle->tags()->sync([$interiorDesign->id, $decor2024->id, $sustainability->id, $homeFurniture->id]);

        $article2 = BlogArticle::query()->updateOrCreate(
            ['slug' => 'choose-home-lighting'],
            [
                'blog_category_id' => $decorTips->id,
                'title' => 'كيف تختار الإضاءة المناسبة لكل غرفة في منزلك؟',
                'excerpt' => 'دليل عملي لاختيار الإضاءة المناسبة لكل غرفة في منزلك.',
                'content' => '<p>الإضاءة الصحيحة تحول أي مساحة إلى بيئة مريحة وعملية.</p>',
                'hero_image' => 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600',
                'author_name' => 'فريق ديار',
                'author_avatar' => 'https://ui-avatars.com/api/?name=Diyar&background=F3F4F6&color=4B5563',
                'author_role' => 'خبراء التصميم والمفروشات',
                'reading_time_minutes' => 3,
                'published_at' => now()->subDays(15),
                'status' => BlogArticleStatus::Published,
            ],
        );
        $article2->tags()->sync([$lighting->id]);

        BlogArticle::query()->updateOrCreate(
            ['slug' => 'living-room-colors-guide-2024'],
            [
                'blog_category_id' => $decorTips->id,
                'title' => 'الدليل الشامل لاختيار ألوان غرفة المعيشة في 2024',
                'excerpt' => 'نصائح عملية لاختيار لوحة ألوان متناسقة لغرفة المعيشة.',
                'content' => '<p>اختيار الألوان المناسبة يمنح غرفة المعيشة توازناً بصرياً مريحاً.</p>',
                'hero_image' => 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=600',
                'author_name' => 'فريق ديار',
                'author_avatar' => 'https://ui-avatars.com/api/?name=Diyar&background=F3F4F6&color=4B5563',
                'author_role' => 'خبراء التصميم والمفروشات',
                'reading_time_minutes' => 3,
                'published_at' => now()->subDays(10),
                'status' => BlogArticleStatus::Published,
            ],
        );

        BlogArticle::query()->updateOrCreate(
            ['slug' => 'classic-modern-blend'],
            [
                'blog_category_id' => $designIdeas->id,
                'title' => 'كيف تدمج النمط الكلاسيكي مع العصري بدون أخطاء؟',
                'excerpt' => 'طرق ذكية لدمج الكلاسيك والعصري في مساحة واحدة.',
                'content' => '<p>الجمع بين الكلاسيك والعصري يتطلب توازناً دقيقاً في الأثاث والألوان.</p>',
                'hero_image' => 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&q=80&w=600',
                'author_name' => 'فريق ديار',
                'author_avatar' => 'https://ui-avatars.com/api/?name=Diyar&background=F3F4F6&color=4B5563',
                'author_role' => 'خبراء التصميم والمفروشات',
                'reading_time_minutes' => 4,
                'published_at' => now()->subDays(15),
                'status' => BlogArticleStatus::Published,
            ],
        );

        BlogArticle::query()->updateOrCreate(
            ['slug' => 'five-home-essentials'],
            [
                'blog_category_id' => $homeEssentials->id,
                'title' => '٥ قطع أساسية لا غنى عنها في منزلك الجديد',
                'excerpt' => 'ابدأ تأثيث منزلك بهذه القطع الأساسية.',
                'content' => '<p>هذه القطع الخمس تشكل الأساس لأي منزل عملي وأنيق.</p>',
                'hero_image' => 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=600',
                'author_name' => 'فريق ديار',
                'author_avatar' => 'https://ui-avatars.com/api/?name=Diyar&background=F3F4F6&color=4B5563',
                'author_role' => 'خبراء التصميم والمفروشات',
                'reading_time_minutes' => 3,
                'published_at' => now()->subDays(23),
                'status' => BlogArticleStatus::Published,
            ],
        );

        BlogArticle::query()->updateOrCreate(
            ['slug' => 'draft-preview-article'],
            [
                'blog_category_id' => $decorTips->id,
                'title' => 'مسودة: أفكار ديكور قيد الإعداد',
                'excerpt' => 'مقال تجريبي غير منشور.',
                'content' => '<p>هذا المقال مسودة ولا يظهر في الواجهة العامة.</p>',
                'hero_image' => null,
                'author_name' => 'فريق ديار',
                'author_avatar' => null,
                'author_role' => null,
                'reading_time_minutes' => 1,
                'published_at' => null,
                'status' => BlogArticleStatus::Draft,
            ],
        );
    }
}
