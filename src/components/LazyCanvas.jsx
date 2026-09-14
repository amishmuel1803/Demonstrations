import { useEffect, useId } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useInView } from '../hooks/useInView'
import { useQuality } from '../hooks/useQuality'
import { perfStore } from '../perf/perfStore'

/** רץ בתוך ה-Canvas: אחרי כל פריים מדווח למאגר כמה משולשים צוירו. */
function PerfReporter({ id }) {
  const gl = useThree((s) => s.gl)
  // רץ לפני הציור של הפריים הנוכחי, ולכן קורא את המספרים של הפריים הקודם — זה מספיק טוב למד.
  // (שימו לב: אסור לתת כאן עדיפות > 0 — זה מכבה את הציור האוטומטי של R3F)
  useFrame(() => {
    perfStore.report(id, gl.info.render.triangles, gl.info.render.calls)
  })
  useEffect(() => {
    perfStore.setActive(1)
    return () => { perfStore.remove(id); perfStore.setActive(-1) }
  }, [id])
  return null
}

/**
 * Canvas שעוצר את הרינדור כשהוא מחוץ למסך.
 * frameloop="never" = לא מציירים בכלל; "always" = מציירים כל פריים.
 * ככה 9 הדגמות בדף לא מתחרות זו בזו על המעבד הגרפי.
 */
export default function LazyCanvas({ children, className = '', style, alwaysOn = false, ...props }) {
  const [ref, inView] = useInView()
  const { tier } = useQuality()
  const id = useId()
  const active = inView || alwaysOn
  return (
    <div ref={ref} className={`${className.includes('absolute') ? '' : 'relative'} ${className}`} style={style}>
      <Canvas
        dpr={tier.dpr}
        frameloop={active ? 'always' : 'never'}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        {...props}
      >
        {active && <PerfReporter id={id} />}
        {children}
      </Canvas>
      {!active && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500 pointer-events-none">
          מושהה (מחוץ למסך)
        </div>
      )}
    </div>
  )
}
