# Epic 4: Polishing & UX Refinement

## Overview
Based on the feedback from the "Party Mode" session, this epic focuses on resolving critical usability issues and enhancing the overall user experience. The main goals are to make the Anki export feature truly usable, provide a UI for managing system prompts, simplify the bubble interface by migrating heavy features to the sidebar, and introduce rapid AI services for instant feedback.

## Objectives
- **Fix Anki Export**: Refactor the export mechanism to a "split" model (Image Download + HTML Copy) to solve the large Base64 issue.
- **Prompt Management**: Allow users to view and modify system prompts via a new Settings interface.
- **UI Simplification**: Slim down the bubble UI, moving complex features to the Sidebar.
- **Responsiveness**: Implement "Rapid AI Services" for instant translation and token analysis.
- **Visual Polish**: Add image previews and other visual enhancements.

## Stories

### Story 4-1: System Settings & Prompt Management
- **Goal**: Create a centralized Settings page in the Sidebar.
- **Features**:
    - Gemini API Key management (moved from Bubble).
    - Prompt Engineering Lab: View/Edit/Reset system prompts.
    - Prompts stored in `chrome.storage`.
    - "Test IPC" removal.

### Story 4-2: Bubble UI Simplification & Sidebar Migration
- **Goal**: De-clutter the Bubble UI and establish the Sidebar as the home for "Heavy" features.
- **Features**:
    - Bubble: Remove Magic Card, Deep Explanation. Keep Translation, Simple Definition.
    - Sidebar: Handle "Deep Analysis", "Magic Card Generation".
    - Communication: Bubble triggers Sidebar actions with context.

### Story 4-3: Rapid AI Services (Fast Translation & Token Detail)
- **Goal**: Reduce perceived latency and provide instant utility.
- **Features**:
    - Rapid Translation: Auto-trigger cheap model for full-text translation.
    - Token Detail: Click token -> fetch simple definition/grammar/audio via cheap model.
    - Settings: Toggles for auto-trigger.

### Story 4-4: Anki Export Strategy Refactor
- **Goal**: Make Anki/Flashcard export robust and database-friendly.
- **Features**:
    - Remove Base64 embedding from export string.
    - "Download Image" button.
    - "Copy Front" / "Copy Back" buttons with file references.

### Story 4-5: UI Visual Enhancements
- **Goal**: Polish the visual experience.
- **Features**:
    - Image Lightbox/Preview for Magic Cards.
    - Global toast notifications cleanup.
    - "Premium" feel adjustements.
