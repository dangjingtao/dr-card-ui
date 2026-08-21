export interface MemberCardProps {
  title?: string
  subtitle?: string
}

export default function MemberCard({ title = '卡博士会员', subtitle = '会员权益持续生长' }: MemberCardProps) {
  return (
    <section className="rounded-container bg-member-surface p-5 text-member-text shadow-member">
      <div className="text-xs text-member-accent">MEMBER</div>
      <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm opacity-80">{subtitle}</p>
    </section>
  )
}
