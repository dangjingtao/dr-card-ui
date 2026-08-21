import { Fragment, type ButtonHTMLAttributes, type ChangeEventHandler, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronRight, CircleX, Info, LoaderCircle, Search, X } from 'lucide-react'

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

type Status = 'info' | 'success' | 'warning' | 'danger'
const statusIcon: Record<Status, LucideIcon> = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: CircleX }

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'regular' | 'large'
  loading?: boolean
  leadingIcon?: LucideIcon
  trailingIcon?: LucideIcon
}
export function Button({ children, variant = 'primary', size = 'regular', loading = false, leadingIcon: LeadingIcon, trailingIcon: TrailingIcon, className = '', disabled, ...props }: ButtonProps) {
  const variants = { primary: 'bg-primary text-text-inverse active:bg-primary-pressed', secondary: 'bg-secondary text-text-brand active:bg-surface-selected', outline: 'border border-border bg-surface text-text-brand active:bg-surface-selected', ghost: 'bg-transparent text-text-brand active:bg-surface-selected', destructive: 'bg-danger text-text-inverse active:bg-danger-text' }
  return <button disabled={disabled || loading} className={cn('inline-flex items-center justify-center gap-2 rounded-control px-4 font-medium transition active:scale-[.98] disabled:pointer-events-none disabled:bg-disabled disabled:text-text-disabled', size === 'large' ? 'min-h-12' : 'min-h-10', variants[variant], className)} {...props}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : LeadingIcon ? <LeadingIcon className="h-5 w-5" /> : null}<span>{children}</span>{!loading && TrailingIcon ? <TrailingIcon className="h-5 w-5" /> : null}</button>
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> { icon: LucideIcon; label: string; variant?: 'ghost' | 'subtle' | 'destructive'; size?: 'regular' | 'large'; selected?: boolean }
export function IconButton({ icon: Icon, label, variant = 'ghost', size = 'regular', selected = false, className = '', ...props }: IconButtonProps) {
  const variants = { ghost: 'bg-transparent text-text-primary active:bg-surface-pressed', subtle: 'bg-surface-subtle text-text-primary active:bg-surface-pressed', destructive: 'bg-transparent text-danger-text active:bg-danger-bg' }
  return <button aria-label={label} className={cn('inline-flex items-center justify-center rounded-control transition disabled:text-text-disabled', size === 'large' ? 'h-12 w-12' : 'h-10 w-10', selected && 'bg-surface-selected text-text-brand', variants[variant], className)} {...props}><Icon className={size === 'large' ? 'h-6 w-6' : 'h-5 w-5'} /></button>
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; helper?: string; error?: string }
export function Input({ label, helper, error, className = '', disabled, readOnly, ...props }: InputProps) {
  return <label className="block space-y-1.5 text-sm text-text-primary">{label && <span className="font-medium">{label}</span>}<input disabled={disabled} readOnly={readOnly} className={cn('min-h-10 w-full rounded-control border bg-surface px-3 text-base outline-none placeholder:text-text-placeholder focus:border-border-focused disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-disabled', error ? 'border-border-error' : 'border-border', className)} {...props}/>{(error || helper) && <span className={cn('block text-xs', error ? 'text-danger-text' : 'text-text-secondary')}>{error || helper}</span>}</label>
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; helper?: string; error?: string }
export function Textarea({ label, helper, error, maxLength, value, className = '', ...props }: TextareaProps) {
  return <label className="block space-y-1.5 text-sm text-text-primary">{label && <span className="font-medium">{label}</span>}<textarea value={value} maxLength={maxLength} className={cn('min-h-[88px] w-full resize-y rounded-control border bg-surface px-3 py-2 text-base outline-none placeholder:text-text-placeholder focus:border-border-focused', error ? 'border-border-error' : 'border-border', className)} {...props}/><span className="flex justify-between text-xs"><span className={error ? 'text-danger-text' : 'text-text-secondary'}>{error || helper}</span>{maxLength != null && <span className="text-text-tertiary">{String(value ?? '').length}/{maxLength}</span>}</span></label>
}

