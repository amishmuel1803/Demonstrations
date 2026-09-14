import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import Section, { DemoLayout } from '../components/ui/Section'
import LazyCanvas from '../components/LazyCanvas'
import Slider from '../components/ui/Slider'
import Toggle from '../components/ui/Toggle'
import Btn from '../components/ui/Btn'
import { useQuality } from '../hooks/useQuality'
import { particles as cfg } from '../config'

const modes = {
  snow: { label: 'שלג', color: '#e0f2fe', size: 3 },
  sparks: { label: 'ניצוצות', color: '#fbbf24', size: 4 },
  smoke: { label: 'עשן', color: '#a1a1aa', size: 14 },
}

// שיידר (תוכנית קטנה שרצה על הכרטיס הגרפי) לציור כל חלקיק כעיגול רך שגודלו ושקיפותו תלויים ב"חיים" שלו
const vert = `
  attribute float aLife; attribute float aSize;
  varying float vLife;
  void main(){
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (30.0 / -mv.z); // קטן יותר ככל שרחוק מהמצלמה
    gl_Position = projectionMatrix * mv;
  }`
const frag = `
  uniform vec3 uColor; uniform float uFadeOut;
  varying float vLife;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.1, d);
    float fade = uFadeOut > 0.5 ? (1.0 - vLife) : 1.0;
    gl_FragColor = vec4(uColor, a * fade);
  }`

/** מערכת חלקיקים: כל החלקיקים במערך אחד, פקודת ציור אחת. הסימולציה על המעבד. */
function Particles({ count, mode, paused }) {
  const geo = useRef(null)
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3), vel = new Float32Array(count * 3)
    const life = new Float32Array(count), size = new Float32Array(count)
    const reset = (i, initial = false) => {
      const k = i * 3
      if (mode === 'snow') {
        pos[k] = (Math.random() - 0.5) * 12; pos[k + 1] = initial ? Math.random() * 8 : 8; pos[k + 2] = (Math.random() - 0.5) * 12
        vel[k] = (Math.random() - 0.5) * 0.3; vel[k + 1] = -(0.6 + Math.random() * 0.8); vel[k + 2] = (Math.random() - 0.5) * 0.3
        size[i] = 1.2 + Math.random() * 2
      } else if (mode === 'sparks') {
        pos[k] = 0; pos[k + 1] = 0.2; pos[k + 2] = 0
        const a = Math.random() * Math.PI * 2, r = Math.random() * 2.5
        vel[k] = Math.cos(a) * r; vel[k + 1] = 4 + Math.random() * 5; vel[k + 2] = Math.sin(a) * r
        size[i] = 2 + Math.random() * 4
      } else {
        pos[k] = (Math.random() - 0.5) * 0.6; pos[k + 1] = 0; pos[k + 2] = (Math.random() - 0.5) * 0.6
        vel[k] = (Math.random() - 0.5) * 0.4; vel[k + 1] = 0.8 + Math.random() * 0.8; vel[k + 2] = (Math.random() - 0.5) * 0.4
        size[i] = 8 + Math.random() * 14
      }
      life[i] = initial ? Math.random() : 0
    }
    for (let i = 0; i < count; i++) reset(i, true)
    return { pos, vel, life, size, reset }
  }, [count, mode])

  useFrame((_, dt) => {
    if (paused) return
    const { pos, vel, life, reset } = data
    const step = Math.min(dt, 1 / 30)
    const lifeSpeed = mode === 'snow' ? 0.08 : mode === 'sparks' ? 0.6 : 0.3
    for (let i = 0; i < count; i++) {
      const k = i * 3
      if (mode === 'sparks') vel[k + 1] -= 9.8 * step
      if (mode === 'smoke') { vel[k] += (Math.random() - 0.5) * 0.05; vel[k + 2] += (Math.random() - 0.5) * 0.05; vel[k + 1] += 0.15 * step }
      pos[k] += vel[k] * step; pos[k + 1] += vel[k + 1] * step; pos[k + 2] += vel[k + 2] * step
      life[i] += lifeSpeed * step
      if (life[i] >= 1 || pos[k + 1] < -0.2) reset(i)
    }
    const g = geo.current
    g.attributes.position.needsUpdate = true
    g.attributes.aLife.needsUpdate = true
  })

  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(modes[mode].color) }, uFadeOut: { value: mode === 'snow' ? 0 : 1 } }), [mode])

  return (
    <points key={`${count}-${mode}`}>
      <bufferGeometry ref={geo}>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-aLife" args={[data.life, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[data.size, 1]} />
      </bufferGeometry>
      <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent depthWrite={false} blending={mode === 'smoke' ? THREE.NormalBlending : THREE.AdditiveBlending} />
    </points>
  )
}

