# Story 1.6: Clipboard Auto-Capture & Shortcut

**Parent Epic:** Epic 1 - Instant Analysis Companion

## User Story

As a User,
I want the extension to automatically read my clipboard when I press `Alt+U`,
So that I can analyze text immediately without pasting it manually.

## Acceptance Criteria

1.  **Given** I have Japanese text in my system clipboard (and the extension has permission)
2.  **When** I press the global shortcut `Alt+U` (or user-configured shortcut)
3.  **Then** the Side Panel should open (if not already open)
4.  **And** it should automatically populate the input area with the clipboard content
5.  **And** (if configured or default behavior) it should auto-start the analysis
6.  **And** if the clipboard is empty or contains non-text/unsupported data, it should show a helpful, humble error message (using the "Coach" persona) asking for text input.

## Implementation Notes

- **Manifest V3 Commands**: Use `commands` API in `manifest.json`.
- **Clipboard Access**: Requires `clipboardRead` permission.
- **Workflow**:
    - **Background Script**: Listen for `chrome.commands.onCommand`.
    - **Side Panel Opening**: Use `chrome.sidePanel.open` (requires Chrome 116+).
    - **Communication**: When command is triggered, send message to Side Panel via `webext-bridge`.
    - **Clipboard Reading**: The Side Panel (DOM context) reads the clipboard using `navigator.clipboard.readText()`. This normally requires document focus.
    - **Auto-Start**: Triggers the existing `analyzeText` function.

## Detailed Tasks

- [ ] Update `manifest.json` to include `commands` ("suggested_key": { "default": "Alt+U" }) and `clipboardRead` permission.
- [ ] In `background/main.ts` (or similar), add listener for `verify-command` and open side panel.
- [ ] In `background/main.ts`, send a message "trigger-clipboard-read" to the side panel after opening.
- [ ] In `SidePanel.vue` (or `AnalysisView.vue`), listen for "trigger-clipboard-read".
- [ ] Implement `readClipboardAndAnalyze()` function in the logic layer (Vue composable).
- [ ] Handle permission errors or empty clipboard gracefully.
