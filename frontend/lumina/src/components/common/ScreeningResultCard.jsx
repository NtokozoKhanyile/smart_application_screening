import StatusBadge from './StatusBadge'
import { formatScore } from '../../utils/formatters'

// ── Status explanations shown to the applicant ────────────────────
const STATUS_DESCRIPTIONS = {
  draft: {
    icon: '📝',
    color: 'bg-gray-50 border-gray-200 text-gray-700',
    heading: 'Your application is saved as a draft.',
    body: 'You have not submitted your application yet. Complete all steps and submit when you are ready.',
  },
  submitted: {
    icon: '📤',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    heading: 'Your application has been submitted.',
    body: 'Your application has been received and is currently being evaluated by our AI screening system.',
  },
  under_review: {
    icon: '🔍',
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    heading: 'Your application is under manual review.',
    body: 'Your score was close to the threshold. An admin is reviewing your application and will make the final decision shortly. No action is needed from you.',
  },
  recommended: {
    icon: '⭐',
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    heading: 'Your application has been recommended for approval.',
    body: 'The AI screening system has recommended your application for approval based on your subject marks. An admin will confirm the final decision.',
  },
  accepted: {
    icon: '🎉',
    color: 'bg-green-50 border-green-200 text-green-800',
    heading: 'Congratulations! Your application has been accepted.',
    body: 'An admin has reviewed and accepted your application. You will be contacted with further instructions.',
  },
  rejected: {
    icon: '❌',
    color: 'bg-red-50 border-red-200 text-red-800',
    heading: 'Your application was not successful.',
    body: 'Unfortunately your application did not meet the requirements. You can review the reason below and reapply with improved subject marks if eligible.',
  },
}

// ── Score bar ─────────────────────────────────────────────────────
const ScoreBar = ({ score }) => {
  const pct = Math.min(100, Math.max(0, Math.round(score)))
  const color = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Weighted Score</span>
        <span className={`text-xs font-semibold ${pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
const ScreeningResultCard = ({ result, applicationStatus }) => {
  // Show status description banner even when there's no result yet (draft/pending)
  const statusInfo = STATUS_DESCRIPTIONS[applicationStatus] || STATUS_DESCRIPTIONS[result?.decision]

  if (!result && !applicationStatus) return null

  // Determine the active decision to display
  const activeDecision = result?.final_decision || result?.decision || applicationStatus

  const scoreColor = (result?.prediction_score ?? 0) >= 70
    ? 'text-green-600' : (result?.prediction_score ?? 0) >= 50
    ? 'text-amber-600' : 'text-red-600'

  const scoreBg = (result?.prediction_score ?? 0) >= 70
    ? 'bg-green-50 border-green-200' : (result?.prediction_score ?? 0) >= 50
    ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="mb-4 space-y-3">

      {/* ── Status Description Banner ── */}
      {statusInfo && (
        <div className={`rounded-xl border px-4 py-3 ${statusInfo.color}`}>
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none mt-0.5">{statusInfo.icon}</span>
            <div>
              <p className="text-sm font-semibold">{statusInfo.heading}</p>
              <p className="text-xs mt-0.5 opacity-80">{statusInfo.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Screening Result Card ── */}
      {result && (
        <div className={`card p-5 border-2 ${scoreBg}`}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
            AI Screening Result
          </h3>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">AI Decision</p>
              <StatusBadge status={result.decision} />
            </div>
            {result.final_decision && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Admin Decision</p>
                <StatusBadge status={result.final_decision} />
              </div>
            )}
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Score</p>
              <p className={`text-3xl font-bold ${scoreColor}`}>
                {formatScore(result.prediction_score)}
              </p>
            </div>
          </div>

          {/* Score bar */}
          {result.prediction_score != null && (
            <div className="mb-4">
              <ScoreBar score={result.prediction_score} />
            </div>
          )}

          {/* Explanation */}
          {result.explanation && (
            <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-medium text-gray-500">Reason</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
            </div>
          )}

          {/* Admin review section */}
          {result.reviewed_by_admin && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-medium mb-2">Admin Review</p>
              <div className="flex items-start gap-3">
                <StatusBadge status={result.final_decision} />
                {result.admin_notes && (
                  <p className="text-sm text-gray-600 italic">"{result.admin_notes}"</p>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            Evaluated by: {result.model_version || 'rule-engine-v1'}
          </p>
        </div>
      )}
    </div>
  )
}

export default ScreeningResultCard