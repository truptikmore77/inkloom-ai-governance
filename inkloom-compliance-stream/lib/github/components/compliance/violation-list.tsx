import { CircleCheck, Lightbulb, ShieldAlert, TriangleAlert } from 'lucide-react'
import { SEVERITY, type Violation } from '@/lib/compliance'

type Props = {
  violations: Violation[]
  ignored: Record<string, boolean>
  activeCount: number
  onAccept: (v: Violation) => void
  onIgnore: (v: Violation) => void
}

export function ViolationList({ violations, ignored, activeCount, onAccept, onIgnore }: Props) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="flags-heading">
      <div className="flex items-center justify-between px-1">
        <h2 id="flags-heading" className="flex items-center gap-2 font-heading font-semibold">
          <ShieldAlert className="size-[18px] text-red-700" aria-hidden="true" />
          Flagged policy breaches
        </h2>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold uppercase">
          {activeCount ? `${activeCount} active` : '0 active (compliant)'}
        </span>
      </div>

      {violations.length === 0 && (
        <div className="flex gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <CircleCheck className="size-[18px] shrink-0" aria-hidden="true" />
          No violations. This copy is ready for reviewer sign-off.
        </div>
      )}

      {violations.map((v) => {
        const sev = SEVERITY[v.rule.sev]
        const isIgnored = !!ignored[v.key]
        return (
          <article
            key={v.key}
            className={`overflow-hidden rounded-xl bg-white shadow-sm ${isIgnored ? 'opacity-50' : ''}`}
          >
            <div className={`flex items-center justify-between px-4 py-2 ${sev.head}`}>
              <h3 className="font-mono text-xs font-semibold">{v.rule.name}</h3>
              <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${sev.badge}`}>
                {sev.label}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-4">
              <p className="rounded bg-slate-50 p-2 font-mono text-xs line-through decoration-2">
                {v.start < 0 ? v.text : `“…${v.text}…”`}
              </p>
              <p className="flex gap-1.5 text-xs text-slate-600">
                <TriangleAlert className="size-4 shrink-0 text-red-700" aria-hidden="true" />
                <span>{v.rule.why}</span>
              </p>
              {v.rule.rep && (
                <div>
                  <p className="flex items-center gap-1 text-[11px] font-bold uppercase text-emerald-700">
                    <Lightbulb className="size-4" aria-hidden="true" />
                    {v.start < 0 ? 'Suggested addition' : 'Suggested compliant phrasing'}
                  </p>
                  <p className="mt-1 rounded bg-slate-50 p-2 text-sm">“{v.rule.rep}”</p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {v.rule.rep && (
                  <button
                    type="button"
                    disabled={isIgnored}
                    className="flex h-9 flex-1 items-center justify-center gap-1 rounded bg-emerald-700 text-sm font-semibold text-white active:scale-95 disabled:opacity-40"
                    onClick={() => onAccept(v)}
                  >
                    <CircleCheck className="size-4" aria-hidden="true" /> Accept suggestion
                  </button>
                )}
                <button
                  type="button"
                  disabled={isIgnored}
                  className="h-9 rounded bg-slate-100 px-3 text-sm text-slate-700 disabled:opacity-40"
                  onClick={() => onIgnore(v)}
                >
                  {isIgnored ? 'Overridden' : 'Ignore'}
                </button>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
