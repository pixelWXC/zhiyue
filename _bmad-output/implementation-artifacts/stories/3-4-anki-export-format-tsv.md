# Story 3.4: Anki Export Format (TSV)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a User,
I want to export my generated card to Anki in a compatible format,
so that I can import it into my existing Anki decks without manual formatting.

## Acceptance Criteria

1.  **TSV Formatting Logic:**
    *   **Given** a generated card with text ("Front", "Back") and an optional image,
    *   **When** formatting for Anki TSV export,
    *   **Then** fields must be separated by tabs (`\t`).
    *   **And** newlines within fields must be replaced by HTML `<br>` tags to preserve formatting.
    *   **And** the specific field mapping should be:
        *   Field 1 (Front): `Target Word` + `Reading` (Furigana) + `Sentence`
        *   Field 2 (Back): `Meaning` + `Hint` + `Translation`
        *   Field 3 (Image): The generated image (as an HTML `<img>` tag with Data URI or URL if supported, or provide instructions for media). *Note: For text clipboard export, handling images is tricky. We will format the image as an `<img>` tag with the Base64 source, which Anki's "Import from Clipboard" can sometimes handle, or at least provides a placeholder.*

2.  **Clipboard Action:**
    *   **Given** the "Magic Card" preview is showing the generated result,
    *   **When** I click "Export to Anki",
    *   **Then** the valid TSV string should be copied to the system clipboard.
    *   **And** a "Success" Toast notification should appear: "Copied for Anki Import!".
    *   **And** if the clipboard operation fails (e.g. permission denied), show an Error Toast.

3.  **UI Integration:**
    *   **Given** the `MagicCard` component,
    *   **Then** the "Export" button should be distinct (e.g., secondary action) and located near the "Save/Done" controls.
    *   **And** it should be disabled if card generation is incomplete.

## Tasks / Subtasks

- [x] Task 1: Create TSV Export Logic
  - [x] Create `src/logic/anki/exporter.ts`.
  - [x] Implement `formatDataForAnki(data: FlashcardData, imageSrc: string | null): string`.
  - [x] Ensure formatting rules: Tabs as separators, Newlines to `<br>`, sanitize HTML chars if needed.
  - [x] Create unit tests for the formatter in `src/logic/anki/__tests__/exporter.spec.ts`.

- [x] Task 2: Implement Copy Action in Store/Composable
  - [x] Update `useAiStore` or create a generic `useClipboard` composable (using VueUse is preferred if allowed, or native).
  - [x] Add `copyCardToClipboard` action that invokes the formatter.

- [x] Task 3: Update `MagicCard` UI
  - [x] Modify `src/side-panel/components/MagicCard/MagicCard.vue`.
  - [x] Add "Export to Anki" button (Lucide icon `Download` or `ClipboardCopy`).
  - [x] Integrate a Toast notification for success/failure feedback (ensure `Toaster` is present in Side Panel App).

- [x] Task 5: Enhance Card Data Model & Context Awareness (Replanned)
  - [x] Add `translation` to `FlashcardData` type.
  - [x] Update `card-generator.ts` and Prompts to generate translation.
  - [x] Update `exporter.ts` to include translation in export.
  - [x] Fix `SidePanel.vue` to pass selected token context to `generateCard`.

- [ ] Task 4: Integration Verification
  - [ ] Manual test: Generate a card, click Export, paste into Notepad to verify TSV structure.
  - [ ] Manual test: Paste into Anki "Import" dialog to verify field parsing.

## Dev Notes

### Architecture & Patterns
-   **Logic Location**: Anki specific logic belongs in `src/logic/anki/`.
-   **Separation of Concerns and Reusability**: The formatter should be a pure function testable without Vue.
-   **State Access**: The UI component (`MagicCard`) should trigger the action, but the logic should reside in the store or a dedicated service helper to keep components clean.

### Formatting Rules (Anki Standard)
-   TSV (Tab-Separated Values).
-   Field separator: `\t`
-   Line break: `<br>` (Anki treats actual newlines as new cards in some import modes, but usually allows quoted fields. However, `<br>` is safer for HTML fields).
-   Image handling: `<img src="base64...">` works in some Anki versions/plugins for clipboard paste, but standard import expects file paths. For this Story, we will use the `<img>` tag with the Base64 Data URI, which is the best effort for a pure clipboard-based web extension check.

### References
-   [Source: src/types/card.ts](FlashcardData definition)
-   [Source: src/side-panel/components/MagicCard/MagicCard.vue](Component to modify)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
- src/logic/anki/exporter.ts
- src/logic/anki/__tests__/exporter.spec.ts
- src/types/card.ts
- src/logic/prompts/card-gen.ts
- src/logic/ai/card-generator.ts
- src/stores/ai-store.ts
- src/stores/__tests__/ai-store-clipboard.spec.ts
- src/side-panel/SidePanel.vue
