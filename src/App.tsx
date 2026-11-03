import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Command,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  GitPullRequest,
  Globe2,
  LayoutDashboard,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  Radio,
  RefreshCw,
  Search,
  Star,
  Terminal,
  Users,
  X,
} from 'lucide-react'
import { demoSnapshot, popularRepositories } from './lib/demo'
import { fetchRepositorySnapshot, type GitHubEvent, type RepositorySnapshot } from './lib/github'
import './App.css'

type Tab = 'overview' | 'compare'
type Range = 7 | 14 | 30

const languageColors: Record<string, string> = {
  TypeScript: '#54a3ff',
  JavaScript: '#f2c94c',
  CSS: '#bf7cff',
  HTML: '#f47b55',
  Python: '#4ba5b8',
  Rust: '#f47755',
  Go: '#51c7cf',
  MDX: '#a6adbb',
  Shell: '#75ba78',
}
const chartToday = new Date()

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function timeAgo(dateString: string | null) {
  if (!dateString) return 'No recent push'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000))
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(dateString).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getEventCopy(event: GitHubEvent) {
  const actor = event.actor?.login ?? 'Someone'
  const action = event.payload?.action
  switch (event.type) {
    case 'PushEvent': {
      const count = event.payload?.commits?.length ?? 1
      const message = event.payload?.commits?.[0]?.message?.split('\n')[0]
      return { title: message || `Pushed ${count} ${count === 1 ? 'commit' : 'commits'}`, detail: `${actor} · ${count} ${count === 1 ? 'commit' : 'commits'}` }
    }
    case 'PullRequestEvent':
      return { title: event.payload.pull_request?.title || 'Updated a pull request', detail: `${actor} · ${action || 'updated'} pull request` }
    case 'IssuesEvent':
      return { title: event.payload.issue?.title || 'Updated an issue', detail: `${actor} · ${action || 'updated'} issue` }
    case 'ReleaseEvent':
      return { title: 'Published a new release', detail: `${actor} · release` }
    case 'WatchEvent':
      return { title: 'Starred the repository', detail: `${actor} · star` }
    case 'ForkEvent':
      return { title: 'Created a fork', detail: `${actor} · fork` }
    default:
      return { title: event.type?.replace(/Event$/, '').replace(/([a-z])([A-Z])/g, '$1 $2') || 'Repository activity', detail: `${actor} · activity` }
  }
}

function eventKind(type: string | null) {
  if (type === 'PullRequestEvent') return 'pull'
  if (type === 'IssuesEvent') return 'issue'
  if (type === 'ReleaseEvent') return 'release'
  return 'commit'
}

function pulseScore(snapshot: RepositorySnapshot) {
  const repo = snapshot.repository
  const daysSincePush = repo.pushed_at ? (Date.now() - new Date(repo.pushed_at).getTime()) / 86400000 : 365
  const freshness = daysSincePush < 3 ? 100 : daysSincePush < 14 ? 88 : daysSincePush < 45 ? 68 : 35
  const community = Math.min(100, Math.round(Math.log10(repo.stargazers_count + repo.forks_count + 10) * 17))
  const issueRatio = repo.open_issues_count / Math.max(repo.stargazers_count, 1)
  const issueLoad = issueRatio < 0.01 ? 96 : issueRatio < 0.04 ? 82 : issueRatio < 0.1 ? 66 : 45
  return Math.round(freshness * 0.45 + community * 0.3 + issueLoad * 0.25)
}

function IconButton({ children, label, onClick, className = '' }: { children: ReactNode; label: string; onClick?: () => void; className?: string }) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} onClick={onClick}>{children}</button>
}

function MetricCard({ icon, label, value, note, tone }: { icon: ReactNode; label: string; value: string; note: string; tone: string }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div className="metric-copy">
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-note">{note}</div>
      </div>
      <MoreHorizontal className="metric-more" size={18} />
    </article>
  )
}

