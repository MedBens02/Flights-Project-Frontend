"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

interface FluidLoaderProps {
  message?: string
}

export default function FluidLoader({ message = "Loading..." }: FluidLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let animationId: number
    let time = 0

    const animate = () => {
      time += 0.008

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "#0f172a")
      gradient.addColorStop(0.5, "#1e3a8a")
      gradient.addColorStop(1, "#164e63")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Redraw gradient
      const newGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      newGradient.addColorStop(0, "#0f172a")
      newGradient.addColorStop(0.5, "#1e3a8a")
      newGradient.addColorStop(1, "#164e63")
      ctx.fillStyle = newGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      const rings = [
        { radius: 100, speed: 0.4, opacity: 0.25 },
        { radius: 150, speed: 0.25, opacity: 0.15 },
        { radius: 200, speed: 0.15, opacity: 0.1 },
      ]

      rings.forEach((ring) => {
        ctx.strokeStyle = `rgba(100, 200, 255, ${ring.opacity})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2 * ((time * ring.speed) % 1))
        ctx.stroke()
      })

      const blobCount = 3
      for (let i = 0; i < blobCount; i++) {
        const x = centerX + Math.sin(time * 0.3 + i * 2) * 100
        const y = centerY + Math.cos(time * 0.25 + i * 2) * 100
        const radius = 50 + Math.sin(time * 0.4 + i) * 15

        const blobGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        blobGradient.addColorStop(0, `rgba(100, 200, 255, ${0.15 + Math.sin(time + i) * 0.08})`)
        blobGradient.addColorStop(1, `rgba(100, 200, 255, 0)`)
        ctx.fillStyle = blobGradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Center glow
      ctx.fillStyle = `rgba(100, 200, 255, ${0.2 + Math.sin(time) * 0.1})`
      ctx.beginPath()
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2)
      ctx.fill()

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-b from-slate-900 via-blue-900 to-cyan-900">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="relative z-10 text-center space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl" />
            <Image
              src="/logo.png"
              alt="SKYSCAN"
              width={160}
              height={100}
              className="relative drop-shadow-2xl"
            />
          </div>
        </div>
        <p className="text-white/70 text-lg font-light tracking-wide">{message}</p>
      </div>
    </div>
  )
}
