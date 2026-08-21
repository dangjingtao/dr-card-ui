export default function ValueCard({ value = '0' }) {
  return (
    <section className="rounded-container border border-border-subtle bg-surface p-4">
      <div className="text-sm text-text-secondary">泡泡值</div>
      <div className="mt-1 text-2xl font-semibold text-reward-text">{value}</div>
    </section>
  )
}
