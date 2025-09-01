"use client"

import { useEffect, useRef } from "react"

interface AudioVisualizerProps {
  audioLevel: number
  isActive: boolean
  className?: string
}

export function AudioVisualizer({ audioLevel, isActive, className = "" }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      if (!isActive) {
        animationFrameRef.current = requestAnimationFrame(draw)
        return
      }

      // Draw audio visualization bars
      const barCount = 20
      const barWidth = width / barCount

      ctx.fillStyle = "#3b82f6"

      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.random() * audioLevel * height * 0.8 + height * 0.1
        const x = i * barWidth
        const y = height - barHeight

        ctx.fillRect(x, y, barWidth - 2, barHeight)
      }

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [audioLevel, isActive])

  return <canvas ref={canvasRef} width={300} height={60} className={`border rounded ${className}`} />
}
