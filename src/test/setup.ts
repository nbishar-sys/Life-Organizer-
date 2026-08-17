import '@testing-library/jest-dom/vitest'
// jsdom doesn't implement IndexedDB — Dexie (and therefore the whole data
// layer) needs a shim to run under Vitest.
import 'fake-indexeddb/auto'
