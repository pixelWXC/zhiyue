# Story 1-3: Secure Settings & API Key Management

**Status**: in-progress
**Epic**: Epic 1 - Instant Analysis Companion
**Started**: 2025-12-26
**Completed**: 
**Developer**: Gemini AI

## User Story

As a user, I need a secure and user-friendly way to input and manage my Google Gemini API Key, ensuring it is validated and stored safely so that I can use the extension's AI capabilities.

## Acceptance Criteria

1. **API Key Input UI**
   - [ ] Side Panel should have a dedicated "Settings" section/tab.
   - [ ] Input field for API Key should use `type="password"` by default.
   - [ ] Provide a toggle to show/hide the API Key.
   - [ ] Include a link to "Get Gemini API Key" (Google AI Studio).

2. **Validation & Storage**
   - [ ] Implement a "Verify & Save" action.
   - [ ] Validates the key by making a lightweight request to the Gemini API (e.g., list models).
   - [ ] If valid: Save to `chrome.storage.local` and show "✅ Active" status.
   - [ ] If invalid: Show specific error message and do NOT save (or mark as invalid).

3. **Security Best Practices**
   - [ ] Key should never be logged to console in production.
   - [ ] Use `chrome.storage.local` (not sync) to avoid syncing secrets across devices inadvertently (or allow user choice).

4. **State Management**
   - [ ] Use Pinia `useSettingsStore` to manage the key state and validation status.
   - [ ] UI should reflect the current state (Loading / Success / Error).

## Technical Context

- **Storage**: `chrome.storage.local` via `webext-bridge` (or direct adapter if in background).
- **Validation Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY`
- **Components**:
    - Refactor `SidePanel.vue` to include a proper `SettingsView.vue` component.
    - Create `src/stores/settings.ts`.
    - Enhance `src/lib/ipc.ts` for validation requests if needed (or keep API calls in Background).

## Implementation Tasks

### Task 1: Store & Logic Setup
- [ ] Create/Update `src/stores/settings.ts` with Pinia.
- [ ] Implement `checkApiKey` action in the store (calling background via bridge).
- [ ] Add `validate-api-key` handler in `background/index.ts`.

### Task 2: UI Implementation
- [ ] Create `src/components/Settings/ApiKeyInput.vue`.
- [ ] Implement Show/Hide logic.
- [ ] Implement "Verify" button with loading state.
- [ ] Style with TailwindCSS (dark/light mode compatible).

### Task 3: Integration
- [ ] Integrate `ApiKeyInput` into the main Side Panel view.
- [ ] Ensure settings persist across reloads.
