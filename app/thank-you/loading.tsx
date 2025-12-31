export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50/20">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-foreground/60">Processing your booking...</p>
      </div>
    </div>
  )
}
