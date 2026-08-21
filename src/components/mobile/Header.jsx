import { TopAppBar } from '../ui'

export default function Header({ title = '卡博士', leading, actions = [], scrolled = false, className = '' }) {
  return <TopAppBar title={title} leading={leading} actions={actions} scrolled={scrolled} className={className} />
}
