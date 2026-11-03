import type { GitHubEvent, GitHubRepository, RepositorySnapshot } from './github'

const daysAgo = (days: number, hour = 11) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 24, 0, 0)
  return date.toISOString()
}

const demoEvents: GitHubEvent[] = [
  { id: 'e1', type: 'PushEvent', actor: { login: 'sarahchen', avatar_url: 'https://avatars.githubusercontent.com/u/124599?v=4' }, created_at: daysAgo(0, 10), payload: { ref: 'refs/heads/main', commits: [{ message: 'Improve streaming response boundaries' }] } },
  { id: 'e2', type: 'PullRequestEvent', actor: { login: 'mikaelbr', avatar_url: 'https://avatars.githubusercontent.com/u/190452?v=4' }, created_at: daysAgo(0, 8), payload: { action: 'opened', pull_request: { title: 'Add edge runtime support', number: 4821, html_url: 'https://github.com/vercel/next.js/pulls/4821' } } },
  { id: 'e3', type: 'IssuesEvent', actor: { login: 'devonlee', avatar_url: 'https://avatars.githubusercontent.com/u/806489?v=4' }, created_at: daysAgo(1, 15), payload: { action: 'closed', issue: { title: 'Fix cache invalidation on route refresh', number: 4818, html_url: 'https://github.com/vercel/next.js/issues/4818' } } },
  { id: 'e4', type: 'PushEvent', actor: { login: 'sarahchen', avatar_url: 'https://avatars.githubusercontent.com/u/124599?v=4' }, created_at: daysAgo(2, 13), payload: { ref: 'refs/heads/main', commits: [{ message: 'Refactor route segment cache' }] } },
  { id: 'e5', type: 'ReleaseEvent', actor: { login: 'vercel-bot', avatar_url: 'https://avatars.githubusercontent.com/u/14985020?v=4' }, created_at: daysAgo(3, 9), payload: { action: 'published' } },
  { id: 'e6', type: 'PullRequestEvent', actor: { login: 'juleswynn', avatar_url: 'https://avatars.githubusercontent.com/u/102402?v=4' }, created_at: daysAgo(4, 16), payload: { action: 'merged', pull_request: { title: 'Document partial prerendering', number: 4807, html_url: 'https://github.com/vercel/next.js/pulls/4807' } } },
  { id: 'e7', type: 'PushEvent', actor: { login: 'mikaelbr', avatar_url: 'https://avatars.githubusercontent.com/u/190452?v=4' }, created_at: daysAgo(5, 11), payload: { ref: 'refs/heads/main', commits: [{ message: 'Add metadata for route groups' }] } },
  { id: 'e8', type: 'IssuesEvent', actor: { login: 'nora-dev', avatar_url: 'https://avatars.githubusercontent.com/u/108914?v=4' }, created_at: daysAgo(7, 14), payload: { action: 'opened', issue: { title: 'Support custom cache tags', number: 4791, html_url: 'https://github.com/vercel/next.js/issues/4791' } } },
  { id: 'e9', type: 'PushEvent', actor: { login: 'sarahchen', avatar_url: 'https://avatars.githubusercontent.com/u/124599?v=4' }, created_at: daysAgo(8, 9), payload: { ref: 'refs/heads/main', commits: [{ message: 'Add integration coverage for server actions' }] } },
  { id: 'e10', type: 'PullRequestEvent', actor: { login: 'juleswynn', avatar_url: 'https://avatars.githubusercontent.com/u/102402?v=4' }, created_at: daysAgo(10, 13), payload: { action: 'closed', pull_request: { title: 'Update Turbopack compatibility notes', number: 4760, html_url: 'https://github.com/vercel/next.js/pulls/4760' } } },
  { id: 'e11', type: 'PushEvent', actor: { login: 'devonlee', avatar_url: 'https://avatars.githubusercontent.com/u/806489?v=4' }, created_at: daysAgo(12, 10), payload: { ref: 'refs/heads/main', commits: [{ message: 'Optimize image metadata generation' }] } },
  { id: 'e12', type: 'IssuesEvent', actor: { login: 'nora-dev', avatar_url: 'https://avatars.githubusercontent.com/u/108914?v=4' }, created_at: daysAgo(13, 14), payload: { action: 'closed', issue: { title: 'Clarify middleware migration guide', number: 4722, html_url: 'https://github.com/vercel/next.js/issues/4722' } } },
  { id: 'e13', type: 'PushEvent', actor: { login: 'sarahchen', avatar_url: 'https://avatars.githubusercontent.com/u/124599?v=4' }, created_at: daysAgo(16, 8), payload: { ref: 'refs/heads/main', commits: [{ message: 'Tune static rendering defaults' }] } },
  { id: 'e14', type: 'PullRequestEvent', actor: { login: 'mikaelbr', avatar_url: 'https://avatars.githubusercontent.com/u/190452?v=4' }, created_at: daysAgo(19, 12), payload: { action: 'merged', pull_request: { title: 'Add draft mode example', number: 4680, html_url: 'https://github.com/vercel/next.js/pulls/4680' } } },
]

const repository: GitHubRepository = {
  id: 70107786,
  name: 'next.js',
  full_name: 'vercel/next.js',
  html_url: 'https://github.com/vercel/next.js',
  description: 'The React Framework for the Web',
  owner: { login: 'vercel', avatar_url: 'https://avatars.githubusercontent.com/u/14985020?v=4', html_url: 'https://github.com/vercel' },
  language: 'TypeScript',
  stargazers_count: 132400,
  forks_count: 28600,
  watchers_count: 1900,
  open_issues_count: 2850,
  subscribers_count: 2350,
  default_branch: 'canary',
  created_at: daysAgo(2200),
  updated_at: daysAgo(0, 10),
  pushed_at: daysAgo(0, 10),
  license: { name: 'MIT License', spdx_id: 'MIT' },
}

export const demoSnapshot: RepositorySnapshot = {
  repository,
  events: demoEvents,
  languages: { TypeScript: 11000000, JavaScript: 1800000, CSS: 750000, Rust: 460000, MDX: 180000 },
  contributors: [
    { id: 1, login: 'sarahchen', avatar_url: 'https://avatars.githubusercontent.com/u/124599?v=4', html_url: 'https://github.com/sarahchen', contributions: 482 },
    { id: 2, login: 'mikaelbr', avatar_url: 'https://avatars.githubusercontent.com/u/190452?v=4', html_url: 'https://github.com/mikaelbr', contributions: 361 },
    { id: 3, login: 'juleswynn', avatar_url: 'https://avatars.githubusercontent.com/u/102402?v=4', html_url: 'https://github.com/juleswynn', contributions: 294 },
    { id: 4, login: 'devonlee', avatar_url: 'https://avatars.githubusercontent.com/u/806489?v=4', html_url: 'https://github.com/devonlee', contributions: 218 },
    { id: 5, login: 'nora-dev', avatar_url: 'https://avatars.githubusercontent.com/u/108914?v=4', html_url: 'https://github.com/nora-dev', contributions: 176 },
  ],
  fetchedAt: new Date().toISOString(),
  isDemo: true,
}

export const popularRepositories = ['facebook/react', 'microsoft/TypeScript', 'vitejs/vite']
