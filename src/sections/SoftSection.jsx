import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Section, { DemoLayout } from '../components/ui/Section'
import LazyCanvas from '../components/LazyCanvas'
import Slider from '../components/ui/Slider'
import ProceduralEnvironment from '../three/environments'
import { useQuality } from '../hooks/useQuality'
import { soft as cfg } from '../config'

/**
 * דגל = בד רך אמיתי (סימולציית Verlet):
 * רשת של נקודות שכל אחת "זוכרת" איפה הייתה בפריים הקודם; בין שכנות יש "חוטים" באורך קבוע.
 * כל פריים: מזיזים כל נקודה לפי התנופה + כבידה + רוח, ואז מתקנים את אורכי החוטים כמה פעמים.
 * הטור השמאלי מוצמד לתורן. הכול על המעבד (CPU), ולכן הרזולוציה מוגבלת.
 */
function Flag({ cols, rows, wind, paused }) {
  const mesh = useRef(null)
  const sim = useMemo(() => {
    const w = 3, h = 2
    const n = cols * rows
    const pos = new Float32Array(n * 3), prev = new Float32Array(n * 3)
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 3
      pos[i] = (x / (cols - 1)) * w; pos[i + 1] = -(y / (rows - 1)) * h; pos[i + 2] = 0
      prev.set(pos.subarray(i, i + 3), i)
    }
    const cons = [] // [a, b, restLength]
    const dx = w / (cols - 1), dy = h / (rows - 1), dd = Math.hypot(dx, dy)
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x
      if (x < cols - 1) cons.push([i, i + 1, dx])
      if (y < rows - 1) cons.push([i, i + cols, dy])
      if (x < cols - 1 && y < rows - 1) { cons.push([i, i + cols + 1, dd]); cons.push([i + 1, i + cols, dd]) }
    }
    const geo = new THREE.PlaneGeometry(w, h, cols - 1, rows - 1)
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { pos, prev, cons, geo, n }
  }, [cols, rows])

  useFrame((state, dt) => {
    if (paused) return
    const { pos, prev, cons, geo } = sim
    const t = state.clock.elapsedTime
    const step = Math.min(dt, 1 / 30)
    const g = -9.8 * 0.15
    // 1) תנועה: Verlet — המהירות היא ההפרש מהמיקום הקודם
    for (let i = 0; i < sim.n; i++) {
      const k = i * 3
      const x = pos[k], y = pos[k + 1], z = pos[k + 2]
      const gust = Math.sin(t * 2.1 + y * 1.5) * 0.5 + Math.sin(t * 0.7 + x * 2) * 0.5
      const wx = wind * (1.5 + gust), wz = wind * Math.sin(t * 1.3 + x * 3) * 1.2
      const vx = (x - prev[k]) * 0.985, vy = (y - prev[k + 1]) * 0.985, vz = (z - prev[k + 2]) * 0.985
      prev[k] = x; prev[k + 1] = y; prev[k + 2] = z
      // הרוח חזקה פי כמה מהכבידה (המוקטנת) — אחרת הדגל פשוט תלוי
      pos[k] = x + vx + wx * step * step * 40
      pos[k + 1] = y + vy + g * step * step * 8
      pos[k + 2] = z + vz + wz * step * step * 40
    }
    // 2) אילוצים: מחזירים כל "חוט" לאורכו — כמה סיבובים כדי שהבד לא יימתח
    for (let iter = 0; iter < 4; iter++) {
      for (const [a, b, rest] of cons) {
        const ka = a * 3, kb = b * 3
        const ddx = pos[kb] - pos[ka], ddy = pos[kb + 1] - pos[ka + 1], ddz = pos[kb + 2] - pos[ka + 2]
        const d = Math.hypot(ddx, ddy, ddz) || 1e-6
        const diff = ((d - rest) / d) * 0.5
        pos[ka] += ddx * diff; pos[ka + 1] += ddy * diff; pos[ka + 2] += ddz * diff
        pos[kb] -= ddx * diff; pos[kb + 1] -= ddy * diff; pos[kb + 2] -= ddz * diff
      }
      // הצמדה לתורן: הטור הראשון לא זז
      for (let y = 0; y < rows; y++) { const k = y * cols * 3; pos[k] = 0; pos[k + 1] = -(y / (rows - 1)) * 2; pos[k + 2] = 0 }
    }
    geo.attributes.position.needsUpdate = true
    geo.computeVertexNormals()
  })

  return (
    <group position={[-3.2, 2.2, 0]}>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 4.4, 12]} />
        <meshStandardMaterial color="#71717a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh ref={mesh} geometry={sim.geo} castShadow>
        <meshStandardMaterial color="#38bdf8" side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
    </group>
  )
}

