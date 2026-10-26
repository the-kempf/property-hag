# List properties

Each row shows a property used in your notes:

- **Property** — its name.
- **Uses** — the number of notes containing it, including empty values.
- **Empty** — the number of notes where it is blank, null, or an empty list. Missing properties, zero, and unchecked checkboxes do not count as empty.
- **Type** — the values found in those notes, such as Text, Number, Checkbox, or List. **Mixed** means more than one type is used.

A list with several items still counts once per note. Type reflects the saved values, which may differ from Obsidian's property settings.

Search by part of a name. Click a property to see its notes and values. Click headings to sort, or, on desktop, drag dividers to resize columns.

Only properties in the note's main properties section are included. If Obsidian is still indexing, reopen the list when it finishes.

Use **Back** for the main menu. Searching keeps the window size steady; resize it manually if needed.

## Search terms and operators

Search is case-insensitive and matches parts of words. Use:

- `toastmasters; tm` or `toastmasters OR tm` for either term.
- `toastmasters AND speech` or `toastmasters speech` for both terms, in any order.
- `toastmasters -archived` or `toastmasters NOT archived` to exclude archived matches.
- `"public speaking"` for that exact phrase, with the words together.

NOT/minus applies first, then AND, then OR/semicolon. For example, `toastmasters OR tm AND speech` matches toastmasters, or matches both tm and speech. To exclude archived results from both alternatives, use `toastmasters NOT archived OR tm NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `"AND"` or `"a;b"`.

An unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.
