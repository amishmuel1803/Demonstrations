import PerfMeter from './components/PerfMeter'
import { useQuality } from './hooks/useQuality'
import ButtonsSection from './sections/ButtonsSection'
import MaterialsSection from './sections/MaterialsSection'
import LightingSection from './sections/LightingSection'

const nav = [
  ['buttons', 'כפתורים'],
  ['materials', 'חומרים'],
  ['lighting', 'תאורה'],
  ['physics', 'פיזיקה'],
  ['game', 'משחק'],
  ['textures', 'טקסטורות'],
  ['soft', 'בד ומים'],
  ['particles', 'חלקיקים'],
  ['scroll', 'גלילה'],
]

export default function App() {
  const { tierName, reducedMotion } = useQuality()
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-4">
          <a href="#top" className="font-extrabold text-lg whitespace-nowrap">🎮 מגרש משחקים</a>
          <nav className="hidden md:flex gap-1 text-sm text-zinc-300 overflow-x-auto">
            {nav.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="px-2 py-1 rounded hover:bg-zinc-800 whitespace-nowrap">{label}</a>
            ))}
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            מה אפשר לעשות בדפדפן עם <span className="text-cyan-400">תלת-מימד</span>, <span className="text-fuchsia-400">פיזיקה</span>, <span className="text-amber-400">חומרים</span> ו<span className="text-emerald-400">אנימציה</span>
          </h1>
          <p className="text-zinc-300 max-w-3xl leading-relaxed">
            דף לימוד. כל מקטע הוא הדגמה אחת: רואים תוצאה, נוגעים בה עם הבקרים, וקוראים מה היכולת ומה הגבול.
            מד הביצועים בפינה השמאלית-תחתונה מראה בזמן אמת כמה זה עולה למחשב.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">פרופיל איכות: <b>{tierName === 'mobile' ? 'טלפון (איכות מופחתת)' : 'מחשב'}</b></span>
            <span className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-300">פחות תנועה: <b>{reducedMotion ? 'פעיל — אנימציות אוטומטיות כבויות' : 'כבוי'}</b></span>
          </div>
        </section>

        <ButtonsSection />
        <MaterialsSection />
        <LightingSection />
      </main>

      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-500">
        Vite · React · Tailwind · Three.js · React Three Fiber · drei · Rapier · GSAP — כל ערכי ברירת המחדל ב-<code>src/config.js</code>
      </footer>
      <PerfMeter />
    </div>
  )
}