/** אובייקט זוהר: צבע "פולט" (emissive) חזק מ-1 + toneMapped=false → ה-Bloom תופס אותו ומורח אור סביבו. */
function GlowOrb({ intensity, paused }) {
  const ref = useRef(null)
  useFrame((state) => { if (!paused && ref.current) ref.current.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2 })
  return (
    <mesh ref={ref} position={[0, 1.6, 0]}>
      <icosahedronGeometry args={[0.45, 2]} />
      <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={intensity} toneMapped={false} />
    </mesh>
  )
}

function useFps() {
  const [fps, setFps] = useState(0)
  useEffect(() => {
    let frames = 0, last = performance.now(), raf
    const loop = (t) => { frames++; if (t - last > 500) { setFps(Math.round((frames * 1000) / (t - last))); frames = 0; last = t } raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return fps
}

export default function ParticlesSection() {
  const { tier, reducedMotion } = useQuality()
  const [count, setCount] = useState(tier.particles)
  const [mode, setMode] = useState(cfg.mode)
  const [bloom, setBloom] = useState(tier.postprocessing)
  const [bloomI, setBloomI] = useState(cfg.bloomIntensity)
  const [glow, setGlow] = useState(3)
  const fps = useFps()

  return (
    <Section
      id="particles"
      number={8}
      title="חלקיקים ואפקטים"
      what="אלפי חלקיקים (שלג / ניצוצות / עשן) בפקודת ציור אחת, ואובייקט זוהר עם Bloom — אפקט שמורח אור סביב דברים בהירים."
      enables="אווירה: שלג, אש, אבק, קסם. Bloom הוא ההבדל בין 'עיגול תכלת' ל'מנורת ניאון'."
      cost="החלקיקים עצמם זולים לציור (נקודה אחת = לא משולשים), אבל הסימולציה רצה על המעבד — כל חלקיק מחושב כל פריים. Bloom מצייר את המסך כמה פעמים בגדלים שונים — עולה בערך פריים שלם נוסף, ובטלפון זה מורגש."
      costLabel="כבד"
    >
      <DemoLayout
        demoClass="h-[400px] md:h-[480px]"
        demo={
          <LazyCanvas className="h-full" camera={{ position: [0, 3, 9], fov: 45 }} gl={{ antialias: false, powerPreference: 'high-performance' }}>
            <color attach="background" args={['#050508']} />
            <ambientLight intensity={0.3} />
            <pointLight position={[0, 1.6, 0]} intensity={8} color="#22d3ee" distance={8} />
            <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 0]}>
              <circleGeometry args={[6, 48]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
            <GlowOrb intensity={glow} paused={reducedMotion} />
            <Particles count={count} mode={mode} paused={reducedMotion} />
            {bloom && (
              <EffectComposer>
                <Bloom intensity={bloomI} luminanceThreshold={cfg.bloomThreshold} luminanceSmoothing={0.3} mipmapBlur />
              </EffectComposer>
            )}
            <OrbitControls enablePan={false} minDistance={4} maxDistance={18} target={[0, 1.2, 0]} />
          </LazyCanvas>
        }
        controls={
          <>
            <div className="flex items-center justify-between rounded-lg bg-zinc-800/60 px-3 py-2">
              <span className="text-sm">FPS במקטע הזה</span>
              <span dir="ltr" className={`font-mono text-xl font-bold ${fps >= 50 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>{fps}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(modes).map(([k, m]) => <Btn key={k} active={mode === k} onClick={() => setMode(k)}>{m.label}</Btn>)}
            </div>
            <Slider label="כמות חלקיקים" hint="העלו ותראו מתי ה-FPS מתחיל לרדת. בטלפון ברירת המחדל נמוכה יותר (config.js › quality.mobile)." value={count} min={500} max={tier.particlesMax} step={500} format={(v) => v.toLocaleString()} onChange={setCount} />
            <Toggle label="זוהר (Bloom)" hint="כבו והשוו: בלי Bloom האובייקט הזוהר הוא סתם עיגול בהיר." checked={bloom} onChange={setBloom} />
            <Slider label="עוצמת Bloom" value={bloomI} min={0} max={4} onChange={setBloomI} />
            <Slider label="בהירות האובייקט (emissive)" hint="מעל 1 = 'בהיר יותר מלבן'. רק פיקסלים כאלה מקבלים זוהר (סף ב-config.js)." value={glow} min={0} max={8} onChange={setGlow} />
          </>
        }
      />
    </Section>
  )
}
