import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface CaptchaImageProps {
  /** 验证码长度，默认 4 位 */
  length?: number
  /** 当前验证码字符串回调（暴露给父组件做校验） */
  onChange?: (code: string) => void
  /** 校验失败红框态 */
  invalid?: boolean
  className?: string
}

const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomCode(length: number) {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return out
}

/**
 * T037｜图形验证码组件（前端 mock）
 * - 内部维护随机字符串，点击图片或右侧「换一张」刷新
 * - 视觉：浅紫底圆角矩形 + 干扰线 + 轻微旋转字符
 * - 通过 onChange 暴露当前验证码，父组件比对用户输入
 */
export function CaptchaImage({ length = 4, onChange, invalid = false, className = '' }: CaptchaImageProps) {
  const [code, setCode] = useState(() => randomCode(length))
  const lastLength = useRef(length)

  useEffect(() => {
    if (lastLength.current !== length) {
      lastLength.current = length
      const next = randomCode(length)
      setCode(next)
      onChange?.(next)
    }
  }, [length, onChange])

  useEffect(() => {
    onChange?.(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = () => {
    const next = randomCode(length)
    setCode(next)
    onChange?.(next)
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={refresh}
        aria-label="点击刷新图形验证码"
        className={`relative h-11 w-[124px] overflow-hidden rounded-lg border bg-gradient-to-br from-[#FFF6E2] to-[#FBE9C1] transition active:opacity-80 ${
          invalid ? 'border-danger' : 'border-[#E8D9B8]'
        }`}
      >
        <svg viewBox="0 0 124 44" className="absolute inset-0 h-full w-full" aria-hidden>
          {/* 干扰线 */}
          {Array.from({ length: 3 }).map((_, i) => (
            <line
              key={`line-${i}`}
              x1={4 + i * 36}
              y1={4}
              x2={120 - i * 28}
              y2={40}
              stroke="#C9A458"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.55}
            />
          ))}
          {/* 干扰点 */}
          {Array.from({ length: 8 }).map((_, i) => (
            <circle
              key={`dot-${i}`}
              cx={8 + ((i * 13) % 110)}
              cy={6 + ((i * 7) % 32)}
              r={1}
              fill="#B8893D"
              opacity={0.55}
            />
          ))}
          {/* 字符 */}
          {code.split('').map((ch, i) => (
            <text
              key={`char-${i}`}
              x={18 + i * 22}
              y={30 + ((i % 2) === 0 ? -2 : 2)}
              fontSize={22}
              fontWeight={700}
              fontFamily="'Helvetica Neue', Arial, sans-serif"
              fill="#7A4B12"
              transform={`rotate(${(i % 2 === 0 ? -1 : 1) * (10 + (i * 5) % 8)} ${18 + i * 22} 26)`}
            >
              {ch}
            </text>
          ))}
        </svg>
      </button>
      <button
        type="button"
        onClick={refresh}
        className="flex h-11 items-center gap-1 px-2 text-xs text-[#B8893D] active:opacity-70"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        换一张
      </button>
    </div>
  )
}

export default CaptchaImage