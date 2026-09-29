import PageContainer from '../components/mobile/PageContainer'
import RichTextContent from '../components/mobile/RichTextContent'
import type { RichTextSettingKey } from '../services/settings'

interface RichTextPlaceholderProps {
  routePath: string
  settingKey: RichTextSettingKey
}

export default function RichTextPlaceholder({ routePath, settingKey }: RichTextPlaceholderProps) {
  return (
    <PageContainer className="min-h-full">
      <div
        className="min-h-[calc(100vh-44px)]"
        data-rich-text-placeholder={routePath}
        aria-live="polite"
      >
        <RichTextContent settingKey={settingKey} title={routePath === '/cause' ? '公益' : '品牌故事'} />
      </div>
    </PageContainer>
  )
}
