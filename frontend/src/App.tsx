import { BrowserRouter } from 'react-router-dom'
import { Toaster } from './components/ui/Toaster'
import { SkipLink } from './components/ui/SkipLink'
import AppRoutes from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <SkipLink />
      <AppRoutes />
      <Toaster />
    </BrowserRouter>
  )
}
