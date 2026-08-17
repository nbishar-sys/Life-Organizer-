import { useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useToast } from '../../context/ToastContext'
import {
  buildExportBundle,
  downloadExportBundle,
  importBundle,
  parseImportFile,
} from '../../data/exportImport'
import { clearAllData } from '../../data/repository'

export function DataBackup() {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleExport() {
    const bundle = await buildExportBundle()
    downloadExportBundle(bundle)
  }

  async function handleImportFile(file: File) {
    setBusy(true)
    try {
      const bundle = await parseImportFile(file)
      const result = await importBundle(bundle)
      showToast(`Imported ${result.importedEntries} entries, ${result.importedTags} tags.`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Everything lives only in this browser. Export a backup regularly, and use it to bring
        your entries to another device — Export here, then Import there. Importing merges rather
        than replaces, so it's safe to run more than once.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={handleExport}>
          Export backup
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          Import backup
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImportFile(file)
            e.target.value = ''
          }}
        />
      </div>

      <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">Danger zone</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Permanently erase every entry and tag on this device. This cannot be undone — export a
          backup first if you're not sure.
        </p>
        <Button size="sm" variant="danger" className="mt-3" onClick={() => setConfirmClear(true)}>
          Clear all data
        </Button>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear all data?"
        description="This permanently deletes every entry and tag on this device. There is no undo. Make sure you've exported a backup if you want to keep anything."
        confirmLabel="Erase everything"
        danger
        onConfirm={async () => {
          await clearAllData()
          setConfirmClear(false)
          showToast('All data cleared.')
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
