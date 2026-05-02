import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    strictPort: true,
    host: '127.0.0.1',
    // Allow all nginx-proxied hostnames (Azure FQDN, nip.io, localhost)
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'gmd-portfolio.westus.cloudapp.azure.com',
      '.nip.io',
      '.sslip.io',
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/ws': {
        target: 'ws://127.0.0.1:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 8080,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        // Thresholds applied only to the included/non-excluded files below.
        // Key files (ws.ts, currency.ts, stores) all meet 80%+ line coverage.
        // Branch coverage is lower because UI component branch paths are covered
        // by Playwright E2E tests rather than unit tests.
        lines: 70,
        branches: 40,
        functions: 55,
        statements: 70,
      },
      include: [
        'src/lib/**',
        'src/stores/**',
        'src/features/canvas/modules/**',
        'src/components/ui/**',
      ],
      exclude: [
        // Network/browser-only files intentionally not unit-tested
        'src/lib/api.ts',
        'src/lib/useStrategyStream.ts',
        'src/lib/copy.ts',
        // UI-only primitives (covered by RTL but at low isolation)
        'src/components/ui/Toaster.tsx',
        'src/components/ui/Dialog.tsx',
        'src/components/ui/PageLoader.tsx',
        'src/components/ui/SkipLink.tsx',
        // Module components (covered by integration tests)
        'src/features/canvas/modules/GoalSummaryCard.tsx',
        'src/features/canvas/modules/NextStepActions.tsx',
        'src/features/canvas/modules/PortfolioSnapshotPanel.tsx',
        'src/features/canvas/modules/StrategyCardGrid.tsx',
        'src/features/canvas/modules/StrategyComparisonTable.tsx',
        'src/features/canvas/modules/ImportantConsiderations.tsx',
        'src/features/canvas/modules/ReadinessCard.tsx',
        'src/features/canvas/modules/RiskAssessmentCard.tsx',
      ],
    },
  },
})
