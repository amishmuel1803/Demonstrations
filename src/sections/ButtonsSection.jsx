import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import Section from '../components/ui/Section'
import Card from '../components/ui/EffectCard'
import LazyCanvas from '../components/LazyCanvas'
import { useQuality } from '../hooks/useQuality'
import { buttons as cfg } from '../config'
import './buttons.css'

gsap.registerPlugin(useGSAP)

const base = 'rounded-xl px-6 py-3 font-bold text-base select-none focus:outline-none focus-visible:ring-2 ring-cyan-400'

/* 1. מגנטי — GSAP. הכפתור זז לכיוון העכבר כשהוא בטווח, וחוזר בקפיצה אלסטית. */
function Magnetic({ reduced }) {
  const wrap = useRef(null)
  const btn = useRef(null)
  const onMove = (e) => {
    if (reduced) return
    const r = wrap.current.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const dist = Math.hypot(dx, dy)
    if (dist < cfg.magneticRadius) {
      gsap.to(btn.current, { x: dx * cfg.magneticStrength, y: dy * cfg.magneticStrength, duration: 0.3, ease: 'power2.out' })
    }
  }
  const onLeave = () => gsap.to(btn.current, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.35)' })
  return (
    <div ref={wrap} onPointerMove={onMove} onPointerLeave={onLeave} className="p-10">
      <button ref={btn} className={`${base} bg-fuchsia-500 text-white`}>משוך אותי</button>
    </div>
  )
}

/* 2. מילוי נוזלי — CSS בלבד (ראה buttons.css) */
function Liquid() {
  return <button className={`${base} btn-liquid border-2 border-cyan-400 text-cyan-300`}>העבר עכבר</button>
}

/* 3. גלים בלחיצה — JS מוסיף עיגול בנקודת הלחיצה, CSS מגדיל ומעלים */
function Ripple() {
  const btn = useRef(null)
  const onClick = (e) => {
    const r = btn.current.getBoundingClientRect()
    const s = document.createElement('span')
    s.className = 'ripple'
    const size = Math.max(r.width, r.height)
    Object.assign(s.style, { width: `${size}px`, height: `${size}px`, left: `${e.clientX - r.left}px`, top: `${e.clientY - r.top}px` })
    btn.current.appendChild(s)
    setTimeout(() => s.remove(), 700)
  }
  return <button ref={btn} onClick={onClick} className={`${base} btn-ripple bg-emerald-500 text-zinc-950`}>לחץ עליי</button>
}

/* 4. טקסט מתחלף אות-אות — GSAP. כל אות "מתערבלת" בתווים אקראיים ואז מתייצבת על המילה החדשה. */
const CHARS = 'אבגדהוזחטיכלמנסעפצקרשת'
function Scramble({ reduced }) {
  const [text, setText] = useState('שלום')
  const words = ['שלום', 'ברוכים הבאים', 'לחצו כאן', 'שלום']
  const idx = useRef(0)
  const tween = useRef(null)
  const scrambleTo = (target) => {
    tween.current?.kill()
    if (reduced) { setText(target); return }
    const obj = { p: 0 }
    tween.current = gsap.to(obj, {
      p: 1, duration: 0.7, ease: 'none',
      onUpdate: () => {
        const n = target.length
        let out = ''
        for (let i = 0; i < n; i++) {
          const reveal = obj.p * n * 1.25 - i * 0.25 // אותיות מימין נחשפות קודם
          out += reveal > 1 ? target[i] : target[i] === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)]
        }
        setText(out)
      },
      onComplete: () => setText(target),
    })
  }
  const next = () => { idx.current = (idx.current + 1) % words.length; scrambleTo(words[idx.current]) }
  return (
    <button onClick={next} onPointerEnter={next} className={`${base} bg-amber-400 text-zinc-950 min-w-40 font-mono`}>{text}</button>
  )
}

