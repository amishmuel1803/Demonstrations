import { useEffect, useRef, useState } from 'react'
import { RoundedBox, MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import Section from '../components/ui/Section'
import Card from '../components/ui/EffectCard'
import LazyCanvas from '../components/LazyCanvas'
import ProceduralEnvironment from '../three/environments'
import { useQuality } from '../hooks/useQuality'
import './more-buttons.css'

const base = 'rounded-xl px-6 py-3 font-bold text-base select-none focus:outline-none focus-visible:ring-2 ring-cyan-400'

/* מסנן ה"גו" — מוגדר פעם אחת בדף ומשמש את כפתור המיזוג.
   feGaussianBlur מטשטש, feColorMatrix מחזיר ניגודיות חדה → שתי צורות שנוגעות נמסות לאחת. */
function GooFilter() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <filter id="mb-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
    </svg>
  )
}

/* רקע צבעוני מתחת לכפתורי הזכוכית — בלי משהו מאחור אין מה לטשטש. */
function GlassStage({ children, reduced }) {
  const orb = reduced ? 'mb-orb' : 'mb-orb moving'
  return (
    <div className="mb-bg relative rounded-xl p-7 overflow-hidden w-full flex items-center justify-center">
      <span className={`${orb} w-16 h-16 bg-pink-400 top-1 left-3`} />
      <span className={`${orb} w-12 h-12 bg-cyan-300 bottom-2 right-5`} style={{ animationDelay: '-3.5s' }} />
      <span className={`${orb} w-10 h-10 bg-amber-300 top-8 right-12`} style={{ animationDelay: '-1.5s' }} />
      <div className="relative">{children}</div>
    </div>
  )
}

/* ===================== קבוצה א׳: עוד נוזלי ===================== */

/* 1. גל נע */
const WaveFill = () => (
  <button className={`${base} mb-wave border-2 border-cyan-500 text-cyan-300 hover:text-zinc-950`}>גל נע</button>
)

/* 2. מילוי מהצד */
const SideFill = () => (
  <button className={`${base} mb-side border-2 border-purple-500 text-purple-300 hover:text-white`}>מילוי מהצד</button>
)

/* 3. בועות */
function Bubbles() {
  const bubbles = [
    { w: 8, right: '12%', delay: '0s' }, { w: 12, right: '30%', delay: '0.4s' },
    { w: 6, right: '52%', delay: '0.8s' }, { w: 10, right: '72%', delay: '0.2s' },
    { w: 7, right: '88%', delay: '1.1s' },
  ]
  return (
    <button className={`${base} mb-bubbles border-2 border-emerald-500 text-emerald-300 hover:text-white`}>
      בועות
      {bubbles.map((b, i) => (
        <span key={i} className="bub" style={{ width: b.w, height: b.w, right: b.right, animationDelay: b.delay }} />
      ))}
    </button>
  )
}

/* 4. מילוי מנקודת הלחיצה — העיגול נשאר ומחליף את צבע הכפתור */
function InkFill() {
  const btn = useRef(null)
  const layer = useRef(null)
  const [on, setOn] = useState(false)
  const onClick = (e) => {
    const r = btn.current.getBoundingClientRect()
    const el = document.createElement('span')
    el.className = 'ink'
    // רדיוס גדול מספיק כדי לכסות את הכפתור מכל נקודת לחיצה
    const size = Math.hypot(r.width, r.height) * 2
    Object.assign(el.style, {
      width: `${size}px`, height: `${size}px`,
      left: `${e.clientX - r.left}px`, top: `${e.clientY - r.top}px`,
      background: on ? '#3f3f46' : '#f59e0b',
    })
    // מכניסים לשכבה נפרדת: אם נכניס ישירות לכפתור, React ידרוס את התוכן שלו בכל שינוי מצב
    layer.current.appendChild(el)
    setOn((v) => !v)
    // משאירים רק את העיגול האחרון, כדי שלא ייערמו אלמנטים
    setTimeout(() => {
      while (layer.current && layer.current.children.length > 1) layer.current.firstChild.remove()
    }, 600)
  }
  return (
    <button ref={btn} onClick={onClick} className={`${base} mb-ink bg-zinc-700 ${on ? 'text-zinc-950' : 'text-white'}`}>
      <span ref={layer} className="ink-layer" />
      {on ? 'דלוק' : 'כבוי'}
    </button>
  )
}