function ActivityChart({ events, range, onRangeChange }: { events: GitHubEvent[]; range: Range; onRangeChange: (range: Range) => void }) {
  const points = useMemo(() => {
    const today = chartToday
    const counts = new Map<string, number>()
    for (const event of events) {
      const date = new Date(event.created_at)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from({ length: range }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (range - index - 1))
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      return {
        day: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        activity: counts.get(key) ?? 0,
      }
    })
  }, [events, range])

  const chartWidth = 720
  const chartHeight = 150
  const slotWidth = chartWidth / points.length
  const barWidth = Math.min(18, Math.max(5, slotWidth * 0.42))
  const maxActivity = Math.max(...points.map((point) => point.activity), 4)
  const labelStep = range === 30 ? 5 : range === 14 ? 2 : 1

  return (
    <section className="panel activity-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">Repository pulse</div>
          <h2>Activity overview</h2>
          <p>Community activity over the last {range} days</p>
        </div>
        <div className="segmented-control" aria-label="Activity range">
          {([7, 14, 30] as Range[]).map((days) => (
            <button className={range === days ? 'selected' : ''} key={days} onClick={() => onRangeChange(days)}>{days}D</button>
          ))}
        </div>
      </div>
      <div className="chart-wrap">
        <svg className="activity-chart" viewBox={`0 0 ${chartWidth} 184`} preserveAspectRatio="none" role="img" aria-label={`Repository activity during the last ${range} days`}>
          {[0, 1, 2, 3].map((line) => <line key={line} x1="0" x2={chartWidth} y1={10 + line * 40} y2={10 + line * 40} stroke="#232c37" strokeDasharray="3 5" />)}
          {points.map((point, index) => {
            const height = point.activity ? Math.max(3, point.activity / maxActivity * (chartHeight - 6)) : 0
            const x = index * slotWidth + (slotWidth - barWidth) / 2
            const y = chartHeight - height
            return <g key={`${point.day}-${index}`}>
              <title>{`${point.day}: ${point.activity} ${point.activity === 1 ? 'event' : 'events'}`}</title>
              <rect x={x} y={y} width={barWidth} height={height} rx="3" fill="#7ce0b7" className="chart-bar" />
              {index % labelStep === 0 && <text x={index * slotWidth + slotWidth / 2} y="176" textAnchor="middle" fill="#738091" fontSize="10">{point.day}</text>}
            </g>
          })}
        </svg>
      </div>
      <div className="chart-footnote"><span className="chart-legend-dot" /> Events returned by GitHub’s public API</div>
    </section>
  )
}

function LanguageBreakdown({ languages, primaryLanguage }: { languages: Record<string, number>; primaryLanguage: string | null }) {
  const total = Object.values(languages).reduce((sum, value) => sum + value, 0)
  const items = Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 5)
  if (!items.length && primaryLanguage) items.push([primaryLanguage, 1])
  const denominator = total || 1
  return (
    <section className="panel language-panel">
      <div className="panel-heading compact">
        <div><div className="eyebrow">Codebase</div><h2>Languages</h2></div>
        <MoreHorizontal className="heading-more" size={18} aria-hidden="true" />
      </div>
      <div className="language-bar" aria-label="Language composition">
        {items.map(([name, bytes]) => <span key={name} title={`${name}: ${Math.round(bytes / denominator * 100)}%`} style={{ width: `${Math.max(bytes / denominator * 100, 2)}%`, backgroundColor: languageColors[name] ?? '#8993a0' }} />)}
      </div>
      <div className="language-list">
        {items.map(([name, bytes]) => (
          <div className="language-row" key={name}>
            <span className="language-name"><i style={{ backgroundColor: languageColors[name] ?? '#8993a0' }} />{name}</span>
            <span className="language-percent">{Math.round(bytes / denominator * 100)}%</span>
          </div>
        ))}
        {!items.length && <p className="muted-copy">Language data is not available for this repository.</p>}
      </div>
    </section>
  )
}

function EventGlyph({ kind }: { kind: string }) {
  if (kind === 'pull') return <GitPullRequest size={15} />
  if (kind === 'issue') return <MessageCircle size={15} />
  if (kind === 'release') return <Star size={15} />
  return <GitCommitHorizontal size={15} />
}

