# Batch actions

Change a property in several notes at once. This screen prepares a change; it does not save notes.

## 1. Check the scope

**Scope** shows the vault or folder you are working with. For a folder, **Include subfolders** also includes notes inside its subfolders.

To start from a folder, right-click it in Obsidian and choose **Batch Edit Properties**.

## 2. Choose an operation and property

Click **Property name** for suggestions, or type a name.

- **Create property** — add it where missing; skip notes that already have it.
- **Set property value** — change it where present; skip notes where missing.
- **Rename property** — change its name. Notes already using the new name are conflicts.
- **Replace value** — replace the exact existing value you enter.
- **Add list item** — add an item without duplicating it. A missing property can become a list.
- **Remove list item** — remove every matching item, keeping the property.
- **Replace list item** — replace matching items, keeping the others in order.
- **Delete property** — remove the property, keeping the note.
- **Delete empty properties** — remove the chosen property where its value is empty.

Only relevant fields appear. Entered values are kept when switching operations.

## 3. Find notes

**Find notes** chooses a starting filter for each operation. For example, Create starts with missing properties and Set starts with existing properties. You can change the filter.

**Match value** is what you are looking for. To replace **archived** with **active**, use **archived** as Match value and **active** as New value. Click or type for suggestions from this property's saved values.

Exact matches are case-sensitive and include the value type: text **1** and number **1** are different. **Contains** ignores case for text; for lists, it matches an exact item. Whole-list matching includes item order.

Empty means blank text, an empty list, or no value. Zero and an unchecked checkbox are not empty. A missing property is different from an empty one.

## 4. Enter the new value

Choose Text, Number, Checkbox, List, or Empty (null).

For a list, use **+ Add item** for each item and **×** to remove a row. No rows means an empty list. List-item operations change individual items; they do not replace the entire list. Dates use Text for now.

Red warnings explain incompatible types or values that will be cleared. Review them before proceeding.

## 5. Select notes and preview

Search by note title or property value. Check individual notes or choose **Select all filtered**. **Clear selection** unchecks them.

Click **Select**, **Note**, or **Current value** to sort the list. Click again to reverse the order. Select groups checked and unchecked notes without changing your selection.

When filters change, notes that no longer match are deselected. Newly matching notes are not selected automatically.

Choose **Preview changes**. If unavailable, check your selection, property name, and any invalid inputs. Preview shows proposed changes, skips, and conflicts.

## If notes change while you work

Save any unsaved notes, then choose **Refresh** to reload their current values. Notes that still match remain selected. Changed notes may be conflicts until refreshed.

Use **Back** from Preview to adjust your choices. Apply is available there after review and a separate confirmation.

For text and numeric **New value** fields, click or focus the input to see existing values for the selected property. Suggestions filter as you type, just like **Property name**. Choose a suggestion with the mouse or arrow keys and Enter, or type a new value. List-item operations suggest existing items of the selected type.

## Search terms and operators

Search is case-insensitive and matches parts of words. Use:

- `toastmasters; tm` or `toastmasters OR tm` for either term.
- `toastmasters AND speech` or `toastmasters speech` for both terms, in any order.
- `toastmasters -archived` or `toastmasters NOT archived` to exclude archived matches.
- `"public speaking"` for that exact phrase, with the words together.

NOT/minus applies first, then AND, then OR/semicolon. For example, `toastmasters OR tm AND speech` matches toastmasters, or matches both tm and speech. To exclude archived results from both alternatives, use `toastmasters NOT archived OR tm NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `"AND"` or `"a;b"`.

An unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.
