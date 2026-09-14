/** כפתור פעולה רגיל (לא חלק מהדגמת הכפתורים). */
export default function Btn({ children, onClick, active = false, className = '', ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors border ${
        active ? 'bg-cyan-500 text-zinc-950 border-cyan-400' : 'bg-zinc-800 text-zinc-100 border-zinc-700 hover:bg-zinc-700'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
