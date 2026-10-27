# Property Hag

Choose a tool:

- **List properties** — browse names, types, and how many notes use them.
- **Batch actions** — select notes, preview a change, then confirm Apply.
- **Find inconsistencies** — review possible mistakes or formatting differences.
- **Batch history / Undo** — review saved changes and restore eligible notes.

Browsing and previews do not change notes. Apply and Undo each ask for confirmation.

## Getting around

Use **Back** to return. Click **?** for help, then close help to continue.

On desktop, drag a window's title to move it or its bottom-right corner to resize it. Click table headings to sort; drag column dividers to adjust widths. Desktop windows keep their size while you search.

On mobile, windows fit the screen and adjust for the keyboard and rotation. Forms stack vertically; tables retain compact rows and columns with horizontal scrolling when needed. Tap a heading to sort and scroll to see more notes or controls. Window and column dragging remain desktop-only controls.

Searches and table settings are remembered while the plugin is running. Desktop and mobile are supported; physical Android/iPhone validation of the mobile is still pending.

## Search terms and operators

Search is case-insensitive and matches parts of words. Use:

- `toastmasters; tm` or `toastmasters OR tm` for either term.
- `toastmasters AND speech` or `toastmasters speech` for both terms, in any order.
- `toastmasters -archived` or `toastmasters NOT archived` to exclude archived matches.
- `"public speaking"` for that exact phrase, with the words together.

NOT/minus applies first, then AND, then OR/semicolon. For example, `toastmasters OR tm AND speech` matches toastmasters, or matches both tm and speech. To exclude archived results from both alternatives, use `toastmasters NOT archived OR tm NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `"AND"` or `"a;b"`.

An unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.