/* 5. כפתור תלת-מימדי — React Three Fiber. קופסה מעוגלת שמסתובבת; hover מאיץ, לחיצה = סיבוב מלא. */
function SpinningBox({ hover, spinRef, reduced }) {
  const mesh = useRef(null)
  useFrame((_, dt) => {
    if (!mesh.current) return
    const idle = reduced ? 0 : 0.4
    mesh.current.rotation.y += dt * (hover ? 2.5 : idle) + spinRef.current
    mesh.current.rotation.x = Math.sin(mesh.current.rotation.y * 0.5) * 0.25
    spinRef.current *= 0.9 // דעיכה של "דחיפת" הלחיצה
  })
  return (
    <RoundedBox ref={mesh} args={[2.6, 1.1, 0.5]} radius={0.18} smoothness={6}>
      <meshStandardMaterial color={hover ? '#22d3ee' : '#0e7490'} metalness={0.4} roughness={0.25} />
    </RoundedBox>
  )
}
function ThreeD({ reduced }) {
  const [hover, setHover] = useState(false)
  const spinRef = useRef(0)
  return (
    <div
      className="relative w-48 h-24 cursor-pointer"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onClick={() => { spinRef.current = 0.35 }}
    >
      <LazyCanvas className="absolute inset-0" camera={{ position: [0, 0, 4], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={2} />
        <SpinningBox hover={hover} spinRef={spinRef} reduced={reduced} />
      </LazyCanvas>
      <span className="absolute inset-0 flex items-center justify-center font-bold text-white pointer-events-none drop-shadow">סובב אותי</span>
    </div>
  )
}

/* 6. זכוכית — CSS בלבד. backdrop-filter מטשטש מה שמאחורי הכפתור. */
function Glass({ reduced }) {
  const blob = reduced ? 'blob' : 'blob motion-auto'
  return (
    <div className="glass-bg relative rounded-xl p-8 overflow-hidden">
      <span className={`${blob} w-16 h-16 bg-pink-400 top-2 left-4`} />
      <span className={`${blob} w-12 h-12 bg-cyan-300 bottom-3 right-6`} style={{ animationDelay: '-3s' }} />
      <button className={`${base} btn-glass text-white relative`}>זכוכית</button>
    </div>
  )
}

/* 7. ברק חולף — CSS בלבד. פס בהיר אלכסוני חוצה את הכפתור ב-hover. */
function Shine() {
  return <button className={`${base} btn-shine bg-gradient-to-l from-violet-600 to-indigo-500 text-white`}>ברק</button>
}

/* 8. לחיצה אלסטית — GSAP. בלחיצה הכפתור "נמעך", בשחרור קופץ חזרה. */
function Elastic({ reduced }) {
  const btn = useRef(null)
  const down = () => gsap.to(btn.current, { scaleX: 1.15, scaleY: 0.8, duration: reduced ? 0 : 0.12 })
  const up = () => gsap.to(btn.current, { scaleX: 1, scaleY: 1, duration: reduced ? 0 : 0.9, ease: 'elastic.out(1.2, 0.3)' })
  return (
    <button ref={btn} onPointerDown={down} onPointerUp={up} onPointerLeave={up} className={`${base} bg-rose-500 text-white`}>
      לחץ והחזק
    </button>
  )
}

export default function ButtonsSection() {
  const { reducedMotion } = useQuality()
  return (
    <Section
      id="buttons"
      number={1}
      title="כפתורים עם אנימציה"
      what="שמונה כפתורים, לכל אחד התנהגות אחרת. מתחת לכל כפתור — שם האפקט והכלי שעושה אותו."
      enables="להבין מה אפשר לעשות ב-CSS לבד (זול, בלי JavaScript), מתי צריך GSAP (תזמון, קפיציות, מגנטיות), ומתי באמת צריך תלת-מימד."
      cost="CSS ו-GSAP כמעט חינם. הכפתור התלת-מימדי פותח Canvas משלו — כמה מגה-בייט זיכרון גרפי, גם כשהוא קטן."
      costLabel="קל"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card name="מגנטי" tool="GSAP" note="נמשך לעכבר, חוזר בקפיצה"><Magnetic reduced={reducedMotion} /></Card>
        <Card name="מילוי נוזלי" tool="CSS בלבד" note="פסאודו-אלמנט עם מסיכת גל"><Liquid /></Card>
        <Card name="גלים בלחיצה" tool="JS + CSS" note="JS מציב עיגול, CSS מנפיש"><Ripple /></Card>
        <Card name="טקסט אות-אות" tool="GSAP" note="תווים אקראיים שמתייצבים"><Scramble reduced={reducedMotion} /></Card>
        <Card name="כפתור תלת-מימדי" tool="תלת-מימד (R3F)" note="Canvas קטן עם קופסה מעוגלת"><ThreeD reduced={reducedMotion} /></Card>
        <Card name="זכוכית" tool="CSS בלבד" note="backdrop-filter: blur"><Glass reduced={reducedMotion} /></Card>
        <Card name="ברק חולף" tool="CSS בלבד" note="גרדיאנט אלכסוני שנע ב-hover"><Shine /></Card>
        <Card name="לחיצה אלסטית" tool="GSAP" note="נמעך בלחיצה, קופץ בשחרור"><Elastic reduced={reducedMotion} /></Card>
      </div>
    </Section>
  )
}
