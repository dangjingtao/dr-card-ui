import { useEffect, useState } from 'react'
import { Button, Skeleton } from '../ui'
import { fetchRichTextSetting, type RichTextSettingKey } from '../../services/settings'
import emptyIllustration from '../../assets/brand/empty/empty-illustration.webp'
import errorIllustration from '../../assets/brand/error/error-illustration.webp'

interface RichTextContentProps {
  settingKey: RichTextSettingKey
  title: string
}

function RichTextSkeleton() {
  return (
    <div aria-label="内容加载中" className="space-y-3 py-4">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-40 w-full rounded-control" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

interface RichTextStateProps {
  kind: 'empty' | 'error'
  title: string
  description: string
  onRetry?: () => void
}

function RichTextState({ kind, title, description, onRetry }: RichTextStateProps) {
  const empty = kind === 'empty'
  return (
    <section
      className="flex min-h-[calc(100vh-44px)] flex-col items-center justify-center overflow-y-auto px-6 pb-[calc(32px+env(safe-area-inset-bottom))] text-center"
      aria-live={empty ? 'polite' : 'assertive'}
      data-rich-text-state={kind}
    >
      <img
        src={empty ? emptyIllustration : errorIllustration}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="h-auto w-[232px] max-w-[70vw] select-none"
      />
      <h2 className="mt-9 text-[22px] font-semibold leading-[30px] text-text-primary">{title}</h2>
      <p className="mt-2.5 max-w-[280px] text-center text-sm leading-[22px] text-text-secondary">{description}</p>
      {onRetry && (
        <Button variant="primary" size="large" onClick={onRetry} className="mt-9 w-full max-w-[320px] rounded-pill bg-gradient-to-b from-reward to-reward-strong shadow-primary-button">
          重试
        </Button>
      )}
    </section>
  )
}

export default function RichTextContent({ settingKey, title }: RichTextContentProps) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ status: 'loading' | 'success' | 'error'; content: string; message?: string }>({
    status: 'loading',
    content: '',
  })

  useEffect(() => {
    let active = true
    setState({ status: 'loading', content: '' })
    void fetchRichTextSetting(settingKey).then(
      (content) => active && setState({ status: 'success', content }),
      (error: unknown) =>
        active && setState({ status: 'error', content: '', message: error instanceof Error ? error.message : '内容加载失败' }),
    )
    return () => {
      active = false
    }
  }, [attempt, settingKey])

  if (state.status === 'loading') return <RichTextSkeleton />

  if (state.status === 'error') {
    return <RichTextState kind="error" title="页面开小差了" description={state.message ?? '当前页面暂时无法加载，请稍后重试。'} onRetry={() => setAttempt((value) => value + 1)} />
  }

  if (!state.content) {
    return <RichTextState kind="empty" title="这里还空空如也" description={`暂时没有可展示的${title}内容。`} />
  }

  return (
    <div
      data-rich-text-content
      className="break-words py-4 text-sm leading-7 text-text-primary [&_a]:text-primary [&_a]:underline [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_li]:ml-5 [&_ol]:my-3 [&_ol]:list-decimal [&_p]:mb-3 [&_table]:my-4 [&_table]:w-full [&_ul]:my-3 [&_ul]:list-disc"
      dangerouslySetInnerHTML={{ __html: state.content }}
    />
  )
}
