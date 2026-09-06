<?php

namespace App\Services\Projects;

use App\Enums\ProjectPublicationStatus;
use App\Models\Project;
use App\Models\ProjectImage;
use App\Models\User;
use App\Services\Admin\AdminAuditService;
use App\Support\Cache\BlogProjectCache;
use Illuminate\Support\Facades\DB;

final class AdminProjectService
{
    public function __construct(
        private readonly ProjectService $projects,
        private readonly AdminAuditService $audit,
        private readonly BlogProjectCache $cache,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes, User $actor): Project
    {
        return DB::transaction(function () use ($attributes, $actor): Project {
            $project = Project::query()->create([
                'slug' => $this->projects->generateSlug(
                    $attributes['title'],
                    $attributes['slug'] ?? null,
                ),
                'title' => $attributes['title'],
                'description' => $attributes['description'] ?? null,
                'category' => $attributes['category'],
                'location' => $attributes['location'] ?? null,
                'year' => $attributes['year'] ?? null,
                'status' => $attributes['status'] ?? ProjectPublicationStatus::Draft->value,
                'cover_image' => $attributes['cover_image'] ?? null,
                'published_at' => $attributes['published_at'] ?? null,
            ]);

            $this->syncImages($project, $attributes['images'] ?? []);

            $project->load('images');

            $this->audit->record(
                actor: $actor,
                action: 'project.create',
                resource: $project,
                after: $this->snapshot($project),
            );

            $this->cache->forgetProjects();

            return $project;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Project $project, array $attributes, User $actor): Project
    {
        return DB::transaction(function () use ($project, $attributes, $actor): Project {
            $before = $this->snapshot($project);

            if (array_key_exists('title', $attributes) || array_key_exists('slug', $attributes)) {
                $attributes['slug'] = $this->projects->generateSlug(
                    $attributes['title'] ?? $project->title,
                    $attributes['slug'] ?? null,
                    $project->id,
                );
            }

            $project->fill([
                'slug' => $attributes['slug'] ?? $project->slug,
                'title' => $attributes['title'] ?? $project->title,
                'description' => $attributes['description'] ?? $project->description,
                'category' => $attributes['category'] ?? $project->category,
                'location' => $attributes['location'] ?? $project->location,
                'year' => $attributes['year'] ?? $project->year,
                'status' => $attributes['status'] ?? $project->status,
                'cover_image' => $attributes['cover_image'] ?? $project->cover_image,
                'published_at' => $attributes['published_at'] ?? $project->published_at,
            ])->save();

            if (array_key_exists('images', $attributes)) {
                $this->syncImages($project, $attributes['images']);
            }

            $project->load('images');

            $this->audit->record(
                actor: $actor,
                action: 'project.update',
                resource: $project,
                before: $before,
                after: $this->snapshot($project),
            );

            $this->cache->forgetProjects();

            return $project;
        });
    }

    public function delete(Project $project, User $actor): void
    {
        DB::transaction(function () use ($project, $actor): void {
            $before = $this->snapshot($project);
            $project->delete();

            $this->audit->record(
                actor: $actor,
                action: 'project.delete',
                resource: $project,
                before: $before,
            );

            $this->cache->forgetProjects();
        });
    }

    public function publish(Project $project, User $actor): Project
    {
        return $this->transition($project, $actor, ProjectPublicationStatus::Published, 'project.publish', [
            'published_at' => $project->published_at ?? now(),
        ]);
    }

    public function unpublish(Project $project, User $actor): Project
    {
        return $this->transition($project, $actor, ProjectPublicationStatus::Draft, 'project.unpublish');
    }

    public function archive(Project $project, User $actor): Project
    {
        return $this->transition($project, $actor, ProjectPublicationStatus::Archived, 'project.archive');
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    private function transition(
        Project $project,
        User $actor,
        ProjectPublicationStatus $status,
        string $action,
        array $extra = [],
    ): Project {
        return DB::transaction(function () use ($project, $actor, $status, $action, $extra): Project {
            $before = $this->snapshot($project);

            $project->fill(array_merge(['status' => $status], $extra))->save();
            $project->load('images');

            $this->audit->record(
                actor: $actor,
                action: $action,
                resource: $project,
                before: $before,
                after: $this->snapshot($project),
            );

            $this->cache->forgetProjects();

            return $project;
        });
    }

    /**
     * @param  list<array<string, mixed>>  $images
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

    /** @return array<string, mixed> */
    private function snapshot(Project $project): array
    {
        return [
            'slug' => $project->slug,
            'title' => $project->title,
            'status' => $project->status->value,
            'category' => $project->category,
            'published_at' => $project->published_at?->toIso8601String(),
        ];
    }
}