export interface SelectOption { value: string | number; label: ReactNode }
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; helper?: string; error?: string; options?: SelectOption[]; placeholder?: string }
export function Select({ label, helper, error, options = [], placeholder = '请选择', className = '', ...props }: SelectProps) {
  return <label className="block space-y-1.5 text-sm text-text-primary">{label && <span className="font-medium">{label}</span>}<span className="relative block"><select className={cn('min-h-10 w-full appearance-none rounded-control border bg-surface px-3 pr-9 text-base outline-none focus:border-border-focused disabled:bg-surface-subtle disabled:text-text-disabled', error ? 'border-border-error' : 'border-border', className)} {...props}><option value="">{placeholder}</option>{options.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" /></span>{(error || helper) && <span className={cn('block text-xs', error ? 'text-danger-text' : 'text-text-secondary')}>{error || helper}</span>}</label>
}

export interface CheckboxProps { label?: ReactNode; checked?: boolean; indeterminate?: boolean; onChange?: ChangeEventHandler<HTMLInputElement>; disabled?: boolean; className?: string }
export function Checkbox({ label, checked, indeterminate = false, onChange, disabled, className = '' }: CheckboxProps) {
  return <label className={cn('flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-primary', disabled && 'cursor-not-allowed text-text-disabled', className)}><input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only"/><span aria-hidden className={cn('flex h-5 w-5 items-center justify-center rounded-[4px] border', checked || indeterminate ? 'border-primary bg-primary text-text-inverse' : 'border-border bg-surface', disabled && 'border-border-subtle bg-surface-subtle')}>{checked ? <Check className="h-4 w-4"/> : indeterminate ? <span className="h-0.5 w-2.5 bg-current"/> : null}</span>{label && <span>{label}</span>}</label>
}

export interface RadioProps { label?: ReactNode; checked?: boolean; onChange?: ChangeEventHandler<HTMLInputElement>; disabled?: boolean; name?: string; value?: string | number; className?: string }
export function Radio({ label, checked, onChange, disabled, name, value, className = '' }: RadioProps) {
  return <label className={cn('flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-primary', disabled && 'cursor-not-allowed text-text-disabled', className)}><input type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled} className="sr-only"/><span className={cn('flex h-5 w-5 items-center justify-center rounded-full border bg-surface', checked ? 'border-primary' : 'border-border', disabled && 'border-border-subtle')}>{checked && <span className="h-2 w-2 rounded-full bg-primary"/>}</span>{label && <span>{label}</span>}</label>
}

export interface SwitchProps { checked?: boolean; onChange?: (checked: boolean) => void; label?: ReactNode; disabled?: boolean; className?: string }
export function Switch({ checked = false, onChange, label, disabled, className = '' }: SwitchProps) {
  return <div className={cn('flex min-h-11 items-center justify-between gap-3 text-sm text-text-primary', disabled && 'text-text-disabled', className)}>{label && <span>{label}</span>}<button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange?.(!checked)} className={cn('relative h-6 w-11 rounded-pill border transition', checked ? 'border-primary bg-primary' : 'border-border bg-surface-subtle', disabled && 'opacity-50')}><span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-surface transition', checked ? 'left-[21px]' : 'left-0.5')}/></button></div>
}

export interface ListItemProps { leading?: ReactNode; title: ReactNode; description?: ReactNode; metadata?: ReactNode; trailing?: ReactNode; actionable?: boolean; selected?: boolean; disabled?: boolean; className?: string; onClick?: () => void }
export function ListItem({ leading, title, description, metadata, trailing, actionable = false, selected = false, disabled = false, className = '', onClick }: ListItemProps) {
  const content = <>{leading && <span className="shrink-0">{leading}</span>}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-text-primary">{title}</span>{description && <span className="mt-0.5 line-clamp-2 block text-xs text-text-secondary">{description}</span>}</span>{metadata && <span className="shrink-0 text-xs text-text-tertiary">{metadata}</span>}{trailing ?? (actionable ? <ChevronRight className="h-5 w-5 shrink-0 text-text-tertiary"/> : null)}</>
  const classes = cn('flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left', actionable && 'active:bg-surface-pressed', selected && 'bg-surface-selected', disabled && 'text-text-disabled', className)
  return actionable ? <button type="button" disabled={disabled} className={classes} onClick={onClick}>{content}</button> : <div className={classes}>{content}</div>
}

