import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// The test browser has no layout, so it does not include this browser feature.
globalThis.ResizeObserver = class {
  observe () {}
  unobserve () {}
  disconnect () {}
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
