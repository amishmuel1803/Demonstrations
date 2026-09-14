/** סליידר עם תווית, ערך נוכחי והסבר של מילה-שתיים. */
export default function Slider({ label, hint, value, min = 0, max = 1, step = 0.01, onChange, format }) {
  const shown = format ? format(value) : (Number.isInteger(step) ? value : Number(value).toFixed(2))
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-zinc-100">{label}</span>
        <span className="text-xs font-mono text-cyan-300" dir="ltr">{shown}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
      {hint && <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{hint}</div>}
    </label>
  )
}
