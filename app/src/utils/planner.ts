import { BOOKS } from '../data/books'
import { addDays, eachDayOfInterval } from 'date-fns'

export type Scope = 'all' | 'ot' | 'nt' | 'custom'

export type PlannerInput = {
  startBookIndex: number
  startChapter: number
  perDay: number
  startDate: Date
  excludePsalms: boolean
  allowedWeekdays: number[] // 0..6 (Sun..Sat)
  scope: Scope
  customBookIds?: string[] // used when scope = 'custom'
}

export type PlanItem = { date: Date, chapters: { bookIndex: number, chapter: number }[] }
export type Plan = {
  items: PlanItem[]
  totalChapters: number
  totalDays: number
  endDate: Date | null
}

function filterBooksIndices(scope: Scope, customBookIds?: string[]) {
  const indices: number[] = []
  BOOKS.forEach((b, i) => {
    if (scope === 'all') indices.push(i)
    else if (scope === 'ot' && b.testament === 'OT') indices.push(i)
    else if (scope === 'nt' && b.testament === 'NT') indices.push(i)
    else if (scope === 'custom' && customBookIds?.includes(b.id)) indices.push(i)
  })
  return indices
}

export function buildRemaining(startBookIndex: number, startChapter: number, excludePsalms: boolean, scope: Scope, customBookIds?: string[]) {
  const indices = filterBooksIndices(scope, customBookIds)
  const setIndices = new Set(indices)
  const remaining: { bookIndex: number, chapter: number }[] = []
  for (let i = startBookIndex; i < BOOKS.length; i++) {
    if (!setIndices.has(i)) continue
    const name = BOOKS[i].name
    if (excludePsalms && name === 'Salmos') continue
    const from = i === startBookIndex ? startChapter : 1
    for (let ch = from; ch <= BOOKS[i].chapters; ch++) {
      remaining.push({ bookIndex: i, chapter: ch })
    }
  }
  return remaining
}

export function generatePlan(input: PlannerInput): Plan {
  const {
    startBookIndex, startChapter, perDay, startDate, excludePsalms, allowedWeekdays, scope, customBookIds
  } = input

  const allowed = new Set(allowedWeekdays.length ? allowedWeekdays : [0,1,2,3,4,5,6])
  const remaining = buildRemaining(startBookIndex, startChapter, excludePsalms, scope, customBookIds)
  const items: PlanItem[] = []
  let idx = 0
  let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())

  while (idx < remaining.length) {
    while (!allowed.has(cursor.getDay())) {
      cursor = addDays(cursor, 1)
    }
    const dayChapters = remaining.slice(idx, idx + perDay)
    items.push({ date: new Date(cursor), chapters: dayChapters })
    idx += dayChapters.length
    cursor = addDays(cursor, 1)
  }

  const endDate = items.length ? items[items.length - 1].date : null
  return {
    items,
    totalChapters: remaining.length,
    totalDays: items.length,
    endDate,
  }
}

export function reverseGoal(
  startBookIndex: number,
  startChapter: number,
  startDate: Date,
  endDate: Date,
  excludePsalms: boolean,
  allowedWeekdays: number[],
  scope: Scope,
  customBookIds?: string[]
): number {
  const remaining = buildRemaining(startBookIndex, startChapter, excludePsalms, scope, customBookIds)
  const allowed = new Set(allowedWeekdays.length ? allowedWeekdays : [0,1,2,3,4,5,6])
  const days = eachDayOfInterval({ start: startDate, end: endDate })
    .filter(d => allowed.has(d.getDay())).length || 1
  return Math.max(1, Math.ceil(remaining.length / days))
}

export function humanizeRange(chapters: { bookIndex: number, chapter: number }[]) {
  if (!chapters.length) return ''
  const parts: string[] = []
  let i = 0
  while (i < chapters.length) {
    const bookIndex = chapters[i].bookIndex
    let start = chapters[i].chapter
    let end = start
    i++
    while (i < chapters.length && chapters[i].bookIndex === bookIndex && chapters[i].chapter === end + 1) {
      end = chapters[i].chapter
      i++
    }
    const bookName = BOOKS[bookIndex].name
    parts.push(start === end ? `${bookName} ${start}` : `${bookName} ${start}–${end}`)
  }
  return parts.join('; ')
}
