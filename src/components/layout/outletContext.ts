/** Shared with every routed page via <Outlet context>, so any page can open
 * the single global quick-capture sheet that AppShell owns. */
export interface AppOutletContext {
  openCapture: () => void
}
