import { useEffect, useRef, useState } from 'react'

export interface CarouselSlide {
  key: string
  /** 轮播帧素材；缺图时保留可识别的降级内容 */
  image?: string
  alt: string
  eyebrow?: string
  title?: string
  description?: string
  cta?: string
}

export interface BannerCarouselProps {
  slides: CarouselSlide[]
  /** 单帧停留毫秒，摹客 carousel.playInterval */
  interval?: number
  /** 切换动画毫秒，摹客 carousel.playSpeed */
  speed?: number
  onSelect?: (slide: CarouselSlide, index: number) => void
  label: string
  className?: string
}

/**
 * 首页 Banner 轮播（节点 #2 `carouselChart 7ps-mqivvr04-28o`）
 * -------------------------------------------------------------
 * 参数逐字取自摹客：effect push（横向推移）、playInterval 3000、playSpeed 700、
 * indicator circle（激活白 / 默认 rgb(163,163,163)）、showPageTurnBtn false。
 * 视觉比例与首页已验收的黑金 Banner 保持一致（3:1）。
 */
export default function BannerCarousel({
  slides,
  interval = 3000,
  speed = 700,
  onSelect,
  label,
  className = '',
}: BannerCarouselProps) {
  const [index, setIndex] = useState(0)
  const total = slides.length
  const touchStartX = useRef<number | null>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (total < 2) return
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % total)
    }, interval + speed)
    return () => window.clearInterval(timer)
  }, [interval, speed, total])

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
    moved.current = false
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null || total < 2) return
    const delta = (event.changedTouches[0]?.clientX ?? start) - start
    if (Math.abs(delta) < 40) return
    moved.current = true
    setIndex((prev) => (delta < 0 ? (prev + 1) % total : (prev - 1 + total) % total))
  }

  if (total === 0) return null

  return (
    <section className={`relative overflow-hidden rounded-2xl shadow-sm ${className}`} aria-label={label}>
      <div
        className="flex"
        style={{ transform: `translateX(-${index * 100}%)`, transition: `transform ${speed}ms ease-in-out` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.key}
            type="button"
            data-carousel-slide={slide.key}
            aria-label={slide.alt}
            aria-hidden={slideIndex !== index}
            tabIndex={slideIndex === index ? 0 : -1}
            onClick={() => {
              if (moved.current) return
              onSelect?.(slide, slideIndex)
            }}
            className="relative block w-full flex-none text-left"
          >
            {slide.image ? (
              <img
                src={slide.image}
                alt={slide.alt}
                className="aspect-[3/1] w-full object-cover object-center"
              />
            ) : (
              <span className="flex aspect-[3/1] w-full items-center justify-center bg-claim-surface text-xs text-text-tertiary">
                {slide.alt}
              </span>
            )}
            {slide.title && (
              <span className="absolute inset-y-0 left-0 flex w-[58%] flex-col justify-center px-5 text-white">
                {slide.eyebrow && (
                  <span className="text-[10px] font-medium tracking-[0.18em] text-[#E8C487]">
                    {slide.eyebrow}
                  </span>
                )}
                <span className="mt-0.5 text-[22px] font-semibold leading-7 tracking-[0.06em]">
                  {slide.title}
                </span>
                {slide.description && (
                  <span className="mt-0.5 whitespace-nowrap text-[10px] text-white/75">
                    {slide.description}
                  </span>
                )}
                {slide.cta && (
                  <span className="mt-2 flex h-6 w-fit items-center rounded-full bg-[#D9A968] px-3 text-[10px] font-medium text-[#2A1A10] shadow-sm">
                    {slide.cta}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {total > 1 && (
        <div className="absolute bottom-2 left-0 flex w-full items-center justify-center gap-1.5">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.key}
              type="button"
              data-carousel-dot={slide.key}
              aria-label={`切换到第 ${slideIndex + 1} 帧`}
              aria-current={slideIndex === index}
              onClick={() => setIndex(slideIndex)}
              className={`h-1.5 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.16)] transition-[width,background-color] ${
                slideIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/55'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
