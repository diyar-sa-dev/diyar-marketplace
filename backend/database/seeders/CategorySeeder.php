<?php

namespace Database\Seeders;

use App\Enums\CategoryType;
use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $productCategories = [
            ['slug' => 'bedroom', 'name' => 'غرف النوم', 'sort_order' => 1],
            ['slug' => 'living-room', 'name' => 'الصالونات', 'sort_order' => 2],
            ['slug' => 'kitchen', 'name' => 'المطابخ', 'sort_order' => 3],
            ['slug' => 'dining', 'name' => 'غرف الطعام', 'sort_order' => 4],
            ['slug' => 'office', 'name' => 'المكاتب', 'sort_order' => 5],
            ['slug' => 'decor', 'name' => 'ديكورات', 'sort_order' => 6],
            ['slug' => 'lighting', 'name' => 'الإضاءة', 'sort_order' => 7],
            ['slug' => 'curtains', 'name' => 'الستائر', 'sort_order' => 8],
            ['slug' => 'outdoor', 'name' => 'أثاث خارجي', 'sort_order' => 9],
            ['slug' => 'bathroom', 'name' => 'الحمامات', 'sort_order' => 10],
        ];

        foreach ($productCategories as $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                [
                    'name' => $category['name'],
                    'type' => CategoryType::Product,
                    'sort_order' => $category['sort_order'],
                    'is_active' => true,
                ],
            );
        }

        $serviceCategories = [
            ['slug' => 'interior-design', 'name' => 'تصميم داخلي', 'sort_order' => 1],
            ['slug' => 'maintenance', 'name' => 'تركيب وصيانة', 'sort_order' => 2],
            ['slug' => 'painting', 'name' => 'دهانات', 'sort_order' => 3],
            ['slug' => 'upholstery', 'name' => 'تنجيد وتجديد', 'sort_order' => 4],
            ['slug' => 'carpentry', 'name' => 'نجارة مخصصة', 'sort_order' => 5],
            ['slug' => 'consultation', 'name' => 'استشارات تصميم', 'sort_order' => 6],
            ['slug' => 'moving', 'name' => 'نقل وتغليف', 'sort_order' => 7],
            ['slug' => 'cleaning', 'name' => 'تنظيف وتلميع', 'sort_order' => 8],
            ['slug' => 'electrical', 'name' => 'إضاءة وكهربا', 'sort_order' => 9],
            ['slug' => 'curtains-install', 'name' => 'تركيب الستائر', 'sort_order' => 10],
        ];

        foreach ($serviceCategories as $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                [
                    'name' => $category['name'],
                    'type' => CategoryType::Service,
                    'sort_order' => $category['sort_order'],
                    'is_active' => true,
                ],
            );
        }
    }
}
