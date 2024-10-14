import { useComputed, useSignal } from '@preact/signals'
import type { IModelLike } from '../../db/schema'

/**
 * function handling state for table row seelction/multi selection
 */
export function useTableSelection<T extends IModelLike>(_rowIds: () => number[]) {
  const rowIds = useComputed(_rowIds)

  const selectionState = useSignal<Set<number>>(new Set())
  const allSelected = useSignal(false)

  function resetSelection() {
    selectionState.value = new Set()
  }

  function toggleSelection(model: T) {
    // store in local as signals operate on full ref.
    const localVal = new Set(selectionState.value)

    if (localVal.has(model.id)) {
      localVal.delete(model.id)
    }
    else {
      localVal.add(model.id)
    }

    allSelected.value = localVal.size === rowIds.value.length

    selectionState.value = localVal
  }

  function toggleFullSelection() {
    if (allSelected.value) {
      resetSelection()
      allSelected.value = false
      return
    }

    selectionState.value = new Set(rowIds.value)
    allSelected.value = true
  }

  // lazy fetch to avoid running comp too many times
  function getSelected(rows: T[]) {
    return rows.filter(it => selectionState.value.has(it.id))
  }

  const hasSelection = useComputed(() => selectionState.value.size > 0)

  return {
    selectionState,
    toggleSelection,
    toggleFullSelection,
    getSelected,
    allSelected,
    hasSelection,
    resetSelection,
  }
}