function RecentActivity({ events, isDemo }: { events: GitHubEvent[]; isDemo: boolean }) {
  const sorted = [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
  return (
    <section className="panel recent-panel">
      <div className="panel-heading compact">
        <div><div className="eyebrow">Live feed</div><h2>Recent activity</h2></div>
        <span className="latest-label">Latest 5</span>
      </div>
      {sorted.length ? <div className="activity-list">
        {sorted.map((event) => {
          const copy = getEventCopy(event)
          const kind = eventKind(event.type)
          return <div className="activity-row" key={event.id}>
            <div className={`event-icon ${kind}`}><EventGlyph kind={kind} /></div>
            <img className="activity-avatar" src={event.actor?.avatar_url} alt="" />
            <div className="activity-copy"><div className="activity-title">{copy.title}</div><div className="activity-detail">{copy.detail}</div></div>
            <time className="activity-time" dateTime={event.created_at}>{timeAgo(event.created_at)}</time>
          </div>
        })}
      </div> : <div className="empty-inline">{isDemo ? 'Activity appears here when GitHub responds.' : 'No recent public events were found.'}</div>}
      {isDemo && <div className="sample-note"><span /> Sample activity · connect to GitHub to refresh</div>}
    </section>
  )
}

function Contributors({ contributors }: { contributors: RepositorySnapshot['contributors'] }) {
  return (
    <section className="panel contributors-panel">
      <div className="panel-heading compact">
        <div><div className="eyebrow">People</div><h2>Top contributors</h2></div>
        <MoreHorizontal className="heading-more" size={18} aria-hidden="true" />
      </div>
      <div className="contributor-list">
        {contributors.slice(0, 4).map((person, index) => (
          <a href={person.html_url} target="_blank" rel="noreferrer" className="contributor-row" key={person.id}>
            <span className="contributor-rank">0{index + 1}</span>
            <img src={person.avatar_url} alt="" />
            <span className="contributor-name">{person.login}</span>
            <span className="contribution-count">{compactNumber(person.contributions)} <small>contrib.</small></span>
          </a>
        ))}
        {!contributors.length && <p className="muted-copy">Contributor data is not available right now.</p>}
      </div>
    </section>
  )
}

function PulseCard({ snapshot }: { snapshot: RepositorySnapshot }) {
  const score = pulseScore(snapshot)
  const circumference = 2 * Math.PI * 37
  return (
    <section className="panel pulse-panel">
      <div className="panel-heading compact">
        <div><div className="eyebrow">At a glance</div><h2>Project pulse</h2></div>
        <span className="info-hint" title="A heuristic based on recent pushes, community size and open issue load."><CircleHelp size={15} /></span>
      </div>
      <div className="pulse-body">
        <div className="pulse-ring">
          <svg viewBox="0 0 88 88" aria-label={`Pulse score ${score} out of 100`}>
            <circle cx="44" cy="44" r="37" className="ring-track" />
            <circle cx="44" cy="44" r="37" className="ring-progress" style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - score / 100) }} />
          </svg>
          <div className="pulse-number">{score}<span>/100</span></div>
        </div>
        <div className="pulse-summary"><strong>{score > 80 ? 'Very active' : score > 60 ? 'Steady pace' : 'Needs attention'}</strong><span>Healthy community signals</span><div className="pulse-delta"><ArrowUpRight size={14} /> Updated {timeAgo(snapshot.repository.pushed_at)}</div></div>
      </div>
      <div className="pulse-legend"><span><i className="legend-green" /> Freshness</span><span><i className="legend-blue" /> Community</span><span><i className="legend-orange" /> Issue load</span></div>
      {snapshot.isDemo && <p className="heuristic-note">Illustrative score from sample data</p>}
    </section>
  )
}

