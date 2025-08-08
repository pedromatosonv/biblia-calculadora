import { format } from 'date-fns'
function escapeText(s: string) { return s.replace(/[\\;,\n]/g, (c) => ({'\\':'\\\\',';':'\;','\,':'\,','\n':'\\n'} as any)[c]) }
export function buildICS(events: { start: Date; title: string; description?: string }[], calName = 'Plano de Leitura') {
  const lines: string[] = []
  lines.push('BEGIN:VCALENDAR'); lines.push('VERSION:2.0'); lines.push('PRODID:-//Bible Planner//PT-BR//EN'); lines.push('CALSCALE:GREGORIAN')
  lines.push(`X-WR-CALNAME:${escapeText(calName)}`)
  for (const ev of events) {
    const dt = format(ev.start, "yyyyMMdd'T'000000")
    const uid = `${dt}-${Math.random().toString(36).slice(2)}@bible-planner`
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${dt}Z`)
    lines.push(`DTSTART;VALUE=DATE:${format(ev.start, 'yyyyMMdd')}`)
    lines.push(`DTEND;VALUE=DATE:${format(ev.start, 'yyyyMMdd')}`)
    lines.push(`SUMMARY:${escapeText(ev.title)}`)
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
