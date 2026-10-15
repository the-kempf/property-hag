# Changelog

## 0.2.4 Beta — 10-14-2026

- Update release metadata and distribution files to 0.2.4 Beta.
- Plugin behavior and appearance are unchanged.

## 0.2.3 Beta — 10-14-2026

- Keep the README focused on installation and use.
- Move development and publishing instructions into docs/DEVELOPMENT.md.
- Refresh release metadata and distribution files; plugin behavior is unchanged.

## 0.2.2 Beta — 10-14-2026

- Retain the verified 0.2.1 plugin behavior and appearance.
- Clean up obsolete development files and organize review records in docs.
- Verify the full automated regression suite and a native Apply → restart → Undo smoke test.
- Refresh the release files in dist; no ZIP is created.

## 0.2.1 Beta — 10-14-2026

- Preserve verified and uncertain write outcomes if an unexpected exception occurs after writing.
- Correct minimum Obsidian version to 1.5.7, required by getFrontMatterInfo.
- Bundle the logo, screen help, and YAML license for the standard three-file installer.
- Add restart/Undo tests for every operation and fault tests for both history journals.

## 0.2.0 beta — 10-13-2026

Desktop beta by Kempf.

### Browse and review

- List vault properties with note counts and observed value types.
- Show a sortable Empty count for blank values, null values, and empty lists.
- Search property names, note titles, and values; sort and resize table columns.
- Find mixed types, formatting variants, and possible spelling mistakes locally.
- Move and resize windows, keep their size steady during searches, and retain navigation state.
- Open help for each screen.

### Batch editing

- Create, set, rename, replace, and delete properties.
- Add, remove, and replace list items; remove empty properties.
- Start from the vault or a folder, optionally including subfolders.
- Show only the controls needed for the chosen operation.
- Suggest existing property names and matching values.
- Deselect notes when they no longer match a filter.
- Preview changes and warnings before a separate Apply confirmation.

### Verification and Undo

- Back up notes before writing and verify saved results.
- Edit only affected property entries, preserving surrounding content.
- Block unsafe layouts, stale notes, and unsaved edits.
- Save batch history and provide a separate Undo preview and confirmation.
- Preserve unrelated edits during Undo and report conflicts.

### Beta limits

- Desktop only; mobile has not been tested.
- Dates use text controls.
- Typo findings require your judgment and do not make automatic corrections.
- Complex property layouts or unsupported values may require manual editing.
