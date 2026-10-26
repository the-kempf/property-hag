# Property details

Each row shows a note and the chosen property's value.

Search by note title or value. Click a note link to open it. Hover over a shortened title to see the full path. Lists appear as comma-separated values; **(empty)** means no value.

Click a heading to sort or drag the column divider to adjust widths.

Choose **Batch actions for this property** to start a batch edit with the property name filled in. You still choose the operation and notes, then review a preview before saving.

Use **Back** to return to the property list. Viewing or searching does not change notes or resize the window.

## Search terms and operators

Search is case-insensitive and matches parts of words. Use:

- `toastmasters; tm` or `toastmasters OR tm` for either term.
- `toastmasters AND speech` or `toastmasters speech` for both terms, in any order.
- `toastmasters -archived` or `toastmasters NOT archived` to exclude archived matches.
- `"public speaking"` for that exact phrase, with the words together.

NOT/minus applies first, then AND, then OR/semicolon. For example, `toastmasters OR tm AND speech` matches toastmasters, or matches both tm and speech. To exclude archived results from both alternatives, use `toastmasters NOT archived OR tm NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `"AND"` or `"a;b"`.

An unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.
