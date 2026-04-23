/**
 * Three-state column sort: asc → desc → original (unsorted).
 * @param {string} clickedColumnId
 * @param {{ column: string | null, dir: 'asc' | 'desc' | null }} current
 * @returns {{ column: string | null, dir: 'asc' | 'desc' | null }}
 */
export function cycleTableSort(clickedColumnId, current) {
  const col = current?.column ?? null
  const dir = current?.dir ?? null
  if (col !== clickedColumnId) {
    return { column: clickedColumnId, dir: 'asc' }
  }
  if (dir === 'asc') return { column: clickedColumnId, dir: 'desc' }
  if (dir === 'desc') return { column: null, dir: null }
  return { column: clickedColumnId, dir: 'asc' }
}
