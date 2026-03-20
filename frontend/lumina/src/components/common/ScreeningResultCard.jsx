import StatusBadge from './StatusBadge'
import { formatScore } from '../../utils/formatters'

const ScreeningResultCard = ({ result }) => {
  if (!result) return null

  const scoreColor = result.prediction_score >= 70
    ? 'text-green-600' : result.prediction_score >= 50
    ? 'text-amber-600' : 'text-red-600'

  const scoreBg = result.prediction_score >= 70
    ? 'bg-green-50 border-green-200' : result.prediction_score >= 50
    ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className={`card p-6 mb-4 border-2 ${scoreBg}`}>
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        AI Screening Result
      </h3>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Screening Decision</p>
          <StatusBadge status={result.decision} />
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">Score</p>
          <p className={`text-3xl font-bold ${scoreColor}`}>
            {formatScore(result.prediction_score)}
          </p>
        </div>
      </div>
      {result.explanation && (
        <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1 font-medium">Explanation</p>
          <p className="text-sm text-gray-700">{result.explanation}</p>
        </div>
      )}
      {result.reviewed_by_admin && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-2">Admin Review</p>
          <div className="flex items-center gap-3">
            <StatusBadge status={result.final_decision} />
            {result.admin_notes && (
              <p className="text-sm text-gray-600 italic">"{result.admin_notes}"</p>
            )}
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3">
        Model version: {result.model_version || 'v1.0'}
      </p>
    </div>
  )
}

export default ScreeningResultCard