'use client'

import { CircleCheck, CircleX, Lock } from 'lucide-react'

export type ReviewStatus = 'draft' | 'audited' | 'approved' | 'rejected'
export type LogEntry = { t: string; m: string }

const STATUS: Record<ReviewStatus, [string, string]> = {
  draft: ['Draft', 'bg-slate-200 text-slate-700'],
  audited: ['Awaiting review', 'bg-indigo-100 text-indigo-800'],
  approved: ['Approved', 'bg-emerald-600 text-white'],
  rejected: ['Rejected', 'bg-red-600 text-white'],
}

type Props = {
  status: ReviewStatus
  fresh: boolean
  criticalCount: number
  note: string
  onNoteChange: (v: string) => void
  attest: boolean
  onAttestChange: (v: boolean) => void
  hash: string | null
  log: LogEntry[]
  onDecide: (type: 'Approved' | 'Rejected') => void
}

export function ReviewPanel({
  status,
  fresh,
  criticalCount,
  note,
  onNoteChange,
  attest,
  onAttestChange,
  hash,
  log,
  onDecide,
}: Props) {
  const [statusLabel, statusClass] = STATUS[status]
  const helper = !fresh
    ? 'Run an audit on the current draft to enable review.'
    : criticalCount > 0
      ? `${criticalCount} critical flag(s) must be fixed or overridden before approval.`
      : 'Ready for sign-off.'

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm" aria-label="Reviewer sign-off">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-900"
            aria-hidden="true"
          >
            EV
          </div>
          <div>
            <p className="font-mono text-xs font-semibold">Lead reviewer: Elena Vance</p>
            <p className="text-[11px] text-slate-500">Chief Compliance Officer · Tier-1 auth</p>
          </div>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusClass}`} aria-live="polite">
          {statusLabel}
        </span>
      </div>

      <label htmlFor="reviewer-note" className="sr-only">
        Reviewer note
      </label>
      <input
        id="reviewer-note"
        className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-indigo-600"
        placeholder="Reviewer note (optional)"
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
      />
      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          className="mt-0.5 accent-indigo-800"
          checked={attest}
          onChange={(e) => onAttestChange(e.target.checked)}
        />
        Log signed compliance attestation (SHA-256) on final sign-off.
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!fresh || criticalCount > 0 || status === 'approved'}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 font-semibold text-white active:scale-95 disabled:opacity-40"
          onClick={() => onDecide('Approved')}
        >
          <CircleCheck className="size-[18px]" aria-hidden="true" /> Approve copy
        </button>
        <button
          type="button"
          disabled={!fresh || status === 'rejected'}
          className="flex h-11 items-center gap-1 rounded-lg bg-red-100 px-4 font-semibold text-red-800 active:scale-95 disabled:opacity-40"
          onClick={() => onDecide('Rejected')}
        >
          <CircleX className="size-[18px]" aria-hidden="true" /> Reject
        </button>
      </div>
      <p className="text-xs text-slate-500">{helper}</p>

      {hash && (
        <p className="flex items-start gap-1 break-all rounded bg-slate-50 p-2 font-mono text-[11px]">
          <Lock className="size-3.5 shrink-0" aria-hidden="true" />
          Attestation SHA-256: {hash}
        </p>
      )}

      {log.length > 0 && (
        <div className="border-t border-slate-100 pt-2">
          <h3 className="mb-1 text-[11px] font-bold uppercase text-slate-500">Audit trail</h3>
          <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-xs text-slate-700">
            {log.map((l, i) => (
              <li key={i}>
                <span className="font-mono text-slate-400">{l.t}</span> {l.m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
