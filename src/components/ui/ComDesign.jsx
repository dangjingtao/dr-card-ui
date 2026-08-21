import React from 'react'
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronRight, CircleX, Info, LoaderCircle, Search, X } from 'lucide-react'

const cn = (...parts) => parts.filter(Boolean).join(' ')

const statusIcon = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: CircleX,
}

export function Button({ children, variant = 'primary', size = 'regular', loading = false, leadingIcon: LeadingIcon, trailingIcon: TrailingIcon, className = '', disabled, ...props }) {
  const variants = {
    primary: 'bg-primary text-text-inverse active:bg-primary-pressed',
    secondary: 'bg-secondary text-text-brand active:bg-surface-selected',
    outline: 'border border-border bg-surface text-text-brand active:bg-surface-selected',
    ghost: 'bg-transparent text-text-brand active:bg-surface-selected',
    destructive: 'bg-danger text-text-inverse active:bg-danger-text',
  }
  return <button disabled={disabled || loading} className={cn('inline-flex items-center justify-center gap-2 rounded-control px-4 font-medium transition active:scale-[.98] disabled:pointer-events-none disabled:bg-disabled disabled:text-text-disabled', size === 'large' ? 'min-h-12' : 'min-h-10', variants[variant] || variants.primary, className)} {...props}>
    {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : LeadingIcon ? <LeadingIcon className="h-5 w-5" /> : null}
    <span>{children}</span>
    {!loading && TrailingIcon ? <TrailingIcon className="h-5 w-5" /> : null}
  </button>
}

export function IconButton({ icon: Icon, label, variant = 'ghost', size = 'regular', selected = false, className = '', ...props }) {
  const variants = { ghost: 'bg-transparent text-text-primary active:bg-surface-pressed', subtle: 'bg-surface-subtle text-text-primary active:bg-surface-pressed', destructive: 'bg-transparent text-danger-text active:bg-danger-bg' }
  return <button aria-label={label} className={cn('inline-flex items-center justify-center rounded-control transition disabled:text-text-disabled', size === 'large' ? 'h-12 w-12' : 'h-10 w-10', selected && 'bg-surface-selected text-text-brand', variants[variant], className)} {...props}><Icon className={size === 'large' ? 'h-6 w-6' : 'h-5 w-5'} /></button>
}

export function Input({ label, helper, error, className = '', disabled, readOnly, ...props }) {
  return <label className="block space-y-1.5 text-sm text-text-primary">{label && <span className="font-medium">{label}</span>}<input disabled={disabled} readOnly={readOnly} className={cn('min-h-10 w-full rounded-control border bg-surface px-3 text-base outline-none placeholder:text-text-placeholder focus:border-border-focused disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-disabled', error ? 'border-border-error' : 'border-border', className)} {...props}/>{(error || helper) && <span className={cn('block text-xs', error ? 'text-danger-text' : 'text-text-secondary')}>{error || helper}</span>}</label>
}

export function Textarea({ label, helper, error, maxLength, value, className = '', ...props }) {
  return <label className="block space-y-1.5 text-sm text-text-primary">{label && <span className="font-medium">{label}</span>}<textarea value={value} maxLength={maxLength} className={cn('min-h-[88px] w-full resize-y rounded-control border bg-surface px-3 py-2 text-base outline-none placeholder:text-text-placeholder focus:border-border-focused', error ? 'border-border-error' : 'border-border', className)} {...props}/><span className="flex justify-between text-xs"><span className={error ? 'text-danger-text' : 'text-text-secondary'}>{error || helper}</span>{maxLength && <span className="text-text-tertiary">{String(value || '').length}/{maxLength}</span>}</span></label>
}

