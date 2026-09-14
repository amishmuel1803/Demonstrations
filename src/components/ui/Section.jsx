const costColors = {
  'קל': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'בינוני': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'כבד': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

/**
 * עטיפה אחידה לכל הדגמה: מספר, כותרת, שתי שורות הסבר, תגית "מה זה עולה בביצועים",
 * ואזור תוכן (ההדגמה + הבקרים).
 */
export default function Section({ id, number, title, what, enables, cost, costLabel = 'קל', children }) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-zinc-800 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-cyan-400 font-mono text-sm">{String(number).padStart(2, '0')}</span>
            <h2 className="text-2xl md:text-3xl font-extrabold">{title}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${costColors[costLabel]}`}>ביצועים: {costLabel}</span>
          </div>
          <p className="text-zinc-300 max-w-3xl leading-relaxed"><b className="text-zinc-100">מה רואים כאן:</b> {what}</p>
          <p className="text-zinc-300 max-w-3xl leading-relaxed"><b className="text-zinc-100">מה זה מאפשר:</b> {enables}</p>
          <p className="text-zinc-400 max-w-3xl leading-relaxed text-sm"><b className="text-zinc-300">מה זה עולה:</b> {cost}</p>
        </header>
        {children}
      </div>
    </section>
  )
}

/** פריסה סטנדרטית: ההדגמה בצד אחד, הבקרים בצד השני (בטלפון — אחד מתחת לשני). */
export function DemoLayout({ demo, controls, demoClass = '' }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_300px]">
      <div className={`rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 ${demoClass}`}>{demo}</div>
      <aside className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-4 md:max-h-[70vh] md:overflow-y-auto">{controls}</aside>
    </div>
  )
}
