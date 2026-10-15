# Batch history / Undo

Review saved batches and undo eligible changes. Previews do not create history entries.

Times use your local timezone: **MM-DD-YYYY HH:MM**, with a 24-hour clock.

## Undo a batch

1. Open the batch.
2. Review its Undo preview and any conflicts.
3. Choose **Undo ready notes**, then confirm.
4. Check the results.

Only changes that were saved and verified can be undone. Failed, uncertain, conflicting, or already undone records are left alone.

Later edits to the affected property can prevent Undo. Other property edits and note text are preserved. Save unsaved notes before retrying. Missing or moved notes may require manual review.

**Original backup** lets you inspect or copy the original note for manual recovery. Opening it does not restore anything.

## Keep your history

History and backups stay locally in the plugin folder. Backups contain full note content. Keep **data.json**, **history-backup.json**, and **backups/** together to retain Undo after restarting. Do not share them with a plugin release.

If a run is interrupted, reopening the plugin checks what was saved without changing notes. Damaged or missing history may block editing; do not delete individual backup files to bypass a warning.

Search or sort to find a batch. Choose **Refresh history** to reload, or **Back** for the main menu.
