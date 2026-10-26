# Find inconsistencies

Look for properties that may need tidying. This screen reports suggestions only; it does not change notes.

Choose a category in **Show**:

- **Mixed value types** — for example, status is text in one note and a list in another.
- **Similar property names** — for example, Status and status, or due-date and due_date.
- **Value spelling / formatting variants** — for example, In Progress and in-progress.
- **Possible typo in property name** — for example, status and stauts.
- **Possible typo in value** — for example, archived and achived.

Typo checks compare nearby spellings, including text items in lists. They run locally without AI. Similar spelling does not prove an error or tell you which spelling is correct. Some short words, IDs, dates, links, and long text are excluded to reduce noise. A warning appears if a scan reaches its limit.

Search the findings or click headings to sort. Counts show how many notes use a spelling. Empty values do not count as mixed types.

If you decide a correction is needed, open **Batch actions** separately, choose the property and operation, select notes, and review the preview.

Use **Back** for the main menu. If indexing is incomplete, reopen this screen after Obsidian finishes.

## Search terms and operators

Search is case-insensitive and matches parts of words. Use:

- `toastmasters; tm` or `toastmasters OR tm` for either term.
- `toastmasters AND speech` or `toastmasters speech` for both terms, in any order.
- `toastmasters -archived` or `toastmasters NOT archived` to exclude archived matches.
- `"public speaking"` for that exact phrase, with the words together.

NOT/minus applies first, then AND, then OR/semicolon. For example, `toastmasters OR tm AND speech` matches toastmasters, or matches both tm and speech. To exclude archived results from both alternatives, use `toastmasters NOT archived OR tm NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `"AND"` or `"a;b"`.

An unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.
