# Preview changes

Review the selected notes before saving. The blue heading shows the planned operation.

- **Before** — the current value.
- **After** — the proposed value.
- **Changed** — a change is proposed.
- **Skipped** — the note will stay as it is; read the reason.
- **Conflict** — the note cannot be changed safely as configured.

Missing, empty, and removed properties are different. Removing a property does not delete the note. For lists, **+** marks added items and crossed-out items are removed.

Search, sort, or open note links to review results. Use **Back** to adjust the batch editor. If notes have changed, go Back and **Refresh** before previewing again.

## Apply

Choose **Apply changes…**, check the operation and note count, then confirm **Apply**. Nothing is saved before confirmation.

Notes are rechecked, backed up, saved, and verified. Skipped and conflicting notes are left alone. Review the results for failures or notes needing attention.

Only affected property entries are edited; surrounding properties and note text are preserved. The changed entry's formatting may be adjusted. Complex layouts that cannot be edited safely become conflicts.

After applying a batch, use **Batch history / Undo** to review and undo saved changes.

## Search terms and operators

Search is case-insensitive and matches parts of words. Use:

- `toastmasters; tm` or `toastmasters OR tm` for either term.
- `toastmasters AND speech` or `toastmasters speech` for both terms, in any order.
- `toastmasters -archived` or `toastmasters NOT archived` to exclude archived matches.
- `"public speaking"` for that exact phrase, with the words together.

NOT/minus applies first, then AND, then OR/semicolon. For example, `toastmasters OR tm AND speech` matches toastmasters, or matches both tm and speech. To exclude archived results from both alternatives, use `toastmasters NOT archived OR tm NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `"AND"` or `"a;b"`.

An unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.
