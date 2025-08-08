import React, { useMemo, useState } from 'react'
import { BOOKS } from '../data/books'
import { generatePlan, humanizeRange, reverseGoal, Scope } from '../utils/planner'
import { buildICS } from '../utils/ics'
import { buildCSV } from '../utils/csv'
import { format } from 'date-fns'
import { Download, Calendar, Share2 } from 'lucide-react'

function parseDateInput(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }

export default function PlannerForm() {
  const todayISO = new Date().toISOString().slice(0,10)
  const [livro, setLivro] = useState(BOOKS.findIndex(b => b.name === '2 Samuel'))
  const [capitulo, setCapitulo] = useState(8)
  const [perDia, setPerDia] = useState(6)
  const [inicio, setInicio] = useState(todayISO)
  const [excluirSalmos, setExcluirSalmos] = useState(false)
  const [scope, setScope] = useState<Scope>('all')
  const [diasSemana, setDiasSemana] = useState<number[]>([0,1,2,3,4,5,6])
  const [metaReversa, setMetaReversa] = useState(false)
  const [terminarEm, setTerminarEm] = useState(todayISO)

  const capMax = BOOKS[livro].chapters
  const allowedWeekdays = diasSemana
  const startDate = parseDateInput(inicio)

  const plan = useMemo(() => {
    const pd = metaReversa ? reverseGoal(livro, capitulo, startDate, parseDateInput(terminarEm), excluirSalmos, allowedWeekdays, scope) : perDia
    return generatePlan({ startBookIndex: livro, startChapter: capitulo, perDay: Math.max(1, pd), startDate, excludePsalms: excluirSalmos, allowedWeekdays, scope })
  }, [livro, capitulo, perDia, inicio, excluirSalmos, diasSemana, metaReversa, terminarEm, scope])

  function downloadBlob(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
  }

  function exportICS() {
    const events = plan.items.map((it, i) => ({ start: it.date, title: `Plano Bíblia — Dia ${i+1}: ${humanizeRange(it.chapters)}`, description: `Leituras: ${humanizeRange(it.chapters)}` }))
    const ics = buildICS(events, 'Plano de Leitura da Bíblia'); downloadBlob(ics, 'plano_biblia.ics', 'text/calendar')
  }
  function exportCSV() {
    const rows = plan.items.map(it => ({ date: it.date, leitura: humanizeRange(it.chapters) }))
    const csv = buildCSV(rows); downloadBlob(csv, 'plano_biblia.csv', 'text/csv;charset=utf-8')
  }
  function shareLink() {
    const params = new URLSearchParams()
    params.set('b', String(livro)); params.set('c', String(capitulo)); params.set('p', String(perDia)); params.set('s', inicio)
    params.set('xps', excluirSalmos ? '1' : '0'); params.set('sc', scope); params.set('dw', diasSemana.join('-'))
    params.set('mr', metaReversa ? '1' : '0'); params.set('te', terminarEm)
    const url = location.origin + location.pathname + '?' + params.toString()
    navigator.clipboard.writeText(url).then(()=>alert('Link copiado!')).catch(()=>prompt('Copie o link:', url))
  }
  function toggleDia(n: number) { setDiasSemana(prev => prev.includes(n) ? prev.filter(x => x!==n) : [...prev, n].sort()) }

  React.useEffect(() => {
    const q = new URLSearchParams(location.search)
    const getNum = (key: string, def: number) => Number(q.get(key) ?? def)
    const getStr = (key: string, def: string) => String(q.get(key) ?? def)
    const getBool = (key: string) => getNum(key, 0) === 1
    const b = getNum('b', livro); if (!Number.isNaN(b) && b>=0 && b<BOOKS.length) setLivro(b)
    const c = getNum('c', capitulo); if (!Number.isNaN(c)) setCapitulo(Math.max(1, Math.min(BOOKS[b]?.chapters ?? BOOKS[livro].chapters, c)))
    setPerDia(getNum('p', perDia) || 1)
    setInicio(getStr('s', inicio))
    setExcluirSalmos(getBool('xps'))
    const sc = (getStr('sc', scope) as any); if (['all','ot','nt','custom'].includes(sc)) setScope(sc)
    const dw = getStr('dw', diasSemana.join('-')); setDiasSemana(dw.split('-').map(Number).filter(n=>!Number.isNaN(n)))
    setMetaReversa(getBool('mr')); setTerminarEm(getStr('te', terminarEm))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-5">
          <label className="text-sm text-slate-300">Livro atual</label>
          <select value={livro} onChange={e=>{setLivro(Number(e.target.value)); setCapitulo(1)}} className="w-full mt-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2">
            {BOOKS.map((b, i) => <option key={b.id} value={i}>{b.name}</option>)}
          </select>
        </div>
        <div className="col-span-3">
          <label className="text-sm text-slate-300">Capítulo atual</label>
          <input type="number" min={1} max={capMax} value={capitulo} onChange={e=>setCapitulo(Math.max(1, Math.min(capMax, Number(e.target.value) || 1)))} className="w-full mt-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2" />
        </div>
        <div className="col-span-4">
          <label className="text-sm text-slate-300">Data de início</label>
          <input type="date" value={inicio} onChange={e=>setInicio(e.target.value)} className="w-full mt-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2" />
        </div>

        <div className="col-span-4">
          <label className="text-sm text-slate-300">Capítulos por dia</label>
          <input type="number" min={1} value={perDia} onChange={e=>setPerDia(Math.max(1, Number(e.target.value) || 1))} className="w-full mt-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2" />
        </div>
        <div className="col-span-4">
          <label className="text-sm text-slate-300">Escopo</label>
          <select value={scope} onChange={e=>setScope(e.target.value as any)} className="w-full mt-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2">
            <option value="all">Bíblia inteira</option>
            <option value="ot">Apenas AT</option>
            <option value="nt">Apenas NT</option>
            <option value="custom" disabled>Custom (em breve)</option>
          </select>
        </div>
        <div className="col-span-4">
          <label className="text-sm text-slate-300">Meta reversa</label>
          <div className="flex items-center gap-2 mt-1">
            <input id="mr" type="checkbox" checked={metaReversa} onChange={e=>setMetaReversa(e.target.checked)} />
            <label htmlFor="mr" className="text-slate-300">Quero terminar até</label>
            <input type="date" value={terminarEm} onChange={e=>setTerminarEm(e.target.value)} className="rounded-md bg-slate-900 border border-slate-700 px-3 py-2" />
          </div>
        </div>

        <div className="col-span-6">
          <label className="text-sm text-slate-300">Dias da semana</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((lbl, i) => (
              <button type="button" key={i} onClick={()=>toggleDia(i)} className={`px-3 py-1 rounded-md border ${diasSemana.includes(i) ? 'bg-slate-800 border-slate-500' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>{lbl}</button>
            ))}
          </div>
        </div>

        <div className="col-span-6">
          <label className="text-sm text-slate-300">Opções</label>
          <div className="flex items-center gap-3 mt-1">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={excluirSalmos} onChange={e=>setExcluirSalmos(e.target.checked)} /> Excluir Salmos</label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-2xl font-extrabold text-emerald-400">Término: {plan.endDate ? format(plan.endDate, 'dd/MM/yyyy') : '—'}</div>
          <div className="px-3 py-1 rounded-full border border-slate-700 bg-slate-950">Dias: {plan.totalDays}</div>
          <div className="px-3 py-1 rounded-full border border-slate-700 bg-slate-950">Capítulos restantes: {plan.totalChapters}</div>
          <button onClick={exportCSV} className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700"><Download size={16}/>CSV</button>
          <button onClick={exportICS} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700"><Calendar size={16}/>ICS</button>
          <button onClick={shareLink} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700"><Share2 size={16}/>Compartilhar</button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h3 className="font-bold mb-2">Primeiros 14 dias</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {plan.items.slice(0,14).map((it, idx) => (
            <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div className="text-sm text-slate-400">Dia {idx+1} — {format(it.date, 'dd/MM/yyyy')}</div>
              <div className="mt-1 font-semibold">{humanizeRange(it.chapters)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
