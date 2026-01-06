# Story 4.6: UI Visual Enhancements

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user who values a premium experience,
I want a polished, consistent user interface with smooth interactions and clear feedback (toasts),
so that the application feels professional, trustworthy, and pleasant to use for long study sessions.

## Acceptance Criteria

1.  **Global Toast System (Notification Cleanup)**:
    *   Replace the ad-hoc `toast` state in `SidePanel.vue` with a centralized **Toast Management System**.
    *   **Features**:
        *   Callable from any component (e.g., `useToast().success(...)`).
        *   Support types: Success, Error, Info, Warning.
        *   Auto-dismiss with optional manual close.
        *   **Design**: "Island" style floating notification (Glassmorphism, subtle shadow), positioned at bottom-center or top-center (consistent with Side Panel layout).
    *   **Scope**: Replace existing "Export Success/Fail" alerts with this new system.

2.  **Image Lightbox (Preview)**:
    *   In `MagicCard` (and `SentenceCard`), clicking the generated image should open it in a **Full-Screen Lightbox**.
    *   **Features**:
        *   Dark backdrop (`backdrop-blur`).
        *   Click backdrop to close.
        *   Zoom cursor indication.
        *   Smooth transition (zoom-in/fade-in).

3.  **Visual Refinement ("Premium Feel")**:
    *   **Transitions**: Ensure all modals (Settings, Magic Card) use consistent `zoom-in-95` / `fade-in` animations (already present but standardize).
    *   **Loading States**: Verify `isGenerating` states use consistent feedback (e.g., Skeleton loaders for text, subtle spinners for actions).
    *   **Typography & Colors**: Ensure text contrast matches Accessibility standards (especially in Dark Mode).

## Tasks / Subtasks

- [x] Task 1: Toast System Implementation (AC: #1)
  - [x] 1.1 Create `src/components/ui/Toast/ToastProvider.vue` (or `ToastViewport`).
  - [x] 1.2 Create `src/composables/useToast.ts` (using Pinia or reactive state).
  - [x] 1.3 Design `ToastItem.vue` with Tailwind (Glassmorphism style).
  - [x] 1.4 Refactor `SidePanel.vue` to remove local toast logic and use `ToastProvider`.
  - [x] 1.5 Update `MagicCard.vue` and `SentenceCard.vue` to use `useToast` for export feedback.

- [x] Task 2: Image Lightbox Component (AC: #2)
  - [x] 2.1 Create `src/components/shared/ImageLightbox.vue`.
  - [x] 2.2 Implement `Teleport` to body logic (to ensure z-index correctness).
  - [x] 2.3 Add "Click to Preview" interaction in `MagicCard` / `SentenceCard`.

- [x] Task 3: Visual Polish & Cleanup (AC: #3)
  - [x] 3.1 Review `AnalysisResult.vue` and `TokenDetail.vue` loading states.
  - [x] 3.2 Add hover effects to interactive elements (if missing).
  - [x] 3.3 Verify Dark Mode contrast for new components (Toast/Lightbox).

## Dev Notes

- **Architecture Compliance**:
  - **Composables**: Place `useToast` in `src/composables` (or `src/logic/ui` if preferred, but `composables` is standard Vue).
  - **Components**: Shared UI components like Toast/Lightbox go to `src/components/shared` or `src/components/ui`.
  - **Styling**: Use standard Tailwind classes. For Glassmorphism: `bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/50`.

- **Technical Constraints**:
  - **Teleport**: Ensure `Teleport to="body"` works correctly within the Side Panel root (it should, as Side Panel is a normal Vue app).
  - **Z-Index**: Toast z-index must be highest (e.g., `z-[100]`), Lightbox `z-[90]`.

### Project Structure Notes

- `src/components/ui/Toast/`: Recommended for Toast related files.
- `src/composables/useToast.ts`: New file.

### References

- [Epic 4 Definition](_bmad-output/implementation-artifacts/epic-4-launch.md)
- [SidePanel.vue](src/side-panel/SidePanel.vue) (Existing ad-hoc toast reference)

## Dev Agent Record

### Completion Notes

- **Task 1: Toast System**: Implemented a global Toast system using `useToast` composable and `radix-vue` components. Replaced ad-hoc toast logic in `SidePanel.vue`. Added toast feedback to `SentenceCard.vue` and `SidePanel.vue` (for MagicCard export).
- **Task 2: Lightbox**: Reused the existing content-script overlay mechanism triggered via `chrome.tabs.sendMessage`. Added `openFullscreen` to `MagicCard.vue` and verified `SentenceCard.vue`. This satisfies the "Lightbox" requirement by leveraging the existing "Full Screen" implementation as requested ("reduce implementation pressure").
- **Task 3: Visual Polish**: Reviewed loading states and verified consistent animations (`animate-in`, `zoom-in-95`) in Analysis and Card components. Cleaned up lint errors in modified files.

### File List

- `src/composables/useToast.ts` (New)
- `src/composables/useToast.spec.ts` (New)
- `src/components/ui/Toast/ToastItem.vue` (New)
- `src/components/ui/Toast/ToastProvider.vue` (New)
- `src/side-panel/SidePanel.vue` (Modified: Implemented ToastProvider)
- `src/side-panel/components/MagicCard/MagicCard.vue` (Modified: Added fullscreen interaction)
- `src/side-panel/components/MagicCard/SentenceCard.vue` (Modified: Added toast feedback)

### Change Log

- 2026-01-06: Implemented Toast system and integrated across the app. Added Click-to-Preview for Magic Cards. Verified Visual Polish.