/* 5. טיפה שעוקבת אחרי העכבר */
function BlobFollow() {
  const btn = useRef(null)
  const move = (e) => {
    const r = btn.current.getBoundingClientRect()
    btn.current.style.setProperty('--x', `${e.clientX - r.left}px`)
    btn.current.style.setProperty('--y', `${e.clientY - r.top}px`)
  }
  return (
    <button
      ref={btn}
      onPointerMove={move}
      onPointerEnter={(e) => { move(e); btn.current.style.setProperty('--r', '90px') }}
      onPointerLeave={() => btn.current.style.setProperty('--r', '0px')}
      className={`${base} mb-blob border-2 border-rose-500 text-rose-300`}
    >
      טיפה עוקבת
    </button>
  )
}

/* 6. מיזוג נוזלי ("גו") */
const Gooey = () => (
  <button className="mb-goo-host relative h-24 w-full flex items-center justify-center select-none">
    {/* המסנן חל רק על שכבת הצורות — הכיתוב יושב מעליה, אחרת גם הוא היה נמס */}
    <span className="mb-goo-wrap absolute inset-0">
      <span className="drop drop-a" />
      <span className="drop drop-b" />
      <span className="pill" />
    </span>
    <span className="relative font-bold text-white pointer-events-none">מיזוג</span>
  </button>
)

/* ===================== קבוצה ב׳: עוד זכוכית ===================== */

/* 7. מסגרת זוהרת מסתובבת */
const GlowRing = ({ reduced }) => (
  <GlassStage reduced={reduced}>
    <div className="mb-ring">
      <button className={`${base} mb-ring-inner text-white block`}>מסגרת זוהרת</button>
    </div>
  </GlassStage>
)

/* 8. השתקפות שעוקבת אחרי הסמן */
function Specular({ reduced }) {
  const btn = useRef(null)
  const move = (e) => {
    const r = btn.current.getBoundingClientRect()
    btn.current.style.setProperty('--x', `${e.clientX - r.left}px`)
    btn.current.style.setProperty('--y', `${e.clientY - r.top}px`)
  }
  return (
    <GlassStage reduced={reduced}>
      <button ref={btn} onPointerMove={move} className={`${base} mb-glass-base mb-spec text-white`}>השתקפות עוקבת</button>
    </GlassStage>
  )
}

/* 9. Liquid Glass */
const LiquidGlass = ({ reduced }) => (
  <GlassStage reduced={reduced}>
    <button className={`${base} mb-liquidglass text-white`}>Liquid Glass</button>
  </GlassStage>
)

/* 10. זכוכית חלבית מחוספסת */
const Frosted = ({ reduced }) => (
  <GlassStage reduced={reduced}>
    <button className={`${base} mb-frost text-white`}>זכוכית חלבית</button>
  </GlassStage>
)

/* 11. זכוכית צבעונית */
const Dichroic = ({ reduced }) => (
  <GlassStage reduced={reduced}>
    <button className={`${base} mb-dichroic text-white`}>זכוכית צבעונית</button>
  </GlassStage>
)

