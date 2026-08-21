export interface ValueCardProps {
  value?: number | string
  label?: string
}

export default function ValueCard({ value = 0, label = '泡泡值' }: ValueCardProps) {
  return (
    <section className="rounded-container bg-surface p-4">
      <div className="text-sm text-text-secondary">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-reward-text">{value}</div>
    </section>
  )
}
