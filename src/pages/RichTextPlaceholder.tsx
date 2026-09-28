import PageContainer from '../components/mobile/PageContainer'

interface RichTextPlaceholderProps {
  routePath: string
}

/** Empty content host for pages whose future payload will be server-provided rich text. */
export default function RichTextPlaceholder({ routePath }: RichTextPlaceholderProps) {
  return (
    <PageContainer className="min-h-full">
      <div
        className="min-h-[calc(100vh-44px)]"
        data-rich-text-placeholder={routePath}
        data-rich-text-content
        aria-live="polite"
      />
    </PageContainer>
  )
}
