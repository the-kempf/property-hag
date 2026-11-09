# Changelog

## 1.1.1 — 11-09-2026

- Use a smaller embedded logo, reducing the plugin download by about two-thirds while keeping the same artwork and three-file installation.
- Retain the existing logo display size and transparent background.

## 1.1.0 — 11-08-2026

- Organize Batch actions into **Choose a change**, **Choose notes**, and **Review and apply**, with a plain-language batch summary.
- Combine multiple property conditions using **All (AND)** or **Any (OR)**. Filter by properties independently of the property being edited, with existing name/value suggestions and eligibility rechecks before saving.
- Infer filter value types where possible; show the type selector only for mixed or unknown types. Explain when filtering removes selected notes.
- Keep Back/Help visible while scrolling every tool window, and keep batch review actions below that navigation row.
- Explain common warnings in plain language with practical next steps, while retaining technical details in saved diagnostics.
- Prevent cramped List properties windows when reopening a remembered search.
- Preserve leading byte-order marks through verified reads, backups, and Undo, including Windows line endings.
- Add hidden local smoke diagnostics with isolated test data, verified Apply/Undo, interrupted-write recovery, automatic cleanup, and native Markdown report export. Include multiple-filter Apply, persisted reload, and exact Undo coverage.
- Fix temporary-folder cleanup on desktop adapters that report EISDIR for empty directories; retain unknown files for manual review.
- Update screen help and README for the new batch workflow and filters.

## 1.0.1 — 10-27-2026

- Fix oversized phone property cards: retain compact table rows and columns, with horizontal scrolling for wider tables. Desktop styling is unchanged.
- Tighten mobile table spacing and remove repeated cell labels.
- Verify rendered layouts at phone and tablet widths; all 15 automated checks pass.

## 1.0.0 — 10-26-2026

- First 1.0.0 release for Obsidian desktop and mobile.
- Includes advanced search, editable value suggestions, consistent action buttons, mobile layouts, and the results-filter state fix.
- Retains previews, confirmations, backups, verified writes, conflict checks, and saved Undo.
- Release metadata and documentation updated; editing behavior is unchanged from the tested build.

## 0.2.4 — 10-14-2026

- Keep history, Apply results, and Undo results search/layout state separate; different batches also keep independent results filters.

- Add mobile-specific screen-fitting windows, keyboard/rotation handling, touch-sized controls, and phone table cards. Desktop layout and interactions are preserved.
- Enable mobile installation and add mobile UI and Apply/Undo regression checks. Physical Android/iPhone validation remains pending.

- Add shared search operators: semicolon/OR, AND/whitespace, minus/NOT, and quoted phrases. Invalid searches match nothing and clear mismatching batch selections.

- Remove the pre-Apply Undo simulation button and simulation-only logic. Saved batch Undo is unchanged.

- New value uses the same editable dropdown as Property name, suggesting current property values while allowing new entries.

- Use consistent buttons for property batch actions, batch history / Undo, and original backup inspection.

- Place Batch history / Undo in a separate action row above the results search and table.

- Keep scrolling checkboxes beneath table headers so they cannot cover the column titles.

- Update release metadata and distribution files to 0.2.4 .
- Editing operations are unchanged.

## 0.2.3 — 10-14-2026

- Keep the README focused on installation and use.
- Move development and publishing instructions into docs/DEVELOPMENT.md.
- Refresh release metadata and distribution files; plugin behavior is unchanged.

## 0.2.2 — 10-14-2026

- Retain the verified 0.2.1 plugin behavior and appearance.
- Clean up obsolete development files and organize review records in docs.
- Verify the full automated regression suite and a native Apply → restart → Undo smoke test.
- Refresh the release files in dist; no ZIP is created.

## 0.2.1 — 10-14-2026

- Preserve verified and uncertain write outcomes if an unexpected exception occurs after writing.
- Correct minimum Obsidian version to 1.5.7, required by getFrontMatterInfo.
- Bundle the logo, screen help, and YAML license for the standard three-file installer.
- Add restart/Undo tests for every operation and fault tests for both history journals.

## 0.2.0 — 10-13-2026

Desktop by Kempf.

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

### Limits

- Desktop only; mobile has not been tested.
- Dates use text controls.
- Typo findings require your judgment and do not make automatic corrections.
- Complex property layouts or unsupported values may require manual editing.
