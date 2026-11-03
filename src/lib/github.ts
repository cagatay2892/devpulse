export type GitHubRepository = {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  owner: { login: string; avatar_url: string; html_url: string }
  language: string | null
  stargazers_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  subscribers_count: number
  default_branch: string
  created_at: string
  updated_at: string
  pushed_at: string | null
  license: { name: string; spdx_id: string | null } | null
}

export type GitHubEvent = {
  id: string
  type: string | null
  actor: { login: string; avatar_url: string }
  created_at: string
  payload: {
    action?: string
    commits?: Array<{ message: string }>
    ref?: string
    ref_type?: string
    issue?: { title: string; number: number; html_url: string }
    pull_request?: { title: string; number: number; html_url: string }
  }
}

export type GitHubContributor = {
  id: number
  login: string
  avatar_url: string
  html_url: string
  contributions: number
}

export type RepositorySnapshot = {
  repository: GitHubRepository
  events: GitHubEvent[]
  languages: Record<string, number>
  contributors: GitHubContributor[]
  fetchedAt: string
  isDemo: boolean
}

export function normalizeRepositoryInput(input: string) {
  const trimmed = input.trim()
  const match = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/(.+)$/i)
  const repositoryPath = (match?.[1] ?? trimmed).split(/[?#]/, 1)[0].replace(/\/$/, '').replace(/\.git$/, '')
  const parts = repositoryPath.split('/').filter(Boolean)

  if (parts.length !== 2 || parts.some((part) => part.startsWith('@'))) {
    throw new Error('Enter a repository as owner/name or paste its GitHub URL.')
  }

  return `${parts[0]}/${parts[1]}`
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      const reset = response.headers.get('x-ratelimit-reset')
      const resetTime = reset
        ? new Date(Number(reset) * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : 'later'
      throw new Error(`GitHub's public API limit was reached. Try again ${reset ? `after ${resetTime}` : 'later'}.`)
    }
    if (response.status === 404) throw new Error('Repository not found. Check the owner and repository name.')
    throw new Error(`GitHub returned ${response.status}. Please try again.`)
  }

  return response.json() as Promise<T>
}

export async function fetchRepositorySnapshot(input: string): Promise<RepositorySnapshot> {
  const fullName = normalizeRepositoryInput(input)
  const encodedName = fullName.split('/').map(encodeURIComponent).join('/')
  const repository = await request<GitHubRepository>(`/repos/${encodedName}`)

  const [events, languages, contributors] = await Promise.all([
    request<GitHubEvent[]>(`/repos/${encodedName}/events?per_page=100`).catch(() => []),
    request<Record<string, number>>(`/repos/${encodedName}/languages`).catch(() => ({})),
    request<GitHubContributor[]>(`/repos/${encodedName}/contributors?per_page=5`).catch(() => []),
  ])

  return {
    repository,
    events,
    languages,
    contributors,
    fetchedAt: new Date().toISOString(),
    isDemo: false,
  }
}
