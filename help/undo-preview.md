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

- `study; research` or `study OR research` for either term.
- `study AND notes` or `study notes` for both terms, in any order.
- `study -archived` or `study NOT archived` to exclude archived matches.
- `"study notes"` for that exact phrase, with the words together.

NOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `"AND"` or `"a;b"`.

An unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.