/**
 * מים = משטח שכל קודקוד בו עולה ויורד לפי סכום של כמה גלי סינוס.
 * לא סימולציה אמיתית של נוזל (זה כבד מאוד) — אבל נראה משכנע וזול.
 */
function Water({ segments, height, speed, paused }) {
  const mesh = useRef(null)
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(7, 5, segments, segments)
    g.rotateX(-Math.PI / 2)
    g.userData.base = g.attributes.position.array.slice()
    return g
  }, [segments])
  useFrame((state) => {
    if (paused) return
    const t = state.clock.elapsedTime * speed
    const p = geo.attributes.position.array, base = geo.userData.base
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i], z = base[i + 2]
      p[i + 1] = height * (Math.sin(x * 1.6 + t * 1.4) * 0.5 + Math.sin(z * 2.1 - t * 1.1) * 0.35 + Math.sin((x + z) * 0.9 + t * 0.8) * 0.4)
    }
    geo.attributes.position.needsUpdate = true
    geo.computeVertexNormals()
  })
  return (
    <mesh ref={mesh} geometry={geo} position={[1.6, 0, 0]} receiveShadow>
      <meshPhysicalMaterial color="#0e7490" roughness={0.12} metalness={0.05} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={1.4} />
    </mesh>
  )
}

export default function SoftSection() {
  const { tier, reducedMotion } = useQuality()
  const [wind, setWind] = useState(cfg.windStrength)
  const [cols, setCols] = useState(tier.clothCols)
  const [waveH, setWaveH] = useState(cfg.waveHeight)
  const [waveS, setWaveS] = useState(cfg.waveSpeed)
  const [segments, setSegments] = useState(tier.waterSegments)
  const rows = Math.round(cols * 0.66)

  return (
    <Section
      id="soft"
      number={7}
      title="גופים רכים ומים"
      what="דגל שמתנופף ברוח (סימולציית בד אמיתית — נקודות וחוטים) ומשטח מים עם גלים (טריק זול — סכום סינוסים)."
      enables="תנועה 'חיה' של בדים, דגלים, וילונות ומים בלי קבצי אנימציה. הרוח והגלים נמשכים לנצח ולא חוזרים על עצמם."
      cost="הבד רץ על המעבד: כל פריים מחשבים כל נקודה וכל חוט. 24×16 נקודות — קל. 60×40 — כבר מורגש. המים זולים יותר כי כל נקודה עצמאית."
      costLabel="בינוני"
    >
      <DemoLayout
        demoClass="h-[400px] md:h-[480px]"
        demo={
          <LazyCanvas className="h-full" camera={{ position: [0, 3.2, 9], fov: 42 }} shadows>
            <color attach="background" args={['#0b1020']} />
            <ProceduralEnvironment name="daylight" background blur={0.6} />
            <directionalLight position={[4, 8, 4]} intensity={1.8} castShadow />
            <Flag cols={cols} rows={rows} wind={wind} paused={reducedMotion} />
            <Water segments={segments} height={waveH} speed={waveS} paused={reducedMotion} />
            <OrbitControls enablePan={false} minDistance={4} maxDistance={16} target={[0, 1, 0]} maxPolarAngle={Math.PI / 2.05} />
          </LazyCanvas>
        }
        controls={
          <>
            <div className="text-sm font-bold text-sky-300">דגל (בד)</div>
            <Slider label="עוצמת רוח" hint="0 = הדגל נופל ותלוי. גבוה = מתנופף חזק." value={wind} min={0} max={2} onChange={setWind} />
            <Slider label="רזולוציית בד" hint={`נקודות לרוחב. עכשיו ${cols}×${rows} = ${cols * rows} נקודות. שימו לב ל-FPS כשמעלים.`} value={cols} min={8} max={60} step={1} onChange={setCols} />
            <div className="text-sm font-bold text-cyan-300 mt-2">מים</div>
            <Slider label="גובה גלים" value={waveH} min={0} max={0.6} onChange={setWaveH} />
            <Slider label="מהירות גלים" value={waveS} min={0} max={3} onChange={setWaveS} />
            <Slider label="רזולוציית מים" hint={`${segments}×${segments} = ${((segments + 1) ** 2).toLocaleString()} קודקודים.`} value={segments} min={16} max={200} step={8} onChange={setSegments} />
            {reducedMotion && <div className="text-[11px] text-amber-300">"פחות תנועה" פעיל — הסימולציות מושהות.</div>}
            <div className="rounded-lg bg-zinc-800/60 p-3 text-[12px] leading-relaxed text-zinc-300">
              <b className="text-zinc-100">הגבול:</b> סימולציית נוזל אמיתית (מים שנשפכים, מתיזים) דורשת מאות אלפי חלקיקים ורצה על הכרטיס הגרפי — לא בדפדפן רגיל, ובטח לא בטלפון. מה שרואים פה זה "פני מים", לא מים.
            </div>
          </>
        }
      />
    </Section>
  )
}
