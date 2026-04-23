import { USAGE_METRIC_BASIC_ROWS, getUsageMetricThemeById } from '../theme/usageMetrics'

/**
 * BASIC plan: show raw usage counts (no limits / period in API).
 * @param {{ ai_queries_used: number, documents_used: number, emails_used: number, sms_used: number, storage_used: number, storage_unit: string }} basicUsage
 */
function UsageMetricCard({ icon: Icon, label, value, accentClass }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accentClass} opacity-[0.12]`}
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accentClass} text-white shadow-sm`}
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function BasicUsageSummary({ basicUsage, title = 'Usage' }) {
  if (!basicUsage) return null

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">
          Current consumption on the BASIC plan (counts only — no limits shown here).
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {USAGE_METRIC_BASIC_ROWS.map(({ id, usedField, cardLabel }) => {
          const t = getUsageMetricThemeById(id)
          const value =
            id === 'storage'
              ? basicUsage.storage_unit === 'GB'
                ? `${Number(basicUsage.storage_used).toLocaleString(undefined, { maximumFractionDigits: 3 })} ${basicUsage.storage_unit}`
                : `${Number(basicUsage.storage_used).toLocaleString()} ${basicUsage.storage_unit}`
              : Number(basicUsage[usedField]).toLocaleString()
          return (
            <UsageMetricCard
              key={id}
              icon={t.Icon}
              label={cardLabel}
              value={value}
              accentClass={t.gradientAccent}
            />
          )
        })}
      </div>
    </div>
  )
}
