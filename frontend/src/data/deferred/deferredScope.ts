/**
 * Intentionally deferred frontend prototypes — NOT transactional API data.
 * Replace with Laravel CMS/B2B modules when product scope is confirmed.
 */
export const DEFERRED_SCOPES = {
  b2bDirectory: {
    id: 'b2b-directory',
    label: 'B2B company directory',
    futureApi: 'GET /api/v1/b2b/companies',
    status: 'live',
  },
  blogCms: {
    id: 'blog-cms',
    label: 'Blog / CMS articles',
    futureApi: 'GET /api/v1/cms/articles/{slug}',
  },
  sidebarProjects: {
    id: 'sidebar-projects',
    label: 'Sidebar inspiration projects widget',
    futureApi: 'GET /api/v1/inspiration/projects (optional)',
  },
} as const;