export interface TabItem { value: string; label: ReactNode; disabled?: boolean }
export interface TabsProps { items?: TabItem[]; value?: string; onChange?: (value: string) => void; className?: string }
export function Tabs({ items = [], value, onChange, className = '' }: TabsProps) { return <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-border-subtle', className)}>{items.map(item => <button key={item.value} type="button" role="tab" aria-selected={value === item.value} disabled={item.disabled} onClick={() => onChange?.(item.value)} className={cn('relative min-h-11 shrink-0 px-3 text-sm font-medium', value === item.value ? 'text-text-brand after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary' : 'text-text-secondary', item.disabled && 'text-text-disabled')}>{item.label}</button>)}</div> }

export interface SegmentedControlProps extends TabsProps {}
export function SegmentedControl({ items = [], value, onChange, className = '' }: SegmentedControlProps) { return <div className={cn('grid rounded-control bg-surface-subtle p-0.5', className)} style={{gridTemplateColumns:`repeat(${Math.max(items.length,1)},minmax(0,1fr))`}}>{items.map(item => <button key={item.value} type="button" disabled={item.disabled} onClick={() => onChange?.(item.value)} className={cn('min-h-9 rounded-[6px] px-3 text-sm font-medium', value === item.value ? 'bg-surface text-text-brand' : 'text-text-secondary active:bg-surface-pressed', item.disabled && 'text-text-disabled')}>{item.label}</button>)}</div> }

export interface TopAppBarProps { title: ReactNode; leading?: ReactNode; actions?: ReactNode[]; scrolled?: boolean; className?: string }
export function TopAppBar({ title, leading, actions = [], scrolled = false, className = '' }: TopAppBarProps) { return <header className={cn('flex min-h-14 items-center gap-2 bg-surface px-4', scrolled && 'border-b border-border-subtle', className)}>{leading && <div className="shrink-0">{leading}</div>}<h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-text-primary">{title}</h1><div className="flex shrink-0 items-center gap-1">{actions.slice(0,2).map((action,index)=><Fragment key={index}>{action}</Fragment>)}</div></header> }

export interface BottomNavigationItem { value: string; label: string; icon?: LucideIcon; badge?: number | string }
export interface BottomNavigationProps { items?: BottomNavigationItem[]; value?: string; onChange?: (value: string) => void; className?: string }
export function BottomNavigation({ items = [], value, onChange, className = '' }: BottomNavigationProps) { return <nav className={cn('grid min-h-14 border-t border-border-subtle bg-surface', className)} style={{gridTemplateColumns:`repeat(${Math.max(items.length,1)},minmax(0,1fr))`}}>{items.map(item => { const Icon = item.icon; const active = value === item.value; return <button type="button" key={item.value} onClick={() => onChange?.(item.value)} aria-current={active ? 'page' : undefined} className={cn('relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px]', active ? 'text-text-brand' : 'text-text-tertiary', 'active:bg-surface-pressed')}>{Icon && <Icon className="h-6 w-6"/>}<span className="truncate">{item.label}</span>{item.badge != null && <Badge count={item.badge} className="absolute left-1/2 top-1 ml-2"/>}</button>})}</nav> }

export interface SectionProps { title?: ReactNode; supportingText?: ReactNode; action?: ReactNode; children: ReactNode; footer?: ReactNode; className?: string }
export function Section({ title, supportingText, action, children, footer, className = '' }: SectionProps) { return <section className={cn('space-y-3', className)}>{(title || supportingText || action) && <header className="flex items-start gap-3"><div className="min-w-0 flex-1">{title && <h2 className="font-semibold text-text-primary">{title}</h2>}{supportingText && <p className="mt-1 text-sm text-text-secondary">{supportingText}</p>}</div>{action && <div className="shrink-0">{action}</div>}</header>}<div>{children}</div>{footer && <footer>{footer}</footer>}</section> }

export interface DividerProps { inset?: boolean; className?: string }
export function Divider({ inset = false, className = '' }: DividerProps) { return <div className={cn('h-px bg-border-subtle', inset && 'ml-4', className)}/> }

export interface CardProps extends HTMLAttributes<HTMLElement> { interactive?: boolean }
export function Card({ children, interactive = false, className = '', onClick, ...props }: CardProps) {
  const classes = cn('w-full rounded-container bg-surface p-4 text-left', interactive && 'active:bg-surface-pressed', className)
  return interactive ? <button type="button" className={classes} onClick={onClick as ButtonHTMLAttributes<HTMLButtonElement>['onClick']}>{children}</button> : <section className={classes} onClick={onClick} {...props}>{children}</section>
}

export interface TagProps { children: ReactNode; variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'; className?: string }
export function Tag({ children, variant = 'neutral', className = '' }: TagProps) { const variants = { neutral:'bg-surface-subtle text-text-secondary', brand:'bg-surface-selected text-text-brand', success:'bg-success-bg text-success-text', warning:'bg-warning-bg text-warning-text', danger:'bg-danger-bg text-danger-text', info:'bg-info-bg text-info-text' }; return <span className={cn('inline-flex min-h-[24px] items-center rounded-pill px-2 text-xs font-medium', variants[variant], className)}>{children}</span> }

export interface BadgeProps { count?: number | string; dot?: boolean; attention?: boolean; className?: string }
export function Badge({ count, dot = count == null, attention = false, className = '' }: BadgeProps) { if (dot) return <span className={cn('inline-block h-2 w-2 rounded-full', attention ? 'bg-danger' : 'bg-primary', className)}/>; const numeric = Number(count); const text = Number.isFinite(numeric) && numeric > 99 ? '99+' : count; return <span className={cn('inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-pill px-1 text-[10px] font-semibold text-text-inverse', attention ? 'bg-danger' : 'bg-primary', className)}>{text}</span> }

export interface AvatarProps { src?: string; alt?: string; name?: string; size?: 'small' | 'regular' | 'large'; status?: boolean; className?: string }
export function Avatar({ src, alt = '', name = '', size = 'regular', status, className = '' }: AvatarProps) { const sizes = { small:'h-6 w-6 text-[10px]', regular:'h-8 w-8 text-xs', large:'h-10 w-10 text-sm' }; const initials = name.trim().split(/\s+/).filter(Boolean).map(x=>x[0]).join('').slice(0,2).toUpperCase(); return <span className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-subtle font-semibold text-text-secondary', sizes[size], className)}>{src ? <img src={src} alt={alt || name} className="h-full w-full object-cover"/> : <span>{initials || '•'}</span>}{status && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success"/>}</span> }

export interface ToastProps { message: ReactNode; status?: Status; className?: string }
export function Toast({ message, status, className = '' }: ToastProps) { const Icon = status ? statusIcon[status] : undefined; return <div role="status" className={cn('inline-flex max-w-[calc(100vw-32px)] items-center gap-2 rounded-control bg-surface-inverse px-4 py-2 text-sm text-text-inverse shadow-floating', className)}>{Icon && <Icon className="h-4 w-4"/>}<span>{message}</span></div> }

export interface SnackbarProps { message: ReactNode; actionLabel?: ReactNode; onAction?: () => void; className?: string }
export function Snackbar({ message, actionLabel, onAction, className = '' }: SnackbarProps) { return <div role="status" className={cn('flex items-center gap-3 rounded-control bg-surface-inverse px-4 py-2 text-sm text-text-inverse shadow-floating', className)}><span className="min-w-0 flex-1">{message}</span>{actionLabel && <button type="button" onClick={onAction} className="shrink-0 font-semibold text-reward">{actionLabel}</button>}</div> }

export interface AlertProps { title?: ReactNode; message: ReactNode; status?: Status; action?: ReactNode; dismissible?: boolean; onDismiss?: () => void; className?: string }
export function Alert({ title, message, status = 'info', action, dismissible = false, onDismiss, className = '' }: AlertProps) { const Icon = statusIcon[status]; const variants = { info:'bg-info-bg text-info-text', success:'bg-success-bg text-success-text', warning:'bg-warning-bg text-warning-text', danger:'bg-danger-bg text-danger-text' }; return <div role="status" className={cn('flex gap-3 rounded-control p-3', variants[status], className)}><Icon className="mt-0.5 h-5 w-5 shrink-0"/><div className="min-w-0 flex-1">{title && <div className="font-semibold">{title}</div>}<div className="text-sm">{message}</div>{action && <div className="mt-2">{action}</div>}</div>{dismissible && <button type="button" aria-label="关闭" onClick={onDismiss} className="shrink-0"><X className="h-5 w-5"/></button>}</div> }

export interface DialogProps { open: boolean; title: string; children?: ReactNode; actions?: ReactNode; onClose?: () => void; className?: string }
export function Dialog({ open, title, children, actions, onClose, className = '' }: DialogProps) { if (!open) return null; return <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget) onClose?.()}}><section role="dialog" aria-modal="true" aria-label={title} className={cn('w-full max-w-sm rounded-overlay bg-surface p-5 shadow-modal', className)}><h2 className="text-lg font-semibold text-text-primary">{title}</h2><div className="mt-3 text-sm text-text-secondary">{children}</div>{actions && <div className="mt-5 flex justify-end gap-2">{actions}</div>}</section></div> }

export interface BottomSheetProps extends DialogProps {}
export function BottomSheet({ open, title, children, actions, onClose, className = '' }: BottomSheetProps) { if (!open) return null; return <div className="fixed inset-0 z-50 flex items-end bg-scrim" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget) onClose?.()}}><section role="dialog" aria-modal="true" aria-label={title} className={cn('max-h-[88vh] w-full overflow-auto rounded-t-overlay bg-surface p-4 shadow-modal', className)}><div className="mx-auto mb-3 h-1 w-10 rounded-pill bg-border-strong"/>{title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}<div className="mt-3">{children}</div>{actions && <div className="sticky bottom-0 mt-4 bg-surface pt-3">{actions}</div>}</section></div> }