export function Select({ label, helper, error, options = [], placeholder = '请选择', className = '', ...props }) {
  return <label className="block space-y-1.5 text-sm text-text-primary">{label && <span className="font-medium">{label}</span>}<span className="relative block"><select className={cn('min-h-10 w-full appearance-none rounded-control border bg-surface px-3 pr-9 text-base outline-none focus:border-border-focused disabled:bg-surface-subtle disabled:text-text-disabled', error ? 'border-border-error' : 'border-border', className)} {...props}><option value="">{placeholder}</option>{options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" /></span>{(error || helper) && <span className={cn('block text-xs', error ? 'text-danger-text' : 'text-text-secondary')}>{error || helper}</span>}</label>
}

export function Checkbox({ label, checked, indeterminate = false, onChange, disabled, className = '' }) {
  return <label className={cn('flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-primary', disabled && 'cursor-not-allowed text-text-disabled', className)}><input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only"/><span aria-hidden className={cn('flex h-5 w-5 items-center justify-center rounded-[4px] border', checked || indeterminate ? 'border-primary bg-primary text-text-inverse' : 'border-border bg-surface', disabled && 'border-border-subtle bg-surface-subtle')}>{checked ? <Check className="h-4 w-4"/> : indeterminate ? <span className="h-0.5 w-2.5 bg-current"/> : null}</span>{label && <span>{label}</span>}</label>
}

export function Radio({ label, checked, onChange, disabled, name, value, className = '' }) {
  return <label className={cn('flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-primary', disabled && 'cursor-not-allowed text-text-disabled', className)}><input type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled} className="sr-only"/><span className={cn('flex h-5 w-5 items-center justify-center rounded-full border bg-surface', checked ? 'border-primary' : 'border-border', disabled && 'border-border-subtle')}>{checked && <span className="h-2 w-2 rounded-full bg-primary"/>}</span>{label && <span>{label}</span>}</label>
}

export function Switch({ checked = false, onChange, label, disabled, className = '' }) {
  return <label className={cn('flex min-h-11 items-center justify-between gap-3 text-sm text-text-primary', disabled && 'text-text-disabled', className)}>{label && <span>{label}</span>}<button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange?.(!checked)} className={cn('relative h-6 w-11 rounded-pill border transition', checked ? 'border-primary bg-primary' : 'border-border bg-surface-subtle', disabled && 'opacity-50')}><span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-surface transition', checked ? 'left-[21px]' : 'left-0.5')}/></button></label>
}

export function ListItem({ leading, title, description, metadata, trailing, actionable = false, selected = false, disabled = false, className = '', ...props }) {
  const Comp = actionable ? 'button' : 'div'
  return <Comp disabled={disabled} className={cn('flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left', actionable && 'active:bg-surface-pressed', selected && 'bg-surface-selected', disabled && 'text-text-disabled', className)} {...props}>{leading && <span className="shrink-0">{leading}</span>}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-text-primary">{title}</span>{description && <span className="mt-0.5 line-clamp-2 block text-xs text-text-secondary">{description}</span>}</span>{metadata && <span className="shrink-0 text-xs text-text-tertiary">{metadata}</span>}{trailing ?? (actionable ? <ChevronRight className="h-5 w-5 shrink-0 text-text-tertiary"/> : null)}</Comp>
}

export function Tabs({ items = [], value, onChange, className = '' }) {
  return <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-border-subtle', className)}>{items.map(item => <button key={item.value} role="tab" aria-selected={value === item.value} disabled={item.disabled} onClick={() => onChange?.(item.value)} className={cn('relative min-h-11 shrink-0 px-3 text-sm font-medium', value === item.value ? 'text-text-brand after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary' : 'text-text-secondary', item.disabled && 'text-text-disabled')}>{item.label}</button>)}</div>
}

export function SegmentedControl({ items = [], value, onChange, className = '' }) {
  return <div className={cn('grid rounded-control bg-surface-subtle p-0.5', className)} style={{gridTemplateColumns:`repeat(${Math.max(items.length,1)},minmax(0,1fr))`}}>{items.map(item => <button key={item.value} disabled={item.disabled} onClick={() => onChange?.(item.value)} className={cn('min-h-9 rounded-[6px] px-3 text-sm font-medium', value === item.value ? 'bg-surface text-text-brand' : 'text-text-secondary active:bg-surface-pressed', item.disabled && 'text-text-disabled')}>{item.label}</button>)}</div>
}

