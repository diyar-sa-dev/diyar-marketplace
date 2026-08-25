<?php

namespace App\Models;

use App\Enums\BlogArticleStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Schema;

class BlogArticle extends Model
{
    use HasUuids, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'blog_category_id',
        'slug',
        'title',
        'excerpt',
        'content',
        'hero_image',
        'author_name',
        'author_avatar',
        'author_role',
        'reading_time_minutes',
        'published_at',
        'status',
        'seo_title',
        'seo_description',
    ];

    protected function casts(): array
    {
        return [
            'status' => BlogArticleStatus::class,
            'reading_time_minutes' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BlogCategory::class, 'blog_category_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(BlogTag::class, 'blog_article_tag');
    }

    public function wishlistItems(): HasMany
    {
        return $this->hasMany(BlogWishlistItem::class, 'blog_article_id');
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeWithUserSaved(Builder $query, ?User $user): void
    {
        if ($user === null || ! Schema::hasTable('blog_wishlist_items')) {
            return;
        }

        $query->withExists([
            'wishlistItems as user_saved' => fn (Builder $wishlistQuery) => $wishlistQuery
                ->where('user_id', $user->id),
        ]);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', BlogArticleStatus::Published)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }
}
