export default function PageContainer({ children, className = '' }) {
  return (
    <main className={`min-h-screen bg-background px-4 pb-20 ${className}`}>
      {children}
    </main>
  )
}
