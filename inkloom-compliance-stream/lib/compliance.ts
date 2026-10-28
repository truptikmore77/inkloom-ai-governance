export type Severity = 'critical' | 'warning' | 'moderate'

export const SEVERITY: Record<
  Severity,
  { weight: number; label: string; head: string; badge: string; mark: string }
> = {
  critical: {
    weight: 20,
    label: 'Critical',
    head: 'bg-red-50 text-red-800',
    badge: 'bg-red-600 text-white',
    mark: 'bg-red-100 decoration-red-500',
  },
  warning: {
    weight: 10,
    label: 'Warning',
    head: 'bg-amber-50 text-amber-900',
    badge: 'bg-amber-600 text-white',
    mark: 'bg-amber-100 decoration-amber-500',
  },
  moderate: {
    weight: 6,
    label: 'Moderate',
    head: 'bg-indigo-50 text-indigo-800',
    badge: 'bg-indigo-700 text-white',
    mark: 'bg-indigo-100 decoration-indigo-500',
  },
}

export type Rule = {
  sev: Severity
  name: string
  re: RegExp
  why: string
  rep: string
  missing: boolean
}

export type Violation = {
  key: string
  rule: Rule
  start: number
  end: number
  text: string
}

export const DEFAULT_RULES = `# severity :: rule name :: pattern :: explanation :: suggested replacement
# pattern = comma-separated terms, or /regex/. Start with ! to REQUIRE a phrase.
critical :: SEC-104 Absolute Claims :: /eliminate \\d+% of [\\w ]+ without lifting a finger|guarantee[ds]?/ :: Policy prohibits zero-error or guaranteed-outcome claims without a legal footnote. :: significantly mitigate critical security risks through automated remediation workflows
warning :: BRAND-22 Superlatives :: unrivaled, unmatched, best-in-class, world-class, revolutionary :: Unsubstantiated superlatives violate executive tone standards. :: high-throughput
moderate :: COMP-09 Derogatory Comparisons :: /we (?:crush|destroy|kill|beat) [\\w ]+?(?= in |[.,!]|$)/ :: Combative comparison tone against competitors breaches brand guideline 3.2. :: we outperform traditional tools
warning :: LEGAL-03 Price Guarantee :: price guarantee :: Pricing commitments need legal-approved wording. :: pricing commitment
warning :: LEGAL-01 Required Disclaimer :: !results may vary :: Marketing copy must carry the standard disclaimer. :: Results may vary. See terms.`

export const DEFAULT_DRAFT =
  'Introducing our unrivaled next-gen cloud automation suite. Customers can easily eliminate 100% of security errors without lifting a finger. Compare us to Salesforce or HubSpot — we crush legacy tools in speed and price guarantee!'

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function parseRules(text: string) {
  const rules: Rule[] = []
  const errors: string[] = []

  text.split('\n').forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line[0] === '#') return
    const parts = line.split('::').map((s) => s.trim())
    const sev = parts[0]?.toLowerCase() as Severity
    if (parts.length < 3 || !SEVERITY[sev]) {
      errors.push(
        `Line ${i + 1}: expected “severity :: name :: pattern :: explanation :: replacement”.`,
      )
      return
    }
    const [, name, rawPattern, why = '', rep = ''] = parts
    let pattern = rawPattern
    let missing = false
    if (pattern[0] === '!') {
      missing = true
      pattern = pattern.slice(1).trim()
    }
    try {
      const literal = pattern.match(/^\/(.+)\/([a-z]*)$/)
      const re = literal
        ? new RegExp(literal[1], [...new Set((literal[2] + 'gi').split(''))].join(''))
        : new RegExp(
            '(?<![\\w])(?:' +
              pattern
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map(escapeRegExp)
                .join('|') +
              ')(?![\\w])',
            'gi',
          )
      rules.push({ sev, name, re, why, rep, missing })
    } catch (e) {
      errors.push(`Line ${i + 1}: invalid pattern (${(e as Error).message}).`)
    }
  })

  return { rules, errors }
}

export function runAudit(draft: string, rules: Rule[]): Violation[] {
  const found: Violation[] = []
  const missing: Violation[] = []

  rules.forEach((rule) => {
    rule.re.lastIndex = 0
    if (rule.missing) {
      if (draft.search(rule.re) < 0) {
        missing.push({
          key: `${rule.name}:missing`,
          rule,
          start: -1,
          end: -1,
          text: '(required phrase absent)',
        })
      }
      return
    }
    for (const m of draft.matchAll(rule.re)) {
      if (!m[0] || m.index === undefined) continue
      found.push({
        key: `${rule.name}:${m.index}:${m[0]}`,
        rule,
        start: m.index,
        end: m.index + m[0].length,
        text: m[0],
      })
    }
  })

  found.sort((a, b) => a.start - b.start || b.end - a.end)
  const nonOverlapping: Violation[] = []
  let last = -1
  found.forEach((v) => {
    if (v.start >= last) {
      nonOverlapping.push(v)
      last = v.end
    }
  })
  return nonOverlapping.concat(missing)
}

export const applyFix = (draft: string, v: Violation) =>
  v.start < 0
    ? `${draft.trimEnd()} ${v.rule.rep}`
    : draft.slice(0, v.start) + v.rule.rep + draft.slice(v.end)

export async function sha256(input: string) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
    return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('')
  } catch {
    return null
  }
}

export const timestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
