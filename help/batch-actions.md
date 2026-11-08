# Batch actions

Prepare a change in three steps: choose a change, choose notes, then review and apply. Browsing and Preview do not save notes.

## 1. Choose a change

Choose an **Operation** and click **Property name** for suggestions, or type a name. This property is independent of the properties used in your filters.

- **Create property** — add it where missing; skip notes that already have it.
- **Set property value** — change it where present; skip notes where missing.
- **Rename property** — change its name. Notes already using the new name are conflicts.
- **Replace value** — replace the exact existing value you enter.
- **Add list item** — add an item without duplicating it. A missing property can become a list.
- **Remove list item** — remove every matching item, keeping the property.
- **Replace list item** — replace matching items, keeping the others in order.
- **Delete property** — remove the property, keeping the note.
- **Delete empty properties** — remove it where its value is empty.

Only relevant fields appear. Entered values are kept when switching operations. Use the property condition cards in step 2 to narrow your notes. Each operation also keeps its own eligibility rules, such as creating a property only where it is missing.

For replacement operations, **Match value** is the original value or list item you want to replace. To replace archived with active, enter **archived** as Match value and **active** as New value.

Choose Text, Number, Checkbox, List, or Empty (null) when entering a new value. Click or focus text/number fields for existing-value suggestions. Choose with the mouse or arrow keys and Enter, or type something new.

For lists, use **+ Add item** for each item and **×** to remove a row. No rows means an empty list. List-item operations change individual items, preserving other items. Dates use Text for now.

Review warnings about incompatible types or values being cleared.

## 2. Choose notes

**Scope** shows the vault or folder you are working with. For a folder, **Include subfolders** includes notes inside its subfolders. To start from a folder, right-click it in Obsidian and choose **Batch Edit Properties**.

Choose **+ Add filter** for each property condition. Each card offers a **Filter property**, **Filter condition**, and a typed **Filter value** when needed. Property and value fields suggest existing names and values. Choose **Remove** on a card to delete that condition.

Value types are inferred from the property and condition. Text properties show text suggestions, numbers use a number input, and checkbox properties offer Checked/Unchecked. Contains on a list uses its item types and suggestions. A type selector appears only for mixed or unknown types. Exists, Is missing, and Is empty need no value.

- **All conditions (AND)** — a note must satisfy every condition.
- **Any condition (OR)** — a note can satisfy any one condition.
- No conditions — include all notes in scope that qualify for the chosen operation and search.

**Equals** requires the same value and type: text **1** and number **1** are different. For whole lists, order matters. **Contains** ignores capitalization in text, or matches an exact typed list item. Numeric comparisons require a number.

**Exists**, **Is missing**, and **Is empty** do not need a value. Empty means blank text, an empty list, or no value. Zero and an unchecked checkbox are not empty. A missing property is different from an empty property.

Search narrows the matching notes further. It checks note titles and the current value of the property you choose to edit in step 1, not all properties or full note content. Scope, search, and operation requirements always apply, including when Any condition is selected.

For example, to add a status only to peer-perspective notes:

1. In step 1, choose **Create property**, enter **status**, and enter the desired value.
2. In step 2, add a condition: **subcategory**, **Equals (same type)**, and **peer-perspective**.
3. In step 3, review the matching notes, select them, and preview.

Create already protects notes that have a status. To make that requirement visible as a condition too, add **status → Is missing** and choose **All conditions**.

Changing conditions clears selections that no longer qualify. Newly matching notes are not selected automatically. An unfinished or invalid condition matches no notes, including in Any mode.

## 3. Review and apply

Read the plain-language description of the proposed batch. Check individual notes or choose **Select all filtered**. **Clear selection** unchecks them. Counts show matching notes, selected notes, proposed changes, skips, and conflicts.

Click **Select**, **Note**, or **Current value** to sort. Sorting does not change your selection. The action toolbar stays available while scrolling through the review section.

Choose **Preview changes**. If unavailable, check your selection, property name, and any invalid inputs. Preview shows proposed changes and conflicts and retains the filter summary. Use **Back** to adjust your choices; filter cards, values, and eligible selections are retained.

Apply requires a separate confirmation. Preview and Apply recheck the property conditions. A note that no longer qualifies is not changed. Undo reverses the saved change without requiring the note to still match those conditions.

## If notes change while you work

Save unsaved notes, then choose **Refresh** to reload current values. Inputs and matching selections are kept. Changed notes may remain conflicts until refreshed. Removed selections are explained beside the counts.

## Search terms and operators

Search is case-insensitive and matches parts of words. Use:

- `study; research` or `study OR research` for either term.
- `study AND notes` or `study notes` for both terms, in any order.
- `study -archived` or `study NOT archived` to exclude archived matches.
- `"study notes"` for that exact phrase, with the words together.

NOT/minus applies first, then AND, then OR/semicolon. For example, `study OR research AND notes` matches study, or matches both research and notes. To exclude archived results from both alternatives, use `study NOT archived OR research NOT archived`. Operators also accept lowercase. Quote literal operator words or semicolons, such as `"AND"` or `"a;b"`.

An unfinished or invalid query shows an error and matches nothing. In Batch actions, selections that no longer match are cleared. These operators apply to search bars; property/value suggestion dropdowns and the typed **Match value** filter continue to use literal values. Search still uses each screen's existing fields; it does not search all note content.
