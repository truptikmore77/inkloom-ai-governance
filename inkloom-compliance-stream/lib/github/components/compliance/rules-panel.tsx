'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Gavel } from 'lucide-react'
import { DEFAULT_RULES } from '@/lib/compliance'

type Props = {
  value: string
  onChange: (value: string) => void
  ruleCount: number
  errors: string[]
}

export function RulesPanel({ value, onChange, ruleCount, errors }: Props) {
  const [open, setOpen] = useState(false)
  const Chevron = open ? ChevronUp : ChevronDown

  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="rules-editor"
        className="flex w-full items-center justify-between bg-slate-50 px-4 py-3"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2 font-heading font-semibold">
          <Gavel className="size-[18px] text-indigo-800" aria-hidden="true" />
          Brand rules
          <span className="font-mono text-xs font-normal text-slate-500">
            {ruleCount} valid{errors.length ? ` · ${errors.length} error(s)` : ''}
          </span>
        </span>
        <Chevron className="size-[18px]" aria-hidden="true" />
      </button>
      {open && (
        <div id="rules-editor" className="flex flex-col gap-2 p-4">
          <label htmlFor="rules-text" className="sr-only">
            Brand rules definition
          </label>
          <textarea
            id="rules-text"
            spellCheck={false}
            className="h-56 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs focus:outline-indigo-600"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {errors.map((e) => (
            <p key={e} className="text-xs text-red-700" role="alert">
              {e}
            </p>
          ))}
          <button
            type="button"
            className="self-start text-xs font-semibold text-indigo-800"
            onClick={() => onChange(DEFAULT_RULES)}
          >
            Reset to default rules
          </button>
        </div>
      )}
    </section>
  )
}
