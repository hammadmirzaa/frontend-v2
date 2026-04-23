export function formatApiErrorDetail(error, fallback) {
  const d = error?.response?.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) {
    const parts = d.map((x) => (typeof x === 'object' && x?.msg != null ? x.msg : String(x)))
    return parts.filter(Boolean).join(' ') || fallback
  }
  return fallback
}
