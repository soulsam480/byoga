import { Alerts } from './lib/components/Alerts'
import { Navbar } from './lib/components/Navbar'
import { useRouter } from './lib/hooks/useRouter'
import { Home } from './lib/pages/Home'
import { Settings } from './lib/pages/Settings'

// TODO: next steps for UI ?
// // 1. file input
// // 2. logging processed value from worker
// // 3. putting data on a chart
// // 4. chart re-rendering

export function App() {
  const { page } = useRouter()

  return (
    <main class="flex h-screen w-screen">
      <Alerts />
      <Navbar />

      {page.value === 'home' && <Home />}
      {page.value === 'settings' && <Settings />}

    </main>
  )
}
