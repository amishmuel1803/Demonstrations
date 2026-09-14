import { useEffect, useRef, useState } from 'react'
import { perfStore } from '../perf/perfStore'
import { useQuality } from '../hooks/useQuality'

/**
 * מד ביצועים קבוע בפינה: FPS (פריימים לשנייה), משולשים, פקודות ציור, כמה canvas-ים פעילים.
 * FPS נמדד ע"י ספירת requestAnimationFrame במשך חצי שנייה.
 */
export default function PerfMeter() {
  const [fps, setFps] = useState(0)
  const [totals, setTotals] = useState({ triangles: 0, drawCalls: 0, canvases: 0 })
  const { tierName, reducedMotion } = useQuality()
  const frames = useRef(0)
  const last = useRef(performance.now())

  useEffect(() => {
    let raf
    const loop = (now) => {
      frames.current++
      if (now - last.current >= 500) {
        setFps(Math.round((frames.current * 1000) / (now - last.current)))
        setTotals(perfStore.totals())
        frames.current = 0
        last.current = now
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const color = fps >= 50 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'
  return (
    <div dir="ltr" className="fixed bottom-3 left-3 z-50 rounded-lg bg-zinc-900/90 backdrop-blur border border-zinc-700 px-3 py-2 font-mono text-[11px] leading-tight shadow-lg select-none">
      <div className={`text-lg font-bold ${color}`}>{fps} <span className="text-[10px] text-zinc-400 font-normal">FPS</span></div>
      <div className="text-zinc-300">{totals.triangles.toLocaleString()} tris</div>
      <div className="text-zinc-400">{totals.drawCalls} draws · {totals.canvases} canvas</div>
      <div className="text-zinc-500">{tierName}{reducedMotion ? ' · reduced-motion' : ''}</div>
    </div>
  )
}
