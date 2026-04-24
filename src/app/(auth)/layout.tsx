export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-cyan-50/30 to-sky-50/50">
      {children}
    </div>
  )
}