export interface LoadingIndicatorProps { label?: ReactNode; size?: 'inline' | 'regular'; className?: string }
export function LoadingIndicator({ label, size = 'regular', className = '' }: LoadingIndicatorProps) { return <div role="status" aria-busy="true" className={cn('inline-flex items-center gap-2 text-text-brand', className)}><LoaderCircle className={cn('animate-spin', size === 'inline' ? 'h-4 w-4' : 'h-6 w-6')}/>{label && <span className="text-sm text-text-secondary">{label}</span>}</div> }

export interface SkeletonProps { className?: string }
export function Skeleton({ className = '' }: SkeletonProps) { return <div aria-hidden="true" className={cn('animate-pulse rounded-control bg-surface-subtle', className)}/> }

export interface EmptyStateProps { title?: ReactNode; supportingText?: ReactNode; visual?: ReactNode; primaryAction?: ReactNode; secondaryAction?: ReactNode; variant?: 'first-use' | 'no-results' | 'no-data' | 'recoverable-error'; className?: string }
export function EmptyState({ title = '暂无内容', supportingText, visual, primaryAction, secondaryAction, variant = 'no-data', className = '' }: EmptyStateProps) { return <section className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>{visual && <div className={cn('mb-4', variant === 'recoverable-error' ? 'text-danger' : 'text-text-tertiary')}>{visual}</div>}<h2 className="text-lg font-semibold text-text-primary">{title}</h2>{supportingText && <p className="mt-2 max-w-xs text-sm text-text-secondary">{supportingText}</p>}{(primaryAction || secondaryAction) && <div className="mt-5 flex flex-wrap justify-center gap-2">{primaryAction}{secondaryAction}</div>}</section> }

export interface ProgressIndicatorProps { value?: number; max?: number; showValue?: boolean; className?: string }
export function ProgressIndicator({ value = 0, max = 100, showValue = false, className = '' }: ProgressIndicatorProps) { const pct = max > 0 ? Math.max(0,Math.min(100,(value/max)*100)) : 0; return <div className={className}><div className="h-1 w-full overflow-hidden rounded-pill bg-surface-subtle"><div className="h-full rounded-pill bg-primary" style={{width:`${pct}%`}}/></div>{showValue && <div className="mt-1 text-right text-xs text-text-tertiary">{Math.round(pct)}%</div>}</div> }

export interface StepItem { id?: string | number; label: ReactNode; error?: boolean }
export interface StepperProps { steps?: StepItem[]; current?: number; vertical?: boolean; className?: string }
export function Stepper({ steps = [], current = 0, vertical = false, className = '' }: StepperProps) { return <ol className={cn(vertical ? 'space-y-4' : 'flex', className)}>{steps.map((step,index)=>{ const state = step.error ? 'error' : index < current ? 'done' : index === current ? 'current' : 'upcoming'; return <li key={step.id ?? index} className={cn('relative', vertical ? 'flex gap-3' : 'flex min-w-0 flex-1 flex-col items-center text-center')}><span className={cn('z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px]', state==='done' && 'border-primary bg-primary text-text-inverse', state==='current' && 'border-primary bg-surface text-primary', state==='upcoming' && 'border-border bg-surface text-text-tertiary', state==='error' && 'border-danger bg-surface text-danger-text')}>{state==='done' ? <Check className="h-3 w-3"/> : index+1}</span><span className={cn('text-xs', vertical ? 'pt-0.5 text-left' : 'mt-2', state==='current' ? 'text-text-primary' : state==='error' ? 'text-danger-text' : 'text-text-secondary')}>{step.label}</span>{!vertical && index < steps.length-1 && <span className="absolute left-1/2 top-2.5 -z-0 h-0.5 w-full bg-border-subtle"/>}</li>})}</ol> }

export interface TimelineItem { id?: string | number; title: ReactNode; time?: ReactNode; description?: ReactNode }
export interface TimelineProps { items?: TimelineItem[]; className?: string }
export function Timeline({ items = [], className = '' }: TimelineProps) { return <ol className={cn('space-y-0', className)}>{items.map((item,index)=><li key={item.id ?? index} className="relative flex gap-3 pb-5"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary"/>{index < items.length-1 && <span className="absolute left-[4px] top-4 h-[calc(100%-8px)] w-px bg-border-subtle"/>}<div className="min-w-0"><div className="text-sm font-medium text-text-primary">{item.title}</div>{item.time && <div className="mt-0.5 text-xs text-text-tertiary">{item.time}</div>}{item.description && <div className="mt-1 text-sm text-text-secondary">{item.description}</div>}</div></li>)}</ol> }

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> { value?: string; onChange?: ChangeEventHandler<HTMLInputElement>; onClear?: () => void; loading?: boolean }
export function SearchField({ value = '', onChange, onClear, loading = false, placeholder = '搜索', className = '', ...props }: SearchFieldProps) { return <label className={cn('flex min-h-10 items-center gap-2 rounded-control bg-surface-subtle px-3 focus-within:bg-surface focus-within:ring-1 focus-within:ring-border-focused', className)}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin text-text-tertiary"/> : <Search className="h-5 w-5 text-text-tertiary"/>}<input type="search" value={value} onChange={onChange} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-placeholder" {...props}/>{value && <button type="button" aria-label="清除搜索" onClick={onClear} className="flex h-9 w-9 items-center justify-center text-text-tertiary"><X className="h-5 w-5"/></button>}</label> }

export interface MenuProps { open: boolean; children?: ReactNode; className?: string }
export function Menu({ open, children, className = '' }: MenuProps) { if (!open) return null; return <div role="menu" className={cn('min-w-40 overflow-hidden rounded-overlay bg-surface py-1 shadow-floating', className)}>{children}</div> }

export interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> { icon?: LucideIcon; selected?: boolean; destructive?: boolean; trailing?: ReactNode }
export function MenuItem({ children, icon: Icon, selected = false, destructive = false, disabled = false, trailing, className = '', ...props }: MenuItemProps) { return <button type="button" role="menuitem" disabled={disabled} className={cn('flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm active:bg-surface-pressed disabled:text-text-disabled', selected ? 'text-text-brand' : destructive ? 'text-danger-text' : 'text-text-primary', className)} {...props}>{Icon && <Icon className="h-5 w-5 shrink-0"/>}<span className="min-w-0 flex-1 truncate">{children}</span>{selected ? <Check className="h-4 w-4"/> : trailing}</button> }
