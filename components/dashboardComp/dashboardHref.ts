export function dashboardHref(path: string) {
  if (!path || path === '/') return '/dashboard';
  return `/dashboard/${path.replace(/^\/+/, '')}`;
}
