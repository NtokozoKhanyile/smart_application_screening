import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, LabelList,
  AreaChart, Area,
} from 'recharts'
import AdminLayout from '../../components/layout/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { applicationAPI } from '../../services/applicationService'

const C = {
  navy: '#1B2B6B', gold: '#D4A017', green: '#16A34A', red: '#DC2626',
  amber: '#D97706', purple: '#7C3AED', blue: '#2563EB', gray: '#94A3B8',
  indigo: '#4F46E5', teal: '#0D9488', lightGray: '#E2E8F0',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

const StatCard = ({ label, value, sub, color = 'text-navy-700', bg = 'bg-navy-50', icon }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
        <p className="text-sm text-gray-600 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      {icon && <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>{icon}</div>}
    </div>
  </div>
)

const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`card p-5 ${className}`}>
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
)

const EmptyChart = () => (
  <div className="flex items-center justify-center h-48 text-gray-300 text-sm">Not enough data yet</div>
)

const TabButton = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
      active ? 'bg-navy-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {children}
    {count != null && (
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-navy-600 text-navy-100' : 'bg-gray-200 text-gray-600'}`}>
        {count}
      </span>
    )}
  </button>
)

// ─── Time Range Filter ────────────────────────────────────────────────────────

const TIME_RANGES = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '6mo', days: 180 },
  { label: 'All time', days: null },
]

const TimeRangeFilter = ({ value, onChange }) => (
  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
    {TIME_RANGES.map(r => (
      <button
        key={r.label}
        onClick={() => onChange(r.days)}
        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
          value === r.days
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {r.label}
      </button>
    ))}
  </div>
)

// ─── Applications Analytics Tab ───────────────────────────────────────────────

