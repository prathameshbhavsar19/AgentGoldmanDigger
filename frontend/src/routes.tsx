import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppShell from './components/layout/AppShell'
import PageLoader from './components/ui/PageLoader'

const LandingPage       = lazy(() => import('./features/landing/LandingPage'))
const OnboardingShell   = lazy(() => import('./features/onboarding/OnboardingShell'))
const AICanvasPage      = lazy(() => import('./features/canvas/AICanvasPage'))

export default function AppRoutes() {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"               element={<LandingPage />} />
          <Route path="/onboarding"     element={<OnboardingShell />} />
          <Route path="/canvas/:jobId"  element={<AICanvasPage />} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
