const toolColor = {
  'CSS בלבד': 'text-emerald-300 border-emerald-500/40',
  'GSAP': 'text-amber-300 border-amber-500/40',
  'JS + CSS': 'text-sky-300 border-sky-500/40',
  'SVG + CSS': 'text-lime-300 border-lime-500/40',
  'תלת-מימד (R3F)': 'text-fuchsia-300 border-fuchsia-500/40',
}

/** כרטיסייה אחידה להדגמת אפקט כפתור: האפקט למעלה, ומתחתיו שם, הכלי שעושה אותו, והערה. */
export default function EffectCard({ name, tool, note, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col items-center gap-3 min-h-52 ${className}`}>
      <div className="flex-1 flex items-center justify-center w-full">{children}</div>
      <div className="text-center">
        <div className="font-semibold">{name}</div>
        <div className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full border ${toolColor[tool]}`}>{tool}</div>
        {note && <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{note}</div>}
      </div>
    </div>
  )
}