const ApplicationsAnalyticsTab = ({ applications }) => {
  const [timeRangeDays, setTimeRangeDays] = useState(null)

  // ── Stat card figures (all-time, not filtered) ──────────────────────────────
  const totalApps = applications.length
  const submitted = applications.filter(a => a.status !== 'draft').length
  const drafts = applications.filter(a => a.status === 'draft').length
  const accepted = applications.filter(a => a.status === 'accepted').length

  const draftAbandonmentRate = totalApps ? Math.round((drafts / totalApps) * 100) : null
  const finalAcceptRate = submitted ? Math.round((accepted / submitted) * 100) : null

  // ── Pipeline funnel (all-time) ──────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = {
      draft: 0, submitted: 0, under_review: 0,
      recommended: 0, accepted: 0, rejected: 0,
    }
    applications.forEach(a => { if (counts[a.status] != null) counts[a.status]++ })
    return counts
  }, [applications])

  const pipelineData = useMemo(() => [
    { label: 'Total',        value: totalApps,                     color: '#818CF8', textColor: '#3730A3' },
    { label: 'Submitted',    value: submitted,                     color: '#34D399', textColor: '#065F46' },
    { label: 'Recommended',  value: statusCounts.recommended,      color: '#A78BFA', textColor: '#5B21B6' },
    { label: 'Under review', value: statusCounts.under_review,     color: '#FCD34D', textColor: '#92400E' },
    { label: 'Accepted',     value: statusCounts.accepted,         color: '#6EE7B7', textColor: '#14532D' },
    { label: 'Rejected',     value: statusCounts.rejected,         color: '#FCA5A5', textColor: '#991B1B' },
  ], [totalApps, submitted, statusCounts])

  // ── Status breakdown donut (all-time) ───────────────────────────────────────
  const donutData = useMemo(() => [
    { name: 'Draft',        value: statusCounts.draft,        color: C.gray },
    { name: 'Submitted',    value: statusCounts.submitted,    color: C.blue },
    { name: 'Under review', value: statusCounts.under_review, color: C.amber },
    { name: 'Recommended',  value: statusCounts.recommended,  color: C.purple },
    { name: 'Accepted',     value: statusCounts.accepted,     color: C.green },
    { name: 'Rejected',     value: statusCounts.rejected,     color: C.red },
  ].filter(d => d.value > 0), [statusCounts])

  // ── Filter applications by time range ───────────────────────────────────────
  const filteredApps = useMemo(() => {
    if (!timeRangeDays) return applications
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - timeRangeDays)
    return applications.filter(a => a.created_at && new Date(a.created_at) >= cutoff)
  }, [applications, timeRangeDays])

  // ── Volume over time (filtered) ─────────────────────────────────────────────
  const volumeData = useMemo(() => {
    const map = {}
    filteredApps.forEach(a => {
      if (!a.created_at) return
      const month = a.created_at.slice(0, 7)
      map[month] = (map[month] || 0) + 1
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }))
  }, [filteredApps])

  // ── Draft vs submitted over time (filtered) ─────────────────────────────────
  const draftVsSubmittedData = useMemo(() => {
    const map = {}
    filteredApps.forEach(a => {
      if (!a.created_at) return
      const month = a.created_at.slice(0, 7)
      if (!map[month]) map[month] = { month, submitted: 0, draft: 0 }
      if (a.status === 'draft') map[month].draft++
      else map[month].submitted++
    })
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  }, [filteredApps])

  // ── Applications by course (all-time) ───────────────────────────────────────
  const courseVolumeData = useMemo(() => {
    const map = {}
    applications.forEach(a => {
      const name = (a.course?.name || `Course #${a.course_id}`)
        .replace('BSc ', '').replace('BCom ', '').replace('BA ', '').replace('BEng ', '')
      map[name] = (map[name] || 0) + 1
    })
    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
  }, [applications])

  // ── Outcome by course (all-time) ─────────────────────────────────────────────
  const courseOutcomeData = useMemo(() => {
    const map = {}
    applications.forEach(a => {
      const name = (a.course?.name || `Course #${a.course_id}`)
        .replace('BSc ', '').replace('BCom ', '').replace('BA ', '').replace('BEng ', '')
      if (!map[name]) map[name] = { name, accepted: 0, rejected: 0, pending: 0 }
      if (a.status === 'accepted') map[name].accepted++
      else if (a.status === 'rejected') map[name].rejected++
      else if (a.status !== 'draft') map[name].pending++
    })
    return Object.values(map).sort((a, b) => b.accepted - a.accepted)
  }, [applications])

  const maxCourseTotal = Math.max(...courseVolumeData.map(d => d.total), 1)

  return (
    <div className="space-y-6">
      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total applications"
          value={totalApps}
          sub="all time"
          color="text-indigo-700"
          bg="bg-indigo-50"
          icon={
            <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Submitted"
          value={submitted}
          sub="past draft stage"
          color="text-green-700"
          bg="bg-green-50"
          icon={
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Draft abandonment"
          value={draftAbandonmentRate != null ? `${draftAbandonmentRate}%` : null}
          sub="started but not submitted"
          color={draftAbandonmentRate > 20 ? 'text-red-600' : 'text-amber-600'}
          bg={draftAbandonmentRate > 20 ? 'bg-red-50' : 'bg-amber-50'}
          icon={
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          }
        />
        <StatCard
          label="Final acceptance rate"
          value={finalAcceptRate != null ? `${finalAcceptRate}%` : null}
          sub="of all submitted"
          color="text-purple-700"
          bg="bg-purple-50"
          icon={
            <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
      </div>

      {/* ── Row 1: Pipeline funnel + Status donut ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Application status pipeline" subtitle="Volume at each stage of the admissions funnel">
          {totalApps === 0 ? <EmptyChart /> : (
            <div className="space-y-2 mt-2">
              {pipelineData.map(step => {
                const pct = totalApps ? Math.round((step.value / totalApps) * 100) : 0
                const barWidth = totalApps ? (step.value / totalApps) * 100 : 0
                return (
                  <div key={step.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-24 text-right flex-shrink-0">{step.label}</span>
                    <div className="flex-1 h-7 rounded-md bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-md flex items-center px-2 transition-all duration-500"
                        style={{ width: `${Math.max(barWidth, 4)}%`, backgroundColor: step.color }}
                      >
                        {step.value > 0 && (
                          <span className="text-xs font-semibold" style={{ color: step.textColor }}>
                            {step.value}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Current status breakdown" subtitle="Live snapshot of all application statuses">
          {donutData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%" cy="50%"
                  innerRadius={65} outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Time range filter ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Time-based charts filtered by selected period</p>
        <TimeRangeFilter value={timeRangeDays} onChange={setTimeRangeDays} />
      </div>

      {/* ── Row 2: Volume + Draft vs Submitted ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Application volume over time" subtitle="Monthly count of new applications">
          {volumeData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={volumeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Applications" fill={C.indigo} radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: '#64748B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Draft vs submitted over time" subtitle="Monthly submission conversion">
          {draftVsSubmittedData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={draftVsSubmittedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="colorDraft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.amber} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.amber} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  name="Submitted"
                  stroke={C.green}
                  strokeWidth={2}
                  fill="url(#colorSubmitted)"
                />
                <Area
                  type="monotone"
                  dataKey="draft"
                  name="Draft only"
                  stroke={C.amber}
                  strokeWidth={2}
                  fill="url(#colorDraft)"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Row 3: Course volume + Course outcomes ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Applications by course" subtitle="Total application volume per programme">
          {courseVolumeData.length === 0 ? <EmptyChart /> : (
            <div className="space-y-3 mt-2">
              {courseVolumeData.map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 text-right flex-shrink-0 truncate">{c.name}</span>
                  <div className="flex-1 h-6 rounded-md bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-500"
                      style={{
                        width: `${(c.total / maxCourseTotal) * 100}%`,
                        backgroundColor: C.indigo,
                        opacity: 0.75,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right flex-shrink-0">{c.total}</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Outcome by course" subtitle="Accepted, rejected, and pending per programme">
          {courseOutcomeData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={courseOutcomeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                <Bar dataKey="accepted" name="Accepted" fill={C.green}  radius={[3, 3, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill={C.red}    radius={[3, 3, 0, 0]} />
                <Bar dataKey="pending"  name="Pending"  fill={C.amber}  radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

// ─── AI Analytics Tab ─────────────────────────────────────────────────────────

const AIAnalyticsTab = ({ applications }) => {
  const screened = useMemo(() => applications.filter(a => a.screening_result), [applications])
  const total = screened.length
  const recommended = screened.filter(a => a.screening_result?.decision === 'recommended').length
  const rejected = screened.filter(a => a.screening_result?.decision === 'rejected').length
  const borderline = screened.filter(a => a.screening_result?.decision === 'review').length
  const recommendedRate = total ? Math.round((recommended / total) * 100) : null
  const rejectionRate = total ? Math.round((rejected / total) * 100) : null
  const borderlineRate = total ? Math.round((borderline / total) * 100) : null

  const decisionData = useMemo(() => [
    { name: 'Recommended', value: recommended, color: C.purple },
    { name: 'Rejected',    value: rejected,    color: C.red },
    { name: 'Under Review', value: borderline, color: C.amber },
  ].filter(d => d.value > 0), [recommended, rejected, borderline])

  const scoreData = useMemo(() => {
    const buckets = [
      { range: '0–19',   min: 0,  max: 19,  count: 0 },
      { range: '20–39',  min: 20, max: 39,  count: 0 },
      { range: '40–59',  min: 40, max: 59,  count: 0 },
      { range: '60–69',  min: 60, max: 69,  count: 0 },
      { range: '70–79',  min: 70, max: 79,  count: 0 },
      { range: '80–89',  min: 80, max: 89,  count: 0 },
      { range: '90–100', min: 90, max: 100, count: 0 },
    ]
    screened.forEach(a => {
      const s = Math.round(a.screening_result?.prediction_score || 0)
      const b = buckets.find(b => s >= b.min && s <= b.max)
      if (b) b.count++
    })
    return buckets
  }, [screened])

  const courseData = useMemo(() => {
    const map = {}
    screened.forEach(a => {
      const name = a.course?.name || `Course #${a.course_id}`
      const short = name.replace('BSc ', '').replace('BCom ', '').replace('BA ', '').replace('BEng ', '')
      if (!map[short]) map[short] = { name: short, total: 0, recommended: 0 }
      map[short].total++
      if (a.screening_result?.decision === 'recommended') map[short].recommended++
    })
    return Object.values(map).map(c => ({
      ...c,
      passRate: Math.round((c.recommended / c.total) * 100),
    })).sort((a, b) => b.passRate - a.passRate)
  }, [screened])

  const failingSubjects = useMemo(() => {
    const map = {}
    applications.forEach(a => {
      if (!a.screening_result || a.screening_result.decision !== 'rejected') return
      const explanation = a.screening_result.explanation || ''
      a.subjects?.forEach(s => {
        const name = s.subject?.name
        if (name && explanation.includes(name)) {
          map[name] = (map[name] || 0) + 1
        }
      })
    })
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [applications])

  const timeData = useMemo(() => {
    const map = {}
    screened.forEach(a => {
      if (!a.created_at) return
      const month = a.created_at.slice(0, 7)
      if (!map[month]) map[month] = { month, recommended: 0, rejected: 0, review: 0 }
      const d = a.screening_result?.decision
      if (d === 'recommended') map[month].recommended++
      else if (d === 'rejected') map[month].rejected++
      else map[month].review++
    })
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  }, [screened])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Screened" value={total} sub="applications processed by AI" color="text-navy-700" bg="bg-navy-50"
          icon={<svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
        <StatCard label="Recommendation Rate" value={recommendedRate != null ? `${recommendedRate}%` : null} sub="of screened applications" color="text-purple-700" bg="bg-purple-50"
          icon={<svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>} />
        <StatCard label="Rejection Rate" value={rejectionRate != null ? `${rejectionRate}%` : null} sub="of screened applications" color="text-red-600" bg="bg-red-50"
          icon={<svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Borderline Rate" value={borderlineRate != null ? `${borderlineRate}%` : null} sub="sent for manual review" color="text-amber-600" bg="bg-amber-50"
          icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="AI Decision Distribution" subtitle="Split of all AI screening outcomes">
          {decisionData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={decisionData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
                  {decisionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Score Distribution" subtitle="How AI scores are spread across all screened applications">
          {total === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={scoreData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Applications" radius={[3, 3, 0, 0]}>
                  {scoreData.map((e) => <Cell key={e.range} fill={parseInt(e.range) >= 70 ? C.green : parseInt(e.range) >= 60 ? C.amber : C.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="AI Recommendation Rate by Course" subtitle="% of applications recommended per course">
          {courseData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={courseData} margin={{ top: 5, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="passRate" name="Recommendation Rate %" fill={C.purple} radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="passRate" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 10, fill: '#64748B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top Failing Subjects" subtitle="Subjects most frequently causing AI rejections">
          {failingSubjects.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={failingSubjects} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748B' }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Rejections" fill={C.red} radius={[0, 3, 3, 0]}>
                  <LabelList dataKey="count" position="right" style={{ fontSize: 10, fill: '#64748B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="AI Decisions Over Time" subtitle="Monthly trend of AI screening outcomes">
        {timeData.length === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timeData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              <Line type="monotone" dataKey="recommended" name="Recommended" stroke={C.purple} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="rejected"    name="Rejected"    stroke={C.red}    strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="review"      name="Under Review" stroke={C.amber} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}

// ─── Admin Analytics Tab ──────────────────────────────────────────────────────

const AdminAnalyticsTab = ({ applications }) => {
  const withResults = useMemo(() => applications.filter(a => a.screening_result), [applications])
  const reviewed = useMemo(() => withResults.filter(a => a.screening_result?.reviewed_by_admin), [withResults])
  const overrideCount = reviewed.length
  const overrideRate = withResults.length ? Math.round((overrideCount / withResults.length) * 100) : null
  const finalAccepted = applications.filter(a => a.status === 'accepted').length
  const totalSubmitted = applications.filter(a => a.status !== 'draft').length
  const finalAcceptRate = totalSubmitted ? Math.round((finalAccepted / totalSubmitted) * 100) : null
  const unreviewed = applications.filter(a => a.status === 'under_review' || a.status === 'recommended').length

  const aiRecommendedAdminRejected = reviewed.filter(a =>
    a.screening_result?.decision === 'recommended' && a.screening_result?.final_decision === 'rejected').length
  const aiRejectedAdminAccepted = reviewed.filter(a =>
    a.screening_result?.decision === 'rejected' && a.screening_result?.final_decision === 'accepted').length
  const aiAndAdminAgreed = reviewed.filter(a => {
    const ai = a.screening_result?.decision
    const admin = a.screening_result?.final_decision
    return (ai === 'recommended' && admin === 'accepted') || (ai === 'rejected' && admin === 'rejected')
  }).length

  const overrideDirectionData = useMemo(() => [
    { name: 'AI & Admin Agreed',        value: aiAndAdminAgreed,            color: C.green },
    { name: 'AI Rec → Admin Rejected',  value: aiRecommendedAdminRejected,  color: C.red },
    { name: 'AI Rej → Admin Accepted',  value: aiRejectedAdminAccepted,     color: C.amber },
  ].filter(d => d.value > 0), [aiAndAdminAgreed, aiRecommendedAdminRejected, aiRejectedAdminAccepted])

  const overrideByCourse = useMemo(() => {
    const map = {}
    withResults.forEach(a => {
      const short = (a.course?.name || `Course #${a.course_id}`)
        .replace('BSc ', '').replace('BCom ', '').replace('BA ', '').replace('BEng ', '')
      if (!map[short]) map[short] = { name: short, total: 0, overridden: 0 }
      map[short].total++
      if (a.screening_result?.reviewed_by_admin) map[short].overridden++
    })
    return Object.values(map).map(c => ({
      ...c,
      overrideRate: Math.round((c.overridden / c.total) * 100),
    })).sort((a, b) => b.overrideRate - a.overrideRate)
  }, [withResults])

  const agreementByCourse = useMemo(() => {
    const map = {}
    reviewed.forEach(a => {
      const short = (a.course?.name || `Course #${a.course_id}`)
        .replace('BSc ', '').replace('BCom ', '').replace('BA ', '').replace('BEng ', '')
      if (!map[short]) map[short] = { name: short, agreed: 0, overridden: 0 }
      const ai = a.screening_result?.decision
      const admin = a.screening_result?.final_decision
      const agreed = (ai === 'recommended' && admin === 'accepted') || (ai === 'rejected' && admin === 'rejected')
      if (agreed) map[short].agreed++
      else map[short].overridden++
    })
    return Object.values(map).sort((a, b) => b.overridden - a.overridden)
  }, [reviewed])

  const adminTimeData = useMemo(() => {
    const map = {}
    reviewed.forEach(a => {
      if (!a.created_at) return
      const month = a.created_at.slice(0, 7)
      if (!map[month]) map[month] = { month, accepted: 0, rejected: 0 }
      const d = a.screening_result?.final_decision
      if (d === 'accepted') map[month].accepted++
      else if (d === 'rejected') map[month].rejected++
    })
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  }, [reviewed])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Admin Reviews" value={overrideCount} sub="applications manually reviewed" color="text-navy-700" bg="bg-navy-50"
          icon={<svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>} />
        <StatCard label="Override Rate" value={overrideRate != null ? `${overrideRate}%` : null} sub="of screened applications changed"
          color={overrideRate > 40 ? 'text-red-600' : 'text-amber-600'} bg={overrideRate > 40 ? 'bg-red-50' : 'bg-amber-50'}
          icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>} />
        <StatCard label="Final Acceptance Rate" value={finalAcceptRate != null ? `${finalAcceptRate}%` : null} sub="of all submitted applications" color="text-green-700" bg="bg-green-50"
          icon={<svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Unreviewed Queue" value={unreviewed} sub="recommended + under review"
          color={unreviewed > 10 ? 'text-red-600' : 'text-blue-600'} bg={unreviewed > 10 ? 'bg-red-50' : 'bg-blue-50'}
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Admin vs AI Agreement" subtitle="How often admins agreed or overrode the AI decision">
          {overrideDirectionData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={overrideDirectionData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
                  {overrideDirectionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Override Rate by Course" subtitle="Which courses see the most admin intervention">
          {overrideByCourse.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={overrideByCourse} margin={{ top: 5, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="overrideRate" name="Override Rate %" fill={C.gold} radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="overrideRate" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 10, fill: '#64748B' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Agreements vs Overrides by Course" subtitle="Per course breakdown of admin decisions">
          {agreementByCourse.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={agreementByCourse} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                <Bar dataKey="agreed"     name="Agreed with AI" fill={C.green} radius={[3, 3, 0, 0]} stackId="a" />
                <Bar dataKey="overridden" name="Overrode AI"    fill={C.amber} radius={[0, 0, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Admin Decisions Over Time" subtitle="Monthly trend of admin accepts and rejects">
          {adminTimeData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={adminTimeData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                <Line type="monotone" dataKey="accepted" name="Accepted" stroke={C.green} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="rejected" name="Rejected" stroke={C.red}   strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Analytics = () => {
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('applications')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const { data } = await applicationAPI.getAllAdmin()
      setApplications(data)
    } catch {
      toast.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const screened = applications.filter(a => a.screening_result).length
  const reviewed = applications.filter(a => a.screening_result?.reviewed_by_admin).length

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            {applications.length} total · {screened} screened · {reviewed} admin reviewed
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <TabButton active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} count={applications.length}>
          Applications
        </TabButton>
        <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} count={screened}>
          AI Analytics
        </TabButton>
        <TabButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} count={reviewed}>
          Admin Analytics
        </TabButton>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" message="Loading analytics..." />
        </div>
      ) : activeTab === 'applications' ? (
        <ApplicationsAnalyticsTab applications={applications} />
      ) : activeTab === 'ai' ? (
        <AIAnalyticsTab applications={applications} />
      ) : (
        <AdminAnalyticsTab applications={applications} />
      )}
    </AdminLayout>
  )
}

export default Analytics