export function TopAppBar({ title, leading, actions = [], scrolled = false, className = '' }) {
  return <header className={cn('flex min-h-14 items-center gap-2 bg-surface px-4', scrolled && 'border-b border-border-subtle', className)}>{leading && <div className="shrink-0">{leading}</div>}<h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-text-primary">{title}</h1><div className="flex shrink-0 items-center gap-1">{actions.slice(0,2).map((action,i)=><React.Fragment key={i}>{action}</React.Fragment>)}</div></header>
}

export function BottomNavigation({ items = [], value, onChange, className = '' }) {
  return <nav className={cn('grid min-h-14 border-t border-border-subtle bg-surface', className)} style={{gridTemplateColumns:`repeat(${Math.max(items.length,1)},minmax(0,1fr))`}}>{items.map(item => { const Icon = item.icon; const active = value === item.value; return <button key={item.value} onClick={() => onChange?.(item.value)} aria-current={active ? 'page' : undefined} className={cn('relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px]', active ? 'text-text-brand' : 'text-text-tertiary', 'active:bg-surface-pressed')}>{Icon && <Icon className="h-6 w-6"/>}<span className="truncate">{item.label}</span>{item.badge != null && <Badge count={item.badge} className="absolute left-1/2 top-1 ml-2"/>}</button>})}</nav>
}

export function Section({ title, supportingText, action, children, footer, className = '' }) {
  return <section className={cn('space-y-3', className)}>{(title || supportingText || action) && <header className="flex items-start gap-3"><div className="min-w-0 flex-1">{title && <h2 className="font-semibold text-text-primary">{title}</h2>}{supportingText && <p className="mt-1 text-sm text-text-secondary">{supportingText}</p>}</div>{action && <div className="shrink-0">{action}</div>}</header>}<div>{children}</div>{footer && <footer>{footer}</footer>}</section>
}

export function Divider({ inset = false, className = '' }) { return <div className={cn('h-px bg-border-subtle', inset && 'ml-4', className)}/> }

export function Card({ children, interactive = false, className = '', ...props }) {
  const Comp = interactive ? 'button' : 'section'
  return <Comp className={cn('w-full rounded-container bg-surface p-4 text-left', interactive && 'active:bg-surface-pressed', className)} {...props}>{children}</Comp>
}

export function Tag({ children, variant = 'neutral', className = '' }) {
  const variants = { neutral:'bg-surface-subtle text-text-secondary', brand:'bg-surface-selected text-text-brand', success:'bg-success-bg text-success-text', warning:'bg-warning-bg text-warning-text', danger:'bg-danger-bg text-danger-text', info:'bg-info-bg text-info-text' }
  return <span className={cn('inline-flex min-h-[24px] items-center rounded-pill px-2 text-xs font-medium', variants[variant], className)}>{children}</span>
}

export function Badge({ count, dot = count == null, attention = false, className = '' }) {
  if (dot) return <span className={cn('inline-block h-2 w-2 rounded-full', attention ? 'bg-danger' : 'bg-primary', className)}/>
  const text = Number(count) > 99 ? '99+' : count
  return <span className={cn('inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-pill px-1 text-[10px] font-semibold text-text-inverse', attention ? 'bg-danger' : 'bg-primary', className)}>{text}</span>
}

export function Avatar({ src, alt = '', name = '', size = 'regular', status, className = '' }) {
  const sizes = { small:'h-6 w-6 text-[10px]', regular:'h-8 w-8 text-xs', large:'h-10 w-10 text-sm' }
  const initials = name.trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()
  return <span className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-subtle font-semibold text-text-secondary', sizes[size], className)}>{src ? <img src={src} alt={alt || name} className="h-full w-full object-cover"/> : <span>{initials || '•'}</span>}{status && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success"/>}</span>
}

