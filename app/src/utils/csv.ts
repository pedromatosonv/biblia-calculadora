import { format } from 'date-fns'
export function buildCSV(rows: { date: Date, leitura: string }[]) {
  const header = ['Dia', 'Data', 'Leituras']
  const lines = [header.join(',')]
  rows.forEach((r, idx) => {
    const day = (idx + 1).toString()
    const data = format(r.date, 'dd/MM/yyyy')
    const leitura = '"' + r.leitura.replaceAll('"', '""') + '"'
    lines.push([day, data, leitura].join(','))
  })
  return lines.join('\n')
}
