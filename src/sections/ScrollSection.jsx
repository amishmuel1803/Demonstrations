import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import LazyCanvas from '../components/LazyCanvas'
import ProceduralEnvironment from '../three/environments'
import { scroll as cfg } from '../config'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const colorA = new THREE.Color('#f43f5e'), colorB = new THREE.Color('#22d3ee')

/** האובייקט קורא כל פריים את "כמה גללנו" (0..1) ומעדכן סיבוב, מרחק מצלמה וחומר. */
function Subject({ progress }) {
  const mesh = useRef(null)
  const mat = useRef(null)
  useFrame((state) => {
    const p = progress.current
    if (!mesh.current) return
    mesh.current.rotation.y = p * Math.PI * 2 * cfg.turns
    mesh.current.rotation.x = Math.sin(p * Math.PI) * 0.6
    state.camera.position.z = THREE.MathUtils.lerp(8, 3.2, p)
    state.camera.lookAt(0, 0, 0)
    mat.current.color.copy(colorA).lerp(colorB, p)
    mat.current.metalness = p
    mat.current.roughness = THREE.MathUtils.lerp(0.8, 0.1, p)
  })
  return (
    <mesh ref={mesh}>
      <torusKnotGeometry args={[1, 0.35, 200, 32, 2, 3]} />
      <meshStandardMaterial ref={mat} color={colorA} roughness={0.8} />
    </mesh>
  )
}

const captions = [
  [0.0, 'גללו למטה', 'האובייקט מגיב לגלילה: מסתובב, מתקרב, ומשנה חומר.'],
  [0.35, 'מפלסטיק מט…', 'החספוס יורד והמתכתיות עולה ככל שגוללים.'],
  [0.7, '…למתכת מלוטשת', 'הכול מחושב מ-progress אחד (0 עד 1) שמגיע מ-GSAP ScrollTrigger.'],
]

export default function ScrollSection() {
  const wrap = useRef(null)
  const progress = useRef(0)
  const captionRefs = useRef([])

  useGSAP(() => {
    // ScrollTrigger עוקב אחרי המקטע הגבוה; scrub=true = מתקדם ונסוג עם הגלילה, לא מנגן לבד
    ScrollTrigger.create({
      trigger: wrap.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        progress.current = self.progress
        captionRefs.current.forEach((el, i) => {
          if (!el) return
          const [start] = captions[i]
          const next = captions[i + 1]?.[0] ?? 1.01
          el.style.opacity = self.progress >= start && self.progress < next ? 1 : 0
        })
      },
    })
  }, { scope: wrap })

  return (
    <section id="scroll" className="scroll-mt-16 border-t border-zinc-800">
      <div className="mx-auto max-w-6xl px-4 pt-12 md:pt-16">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-cyan-400 font-mono text-sm">09</span>
          <h2 className="text-2xl md:text-3xl font-extrabold">אנימציית גלילה</h2>
          <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">ביצועים: קל</span>
        </div>
        <p className="text-zinc-300 max-w-3xl leading-relaxed"><b className="text-zinc-100">מה רואים כאן:</b> המקטע הבא גבוה פי {cfg.sectionHeightVh / 100} מהמסך. הסצנה "נדבקת" (sticky) ואובייקט תלת-מימדי מגיב לגלילה: מסתובב {cfg.turns} סיבובים, המצלמה מתקרבת, והחומר הופך ממט למתכת.</p>
        <p className="text-zinc-300 max-w-3xl leading-relaxed"><b className="text-zinc-100">מה זה מאפשר:</b> דפי נחיתה שבהם המוצר "מספר סיפור" תוך כדי גלילה. GSAP ScrollTrigger נותן מספר אחד (0–1) — ואנחנו מחליטים מה לעשות איתו.</p>
        <p className="text-zinc-400 max-w-3xl leading-relaxed text-sm mb-6"><b className="text-zinc-300">מה זה עולה:</b> כמעט כלום — זה רק אובייקט אחד. הזהירות: אנימציה שקשורה לגלילה מרגישה "כבדה" אם ה-FPS יורד, כי היד מרגישה את העיכוב מיד.</p>
      </div>

      <div ref={wrap} style={{ height: `${cfg.sectionHeightVh}vh` }} className="relative">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)]">
          <LazyCanvas className="h-full" camera={{ position: [0, 0, 8], fov: 45 }}>
            <color attach="background" args={['#0a0a0c']} />
            <ProceduralEnvironment name="sunset" />
            <directionalLight position={[3, 5, 4]} intensity={1.5} />
            <Subject progress={progress} />
          </LazyCanvas>
          <div className="absolute inset-x-0 bottom-10 pointer-events-none">
            <div className="mx-auto max-w-6xl px-4 relative h-20">
              {captions.map(([, title, text], i) => (
                <div key={i} ref={(el) => (captionRefs.current[i] = el)} className="absolute inset-x-4 transition-opacity duration-300" style={{ opacity: i === 0 ? 1 : 0 }}>
                  <div className="text-2xl md:text-4xl font-extrabold">{title}</div>
                  <div className="text-zinc-300">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