export function Toast({ message, status, className = '' }) { const Icon = statusIcon[status]; return <div role="status" className={cn('inline-flex max-w-[calc(100vw-32px)] items-center gap-2 rounded-control bg-surface-inverse px-4 py-2 text-sm text-text-inverse shadow-floating', className)}>{Icon && <Icon className="h-4 w-4"/>}<span>{message}</span></div> }

export function Snackbar({ message, actionLabel, onAction, className = '' }) { return <div role="status" className={cn('flex items-center gap-3 rounded-control bg-surface-inverse px-4 py-2 text-sm text-text-inverse shadow-floating', className)}><span className="min-w-0 flex-1">{message}</span>{actionLabel && <button onClick={onAction} className="shrink-0 font-semibold text-reward">{actionLabel}</button>}</div> }

export function Alert({ title, message, status = 'info', action, dismissible = false, onDismiss, className = '' }) {
  const Icon = statusIcon[status] || Info
  const variants = { info:'bg-info-bg text-info-text', success:'bg-success-bg text-success-text', warning:'bg-warning-bg text-warning-text', danger:'bg-danger-bg text-danger-text' }
  return <div role="status" className={cn('flex gap-3 rounded-control p-3', variants[status], className)}><Icon className="mt-0.5 h-5 w-5 shrink-0"/><div className="min-w-0 flex-1">{title && <div className="font-semibold">{title}</div>}<div className="text-sm">{message}</div>{action && <div className="mt-2">{action}</div>}</div>{dismissible && <button aria-label="关闭" onClick={onDismiss} className="shrink-0"><X className="h-5 w-5"/></button>}</div>
}

export function Dialog({ open, title, children, actions, onClose, className = '' }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget) onClose?.()}}><section role="dialog" aria-modal="true" aria-label={title} className={cn('w-full max-w-sm rounded-overlay bg-surface p-5 shadow-modal', className)}><h2 className="text-lg font-semibold text-text-primary">{title}</h2><div className="mt-3 text-sm text-text-secondary">{children}</div>{actions && <div className="mt-5 flex justify-end gap-2">{actions}</div>}</section></div>
}

export function BottomSheet({ open, title, children, actions, onClose, className = '' }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-end bg-scrim" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget) onClose?.()}}><section role="dialog" aria-modal="true" aria-label={title} className={cn('max-h-[88vh] w-full overflow-auto rounded-t-overlay bg-surface p-4 shadow-modal', className)}><div className="mx-auto mb-3 h-1 w-10 rounded-pill bg-border-strong"/>{title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}<div className="mt-3">{children}</div>{actions && <div className="sticky bottom-0 mt-4 bg-surface pt-3">{actions}</div>}</section></div>
}

export function LoadingIndicator({ label, size = 'regular', className = '' }) { return <div role="status" aria-busy="true" className={cn('inline-flex items-center gap-2 text-text-brand', className)}><LoaderCircle className={cn('animate-spin', size === 'inline' ? 'h-4 w-4' : 'h-6 w-6')}/>{label && <span className="text-sm text-text-secondary">{label}</span>}</div> }

export function Skeleton({ className = '' }) { return <div aria-hidden="true" className={cn('animate-pulse rounded-control bg-surface-subtle', className)}/> }

export function EmptyState({ title = '暂无内容', supportingText, visual, primaryAction, secondaryAction, variant = 'no-data', className = '' }) { return <section className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>{visual && <div className={cn('mb-4', variant === 'recoverable-error' ? 'text-danger' : 'text-text-tertiary')}>{visual}</div>}<h2 className="text-lg font-semibold text-text-primary">{title}</h2>{supportingText && <p className="mt-2 max-w-xs text-sm text-text-secondary">{supportingText}</p>}{(primaryAction || secondaryAction) && <div className="mt-5 flex flex-wrap justify-center gap-2">{primaryAction}{secondaryAction}</div>}</section> }

