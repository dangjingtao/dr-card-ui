import { BatteryFull, Signal, Wifi } from 'lucide-react'

export default function StatusBar() {
  return (
    <div className="w-full bg-background" aria-hidden="true" data-mobile-status-bar>
      <div className="mx-auto flex h-11 w-full max-w-[480px] items-center justify-between px-6 text-text-primary">
        <span className="text-sm font-semibold">9:41</span>
        <span className="inline-flex items-center gap-1.5">
          <Signal className="h-4 w-4" />
          <Wifi className="h-4 w-4" />
          <BatteryFull className="h-5 w-4" />
        </span>
      </div>
    </div>
  )
}
