# Preview changes

Review the selected notes before saving. The blue heading shows the planned operation. If you added property conditions, their summary appears below it.

- **Before** — the current value.
- **After** — the proposed value.
- **Changed** — a change is proposed.
- **Skipped** — the note will stay as it is; read the reason.
- **Conflict** — the note cannot be changed safely as configured.

Missing, empty, and removed properties are different. Removing a property does not delete the note. For lists, **+** marks added items and crossed-out items are removed.

Search, sort, or open note links to review results. Use **Back** to adjust the batch editor. If notes have changed, go Back and **Refresh** before previewing again.

## Apply

Choose **Apply changes…**, check the operation and note count, then confirm **Apply**. Nothing is saved before confirmation.

Notes and property conditions are rechecked before saving. Original content is backed up, then the saved result is verified. Skipped and conflicting notes are left alone. Review the results for failures or notes needing attention.

Only affected property entries are edited; surrounding properties and note text are preserved. The changed entry's formatting may be adjusted. Complex layouts that cannot be edited safely become conflicts.

After applying a batch, use **Batch history / Undo** to review and undo saved changes.

## Search terms and operators

Search is case-insensitive and matches parts of words. Use:

- `study; research` or `study OR research` for either term.
- `study AND notes` or `study notes` for both terms, in any order.
- `study -archived` or `study NOT archived` to exclude archived matches.
- `"study notes"` for that exact phrase, with the words together.

NOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `"AND"` or `"a;b"`.

An unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.