function ComparePanel({ primary, comparison, loading, error, input, setInput, onCompare }: {
  primary: RepositorySnapshot
  comparison: RepositorySnapshot | null
  loading: boolean
  error: string
  input: string
  setInput: (value: string) => void
  onCompare: (event: FormEvent<HTMLFormElement>) => void
}) {
  const rows = [
    { label: 'Stars', icon: <Star size={15} />, key: 'stargazers_count' as const },
    { label: 'Forks', icon: <GitFork size={15} />, key: 'forks_count' as const },
    { label: 'Open issues', icon: <MessageCircle size={15} />, key: 'open_issues_count' as const },
    { label: 'Pulse score', icon: <Activity size={15} />, value: true },
  ]
  return (
    <section className="compare-section">
      <div className="compare-intro"><span className="eyebrow">Side by side</span><h2>Compare repositories</h2><p>See how two open source projects stack up across community and maintenance signals.</p></div>
      <form className="compare-search" onSubmit={onCompare}>
        <Search size={17} />
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="owner/repository" aria-label="Repository to compare" />
        <button type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={15} /> : 'Add comparison'}</button>
      </form>
      {error && <div className="error-banner" role="alert"><X size={16} />{error}</div>}
      {comparison ? <div className="compare-table panel">
        <div className="compare-table-head">
          <div className="compare-repo-name"><img src={primary.repository.owner.avatar_url} alt="" /><span><small>BASE REPOSITORY</small><strong>{primary.repository.full_name}</strong></span></div>
          <div className="compare-vs">VS</div>
          <div className="compare-repo-name"><img src={comparison.repository.owner.avatar_url} alt="" /><span><small>COMPARISON</small><strong>{comparison.repository.full_name}</strong></span></div>
        </div>
        {rows.map((row) => {
          const left = row.value ? pulseScore(primary) : primary.repository[row.key!]
          const right = row.value ? pulseScore(comparison) : comparison.repository[row.key!]
          const max = Math.max(left, right, 1)
          return <div className="compare-metric-row" key={row.label}>
            <div className={`compare-value ${left >= right ? 'winner' : ''}`}>{compactNumber(left)}</div>
            <div className="compare-label">{row.icon}<span>{row.label}</span></div>
            <div className={`compare-value right ${right >= left ? 'winner' : ''}`}>{compactNumber(right)}</div>
            <div className="compare-bars"><span style={{ width: `${left / max * 46}%` }} /><span style={{ width: `${right / max * 46}%` }} /></div>
          </div>
        })}
        <div className="compare-footer"><span>Metrics are fetched from GitHub’s public API.</span><a href={comparison.repository.html_url} target="_blank" rel="noreferrer">Open comparison repo <ExternalLink size={13} /></a></div>
      </div> : <div className="compare-empty panel"><div className="compare-empty-icon"><GitBranch size={22} /></div><strong>Choose a repository to compare</strong><span>Enter a public GitHub repo above or pick a popular project.</span><div className="quick-repos">{popularRepositories.map((repo) => <button type="button" key={repo} onClick={() => setInput(repo)}>{repo}</button>)}</div></div>}
    </section>
  )
}

