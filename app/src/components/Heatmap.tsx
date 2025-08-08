import React from 'react'
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns'

type Props = { dates: Date[]; completed: Set<string> }
function key(d: Date) { return d.toISOString().slice(0,10) }

export default function Heatmap({ dates, completed }: Props) {
  if (!dates.length) return null
  const start = startOfMonth(dates[0])
  const end = endOfMonth(dates[dates.length-1])
  const all = eachDayOfInterval({ start, end })
  return (
    <div className="grid grid-cols-14 gap-1">
      {all.map((d, i) => {
        const k = key(d)
        const has = dates.some(x => key(x) === k)
        const done = completed.has(k)
        return (
          <div key={i} title={`${format(d, 'dd/MM/yyyy')}${done ? ' — lido' : has ? ' — planejado' : ''}`}
            className={`h-4 w-4 rounded ${done ? 'bg-emerald-500' : has ? 'bg-slate-600' : 'bg-slate-800'}`}/>
        )
      })}
    </div>
  )
}
