import { lazy, Suspense } from 'react'
import { Orbit } from 'lucide-react'

const NebulaCoreCanvas = lazy(() => import('./components/NebulaCoreCanvas.jsx'))

function App() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-void text-ion">
          <Orbit className="h-6 w-6 animate-spin" aria-label="正在载入记忆星云" />
        </div>
      }
    >
      <NebulaCoreCanvas />
    </Suspense>
  )
}

export default App
