export default function Button({ children, className = '', variant = 'primary', ...props }) {
  const styles = {
    primary: 'bg-brand-gold text-white',
    accent: 'bg-brand-orange text-white',
  }

  return (
    <button
      className={`rounded-button px-5 py-3 font-medium shadow-card active:scale-95 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
