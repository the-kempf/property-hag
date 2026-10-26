# Undo preview

## For a saved batch

- **Current** shows the affected properties now.
- **Undo restores** shows their original names and values.
- **Result** tells you whether a note is ready, skipped, or in conflict.

A property that was originally missing will be removed. An originally empty property stays present.

Later changes to affected properties, unsaved edits, and missing or replaced notes can prevent Undo. Unrelated properties and note text are preserved. Already undone changes are skipped.

Choose **Refresh Undo preview** to reread notes. Choose **Undo ready notes**, review the count, and confirm to restore ready notes. Check the results afterward.

**Original backup** opens the original note for inspection or copying. It does not restore it.

Search or sort to review notes. Use **Back** to return to the previous screen.

## Search terms and operators

Search is case-insensitive and matches parts of words. Use:

- `toastmasters; tm` or `toastmasters OR tm` for either term.
- `toastmasters AND speech` or `toastmasters speech` for both terms, in any order.
- `toastmasters -archived` or `toastmasters NOT archived` to exclude archived matches.
- `"public speaking"` for that exact phrase, with the words together.

NOT/minus applies first, then AND, then OR/semicolon. For example, `toastmasters OR tm AND speech` matches toastmasters, or matches both tm and speech. To exclude archived results from both alternatives, use `toastmasters NOT archived OR tm NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `"AND"` or `"a;b"`.

An unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.