/* 12. זכוכית תלת-מימדית אמיתית — שבירת אור אמיתית של מה שמאחורי הלוח */
function GlassSlab({ hover }) {
  const g = useRef(null)
  useFrame((state) => {
    if (!g.current) return
    const t = state.pointer // מיקום העכבר בתוך ה-Canvas, בטווח -1..1
    g.current.rotation.y += (t.x * 0.35 - g.current.rotation.y) * 0.1
    g.current.rotation.x += (-t.y * 0.25 - g.current.rotation.x) * 0.1
  })
  return (
    <group ref={g}>
      <RoundedBox args={[3.1, 1.25, 0.32]} radius={0.16} smoothness={6}>
        <MeshTransmissionMaterial
          color="#ffffff"
          transmission={1}
          thickness={0.3}
          roughness={hover ? 0.0 : 0.08}
          ior={1.35}
          chromaticAberration={0.18}
          distortion={0.06}
          distortionScale={0.3}
          anisotropicBlur={0.1}
          samples={6}
          resolution={256}
          backside={false}
        />
      </RoundedBox>
    </group>
  )
}
function Glass3D({ reduced }) {
  const [hover, setHover] = useState(false)
  return (
    <div className="relative w-full h-28 cursor-pointer" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <LazyCanvas className="absolute inset-0" camera={{ position: [0, 0, 4.2], fov: 42 }}>
        <color attach="background" args={['#141418']} />
        <ProceduralEnvironment name="studio" />
        <BackShapes reduced={reduced} />
        <GlassSlab hover={hover} />
      </LazyCanvas>
      <span className="absolute inset-0 flex items-center justify-center font-bold text-white pointer-events-none drop-shadow-lg">זכוכית אמיתית</span>
    </div>
  )
}
/* צורות צבעוניות מאחורי הלוח — בלי משהו מאחור, לזכוכית אין מה לשבור */
function BackShapes({ reduced }) {
  const g = useRef(null)
  useFrame((_, dt) => { if (!reduced && g.current) g.current.rotation.z += dt * 0.3 })
  return (
    <group ref={g} position={[0, 0, -1.1]}>
      {[['#f43f5e', -1.3, 0.45], ['#22d3ee', 1.3, -0.35], ['#facc15', 0, 0.75], ['#a855f7', 0.15, -0.75], ['#4ade80', -0.7, -0.5], ['#fb923c', 0.8, 0.5]].map(([c, x, y], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <sphereGeometry args={[0.55, 24, 24]} />
          <meshStandardMaterial color={c} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

/* ===================== קבוצה ג׳: אפקטים שלא הודגמו ===================== */

/* 13. ציור מסגרת */
const BorderDraw = () => (
  <button className={`${base} mb-draw relative text-lime-300 bg-transparent`}>
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="12" fill="none" stroke="#a3e635" strokeWidth="2" pathLength="1" />
    </svg>
    <span className="relative">ציור מסגרת</span>
  </button>
)

/* 14. ניאון */
const Neon = () => <button className={`${base} mb-neon`}>ניאון</button>

/* 15. גלגול טקסט */
const TextRoll = () => (
  <button className={`${base} mb-roll bg-sky-500 text-white h-[50px] leading-[26px]`}>
    <span className="roll-track">
      <span className="block h-[26px]">העבר עכבר</span>
      <span className="block h-[26px]">שלום!</span>
    </span>
  </button>
)

/* 16. חץ נע */
const ArrowSlide = () => (
  <button className={`${base} mb-arrow bg-zinc-100 text-zinc-900 inline-flex items-center gap-2`}>
    המשך
    <span className="arrow-box">
      <span className="a1">←</span>
      <span className="a2">←</span>
    </span>
  </button>
)

/* 17. המבורגר → X */
function Burger() {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen((v) => !v)}
      aria-label={open ? 'סגור תפריט' : 'פתח תפריט'}
      aria-expanded={open}
      className={`mb-burger ${open ? 'open' : ''} rounded-xl p-4 bg-zinc-800 text-white border border-zinc-600`}
    >
      <span /><span /><span />
    </button>
  )
}

/* 18. טעינה → הצלחה */
function LoadSuccess() {
  const [state, setState] = useState('idle') // idle | loading | done
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const run = () => {
    if (state !== 'idle') return
    setState('loading')
    // משרשרים: קודם "הצלחה", ורק מתוכו קובעים את החזרה למצב רגיל.
    // אם היינו קובעים את שני הטיימרים יחד ומכשיר איטי היה נתקע, שניהם היו נורים
    // כמעט באותו רגע ומצב ה"הצלחה" לא היה נראה בכלל.
    timer.current = setTimeout(() => {
      setState('done')
      timer.current = setTimeout(() => setState('idle'), 1800)
    }, 1400)
  }
  const color = state === 'done' ? 'bg-emerald-500' : 'bg-indigo-500'
  return (
    <button onClick={run} className={`${base} ${color} text-white inline-flex items-center justify-center gap-2 min-w-36 transition-colors`}>
      {state === 'idle' && 'שלח'}
      {state === 'loading' && <><span className="mb-spinner" /> שולח…</>}
      {state === 'done' && (
        <>
          <svg className="mb-check" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 12.5l5 5L20 6.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          נשלח
        </>
      )}
    </button>
  )
}

/* 19. רעידת שגיאה */
function Shake() {
  const [shaking, setShaking] = useState(false)
  const t = useRef(null)
  useEffect(() => () => clearTimeout(t.current), [])
  const go = () => { setShaking(true); t.current = setTimeout(() => setShaking(false), 550) }
  return <button onClick={go} className={`${base} mb-shake ${shaking ? 'shaking' : ''} bg-rose-600 text-white`}>שגיאה</button>
}

/* 20. קונפטי */
function Confetti() {
  const wrap = useRef(null)
  const colors = ['#f43f5e', '#22d3ee', '#facc15', '#4ade80', '#a855f7', '#fb923c']
  const boom = () => {
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('span')
      p.className = 'mb-confetti-piece'
      const a = Math.random() * Math.PI * 2
      const d = 45 + Math.random() * 75
      p.style.setProperty('--tx', `${Math.cos(a) * d}px`)
      p.style.setProperty('--ty', `${Math.sin(a) * d}px`)
      p.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`)
      p.style.background = colors[i % colors.length]
      p.style.animationDelay = `${Math.random() * 0.1}s`
      wrap.current.appendChild(p)
      setTimeout(() => p.remove(), 1100)
    }
  }
  return (
    <div ref={wrap} className="relative">
      <button onClick={boom} className={`${base} bg-fuchsia-600 text-white`}>חגיגה 🎉</button>
    </div>
  )
}

/* 21. הטיה תלת-מימדית — CSS בלבד, בלי מנוע תלת-מימד */
function Tilt({ reduced }) {
  const btn = useRef(null)
  const move = (e) => {
    const r = btn.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    btn.current.style.setProperty('--x', `${px * 100}%`)
    btn.current.style.setProperty('--y', `${py * 100}%`)
    if (reduced) return
    btn.current.style.transform = `rotateY(${(px - 0.5) * 26}deg) rotateX(${(0.5 - py) * 22}deg) translateZ(6px)`
  }
  const reset = () => { btn.current.style.transform = '' }
  return (
    <div className="mb-tilt-wrap" onPointerMove={move} onPointerLeave={reset}>
      <button ref={btn} className={`${base} mb-tilt bg-gradient-to-br from-teal-500 to-blue-600 text-white`}>
        הטיה תלת-מימדית
        <span className="glare" />
      </button>
    </div>
  )
}

/* 22. לחיצה ארוכה לאישור */
function HoldConfirm() {
  const [holding, setHolding] = useState(false)
  const [done, setDone] = useState(false)
  const t = useRef(null)
  useEffect(() => () => clearTimeout(t.current), [])
  const start = () => {
    if (done) { setDone(false); return }
    setHolding(true)
    t.current = setTimeout(() => { setDone(true); setHolding(false) }, 1200)
  }
  const cancel = () => { clearTimeout(t.current); setHolding(false) }
  return (
    <button
      onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
      className={`${base} mb-hold ${holding ? 'holding' : ''} ${done ? 'bg-emerald-600' : 'bg-zinc-700'} text-white`}
    >
      <span className="fill" />
      {done ? '✓ אושר' : 'לחץ והחזק לאישור'}
    </button>
  )
}

/* 23. חצייה */
const SplitReveal = () => (
  <button className={`${base} mb-split bg-zinc-900 text-amber-300 border border-zinc-700`}>
    לחץ כאן
    <span className="half half-t">העבר עכבר</span>
    <span className="half half-b">העבר עכבר</span>
  </button>
)

/* 24. כתובית רצה */
const Marquee = () => (
  <button className={`${base} mb-marquee bg-amber-400 text-zinc-950 w-44`}>
    <span className="track">
      <span>מבצע! · עכשיו · מבצע! ·</span>
      <span>מבצע! · עכשיו · מבצע! ·</span>
    </span>
  </button>
)

export default function MoreButtonsSection() {
  const { reducedMotion } = useQuality()
  return (
    <Section
      id="buttons2"
      number="1+"
      title="עוד כפתורים — נוזלי, זכוכית, ועוד 12 אפקטים"
      what="24 כפתורים נוספים בשלוש קבוצות: וריאציות נוזליות, וריאציות זכוכית, ואפקטים שלא הודגמו במקטע הראשון."
      enables="לראות כמה רחוק אפשר להגיע עם CSS לבד, איפה נדרש JavaScript (מעקב אחרי הסמן, מצבים), ואיפה זכוכית 'אמיתית' דורשת מנוע תלת-מימד."
      cost="רובם CSS טהור — כמעט חינם. יוצאי דופן: backdrop-filter (טשטוש רקע) מכריח את הדפדפן לצייר את מה שמאחור פעם נוספת, מסנן ה'גו' מפעיל טשטוש על כל פריים, והזכוכית התלת-מימדית מצלמת את הסצנה לטקסטורה בכל פריים."
      costLabel="בינוני"
    >
      <GooFilter />

      <h3 className="text-lg font-bold text-cyan-300 mb-3">א׳ · עוד מילוי נוזלי</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        <Card name="גל נע" tool="CSS בלבד" note="מסיכת גל שגם זזה הצידה בזמן שהיא מלאה"><WaveFill /></Card>
        <Card name="מילוי מהצד" tool="CSS בלבד" note="scaleX מנקודת עוגן ימנית — מתאים לעברית"><SideFill /></Card>
        <Card name="בועות" tool="CSS בלבד" note="מילוי עולה + בועות שמטפסות בהשהיות שונות"><Bubbles /></Card>
        <Card name="מילוי מנקודת הלחיצה" tool="JS + CSS" note="בניגוד ל'גלים' — העיגול נשאר ומחליף מצב"><InkFill /></Card>
        <Card name="טיפה עוקבת" tool="JS + CSS" note="JS מעדכן משתני CSS, הגרדיאנט זז"><BlobFollow /></Card>
        <Card name="מיזוג נוזלי (גו)" tool="SVG + CSS" note="טשטוש + ניגודיות = צורות שנמסות זו לזו"><Gooey /></Card>
      </div>

      <h3 className="text-lg font-bold text-sky-200 mb-3">ב׳ · עוד זכוכית</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        <Card name="מסגרת זוהרת" tool="CSS בלבד" note="גרדיאנט חרוטי מסתובב מאחורי הכפתור"><GlowRing reduced={reducedMotion} /></Card>
        <Card name="השתקפות עוקבת" tool="JS + CSS" note="ברק לבן שנע עם הסמן"><Specular reduced={reducedMotion} /></Card>
        <Card name="Liquid Glass" tool="CSS בלבד" note="עדשה: טשטוש חזק + שוליים בהירים + הגדלה"><LiquidGlass reduced={reducedMotion} /></Card>
        <Card name="זכוכית חלבית" tool="CSS בלבד" note="טשטוש + שכבת רעש (feTurbulence)"><Frosted reduced={reducedMotion} /></Card>
        <Card name="זכוכית צבעונית" tool="CSS בלבד" note="hue-rotate מסובב את הצבעים שמאחור"><Dichroic reduced={reducedMotion} /></Card>
        <Card name="זכוכית אמיתית" tool="תלת-מימד (R3F)" note="שבירת אור אמיתית — הזיזו את העכבר"><Glass3D reduced={reducedMotion} /></Card>
      </div>

      <h3 className="text-lg font-bold text-emerald-300 mb-3">ג׳ · אפקטים שלא הודגמו</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card name="ציור מסגרת" tool="SVG + CSS" note="stroke-dashoffset מ-1 ל-0"><BorderDraw /></Card>
        <Card name="ניאון" tool="CSS בלבד" note="שכבות text-shadow + הבהוב עדין"><Neon /></Card>
        <Card name="גלגול טקסט" tool="CSS בלבד" note="שני עותקים, גלילה של 50%"><TextRoll /></Card>
        <Card name="חץ נע" tool="CSS בלבד" note="חץ יוצא, חדש נכנס — בלי קפיצה"><ArrowSlide /></Card>
        <Card name="המבורגר → X" tool="CSS בלבד" note="שלושה קווים, סיבוב והיעלמות האמצעי"><Burger /></Card>
        <Card name="טעינה → הצלחה" tool="JS + CSS" note="שלושה מצבים; הווי מצויר בקו"><LoadSuccess /></Card>
        <Card name="רעידת שגיאה" tool="CSS בלבד" note="keyframes של תזוזות קטנות"><Shake /></Card>
        <Card name="קונפטי" tool="JS + CSS" note="JS יוצר 26 חלקיקים, CSS מפזר"><Confetti /></Card>
        <Card name="הטיה תלת-מימדית" tool="JS + CSS" note="perspective + rotateX/Y לפי הסמן"><Tilt reduced={reducedMotion} /></Card>
        <Card name="לחיצה ארוכה" tool="JS + CSS" note="מד התקדמות; שחרור מוקדם מבטל"><HoldConfirm /></Card>
        <Card name="חצייה" tool="CSS בלבד" note="clip-path חוצה, החצאים נפתחים"><SplitReveal /></Card>
        <Card name="כתובית רצה" tool="CSS בלבד" note="שני עותקים שנעים ברצף אינסופי"><Marquee /></Card>
      </div>
    </Section>
  )
}
