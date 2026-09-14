/** מתג הדלקה/כיבוי עם תווית והסבר. */
export default function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-cyan-500' : 'bg-zinc-700'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'right-0.5' : 'right-[22px]'}`} />
      </button>
      <span>
        <span className="text-sm font-semibold text-zinc-100">{label}</span>
        {hint && <span className="block text-[11px] text-zinc-400 leading-snug">{hint}</span>}
      </span>
    </label>
  )
}
