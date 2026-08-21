export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-button border border-border bg-surface px-4 py-3 text-text outline-none focus:border-brand-gold ${className}`}
      {...props}
    />
  )
}