function App() {
  const [tab, setTab] = useState<Tab>('overview')
  const [snapshot, setSnapshot] = useState<RepositorySnapshot>(demoSnapshot)
  const [comparison, setComparison] = useState<RepositorySnapshot | null>(null)
  const [repoInput, setRepoInput] = useState('')
  const [compareInput, setCompareInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [compareLoading, setCompareLoading] = useState(false)
  const [error, setError] = useState('')
  const [compareError, setCompareError] = useState('')
  const [range, setRange] = useState<Range>(14)
  const [cloneCopied, setCloneCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchRepositorySnapshot('vercel/next.js').then((data) => {
      if (!cancelled) setSnapshot(data)
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  async function loadRepository(query = repoInput) {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const next = await fetchRepositorySnapshot(query)
      setSnapshot(next)
      setRepoInput('')
      setTab('overview')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load this repository.')
    } finally {
      setLoading(false)
    }
  }

  async function loadComparison(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!compareInput.trim()) return
    setCompareLoading(true)
    setCompareError('')
    try {
      const next = await fetchRepositorySnapshot(compareInput)
      if (next.repository.id === snapshot.repository.id) throw new Error('Choose a different repository to compare.')
      setComparison(next)
    } catch (caught) {
      setCompareError(caught instanceof Error ? caught.message : 'Unable to load this repository.')
    } finally {
      setCompareLoading(false)
    }
  }

  async function copyCloneCommand() {
    if (!navigator.clipboard) {
      setError('Clipboard access is not available in this browser.')
      return
    }
    try {
      await navigator.clipboard.writeText(`git clone ${repo.html_url}.git`)
      setCloneCopied(true)
      window.setTimeout(() => setCloneCopied(false), 1800)
    } catch {
      setError('Could not copy the clone command. Try copying it from the GitHub page instead.')
    }
  }

  const repo = snapshot.repository
  const totalLanguages = Object.values(snapshot.languages).reduce((sum, bytes) => sum + bytes, 0)
  const dominantLanguage = Object.entries(snapshot.languages).sort((a, b) => b[1] - a[1])[0]?.[0] || repo.language || 'Unknown'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#overview" className="brand" onClick={(event) => { event.preventDefault(); setTab('overview') }}>
          <span className="brand-mark"><Activity size={19} strokeWidth={2.8} /></span>
          <span>dev<span>pulse</span></span>
          <span className="brand-tag">BETA</span>
        </a>
        <div className="workspace-switcher"><span className="workspace-avatar">S</span><span className="workspace-copy"><small>WORKSPACE</small><strong>Personal space</strong></span></div>
        <div className="side-label">Workspace</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}><LayoutDashboard size={17} /><span>Overview</span></button>
          <button className={tab === 'compare' ? 'active' : ''} onClick={() => setTab('compare')}><GitBranch size={17} /><span>Compare repos</span></button>
        </nav>
        <div className="side-label tracked-label">Tracked repositories <button type="button" aria-label="Add repository" onClick={() => document.getElementById('repo-search')?.focus()}>+</button></div>
        <div className="tracked-list">
          {[repo.full_name, 'facebook/react', 'microsoft/TypeScript'].map((name, index) => <button className={name === repo.full_name ? 'tracked active-tracked' : 'tracked'} key={`${name}-${index}`} onClick={() => loadRepository(name)}>
            <span className={`repo-dot dot-${index}`} />{name.split('/')[1]}{name === repo.full_name && <span className="tracked-live" />}
          </button>)}
        </div>
        <div className="sidebar-spacer" />
        <div className="api-status"><span className="status-signal"><i /></span><span><strong>GitHub API</strong><small>{snapshot.isDemo ? 'Sample preview' : 'Connected · public access'}</small></span><ChevronRight size={14} /></div>
        <div className="sidebar-bottom">
          <a href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer"><CircleHelp size={16} />Documentation <ExternalLink size={13} /></a>
          <div className="profile"><span className="profile-avatar">A</span><span><strong>Alex Morgan</strong><small>Free workspace</small></span></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{tab === 'overview' ? 'Overview' : 'Compare'}</strong></div>
          <div className="topbar-actions">
            <span className={`connection-pill ${snapshot.isDemo ? 'demo' : ''}`}><i />{snapshot.isDemo ? 'Demo mode' : 'Live data'}</span>
            <span className="topbar-divider" />
            <a href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer" className="help-button"><CircleHelp size={16} />Help center</a>
            <button type="button" className="top-profile">AM</button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-title-row">
            <div><div className="eyebrow title-eyebrow"><span className="crumb-chip">PROJECTS</span><ChevronRight size={13} />{tab === 'overview' ? 'OVERVIEW' : 'COMPARISON'}</div><h1>{tab === 'overview' ? 'Repository overview' : 'Compare repositories'}</h1><p>{tab === 'overview' ? 'Keep a pulse on the projects that matter.' : 'A clearer view of how projects grow and stay maintained.'}</p></div>
            <div className="title-actions"><button type="button" className="outline-button" onClick={() => { setRepoInput(repo.full_name); setError(''); document.getElementById('repo-search')?.focus() }}><Command size={15} /> Quick actions <kbd>⌘ K</kbd></button><button type="button" className="primary-button" onClick={() => { setTab('compare'); setCompareError('') }}><GitBranch size={15} /> Compare repos</button></div>
          </div>

          <form className="repo-search" onSubmit={(event) => { event.preventDefault(); loadRepository() }}>
            <Search size={18} />
            <input id="repo-search" value={repoInput} onChange={(event) => setRepoInput(event.target.value)} placeholder="Search GitHub repositories · owner/name or paste a URL" aria-label="Search GitHub repositories" />
            {repoInput && <IconButton label="Clear search" onClick={() => setRepoInput('')}><X size={16} /></IconButton>}
            <span className="search-divider" />
            <button type="submit" disabled={loading}>{loading ? <LoaderCircle size={16} className="spin" /> : <><span>Analyze repo</span><ChevronRight size={15} /></>}</button>
          </form>
          {error && <div className="error-banner" role="alert"><X size={16} />{error}</div>}

          {tab === 'overview' ? <>
            <section className="repo-hero">
              <div className="repo-identity">
                <img className="owner-avatar" src={repo.owner.avatar_url} alt={`${repo.owner.login} avatar`} />
                <div><div className="repo-path"><a href={repo.owner.html_url} target="_blank" rel="noreferrer">{repo.owner.login}</a><span>/</span><strong>{repo.name}</strong><span className="visibility-badge"><Globe2 size={12} /> Public</span></div><p>{repo.description || 'No repository description provided.'}</p></div>
              </div>
              <div className="repo-hero-actions"><span className="default-branch"><GitBranch size={13} />{repo.default_branch}</span><button type="button" className="outline-button small" onClick={() => { void copyCloneCommand() }}>{cloneCopied ? <Check size={14} /> : <Terminal size={14} />}{cloneCopied ? 'Copied' : 'Copy clone command'}</button><a className="outline-button small" href={repo.html_url} target="_blank" rel="noreferrer">Open GitHub <ExternalLink size={13} /></a></div>
            </section>

            <div className="stats-grid">
              <MetricCard icon={<Star size={18} />} label="Total stars" value={compactNumber(repo.stargazers_count)} note="Community appreciation" tone="gold" />
              <MetricCard icon={<GitFork size={18} />} label="Forks" value={compactNumber(repo.forks_count)} note="Independent copies" tone="violet" />
              <MetricCard icon={<Users size={18} />} label="Watchers" value={compactNumber(repo.subscribers_count || repo.watchers_count)} note="Following activity" tone="blue" />
              <MetricCard icon={<MessageCircle size={18} />} label="Open issues" value={compactNumber(repo.open_issues_count)} note="Issues + pull requests" tone="coral" />
            </div>

            <div className="dashboard-grid">
              <ActivityChart events={snapshot.events} range={range} onRangeChange={setRange} />
              <PulseCard snapshot={snapshot} />
              <LanguageBreakdown languages={snapshot.languages} primaryLanguage={repo.language} />
              <Contributors contributors={snapshot.contributors} />
              <RecentActivity events={snapshot.events} isDemo={snapshot.isDemo} />
              <section className="panel repo-details-panel">
                <div className="panel-heading compact"><div><div className="eyebrow">Repository details</div><h2>Project info</h2></div><MoreHorizontal className="heading-more" size={18} aria-hidden="true" /></div>
                <div className="detail-rows">
                  <div><span><Code2 size={15} />Primary language</span><strong><i className="detail-language-dot" style={{ backgroundColor: languageColors[dominantLanguage] ?? '#8993a0' }} />{dominantLanguage}</strong></div>
                  <div><span><Radio size={15} />Last push</span><strong>{timeAgo(repo.pushed_at)}</strong></div>
                  <div><span><GitBranch size={15} />Default branch</span><strong className="mono-value">{repo.default_branch}</strong></div>
                  <div><span><Globe2 size={15} />License</span><strong>{repo.license?.spdx_id || repo.license?.name || 'Not specified'}</strong></div>
                  <div><span><Activity size={15} />Created</span><strong>{new Date(repo.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</strong></div>
                </div>
                {totalLanguages > 0 && <div className="detail-footer"><span><Check size={14} /> Data refreshed {timeAgo(snapshot.fetchedAt)}</span><button type="button" onClick={() => loadRepository(repo.full_name)}><RefreshCw size={13} /> Refresh</button></div>}
              </section>
            </div>
            <div className="page-footer"><span>DevPulse · Open source project insights</span><span>Data provided by <a href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer">GitHub REST API</a></span></div>
          </> : <ComparePanel primary={snapshot} comparison={comparison} loading={compareLoading} error={compareError} input={compareInput} setInput={setCompareInput} onCompare={loadComparison} />}
        </div>
      </main>
    </div>
  )
}

export default App
