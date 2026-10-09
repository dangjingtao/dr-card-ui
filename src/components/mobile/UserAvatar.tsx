import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'

/** Real user avatar with a neutral fallback; never impersonate a member with a stock photo. */
export default function UserAvatar({
  src,
  className = '',
}: {
  src?: string | null
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  const imageUrl = src?.trim()
  return (
    <span className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-surface-subtle text-text-tertiary ${className}`}>
      {imageUrl && !failed
        ? <img src={imageUrl} alt="会员头像" className="h-full w-full object-cover" onError={() => setFailed(true)} />
        : <UserRound className="h-1/2 w-1/2" aria-label="默认头像" />}
    </span>
  )
}
