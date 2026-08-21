export default function EmptyState({ title = '暂无数据', description = '' }) {
  return (
    <section className="flex flex-col items-center justify-center py-12 text-center text-text">
      <h3 className="font-medium">{title}</h3>
      {description && <p className="mt-2 text-sm opacity-70">{description}</p>}
    </section>
  )
}