export function ProgressIndicator({ value = 0, max = 100, showValue = false, className = '' }) { const pct = Math.max(0,Math.min(100,(value/max)*100)); return <div className={className}><div className="h-1 w-full overflow-hidden rounded-pill bg-surface-subtle"><div className="h-full rounded-pill bg-primary" style={{width:`${pct}%`}}/></div>{showValue && <div className="mt-1 text-right text-xs text-text-tertiary">{Math.round(pct)}%</div>}</div> }

export function Stepper({ steps = [], current = 0, vertical = false, className = '' }) { return <ol className={cn(vertical ? 'space-y-4' : 'flex', className)}>{steps.map((step,i)=>{ const state = step.error ? 'error' : i < current ? 'done' : i === current ? 'current' : 'upcoming'; return <li key={step.id ?? i} className={cn('relative', vertical ? 'flex gap-3' : 'flex min-w-0 flex-1 flex-col items-center text-center')}><span className={cn('z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px]', state==='done' && 'border-primary bg-primary text-text-inverse', state==='current' && 'border-primary bg-surface text-primary', state==='upcoming' && 'border-border bg-surface text-text-tertiary', state==='error' && 'border-danger bg-surface text-danger-text')}>{state==='done' ? <Check className="h-3 w-3"/> : i+1}</span><span className={cn('text-xs', vertical ? 'pt-0.5 text-left' : 'mt-2', state==='current' ? 'text-text-primary' : state==='error' ? 'text-danger-text' : 'text-text-secondary')}>{step.label}</span>{!vertical && i < steps.length-1 && <span className="absolute left-1/2 top-2.5 -z-0 h-0.5 w-full bg-border-subtle"/>}</li>})}</ol> }

export function Timeline({ items = [], className = '' }) { return <ol className={cn('space-y-0', className)}>{items.map((item,i)=><li key={item.id ?? i} className="relative flex gap-3 pb-5"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary"/>{i < items.length-1 && <span className="absolute left-[4px] top-4 h-[calc(100%-8px)] w-px bg-border-subtle"/>}<div className="min-w-0"><div className="text-sm font-medium text-text-primary">{item.title}</div>{item.time && <div className="mt-0.5 text-xs text-text-tertiary">{item.time}</div>}{item.description && <div className="mt-1 text-sm text-text-secondary">{item.description}</div>}</div></li>)}</ol> }

export function SearchField({ value = '', onChange, onClear, loading = false, placeholder = '搜索', className = '', ...props }) { return <label className={cn('flex min-h-10 items-center gap-2 rounded-control bg-surface-subtle px-3 focus-within:bg-surface focus-within:ring-1 focus-within:ring-border-focused', className)}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin text-text-tertiary"/> : <Search className="h-5 w-5 text-text-tertiary"/>}<input type="search" value={value} onChange={onChange} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-placeholder" {...props}/>{value && <button type="button" aria-label="清除搜索" onClick={onClear} className="flex h-9 w-9 items-center justify-center text-text-tertiary"><X className="h-5 w-5"/></button>}</label> }

export function Menu({ open, children, className = '' }) { if (!open) return null; return <div role="menu" className={cn('min-w-40 overflow-hidden rounded-overlay bg-surface py-1 shadow-floating', className)}>{children}</div> }

export function MenuItem({ children, icon: Icon, selected = false, destructive = false, disabled = false, trailing, className = '', ...props }) { return <button role="menuitem" disabled={disabled} className={cn('flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm active:bg-surface-pressed disabled:text-text-disabled', selected ? 'text-text-brand' : destructive ? 'text-danger-text' : 'text-text-primary', className)} {...props}>{Icon && <Icon className="h-5 w-5 shrink-0"/>}<span className="min-w-0 flex-1 truncate">{children}</span>{selected ? <Check className="h-4 w-4"/> : trailing}</button> }
