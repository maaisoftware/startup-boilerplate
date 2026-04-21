-- Seed file. Runs after migrations on `supabase db reset`.
-- Minimal content to exercise public-read paths.

insert into public.newsletters (slug, title, description) values
  ('changelog', 'Changelog', 'Shipping notes, monthly.')
on conflict (slug) do nothing;

insert into public.navigation (label, href, position) values
  ('Blog', '/blog', 0),
  ('Pricing', '/pricing', 1),
  ('Docs', '/docs', 2)
on conflict do nothing;

insert into public.seo_overrides (route_pattern, title, description) values
  ('/', 'Startup Boilerplate — AI-ready monorepo template',
   'Production-grade boilerplate with abstraction layers, RLS, and CI/CD wired in.')
on conflict (route_pattern) do nothing;

insert into public.pages (slug, title, status, published_at)
values ('about', 'About', 'published', now())
on conflict (slug) do nothing;

insert into public.posts (slug, title, excerpt, content_markdown, status, published_at)
values (
  'hello-world',
  'Hello, world',
  'First post — proving the stack.',
  '# Hello\n\nWelcome to the Startup Boilerplate demo.',
  'published',
  now()
) on conflict (slug) do nothing;
