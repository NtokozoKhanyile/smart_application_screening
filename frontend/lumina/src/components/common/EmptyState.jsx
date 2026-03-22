// ── Illustrations ─────────────────────────────────────────────────

const IllustrationNoApplications = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
    {/* Background circle */}
    <circle cx="100" cy="85" r="60" fill="#F1F5F9" />
    {/* Document stack */}
    <rect x="65" y="55" width="52" height="66" rx="4" fill="#CBD5E1" />
    <rect x="60" y="50" width="52" height="66" rx="4" fill="#E2E8F0" />
    <rect x="55" y="45" width="52" height="66" rx="4" fill="white" stroke="#CBD5E1" strokeWidth="1.5" />
    {/* Lines on document */}
    <rect x="64" y="60" width="34" height="3" rx="1.5" fill="#CBD5E1" />
    <rect x="64" y="68" width="26" height="3" rx="1.5" fill="#CBD5E1" />
    <rect x="64" y="76" width="30" height="3" rx="1.5" fill="#CBD5E1" />
    <rect x="64" y="84" width="22" height="3" rx="1.5" fill="#E2E8F0" />
    {/* Plus icon */}
    <circle cx="148" cy="48" r="14" fill="#1B2B6B" />
    <path d="M148 41v14M141 48h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    {/* Small dots decoration */}
    <circle cx="40" cy="70" r="4" fill="#E2E8F0" />
    <circle cx="160" cy="100" r="5" fill="#E2E8F0" />
    <circle cx="155" cy="70" r="3" fill="#F1F5F9" />
  </svg>
)

const IllustrationNoResults = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
    {/* Background circle */}
    <circle cx="100" cy="85" r="60" fill="#F1F5F9" />
    {/* Magnifying glass */}
    <circle cx="92" cy="78" r="28" fill="white" stroke="#CBD5E1" strokeWidth="2" />
    <circle cx="92" cy="78" r="20" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
    {/* X inside glass */}
    <path d="M85 71l14 14M99 71L85 85" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
    {/* Handle */}
    <path d="M114 100l12 12" stroke="#CBD5E1" strokeWidth="3.5" strokeLinecap="round" />
    {/* Decoration dots */}
    <circle cx="45" cy="65" r="4" fill="#E2E8F0" />
    <circle cx="158" cy="75" r="5" fill="#E2E8F0" />
    <circle cx="50" cy="105" r="3" fill="#F1F5F9" />
  </svg>
)

const IllustrationEmptyQueue = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
    {/* Background circle */}
    <circle cx="100" cy="85" r="60" fill="#F1F5F9" />
    {/* Checkmark shield */}
    <path d="M100 38l32 12v28c0 18-14 34-32 40-18-6-32-22-32-40V50L100 38z" fill="white" stroke="#CBD5E1" strokeWidth="1.5" />
    <path d="M86 80l10 10 18-20" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    {/* Stars decoration */}
    <circle cx="48" cy="60" r="4" fill="#D4A017" opacity="0.5" />
    <circle cx="155" cy="65" r="3" fill="#D4A017" opacity="0.4" />
    <circle cx="158" cy="105" r="5" fill="#E2E8F0" />
    <circle cx="42" cy="100" r="3" fill="#E2E8F0" />
    {/* Small sparkle */}
    <path d="M155 50l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#D4A017" opacity="0.6" />
  </svg>
)

const IllustrationNoStats = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
    {/* Background circle */}
    <circle cx="100" cy="85" r="60" fill="#F1F5F9" />
    {/* Bar chart bars */}
    <rect x="62" y="95" width="16" height="22" rx="2" fill="#E2E8F0" />
    <rect x="84" y="78" width="16" height="39" rx="2" fill="#CBD5E1" />
    <rect x="106" y="65" width="16" height="52" rx="2" fill="#E2E8F0" />
    <rect x="128" y="83" width="16" height="34" rx="2" fill="#CBD5E1" />
    {/* Baseline */}
    <line x1="55" y1="117" x2="152" y2="117" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
    {/* Question mark */}
    <circle cx="148" cy="50" r="14" fill="#1B2B6B" />
    <path d="M144 46c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.6-1 2.8-2.4 3.4-.6.3-1 .8-1 1.4v1" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="148" cy="55" r="1" fill="white" />
    {/* Decoration */}
    <circle cx="42" cy="72" r="4" fill="#E2E8F0" />
    <circle cx="48" cy="108" r="3" fill="#F1F5F9" />
  </svg>
)

// ── Illustration map ──────────────────────────────────────────────
const illustrations = {
  applications: IllustrationNoApplications,
  search: IllustrationNoResults,
  queue: IllustrationEmptyQueue,
  stats: IllustrationNoStats,
}

// ── EmptyState Component ──────────────────────────────────────────
const EmptyState = ({
  variant = 'applications',
  title,
  description,
  action,
  actionLabel,
}) => {
  const Illustration = illustrations[variant] || IllustrationNoApplications

  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <Illustration />
      <h3 className="mt-4 text-base font-semibold text-gray-700">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-400 max-w-xs">{description}</p>
      )}
      {action && actionLabel && (
        <button
          onClick={action}
          className="mt-5 btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState