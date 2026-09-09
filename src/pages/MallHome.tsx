import { useState, useCallback, useMemo, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string
  tag: string
  tone: ToneKey
  name: string
  spec: string
  priceOld: number
  price: number
  svgKey: SvgKey
}

interface FlashItem {
  id: string
  name: string
  old: number
  now: number
  pct: number
}

interface Coupon {
  id: string
  amount: number
  threshold: number
  desc: string
  initiallyClaimed?: boolean
}

interface CartItem {
  id: string
  name: string
  spec: string
  tone: ToneKey
  price: number
  priceOld: number
  n: number
  svgKey: SvgKey
  isFlash?: boolean
  flashLabel?: string
}

type ToneKey =
  | 'tone-water'
  | 'tone-snack'
  | 'tone-meal'
  | 'tone-fruit'
  | 'tone-daily'
  | 'tone-frozen'
  | 'tone-coffee'
  | 'tone-all'

type SvgKey =
  | 'bottle-water'
  | 'bottle-cola'
  | 'chips'
  | 'meal-box'
  | 'lunch-box'
  | 'pie'
  | 'ice-cream'

// ─── Design Token CSS (scoped to .mall-home) ─────────────────────────────────
// 复杂的 CSS 变量系统、SVG 填充类、伪元素和 keyframes 动画保留在 style 标签中，
// 布局/间距/排版使用 Tailwind class 表达。

const designTokensCss = `
.mall-home {
  /* ── base 6 ── */
  --bg:           #f4f5f7;
  --surface:      #ffffff;
  --fg:           #1f2024;
  --muted:        #75787f;
  --border:       #e8eaed;
  --accent:       #ff5a2e;

  /* ── extended neutral ── */
  --fg-2:         #44474d;
  --border-soft:  #f1f2f4;
  --surface-warm: #fff1ea;

  /* ── accent system ── */
  --accent-on:    #ffffff;
  --accent-hover: #e84f28;
  --accent-active:#d44724;
  --accent-soft:  #ffd8cc;
  --accent-tint:  #fff1ea;
  --accent-cta-bg-hover: #fff5ef;

  /* ── status palette ── */
  --success:      #16a34a;
  --warn:         #f59e0b;
  --danger:       #dc2626;

  /* ── search ── */
  --search-bg:        #eceef2;
  --search-bg-hover:  #e5e7ec;

  /* ── category tints ── */
  --tone-water-bg:    #e3f2ff;  --tone-water-fg:    #1a73e8;
  --tone-snack-bg:    #fff1e3;  --tone-snack-fg:    #ff8a1f;
  --tone-meal-bg:     #ffe8e0;  --tone-meal-fg:     #ff5a2e;
  --tone-fruit-bg:    #e6f6ea;  --tone-fruit-fg:    #16a34a;
  --tone-daily-bg:    #ffe4e6;  --tone-daily-fg:    #e11d48;
  --tone-frozen-bg:   #e1f4f8;  --tone-frozen-fg:   #0891b2;
  --tone-coffee-bg:   #f5ebe1;  --tone-coffee-fg:   #92400e;
  --tone-all-bg:      #1f2024;  --tone-all-fg:      #ffffff;

  /* ── product covers ── */
  --cover-water:   #eaf3fb;
  --cover-snack:   #fff3e6;
  --cover-meal:    #ffece5;
  --cover-daily:   #ffe4e6;
  --cover-fruit:   #ecf7ee;
  --cover-frozen:  #e3f2f6;

  /* ── promo banner ── */
  --promo-deep:    #ff5a2e;
  --promo-mid:     #ff7a3d;
  --promo-light:   #ff8a1f;

  /* ── scenario gradients ── */
  --sce-red-a:     #ff5a2e;  --sce-red-b:     #ff7a3d;
  --sce-gold-a:    #f59e0b;  --sce-gold-b:    #fbbf24;
  --sce-blue-a:    #1a73e8;  --sce-blue-b:    #4c9aff;
  --sce-teal-a:    #0891b2;  --sce-teal-b:    #38bdf8;

  /* ── tag/badge gold gradient ── */
  --tag-gold-a:    #ff8a1f;
  --tag-gold-b:    #ffb347;

  /* ── flash / countdown / progress ── */
  --countdown-bg:  #1c1d22;
  --progress-track:#f0f1f3;
  --flash-cta-a:   #ff5a2e;
  --flash-cta-b:   #ff7a3d;
  --grad-accent-a: #ff5a2e;
  --grad-accent-b: #ff8a1f;

  /* ── floating cart + badge ── */
  --cart-bg-a:     #1c1d22;
  --cart-bg-b:     #2a2c33;
  --cart-badge-bg: #ffffff;

  /* ── illustration colors ── */
  --ill-water-strong: #1a73e8;
  --ill-water-weak:   #cfe3fb;
  --ill-cola-deep:    #dc2626;
  --ill-cola-cap:     #7a1818;
  --ill-snack-body:   #ffb84d;
  --ill-snack-shade:  #ff8a1f;
  --ill-snack-text:   #7a3e00;
  --ill-meal-deep:    #ff5a2e;
  --ill-meal-mid:     #ff7a3d;
  --ill-meal-tray:    #ffffff;
  --ill-meal-rice:    #ffd58a;
  --ill-meal-greens:  #16a34a;
  --ill-meal-border:  #dcdfe4;
  --ill-pie-deep:     #b25410;
  --ill-pie-light:    #f59e0b;
  --ill-pie-text:     #7a3e00;
  --ill-ice-body:     #fff8ef;
  --ill-ice-shade:    #ffd9bf;
  --ill-ice-cone:     #fff5e3;

  /* ── shadows ── */
  --elev-card:  0 1px 2px rgba(20,22,30,.04), 0 2px 8px rgba(20,22,30,.04);
  --elev-float: 0 10px 28px rgba(255,90,46,.34);
  --elev-sheet: 0 -10px 30px rgba(20,22,30,.18);
  --elev-promo: 0 8px 20px rgba(255,90,46,.22);
  --mask:       rgba(20,22,30,.42);

  /* ── type scale ── */
  --fs-xs:  11px;
  --fs-sm:  12px;
  --fs-base:14px;
  --fs-md:  15px;
  --fs-lg:  17px;
  --fs-xl:  19px;
  --fs-2xl: 22px;
  --fs-3xl: 28px;

  --font-display: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, -apple-system, 'Helvetica Neue', sans-serif;
  --font-body:    'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', system-ui, -apple-system, 'Helvetica Neue', sans-serif;
  --font-mono:    ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;

  --gutter:  16px;
}

/* SVG illustration utility fills */
.mall-home .ill-fill-accent   { fill: var(--accent); }
.mall-home .ill-fill-on       { fill: var(--accent-on); }
.mall-home .ill-fill-surface  { fill: var(--surface); }
.mall-home .ill-fill-strong   { fill: var(--ill-water-strong); }
.mall-home .ill-fill-weak     { fill: var(--ill-water-weak); }
.mall-home .ill-fill-cola     { fill: var(--ill-cola-deep); }
.mall-home .ill-fill-cola-cap { fill: var(--ill-cola-cap); }
.mall-home .ill-fill-snack    { fill: var(--ill-snack-body); }
.mall-home .ill-fill-snack-s  { fill: var(--ill-snack-shade); }
.mall-home .ill-fill-snack-t  { fill: var(--ill-snack-text); }
.mall-home .ill-fill-meal     { fill: var(--ill-meal-deep); }
.mall-home .ill-fill-meal-m   { fill: var(--ill-meal-mid); }
.mall-home .ill-fill-meal-tr  { fill: var(--ill-meal-tray); }
.mall-home .ill-fill-meal-rc  { fill: var(--ill-meal-rice); }
.mall-home .ill-fill-meal-gr  { fill: var(--ill-meal-greens); }
.mall-home .ill-stroke-meal-b { stroke: var(--ill-meal-border); }
.mall-home .ill-stroke-meal   { stroke: var(--ill-meal-deep); }
.mall-home .ill-stroke-strong { stroke: var(--ill-water-strong); }
.mall-home .ill-stroke-cola   { stroke: var(--ill-cola-deep); }
.mall-home .ill-fill-pie-d    { fill: var(--ill-pie-deep); }
.mall-home .ill-fill-pie-l    { fill: var(--ill-pie-light); }
.mall-home .ill-fill-pie-t    { fill: var(--ill-pie-text); }
.mall-home .ill-fill-ice-b    { fill: var(--ill-ice-body); }
.mall-home .ill-fill-ice-s    { fill: var(--ill-ice-shade); }
.mall-home .ill-fill-ice-c    { fill: var(--ill-ice-cone); }
.mall-home .ill-stroke-on     { stroke: var(--accent-on); }

/* promo banner gradient */
.mall-home .promo-banner {
  background:
    radial-gradient(120% 130% at 100% 0%, var(--promo-light) 0%, transparent 55%),
    linear-gradient(135deg, var(--promo-deep) 0%, var(--promo-mid) 100%);
  box-shadow: var(--elev-promo);
}
.mall-home .promo-banner::before {
  content: "";
  position: absolute;
  right: -36px; top: -32px;
  width: 140px; height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.22), transparent 70%);
}

/* scenario icon gradients */
.mall-home .sce-t-red    { background: linear-gradient(135deg, var(--sce-red-a),    var(--sce-red-b)); }
.mall-home .sce-t-gold   { background: linear-gradient(135deg, var(--sce-gold-a),   var(--sce-gold-b)); }
.mall-home .sce-t-teal   { background: linear-gradient(135deg, var(--sce-teal-a),   var(--sce-teal-b)); }
.mall-home .sce-t-blue   { background: linear-gradient(135deg, var(--sce-blue-a),   var(--sce-blue-b)); }

/* gold tag gradient */
.mall-home .tag-gold { background: linear-gradient(135deg, var(--tag-gold-a), var(--tag-gold-b)); }

/* progress bar gradient */
.mall-home .progress-bar { background: linear-gradient(90deg, var(--grad-accent-a), var(--grad-accent-b)); }

/* flash buy button gradient */
.mall-home .flash-buy-btn { background: linear-gradient(90deg, var(--flash-cta-a), var(--flash-cta-b)); }

/* floating cart gradient */
.mall-home .float-cart-bg { background: linear-gradient(135deg, var(--cart-bg-a), var(--cart-bg-b)); }

/* coupon notches */
.mall-home .coupon-card::before,
.mall-home .coupon-card::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 10px; height: 10px;
  background: var(--bg);
  border-radius: 50%;
  transform: translateY(-50%);
}
.mall-home .coupon-card::before { left: -5px; }
.mall-home .coupon-card::after  { right: -5px; }

/* dot status pulse */
.mall-home .status-dot {
  box-shadow: 0 0 0 3px rgba(22,163,74,0.24);
}

/* card elevation */
.mall-home .elev-card   { box-shadow: var(--elev-card); }
.mall-home .elev-float  { box-shadow: var(--elev-float); }
.mall-home .elev-sheet  { box-shadow: var(--elev-sheet); }

/* drawer transitions */
.mall-home .drawer-mask {
  transition: opacity .25s ease, visibility .25s ease;
}
.mall-home .drawer-panel {
  transition: transform .28s cubic-bezier(.2,.8,.2,1);
}

/* bounce animation */
@keyframes mallBounce {
  0%   { transform: translateY(0) scale(1); }
  40%  { transform: translateY(-8px) scale(1.08); }
  100% { transform: translateY(0) scale(1); }
}
.mall-home .bounce-anim { animation: mallBounce .42s ease; }

/* product name clamp */
.mall-home .line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* text balance */
.mall-home .text-balance { text-wrap: balance; }
`

// ─── SVG Illustration Components ──────────────────────────────────────────────

function BottleSvg({ variant = 'water', label1, label2 }: { variant?: 'water' | 'cola'; label1: string; label2: string }) {
  const capClass = variant === 'water' ? 'ill-fill-strong' : 'ill-fill-cola-cap'
  const bodyClass = variant === 'water' ? 'ill-fill-strong' : 'ill-fill-cola'
  const strokeClass = variant === 'water' ? 'ill-stroke-strong' : 'ill-stroke-cola'
  return (
    <svg viewBox="0 0 60 90" fill="none">
      <path d="M22 4h16l-2 6h-12z" className={capClass} opacity=".85" />
      <path d="M20 10h20l-3 70a4 4 0 0 1-4 4H27a4 4 0 0 1-4-4z" className={`${bodyClass} ${strokeClass}`} opacity=".25" strokeWidth="1.4" />
      <rect x="22" y="36" width="16" height="22" rx="2" className="ill-fill-meal-tr" />
      <text x="30" y="46" textAnchor="middle" fontFamily="PingFang SC, system-ui" fontWeight="700" fontSize="6" className={bodyClass}>{label1}</text>
      <text x="30" y="54" textAnchor="middle" fontFamily="PingFang SC, system-ui" fontWeight="600" fontSize="5" className={bodyClass} opacity=".7">{label2}</text>
    </svg>
  )
}

function ChipsSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none">
      <path d="M14 18h52a6 6 0 0 1 6 6v32a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8V24a6 6 0 0 1 6-6z" className="ill-fill-snack" />
      <path d="M8 30c2-3 6-4 8-1s2 6-2 7-8-1-6-6z" className="ill-fill-snack-s" />
      <path d="M70 18c4 2 5 8 1 10s-9-2-7-7z" className="ill-fill-snack-s" />
      <text x="40" y="46" textAnchor="middle" fontFamily="PingFang SC, system-ui" fontWeight="800" fontSize="13" className="ill-fill-snack-t">Lay&apos;s</text>
    </svg>
  )
}

function MealBoxSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none">
      <rect x="10" y="22" width="60" height="44" rx="3" className="ill-fill-meal" />
      <rect x="10" y="22" width="60" height="10" rx="3" className="ill-fill-meal-m" />
      <text x="40" y="30" textAnchor="middle" fontFamily="PingFang SC" fontWeight="700" fontSize="6" className="ill-fill-meal-tr">康师傅</text>
      <circle cx="40" cy="50" r="14" className="ill-fill-meal-tr" opacity=".92" />
      <path d="M28 50 q6 -8 12 0 t12 0" className="ill-stroke-meal" strokeWidth="1.2" fill="none" />
    </svg>
  )
}

function LunchBoxSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none">
      <rect x="14" y="22" width="52" height="38" rx="3" className="ill-fill-meal-tr ill-stroke-meal-b" strokeWidth="1.4" />
      <path d="M14 30h52" className="ill-stroke-meal-b" strokeWidth="1.4" />
      <circle cx="40" cy="48" r="9" className="ill-fill-meal-rc" />
      <circle cx="32" cy="44" r="5" className="ill-fill-meal-gr" />
      <circle cx="48" cy="44" r="5" className="ill-fill-meal-gr" />
    </svg>
  )
}

function PieSvg() {
  return (
    <svg viewBox="0 0 80 80" fill="none">
      <rect x="14" y="22" width="52" height="38" rx="3" className="ill-fill-pie-d" />
      <rect x="14" y="22" width="52" height="10" rx="3" className="ill-fill-pie-l" />
      <circle cx="40" cy="50" r="11" className="ill-fill-meal-tr" />
      <text x="40" y="53" textAnchor="middle" fontFamily="PingFang SC" fontWeight="800" fontSize="8" className="ill-fill-pie-t">派</text>
    </svg>
  )
}

function IceCreamSvg() {
  return (
    <svg viewBox="0 0 120 120" fill="none">
      <ellipse cx="60" cy="70" rx="38" ry="32" className="ill-fill-ice-b" />
      <ellipse cx="44" cy="56" rx="14" ry="12" className="ill-fill-ice-s" />
      <ellipse cx="76" cy="56" rx="14" ry="12" className="ill-fill-ice-s" />
      <path d="M40 80 L60 110 L80 80 Z" className="ill-fill-ice-c" />
      <path d="M40 80 L60 110 L80 80" className="ill-stroke-on" strokeWidth="1.2" />
      <path d="M48 60 q4 6 -2 12" className="ill-stroke-on" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 60 q-4 6 2 12" className="ill-stroke-on" strokeWidth="2" strokeLinecap="round" />
      <circle cx="92" cy="34" r="2" className="ill-fill-on" />
      <circle cx="100" cy="50" r="1.4" className="ill-fill-on" />
      <circle cx="22" cy="48" r="1.6" className="ill-fill-on" />
    </svg>
  )
}

function FlashBottleSvg({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 60 90" fill="none">
      <path d="M22 4h16l-2 6h-12z" className="ill-fill-accent" opacity=".85" />
      <path d="M20 10h20l-3 70a4 4 0 0 1-4 4H27a4 4 0 0 1-4-4z" className="ill-fill-meal-tr ill-stroke-meal" strokeWidth="1.4" />
      <text x="30" y="50" textAnchor="middle" fontFamily="PingFang SC, system-ui" fontWeight="700" fontSize="6" className="ill-fill-accent">{label}</text>
    </svg>
  )
}

// ─── Product Cover SVG Selector ───────────────────────────────────────────────

function ProductCoverSvg({ svgKey, name }: { svgKey: SvgKey; name: string }) {
  switch (svgKey) {
    case 'bottle-water':
      return <BottleSvg variant="water" label1={name.split(' ')[0]} label2="550ml" />
    case 'bottle-cola':
      return <BottleSvg variant="cola" label1={name.split(' ')[0]} label2="330ml" />
    case 'chips':
      return <ChipsSvg />
    case 'meal-box':
      return <MealBoxSvg />
    case 'lunch-box':
      return <LunchBoxSvg />
    case 'pie':
      return <PieSvg />
    default:
      return <BottleSvg variant="water" label1={name.split(' ')[0]} label2="" />
  }
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const products: Product[] = [
  { id: 'p1', tag: '热销',   tone: 'tone-water', name: '农夫山泉 天然矿泉水 550ml', spec: '550ml × 1 瓶', priceOld: 2.5,  price: 2.0,  svgKey: 'bottle-water' },
  { id: 'p2', tag: '直降',   tone: 'tone-snack', name: '乐事 薯片 原味 75g',       spec: '75g × 1 袋',   priceOld: 8.9,  price: 6.9,  svgKey: 'chips' },
  { id: 'p3', tag: '',       tone: 'tone-meal',  name: '康师傅 红烧牛肉面 五包装', spec: '112g × 5 包',  priceOld: 15.5, price: 12.9, svgKey: 'meal-box' },
  { id: 'p4', tag: '',       tone: 'tone-water', name: '可口可乐 经典原味 330ml', spec: '330ml × 1 罐', priceOld: 4.0,  price: 3.5,  svgKey: 'bottle-cola' },
  { id: 'p5', tag: '新品',   tone: 'tone-meal',  name: '鲜食便当 照烧鸡腿饭',     spec: '450g × 1 盒',  priceOld: 24.9, price: 19.9, svgKey: 'lunch-box' },
  { id: 'p6', tag: '',       tone: 'tone-snack', name: '好丽友 · 派 巧克力 12枚', spec: '12 枚 × 1 盒', priceOld: 24.9, price: 19.9, svgKey: 'pie' },
]

const flashItems: FlashItem[] = [
  { id: 'f1', name: '蒙牛纯牛奶 250ml × 6 盒', old: 32.9, now: 19.9, pct: 82 },
  { id: 'f2', name: '乐事薯片 家庭装 4 袋',   old: 39.9, now: 24.9, pct: 65 },
  { id: 'f3', name: '双汇火腿肠 8 支装',       old: 14.9, now: 9.9,  pct: 43 },
  { id: 'f4', name: '农夫山泉 550ml × 24 瓶', old: 48.0, now: 29.9, pct: 28 },
]

const coupons: Coupon[] = [
  { id: 'c1', amount: 6,  threshold: 49,  desc: '满 49 元可用' },
  { id: 'c2', amount: 10, threshold: 89,  desc: '满 89 元可用 · 食品饮料' },
  { id: 'c3', amount: 3,  threshold: 19,  desc: '满 19 元可用 · 新人', initiallyClaimed: true },
  { id: 'c4', amount: 15, threshold: 129, desc: '满 129 元可用 · 日用' },
]

const categoryList = [
  { id: 'water',  tone: 'tone-water'  as const, label: '酒水饮料' },
  { id: 'snack',  tone: 'tone-snack'  as const, label: '零食小吃' },
  { id: 'meal',   tone: 'tone-meal'   as const, label: '鲜食便当' },
  { id: 'fruit',  tone: 'tone-fruit'  as const, label: '水果蔬菜' },
  { id: 'daily',  tone: 'tone-daily'  as const, label: '日用百货' },
  { id: 'frozen', tone: 'tone-frozen' as const, label: '冰品冷饮' },
  { id: 'coffee', tone: 'tone-coffee' as const, label: '热食咖啡' },
  { id: 'all',    tone: 'tone-all'    as const, label: '全部分类' },
]

const tabList = ['猜你喜欢', '饮料酒水', '零食小吃', '鲜食便当', '日用百货']

const scenarioList = [
  { id: 'flash',   tone: 't-red'  as const, title: '限时秒杀', desc: '低至 5 折' },
  { id: 'vip',     tone: 't-gold' as const, title: '会员特价', desc: '会员专享价' },
  { id: 'night',   tone: 't-teal' as const, title: '夜宵专场', desc: '深夜也送达' },
  { id: 'morning', tone: 't-blue' as const, title: '早餐预定', desc: '明早准时取' },
]

// ─── Icon SVGs (inline, stroke-based) ────────────────────────────────────────

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function IconScan() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18" />
    </svg>
  )
}

function IconMessage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
    </svg>
  )
}

function IconSwitch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h13a4 4 0 0 1 0 8H9M3 9l4-4M3 9l4 4M21 15H8a4 4 0 0 1 0-8h7" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function IconVoice() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
    </svg>
  )
}

function IconCatWater() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2h4l-.5 3h-3z" />
      <path d="M9 5h6l1.4 14.2a2 2 0 0 1-2 2.3H9.6a2 2 0 0 1-2-2.3z" />
    </svg>
  )
}

function IconCatSnack() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h16v3a8 8 0 0 1-16 0z" />
      <path d="M4 8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3" />
      <path d="M8 11h8M9 14h6" />
    </svg>
  )
}

function IconCatMeal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M8 6V4M16 6V4" />
    </svg>
  )
}

function IconCatFruit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8c-3 0-6 3-6 7a5 5 0 0 0 10 0c0-4-1-7-4-7z" />
      <path d="M12 5c0-2 2-3 4-3" />
    </svg>
  )
}

function IconCatDaily() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </svg>
  )
}

function IconCatFrozen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1" />
    </svg>
  )
}

function IconCatCoffee() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h14v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <path d="M17 10h2a2 2 0 1 1 0 4h-2M8 3c0 1 1 1 1 2s-1 1-1 2M11 3c0 1 1 1 1 2s-1 1-1 2" />
    </svg>
  )
}

function IconCatAll() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <rect x="14" y="14" width="7" height="7" rx="1.2" />
    </svg>
  )
}

function getCategoryIcon(id: string) {
  switch (id) {
    case 'water':  return <IconCatWater />
    case 'snack':  return <IconCatSnack />
    case 'meal':   return <IconCatMeal />
    case 'fruit':  return <IconCatFruit />
    case 'daily':  return <IconCatDaily />
    case 'frozen': return <IconCatFrozen />
    case 'coffee': return <IconCatCoffee />
    case 'all':    return <IconCatAll />
    default:       return <IconCatAll />
  }
}

function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  )
}

function IconScenarioFlash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  )
}

function IconScenarioVip() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7l3 12h12l3-12-5 4-4-7-4 7z" />
    </svg>
  )
}

function IconScenarioNight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

function IconScenarioMorning() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function getScenarioIcon(id: string) {
  switch (id) {
    case 'flash':   return <IconScenarioFlash />
    case 'vip':     return <IconScenarioVip />
    case 'night':   return <IconScenarioNight />
    case 'morning': return <IconScenarioMorning />
    default:        return <IconScenarioFlash />
  }
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconMinus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  )
}

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2l3 12h11l3-9H6" />
      <circle cx="9" cy="20" r="1.6" />
      <circle cx="18" cy="20" r="1.6" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MallHome() {
  // ── State ──
  const [activeTab, setActiveTab] = useState(0)
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cartBounceKey, setCartBounceKey] = useState(0)
  const [claimedCoupons, setClaimedCoupons] = useState<Set<string>>(
    new Set(coupons.filter(c => c.initiallyClaimed).map(c => c.id))
  )

  // ── Initialize cart with demo items (matches HTML initial state) ──
  useEffect(() => {
    const initial = new Map<string, CartItem>()
    const p1 = products[0]
    const p2 = products[1]
    initial.set(p1.id, {
      id: p1.id, name: p1.name, spec: p1.spec, tone: p1.tone,
      price: p1.price, priceOld: p1.priceOld, n: 2, svgKey: p1.svgKey,
    })
    initial.set(p2.id, {
      id: p2.id, name: p2.name, spec: p2.spec, tone: p2.tone,
      price: p2.price, priceOld: p2.priceOld, n: 1, svgKey: p2.svgKey,
    })
    setCart(initial)
  }, [])

  // ── Computed totals ──
  const totals = useMemo(() => {
    let count = 0
    let total = 0
    let saved = 0
    cart.forEach(c => {
      count += c.n
      total += c.price * c.n
      if (c.priceOld) saved += (c.priceOld - c.price) * c.n
    })
    return { count, total, saved }
  }, [cart])

  // ── Handlers ──
  const triggerBounce = useCallback(() => {
    setCartBounceKey(k => k + 1)
  }, [])

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const next = new Map(prev)
      const exist = next.get(product.id)
      if (exist) {
        next.set(product.id, { ...exist, n: exist.n + 1 })
      } else {
        next.set(product.id, {
          id: product.id, name: product.name, spec: product.spec,
          tone: product.tone, price: product.price, priceOld: product.priceOld,
          n: 1, svgKey: product.svgKey,
        })
      }
      return next
    })
    triggerBounce()
  }, [triggerBounce])

  const addFlashToCart = useCallback((flash: FlashItem) => {
    setCart(prev => {
      const next = new Map(prev)
      const exist = next.get(flash.id)
      if (exist) {
        next.set(flash.id, { ...exist, n: exist.n + 1 })
      } else {
        next.set(flash.id, {
          id: flash.id, name: flash.name, spec: '限时特惠',
          tone: 'tone-water', price: flash.now, priceOld: flash.old,
          n: 1, svgKey: 'bottle-water', isFlash: true, flashLabel: flash.name.split(' ')[0],
        })
      }
      return next
    })
    triggerBounce()
  }, [triggerBounce])

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => {
      const next = new Map(prev)
      const exist = next.get(id)
      if (!exist) return prev
      if (exist.n <= 1) {
        next.delete(id)
      } else {
        next.set(id, { ...exist, n: exist.n - 1 })
      }
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart(new Map())
  }, [])

  const claimCoupon = useCallback((id: string) => {
    setClaimedCoupons(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const handleAddClick = useCallback((product: Product) => {
    addToCart(product)
  }, [addToCart])

  const handleQtyMinus = useCallback((id: string) => {
    removeFromCart(id)
  }, [removeFromCart])

  const handleQtyPlus = useCallback((product: Product) => {
    addToCart(product)
  }, [addToCart])

  const handleQtyClick = useCallback(() => {
    openDrawer()
  }, [openDrawer])

  // ── Tone → cover bg var mapping ──
  const coverBgVar: Record<string, string> = {
    'tone-water':  'var(--cover-water)',
    'tone-snack':  'var(--cover-snack)',
    'tone-meal':   'var(--cover-meal)',
    'tone-daily':  'var(--cover-daily)',
    'tone-fruit':  'var(--cover-fruit)',
    'tone-frozen': 'var(--cover-frozen)',
  }

  const catBgVar: Record<string, string> = {
    'tone-water':  'var(--tone-water-bg)',
    'tone-snack':  'var(--tone-snack-bg)',
    'tone-meal':   'var(--tone-meal-bg)',
    'tone-fruit':  'var(--tone-fruit-bg)',
    'tone-daily':  'var(--tone-daily-bg)',
    'tone-frozen': 'var(--tone-frozen-bg)',
    'tone-coffee': 'var(--tone-coffee-bg)',
    'tone-all':    'var(--tone-all-bg)',
  }

  const catFgVar: Record<string, string> = {
    'tone-water':  'var(--tone-water-fg)',
    'tone-snack':  'var(--tone-snack-fg)',
    'tone-meal':   'var(--tone-meal-fg)',
    'tone-fruit':  'var(--tone-fruit-fg)',
    'tone-daily':  'var(--tone-daily-fg)',
    'tone-frozen': 'var(--tone-frozen-fg)',
    'tone-coffee': 'var(--tone-coffee-fg)',
    'tone-all':    'var(--tone-all-fg)',
  }

  // ── Render ──
  return (
    <div className="mall-home min-h-screen w-full" style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)', color: 'var(--fg)', fontSize: 'var(--fs-base)', lineHeight: 1.5 }}>
      <style dangerouslySetInnerHTML={{ __html: designTokensCss }} />

      <div className="w-full pb-24" style={{ background: 'var(--bg)', maxWidth: '100%', margin: '0 auto' }}>
        {/* ─── Store header ─── */}
        <section className="px-4 pt-2 pb-3.5 flex items-center justify-between gap-3" style={{ background: 'var(--bg)' }}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-semibold" style={{ fontSize: 'var(--fs-lg)' }}>
              <span className="flex-shrink-0" style={{ color: 'var(--accent)' }}><IconPin /></span>
              <span className="truncate">朝阳合生汇店</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>▾</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs whitespace-nowrap" style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
              <span className="w-1.5 h-1.5 rounded-full status-dot" style={{ background: 'var(--success)' }} />
              <span>营业中 · 24h</span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span>距您 320m</span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span>约 28 分钟达</span>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              className="relative w-11 h-11 grid place-items-center rounded-full"
              style={{ color: 'var(--fg-2)' }}
              aria-label="扫一扫"
            >
              <IconScan />
            </button>
            <button
              className="relative w-11 h-11 grid place-items-center rounded-full"
              style={{ color: 'var(--fg-2)' }}
              aria-label="消息"
            >
              <IconMessage />
              <span
                className="absolute min-w-4 h-4 px-1 rounded-full text-[10px] font-semibold grid place-items-center"
                style={{
                  transform: 'translate(8px, -8px)',
                  background: 'var(--accent)',
                  color: 'var(--accent-on)',
                  fontFamily: 'var(--font-mono)',
                  border: '1.5px solid var(--bg)',
                }}
              >3</span>
            </button>
            <button
              className="relative w-11 h-11 grid place-items-center rounded-full"
              style={{ color: 'var(--fg-2)' }}
              aria-label="切换门店"
            >
              <IconSwitch />
            </button>
          </div>
        </section>

        {/* ─── Search ─── */}
        <div
          className="mx-4 mb-1 h-10 px-3.5 pl-3.5 flex items-center gap-2 rounded-full"
          style={{ background: 'var(--search-bg)', color: 'var(--muted)', fontSize: 'var(--fs-base)' }}
        >
          <IconSearch />
          <span className="flex-1" style={{ color: 'var(--muted)' }}>搜索商品、品牌或分类</span>
          <button
            className="w-7 h-7 grid place-items-center rounded-full"
            style={{ color: 'var(--accent)' }}
            aria-label="语音搜索"
          >
            <IconVoice />
          </button>
        </div>

        {/* ─── Categories ─── */}
        <section className="px-4 pt-3 pb-2 grid grid-cols-4 gap-y-3 gap-x-1" style={{ background: 'var(--bg)' }}>
          {categoryList.map(cat => (
            <button
              key={cat.id}
              className="flex flex-col items-center gap-1.5 py-1 active:scale-96"
            >
              <span
                className="w-11 h-11 rounded-[14px] grid place-items-center flex-shrink-0"
                style={{ background: catBgVar[cat.tone], color: catFgVar[cat.tone] }}
              >
                {getCategoryIcon(cat.id)}
              </span>
              <span className="text-center leading-tight" style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg)' }}>{cat.label}</span>
            </button>
          ))}
        </section>

        {/* ─── Promo banner ─── */}
        <section className="mt-3 mx-4">
          <div className="promo-banner relative rounded-[14px] p-4.5 px-5 text-white grid grid-cols-[1fr_auto] gap-3 items-center min-h-[116px] overflow-hidden">
            <div className="relative z-10">
              <p className="opacity-90 mb-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>限时 · 今日</p>
              <h2 className="font-bold tracking-tight leading-tight mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>冰柜清仓 买二送一</h2>
              <p className="text-sm opacity-92 mb-3">指定饮料 / 冰品 · 整单立享</p>
              <button
                className="inline-flex items-center gap-1 font-semibold px-3.5 py-[7px] rounded-full active:scale-96"
                style={{ background: 'var(--surface)', color: 'var(--accent)', fontSize: 'var(--fs-sm)' }}
                onClick={openDrawer}
              >立即抢购 →</button>
            </div>
            <div className="relative z-10 w-22 h-22 grid place-items-center flex-shrink-0" style={{ width: 88, height: 88 }} aria-hidden="true">
              <IceCreamSvg />
            </div>
          </div>
          <div className="flex justify-center gap-1 mt-2.5" aria-hidden="true">
            <span className="w-3.5 h-1.25 rounded-full" style={{ background: 'var(--accent)' }} />
            <span className="w-1.25 h-1.25 rounded-full" style={{ background: 'var(--border)' }} />
            <span className="w-1.25 h-1.25 rounded-full" style={{ background: 'var(--border)' }} />
            <span className="w-1.25 h-1.25 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
        </section>

        {/* ─── Coupons ─── */}
        <section className="mt-3.5 pt-3.5 pb-1">
          <div className="flex gap-2.5 px-4 pb-3.5 overflow-x-auto scroll-smooth" style={{ scrollbarWidth: 'none' }}>
            {coupons.map(coupon => {
              const claimed = claimedCoupons.has(coupon.id)
              return (
                <div
                  key={coupon.id}
                  className="coupon-card flex-0-0-[156px] bg-white border rounded-[10px] p-3 px-3.5 flex flex-col justify-between gap-2 min-h-[88px] relative"
                  style={{ flex: '0 0 156px', borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <div>
                    <div className="font-bold tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--accent)' }}>
                      <span className="text-sm mr-0.5" style={{ fontSize: 14 }}>¥</span>{coupon.amount}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                      {coupon.desc}
                    </div>
                  </div>
                  <button
                    className="self-start text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                    style={{
                      borderColor: claimed ? 'var(--border)' : 'var(--accent)',
                      color: claimed ? 'var(--muted)' : 'var(--accent)',
                      background: 'transparent',
                      cursor: claimed ? 'default' : 'pointer',
                    }}
                    onClick={() => claimCoupon(coupon.id)}
                    disabled={claimed}
                  >
                    {claimed ? '已领取' : '领取'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* ─── Scenarios ─── */}
        <section className="mt-4.5 px-4">
          <div
            className="rounded-[14px] p-1 grid grid-cols-2 elev-card"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {scenarioList.map((sce, i) => (
              <button
                key={sce.id}
                className="p-3.5 flex gap-3 items-center rounded-[10px] min-h-[76px]"
                style={{
                  borderTop: i >= 2 ? '1px solid var(--border-soft)' : 'none',
                  borderRight: i % 2 === 0 ? '1px solid var(--border-soft)' : 'none',
                }}
              >
                <span className={`sce-${sce.tone} w-10 h-10 rounded-[12px] grid place-items-center flex-shrink-0`} style={{ color: 'var(--surface)' }}>
                  {getScenarioIcon(sce.id)}
                </span>
                <span className="min-w-0 text-left">
                  <h4 className="font-semibold mb-0.5" style={{ fontSize: 'var(--fs-md)' }}>{sce.title}</h4>
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{sce.desc}</p>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ─── Flash sale ─── */}
        <section className="px-4 pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)', width: 22, height: 22 }}>
                <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
              </svg>
              <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)' }}>限时秒杀</h2>
            </div>
            <div className="inline-flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--fg-2)' }}>
              <span className="mr-1" style={{ color: 'var(--muted)' }}>距结束</span>
              <span className="font-semibold px-1.25 py-0.5 rounded-sm text-center" style={{ background: 'var(--countdown-bg)', color: 'var(--surface)', minWidth: 22 }}>02</span>
              <span style={{ color: 'var(--muted)' }}>:</span>
              <span className="font-semibold px-1.25 py-0.5 rounded-sm text-center" style={{ background: 'var(--countdown-bg)', color: 'var(--surface)', minWidth: 22 }}>14</span>
              <span style={{ color: 'var(--muted)' }}>:</span>
              <span className="font-semibold px-1.25 py-0.5 rounded-sm text-center" style={{ background: 'var(--countdown-bg)', color: 'var(--surface)', minWidth: 22 }}>36</span>
            </div>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {flashItems.map(f => {
              const cartQty = cart.get(f.id)?.n ?? 0
              return (
                <article
                  key={f.id}
                  className="flex-0-0-[138px] rounded-[10px] overflow-hidden flex flex-col"
                  style={{ flex: '0 0 138px', background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="relative aspect-square grid place-items-center" style={{ background: 'var(--accent-tint)' }}>
                    <span
                      className="absolute top-1.5 left-1.5 font-bold px-1.25 py-0.5 rounded-sm"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'var(--accent)', color: 'var(--accent-on)' }}
                    >直降</span>
                    <div className="w-[60%] h-[60%]">
                      <FlashBottleSvg label={f.name.split(' ')[0]} />
                    </div>
                  </div>
                  <div className="p-2 pb-2.5 flex flex-col gap-1">
                    <div
                      className="font-medium leading-tight line-clamp-2"
                      style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg)', minHeight: 32 }}
                    >
                      {f.name}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--accent)' }}>
                        <span style={{ fontSize: 11, marginRight: 1 }}>¥</span>{f.now.toFixed(1)}
                      </span>
                      <span className="text-[11px] line-through" style={{ color: 'var(--muted)' }}>¥{f.old.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="flex-1 h-1.25 rounded-full overflow-hidden" style={{ background: 'var(--progress-track)' }}>
                        <i className="block h-full progress-bar rounded-full" style={{ width: `${f.pct}%` }} />
                      </span>
                      <span className="text-[10px] flex-shrink-0" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>剩 {f.pct}%</span>
                    </div>
                    <button
                      className="relative mt-1.5 h-6.5 flash-buy-btn text-white text-[11px] font-semibold rounded-[13px] grid place-items-center tracking-wide active:scale-[0.97]"
                      style={{ height: 26, color: 'var(--accent-on)', fontSize: 'var(--fs-xs)', letterSpacing: '0.02em' }}
                      onClick={() => addFlashToCart(f)}
                    >
                      {cartQty > 0 ? `已抢 ${cartQty} 件` : '立即抢购'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* ─── Product recommendation ─── */}
        <section className="px-4 pt-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-xl)' }}>猜你喜欢</h2>
            <a href="#" className="inline-flex items-center gap-0.5" style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>
              查看全部 →
            </a>
          </div>
          <div className="flex gap-[18px] overflow-x-auto pb-3 mb-3" style={{ scrollbarWidth: 'none', borderBottom: '1px solid var(--border)' }}>
            {tabList.map((tab, i) => (
              <button
                key={tab}
                className="flex-shrink-0 py-2 relative"
                style={{
                  fontSize: 'var(--fs-md)',
                  color: activeTab === i ? 'var(--accent)' : 'var(--muted)',
                  fontWeight: activeTab === i ? 600 : 400,
                }}
                onClick={() => setActiveTab(i)}
              >
                {tab}
                {activeTab === i && (
                  <span
                    className="absolute left-1/2 -translate-x-1/2 -bottom-px w-[18px] h-0.5 rounded-sm"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {products.map(product => {
              const qty = cart.get(product.id)?.n ?? 0
              return (
                <article
                  key={product.id}
                  className="rounded-[14px] overflow-hidden flex flex-col"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="relative aspect-square grid place-items-center overflow-hidden"
                    style={{ background: coverBgVar[product.tone] ?? 'var(--accent-tint)' }}
                  >
                    {product.tag && (
                      <span
                        className={`absolute top-2 left-2 font-semibold px-1.5 py-0.5 rounded" ${product.tag === '新品' ? '' : product.tag === '直降' ? 'tag-gold' : ''}`}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          letterSpacing: '0.04em',
                          background: product.tag === '新品'
                            ? 'rgba(31,32,36,0.55)'
                            : product.tag === '直降'
                              ? undefined
                              : 'var(--accent)',
                          color: 'var(--accent-on)',
                          borderRadius: 4,
                          padding: '2px 6px',
                        }}
                      >
                        {product.tag}
                      </span>
                    )}
                    <div className="w-[64%] h-[64%]">
                      <ProductCoverSvg svgKey={product.svgKey} name={product.name} />
                    </div>
                  </div>
                  <div className="p-2.5 pb-3 flex flex-col gap-1.5 flex-1">
                    <div
                      className="font-medium leading-tight line-clamp-2"
                      style={{ fontSize: 'var(--fs-base)', color: 'var(--fg)', minHeight: 36 }}
                    >
                      {product.name}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--muted)' }}>{product.spec}</div>
                    <div className="mt-auto flex items-end justify-between gap-1.5">
                      <div className="flex flex-col gap-0.25">
                        <div className="font-bold tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--accent)' }}>
                          <span className="font-semibold" style={{ fontSize: 12, marginRight: 1 }}>¥</span>{product.price.toFixed(1)}
                        </div>
                        <div className="text-[11px] line-through" style={{ color: 'var(--muted)' }}>¥{product.priceOld.toFixed(1)}</div>
                      </div>
                      {qty === 0 ? (
                        <button
                          className="relative w-6.5 h-6.5 rounded-full grid place-items-center flex-shrink-0 active:scale-90"
                          style={{ width: 26, height: 26, background: 'var(--accent)', color: 'var(--accent-on)' }}
                          onClick={() => handleAddClick(product)}
                          aria-label="加入购物车"
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          className="inline-flex items-center gap-1 h-6.5 px-1 rounded-full active:scale-95"
                          style={{ height: 26, background: 'var(--accent)', color: 'var(--accent-on)', borderRadius: 13 }}
                          onClick={handleQtyClick}
                          aria-label="调整数量"
                        >
                          <span
                            className="w-5 h-5 rounded-full grid place-items-center"
                            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                            onClick={e => { e.stopPropagation(); handleQtyMinus(product.id) }}
                          >
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2">
                              <path d="M5 12h14" />
                            </svg>
                          </span>
                          <span className="font-bold text-center" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-base)', minWidth: 16 }}>{qty}</span>
                          <span
                            className="w-5 h-5 rounded-full grid place-items-center"
                            style={{ background: 'var(--surface)', color: 'var(--accent)' }}
                            onClick={e => { e.stopPropagation(); handleQtyPlus(product) }}
                          >
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* ─── Footer note ─── */}
        <section className="px-4 pt-5 pb-2 text-center">
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', padding: '12px 0 4px' }}>
            已展示部分商品 · 向下滚动查看更多
          </p>
        </section>
      </div>

      {/* ─── Floating cart ─── */}
      <button
        key={cartBounceKey}
        className={`float-cart-bg fixed right-4 bottom-[86px] h-12 px-4 pl-3.5 rounded-[24px] inline-flex items-center gap-2.5 elev-float z-30 bounce-anim`}
        style={{ color: 'var(--surface)' }}
        onClick={openDrawer}
        aria-label="打开购物车"
      >
        <span className="relative w-7.5 h-7.5 rounded-full grid place-items-center flex-shrink-0" style={{ width: 30, height: 30, background: 'var(--accent)' }}>
          <IconCart />
          {totals.count > 0 && (
            <span
              className="absolute -top-0.75 -right-1 min-w-[18px] h-[18px] px-1.25 rounded-[9px] font-bold text-[11px] grid place-items-center"
              style={{
                top: -3, right: -4,
                background: 'var(--cart-badge-bg)',
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
                border: '2px solid var(--cart-bg-a)',
              }}
            >
              {totals.count}
            </span>
          )}
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[9px] opacity-65 uppercase" style={{ letterSpacing: '0.05em' }}>共 {totals.count} 件</span>
          <span className="font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>¥ {totals.total.toFixed(2)}</span>
        </span>
      </button>

      {/* ─── Cart drawer mask ─── */}
      <div
        className={`drawer-mask fixed inset-0 z-50 ${drawerOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        style={{ background: 'var(--mask)', backdropFilter: 'blur(2px)' }}
        onClick={closeDrawer}
      />

      {/* ─── Cart drawer ─── */}
      <aside
        className={`drawer-panel fixed left-0 right-0 bottom-0 rounded-t-[20px] elev-sheet z-[60] max-h-[78%] flex flex-col ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ background: 'var(--surface)' }}
        aria-label="购物车"
      >
        <span className="w-9 h-1 mx-auto my-2 rounded-sm" style={{ background: 'var(--border)' }} aria-hidden="true" />
        <div className="px-[18px] pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-soft)' }}>
          <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)' }}>
            购物车 · {totals.count} 件
          </h3>
          <button
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}
            onClick={clearCart}
            aria-label="清空购物车"
          >
            <IconTrash />
            清空
          </button>
        </div>

        <div className="py-1 pb-2 overflow-y-auto flex-1">
          {totals.count === 0 ? (
            <div className="py-9 px-[18px] pb-6 text-center" style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
              <span className="block font-medium mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', color: 'var(--fg-2)' }}>
                购物车空空如也
              </span>
              挑几件喜欢的商品加入吧
            </div>
          ) : (
            Array.from(cart.values()).map(item => (
              <div
                key={item.id}
                className="grid grid-cols-[56px_1fr_auto] gap-3 px-[18px] py-3 items-center"
                style={{ borderTop: '1px solid var(--border-soft)' }}
              >
                <div
                  className="w-14 h-14 rounded-[10px] grid place-items-center"
                  style={{ background: coverBgVar[item.tone] ?? 'var(--accent-tint)' }}
                >
                  <div className="w-[60%] h-[60%]">
                    {item.isFlash ? (
                      <FlashBottleSvg label={item.flashLabel ?? ''} />
                    ) : (
                      <ProductCoverSvg svgKey={item.svgKey} name={item.name} />
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <div
                    className="font-medium leading-tight truncate"
                    style={{ fontSize: 'var(--fs-base)' }}
                  >
                    {item.name}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>{item.spec}</div>
                  <div className="font-bold mt-1" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-md)', color: 'var(--accent)' }}>
                    <span style={{ fontSize: 11, marginRight: 1 }}>¥</span>{item.price.toFixed(1)}
                  </div>
                </div>
                <div className="inline-flex items-center border rounded-full p-0.5" style={{ borderColor: 'var(--border)' }}>
                  <button
                    className="w-5.5 h-5.5 rounded-full grid place-items-center"
                    style={{ width: 22, height: 22, background: 'var(--accent-tint)', color: 'var(--accent)' }}
                    onClick={() => removeFromCart(item.id)}
                    aria-label="减少"
                  >
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="font-semibold text-center" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', minWidth: 18 }}>{item.n}</span>
                  <button
                    className="w-5.5 h-5.5 rounded-full grid place-items-center"
                    style={{ width: 22, height: 22, background: 'var(--accent)', color: 'var(--accent-on)' }}
                    onClick={() => {
                      // Add via product lookup or flash item
                      const prod = products.find(p => p.id === item.id)
                      if (prod) addToCart(prod)
                      else {
                        const flash = flashItems.find(f => f.id === item.id)
                        if (flash) addFlashToCart(flash)
                      }
                    }}
                    aria-label="增加"
                  >
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div
          className="px-[18px] pb-6 pt-3"
          style={{
            borderTop: '1px solid var(--border-soft)',
            background: 'linear-gradient(180deg, transparent, var(--accent-soft))',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
              合计 · 已优惠 <strong style={{ color: 'var(--accent)', fontWeight: 600 }}>¥{totals.saved.toFixed(0)}</strong>
            </span>
            <span className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-2xl)', color: 'var(--accent)' }}>
              <span style={{ fontSize: 14, marginRight: 2 }}>¥</span>{totals.total.toFixed(2)}
            </span>
          </div>
          <button
            className="h-12 w-full rounded-full font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.985] disabled:cursor-not-allowed disabled:scale-100"
            style={{
              background: totals.count === 0 ? 'color-mix(in oklab, var(--accent) 55%, var(--border))' : 'var(--accent)',
              color: 'var(--accent-on)',
              fontSize: 'var(--fs-md)',
              letterSpacing: '0.02em',
            }}
            disabled={totals.count === 0}
          >
            去结算
          </button>
        </div>
      </aside>
    </div>
  )
}
