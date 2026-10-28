import { ShieldCheck } from 'lucide-react'

export function AppHeader({ ruleCount }: { ruleCount: number }) {
  return (
    <header className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-800 text-white">
          <ShieldCheck className="size-[18px]" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-heading font-semibold leading-none">Inkloom AI</h1>
          <p className="text-xs text-slate-500">Compliance Stream</p>
        </div>
      </div>
      <div className="text-right">
        <p className="flex items-center justify-end gap-1 font-mono text-[11px] font-semibold uppercase text-emerald-700">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
          Policy engine active
        </p>
        <p className="text-[11px] text-slate-500">{ruleCount} rules enforced · Strict</p>
      </div>
    </header>
  )
}
