export default function Card({ children, className = '' }) {
  return (
    <section className={`rounded-card bg-surface shadow-card p-4 ${className}`}>
      {children}
    </section>
  )
}
