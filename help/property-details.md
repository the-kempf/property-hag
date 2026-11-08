# Property details

Each row shows a note and the chosen property's value.

Search by note title or value. Click a note link to open it. Hover over a shortened title to see the full path. Lists appear as comma-separated values; **(empty)** means no value.

Click a heading to sort or drag the column divider to adjust widths.

Choose **Batch actions for this property** to start a batch edit with the property name filled in. You still choose the operation and notes, then review a preview before saving.

Use **Back** to return to the property list. Viewing or searching does not change notes or resize the window.

## Search terms and operators

Search is case-insensitive and matches parts of words. Use:

- `study; research` or `study OR research` for either term.
- `study AND notes` or `study notes` for both terms, in any order.
- `study -archived` or `study NOT archived` to exclude archived matches.
- `"study notes"` for that exact phrase, with the words together.

NOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `"AND"` or `"a;b"`.

An unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.
