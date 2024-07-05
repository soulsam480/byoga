import { useResource } from 'voby'

const ExcelWorker = new ComlinkWorker<
  typeof import('./lib/workers/xlsx.worker')
>(new URL('./lib/workers/xlsx.worker', import.meta.url))

export function App(): JSX.Element {
  const worker = useResource(async () => await new ExcelWorker.ExcelWorker())

  function handleFile(event: Event) {
    const target = event.target as HTMLInputElement

    const file = target.files?.[0]

    if (file === undefined)
      return

    worker().value?.process(file)
  }

  return (
    <>
      <label for="file">Choose file</label>
      <input name="file" type="file" onChange={handleFile} />
    </>
  )
}
