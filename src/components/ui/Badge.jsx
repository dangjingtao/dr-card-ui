export default function Badge({ children, className = '' }) {
  return (
    <span className={`rounded-full bg-brand-orange/10 px-2 py-1 text-xs text-brand-orange ${className}`}>
      {children}
    </span>
  )
}
