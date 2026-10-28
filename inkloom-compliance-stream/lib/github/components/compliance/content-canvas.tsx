'use client'

import { Copy, Eye, PenLine, Pencil, Play, WandSparkles } from 'lucide-react'
import { SEVERITY, type Violation } from '@/lib/compliance'

type Props = {
  draft: string
  onDraftChange: (value: string) => void
  violations: Violation[] | null
  ignored: Record<string, boolean>
  activeCount: number
  score: number | null
  editing: boolean
  canApplyAll: boolean
  onAudit: () => void
  onToggleEditing: () => void
  onApplyAll: () => void
  onCopy: () => void
}

function scoreBadge(score: number | null) {
  if (score === null) return ['bg-slate-200 text-slate-700', 'Not audited']
  const label = `Score: ${score}/100`
  if (score >= 90) return ['bg-emerald-100 text-emerald-800', label]
  if (score >= 75) return ['bg-amber-100 text-amber-800', label]
  return ['bg-red-100 text-red-800', label]
}

export function ContentCanvas({
  draft,
  onDraftChange,
  violations,
  ignored,
  activeCount,
  score,
  editing,
  canApplyAll,
  onAudit,
  onToggleEditing,
  onApplyAll,
  onCopy,
}: Props) {
  const fresh = violations !== null
  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0
  const [badgeClass, badgeLabel] = scoreBadge(score)

  const segments: { text: string; v?: Violation }[] = []
  if (fresh) {
    let pos = 0
    violations
      .filter((v) => v.start >= 0)
      .forEach((v) => {
        segments.push({ text: draft.slice(pos, v.start) })
        segments.push({ text: v.text, v })
        pos = v.end
      })
    segments.push({ text: draft.slice(pos) })
  }

  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 px-4 py-3">
        <h2 className="flex items-center gap-2 font-heading font-semibold">
          <PenLine className="size-[18px] text-indigo-800" aria-hidden="true" />
          Content canvas
        </h2>
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${badgeClass}`}
        >
          {badgeLabel}
        </span>
        <p className="w-full font-mono text-xs text-slate-500">
          {words} words · est. {Math.max(1, Math.round(words / 4))}s read ·{' '}
          <span className={activeCount ? 'font-semibold text-red-700' : ''}>
            {fresh ? `${activeCount} active flag(s)` : 'run audit to scan'}
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {fresh && !editing ? (
          <div className="rounded-lg border border-slate-200 p-3 leading-relaxed">
            {segments.map((s, i) =>
              s.v ? (
                <mark
                  key={i}
                  title={s.v.rule.name}
                  className={`rounded px-1 text-slate-900 underline decoration-2 underline-offset-4 ${
                    ignored[s.v.key] ? 'bg-slate-100 decoration-slate-400' : SEVERITY[s.v.rule.sev].mark
                  }`}
                >
                  {s.text}
                </mark>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </div>
        ) : (
          <>
            <label htmlFor="draft" className="sr-only">
              Content draft
            </label>
            <textarea
              id="draft"
              className="h-40 w-full rounded-lg border border-slate-200 p-3 leading-relaxed focus:outline-indigo-600"
              placeholder="Paste or write your content draft…"
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
            />
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="flex h-10 items-center gap-1 rounded-lg bg-indigo-800 px-4 font-semibold text-white active:scale-95"
            onClick={onAudit}
          >
            <Play className="size-4" aria-hidden="true" /> Run Audit
          </button>
          {fresh && (
            <button
              type="button"
              className="flex h-10 items-center gap-1 rounded-lg bg-slate-100 px-3 text-sm font-semibold"
              onClick={onToggleEditing}
            >
              {editing ? (
                <Eye className="size-4" aria-hidden="true" />
              ) : (
                <Pencil className="size-4" aria-hidden="true" />
              )}
              {editing ? 'Show flags' : 'Edit draft'}
            </button>
          )}
          {fresh && canApplyAll && (
            <button
              type="button"
              className="flex h-10 items-center gap-1 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white active:scale-95"
              onClick={onApplyAll}
            >
              <WandSparkles className="size-4" aria-hidden="true" /> Apply all fixes
            </button>
          )}
          <button
            type="button"
            className="ml-auto flex h-10 items-center gap-1 rounded-lg bg-slate-100 px-3 text-sm text-slate-700"
            onClick={onCopy}
          >
            <Copy className="size-4" aria-hidden="true" /> Copy
          </button>
        </div>
      </div>
    </section>
  )
}
