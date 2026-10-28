'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_DRAFT,
  DEFAULT_RULES,
  SEVERITY,
  applyFix,
  parseRules,
  runAudit,
  sha256,
  timestamp,
  type Violation,
} from '@/lib/compliance'
import { AppHeader } from './app-header'
import { RulesPanel } from './rules-panel'
import { ContentCanvas } from './content-canvas'
import { ViolationList } from './violation-list'
import { ReviewPanel, type LogEntry, type ReviewStatus } from './review-panel'

const RULES_KEY = 'ik_rules'
const DRAFT_KEY = 'ik_draft'

const readStored = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}
const writeStored = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

export function ComplianceApp() {
  const [rulesText, setRulesText] = useState(DEFAULT_RULES)
  const [draft, setDraft] = useState(DEFAULT_DRAFT)
  const [hydrated, setHydrated] = useState(false)
  const [result, setResult] = useState<{ draft: string; list: Violation[] } | null>(null)
  const [ignored, setIgnored] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState(true)
  const [status, setStatus] = useState<ReviewStatus>('draft')
  const [log, setLog] = useState<LogEntry[]>([])
  const [attest, setAttest] = useState(true)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')
  const [hash, setHash] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setRulesText(readStored(RULES_KEY, DEFAULT_RULES))
    setDraft(readStored(DRAFT_KEY, DEFAULT_DRAFT))
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (hydrated) writeStored(RULES_KEY, rulesText)
  }, [rulesText, hydrated])
  useEffect(() => {
    if (hydrated) writeStored(DRAFT_KEY, draft)
  }, [draft, hydrated])

  const { rules, errors } = useMemo(() => parseRules(rulesText), [rulesText])

  const say = (message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2400)
  }
  const addLog = (m: string) => setLog((l) => [{ t: timestamp(), m }, ...l].slice(0, 30))

  const fresh = result !== null && result.draft === draft
  const active = fresh ? result.list.filter((v) => !ignored[v.key]) : []
  const criticalCount = active.filter((v) => v.rule.sev === 'critical').length
  const score = fresh
    ? Math.max(0, 100 - active.reduce((s, v) => s + SEVERITY[v.rule.sev].weight, 0))
    : null

  function audit(d = draft, quiet = false) {
    if (!d.trim()) {
      say('Add some draft content first.')
      return
    }
    const list = runAudit(d, rules)
    setResult({ draft: d, list })
    setIgnored({})
    setEditing(false)
    setStatus('audited')
    setHash(null)
    if (!quiet) addLog(`Audit run: ${list.length} flag(s) against ${rules.length} rule(s).`)
    say(list.length ? `${list.length} policy flag(s) found.` : 'Clean — no violations found.')
  }

  function accept(v: Violation) {
    const next = applyFix(draft, v)
    setDraft(next)
    addLog(`Accepted fix for ${v.rule.name}.`)
    audit(next, true)
  }

  function ignore(v: Violation) {
    setIgnored((i) => ({ ...i, [v.key]: true }))
    addLog(`Reviewer overrode ${v.rule.name}.`)
  }

  function applyAll() {
    const fixes = active.filter((v) => v.rule.rep)
    if (!fixes.length) {
      say('No fixes with suggested phrasing.')
      return
    }
    let next = draft
    fixes
      .filter((v) => v.start >= 0)
      .sort((a, b) => b.start - a.start)
      .forEach((v) => {
        next = applyFix(next, v)
      })
    fixes
      .filter((v) => v.start < 0)
      .forEach((v) => {
        next = applyFix(next, v)
      })
    setDraft(next)
    addLog(`Applied ${fixes.length} fix(es) in bulk.`)
    audit(next, true)
  }

  async function decide(type: 'Approved' | 'Rejected') {
    const h = attest ? await sha256(`${draft}|${type}|${Date.now()}`) : null
    setHash(h)
    setStatus(type === 'Approved' ? 'approved' : 'rejected')
    addLog(`${type} by Elena Vance${note ? ` — “${note}”` : ''}${h ? '. Attested.' : '.'}`)
    say(type === 'Approved' ? 'Copy approved and stamped.' : 'Copy rejected; feedback sent to author.')
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft)
    } catch {}
    say('Draft copied.')
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-28 pt-4">
      <AppHeader ruleCount={rules.length} />
      <RulesPanel value={rulesText} onChange={setRulesText} ruleCount={rules.length} errors={errors} />
      <ContentCanvas
        draft={draft}
        onDraftChange={(value) => {
          setDraft(value)
          if (status !== 'draft') setStatus('draft')
        }}
        violations={fresh ? result.list : null}
        ignored={ignored}
        activeCount={active.length}
        score={score}
        editing={editing}
        canApplyAll={active.some((v) => v.rule.rep)}
        onAudit={() => audit()}
        onToggleEditing={() => setEditing(!editing)}
        onApplyAll={applyAll}
        onCopy={copyDraft}
      />
      {fresh && (
        <ViolationList
          violations={result.list}
          ignored={ignored}
          activeCount={active.length}
          onAccept={accept}
          onIgnore={ignore}
        />
      )}
      <ReviewPanel
        status={status}
        fresh={fresh}
        criticalCount={criticalCount}
        note={note}
        onNoteChange={setNote}
        attest={attest}
        onAttestChange={setAttest}
        hash={hash}
        log={log}
        onDecide={decide}
      />
      <div aria-live="polite" role="status">
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </main>
  )
}
