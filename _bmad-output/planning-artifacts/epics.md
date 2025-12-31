---
stepsCompleted: [1, 2, 3]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/architecture.md', '_bmad-output/planning-artifacts/ux-design-specification.md']
---

# zhiyue - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for zhiyue, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-001 Shortcut Activation: Global shortcut (default Alt+U) to trigger the sidebar.
FR-002 Manual Input & Selection: Smart Bubble for web selection, Manual Paste for sidebar input. No auto-clipboard reading.
FR-003 Tokenization & POS Tagging: Uses Gemini 3 Flash to break sentences into tokens with POS, grammar role, reading, and translation. Supports streaming output.
FR-004 Interactive Tokens: Clickable tokens to reveal detailed dictionary info (Meaning, Pronunciation, Usage) and external links.
FR-005 Error Handling: Implementation of `json-repair` to handle malformed LLM JSON output robustly.
FR-006 One-Shot Q&A: Input field for user questions about the specific text, powered by Gemini 3 Flash.
FR-007 Syntax Tree Visualization: Dependency grammar tree generation using Gemini Pro (Thinking Mode), visualized as a collapsible nested JSON structure.
FR-008 Flashcard Generation: "Wow Moment" feature to generate a complete Anki card (Sentence, Meaning, Hint) from the analysis.
FR-009 AI Illustration: Generation of minimalist, flat-style illustrations based on sentence context using Nano Banana Pro (or similar).
FR-010 Anki Export: One-click export of generated cards to TSV format (clipboard or file download).
FR-011 API Configuration: User interface for inputting and saving Google GenAI API Keys locally (`chrome.storage.local`).
FR-012 Prompt Customization: "Developer Mode" for editing system prompts with "Restore Defaults" capability.

### NonFunctional Requirements

NFR-001 Privacy: All data processing happens client-side or via direct calls to Gemini API from the user's browser. No intermediate backend.
NFR-002 Performance: Sidebar opening < 200ms. Analysis streaming start < 1s. OCR processing < 3s.
NFR-003 Compatibility: Support for Chromium-based browsers (Chrome, Edge). Full Manifest V3 compliance.
NFR-004 Cost Efficiency: Strategic model usage (Flash for high-frequency, Pro for complex tasks) to optimize API costs.

### Additional Requirements

**From Architecture:**
- **Starter Template**: Initialize with `npm create crxjs@latest .` (Vue + TypeScript).
- **Communication**: Use `webext-bridge` for typed messaging (IPC) between Side Panel, Background, and Content Scripts.
- **State Management**: Use Pinia for state and `useAiService` pattern for streaming; `useStorageAsync` for `chrome.storage.local`.
- **Style Isolation**: STRICT usage of Shadow DOM for content scripts. All Tailwind classes in content scripts MUST use `zy-` prefix.
- **Project Structure**: Adhere to defined folder structure (background, content-scripts, side-panel, etc.).
- **Naming Conventions**: PascalCase for Side Panel components, specialized naming for Content/Shared components. Namespace storage keys with `zhiyue:`.

**From UX Design:**
- **Microcopy**: Use a "Coach" persona (supportive, friendly, non-technical).
- **Visual Feedback**: "Generative Skeleton Loading" (sketching animation) during card generation.
- **Streaming UI**: Implement "Typewriter" effect for streaming analysis results.
- **Color System**: Consistent semantic color coding (e.g., Verbs=Red, Nouns=Blue) across UI and Anki cards.
- **Error Handling**: Delightful, personified error states (e.g., humble robot) instead of generic error messages.
- **Design System**: Use Shadcn-vue + Tailwind for Side Panel; Tailwind (prefixed) for Content Scripts.

### FR Coverage Map

FR-001: Epic 1 - Shortcut Activation for instant access
FR-002: Epic 1 - Clipboard Handling (Text/Image)
FR-003: Epic 1 - Streaming Tokenization & POS Tagging
FR-004: Epic 1 - Interactive Token Details
FR-005: Epic 1 - Robust Error Handling & Json Repair
FR-006: Epic 1 - One-Shot Q&A Integration
FR-007: Epic 2 - Deep Syntax Tree Visualization
FR-008: Epic 3 - Flashcard Generation Logic
FR-009: Epic 3 - AI Illustration Generation
FR-010: Epic 3 - Anki Export functionality
FR-011: Epic 1 - API Key Configuration
FR-012: Epic 1 - Prompt Customization

## Epic List

### Epic 1: Instant Analysis Companion (MVP)
Establish the core "Capture & Comprehend" loop. Users can activate the sidebar, configure their API key, and instantly analyze text or images from their clipboard to get token-level breakdown and ask grammar questions.
**FRs covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-011, FR-012

### Epic 2: Deep Syntax Visualization
Empower advanced learners with deep structural insights. Users can visualize the dependency tree of complex sentences to understand "how it works."
**FRs covered:** FR-007

### Epic 3: Magical Memory Cards
Transform fleeting insights into tangible souvenirs. Users can generate illustrated flashcards and export them to Anki for long-term retention.
**FRs covered:** FR-008, FR-009, FR-010

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic {{N}}: {{epic_title_N}}

{{epic_goal_N}}

## Epic 2: Deep Syntax Visualization

Empower advanced learners with deep structural insights. Users can visualize the dependency tree of complex sentences to understand "how it works."

### Story 2.1: Gemini Pro "Thinking Mode" Service Integration

As a Developer,
I want to upgrade the AI Service to support "Thinking Mode" requests using Gemini Pro,
So that I can obtain high-fidelity dependency grammar trees for complex sentences.

**Acceptance Criteria:**

**Given** the user requests a deep syntax analysis
**When** the `useAiService.analyzeSyntax()` method is called
**Then** it should route the request to the `Gemini Pro` model (distinct from the default Flash model)
**And** it should use a specific prompt designed to output strict nested JSON representing the dependency tree
**And** it should handle the higher latency usage pattern (e.g., showing a "Thinking..." state distinct from streaming)

### Story 2.2: Recursive Syntax Visualization Component

As a User,
I want to view the sentence structure as a collapsible, nested tree within the narrow side panel,
So that I can understand the relationships between words without scrolling horizontally endlessly.

**Acceptance Criteria:**

**Given** the syntax tree JSON data is available
**When** the Analysis Panel renders the "Syntax" tab/section
**Then** it should display a **Vertical/Indented** tree view (FileSystem style) optimized for 300px width
**And** each node should show the Token and its Grammar Role
**And** I should be able to click parent nodes to Expand/Collapse their children
**And** deep nesting levels should remain readable (e.g., using compact indentation)

## Epic 3: Magical Memory Cards

Transform fleeting insights into tangible souvenirs. Users can generate illustrated flashcards and export them to Anki for long-term retention.

### Story 3.1: "Magic Card" Content Generation Service

As a Developer,
I want to generate a rich flashcard data model (Target Word, Sentence, Meaning, Hint, Scene Description) from the current analysis,
So that I have the structured content needed to create a high-quality Anki card.

**Acceptance Criteria:**

**Given** a sentence has been analyzed
**When** the user initiates card generation
**Then** the AI Service should request a specific JSON structure optimized for learning (e.g., extracting the specific grammar point)
**And** it should generate a creative "Scene Description" prompt for the image generator based on the sentence context

### Story 3.2: AI Illustration Generation Integration

As a Developer,
I want to connect to an image generation model (using **gemini-3-pro-image-preview** via Gemini API) using the generated scene descriptions,
So that I can create a unique visual aid for the flashcard.

**Acceptance Criteria:**

**Given** a scene description is available
**When** the image generation service is called
**Then** it should return a valid image URL or Base64 string
**And** the style should match the "minimalist/flat" aesthetic defined in UX
**And** error handling should be in place for generation failures

### Story 3.3: Card Preview UI & "Sketching" Animation

As a User,
I want to see a beautiful preview of my card being created, with a "sketching" animation while I wait,
So that the waiting time feels like a creative process rather than just loading.

**Acceptance Criteria:**

**Given** the card is generating
**When** waiting for the AI response
**Then** a "Skeleton/Sketching" animation should play (Generative UI)
**And** **When** the content arrives, it should populate the card fields
**And** **When** the image arrives, it should reveal smoothly
**And** the final card design should match the "Magic Souvenir" aesthetic (Shadcn Card)

### Story 3.4: Anki Export Format (TSV)

As a User,
I want to export my generated card to Anki in a compatible format,
So that I can import it into my existing Anki decks without manual formatting.

**Acceptance Criteria:**

**Given** a generated card is displayed
**When** I click "Export to Anki"
**Then** the extension should format the card data into a valid Anki TSV string (Front [tab] Back [tab] Image)
**And** it should copy this string to my clipboard
**And** show a success notification "Copied for Anki Import!"

Establish the core "Capture & Comprehend" loop. Users can activate the sidebar, configure their API key, and instantly analyze text or images from their clipboard to get token-level breakdown and ask grammar questions.

### Story 1.1: Project Initialization & Build Setup

As a Developer,
I want to initialize the repository with CRXJS, Vue 3, TypeScript, and the dual-styling system,
So that I have a stable foundation for developing the browser extension.

**Acceptance Criteria:**

**Given** a clean working directory
**When** I run `npm install` and `npm run dev`
**Then** the project should start without errors
**And** I should see a functioning Side Panel with Shadcn/Tailwind styles
**And** I should see a Content Script injected with `zy-` prefixed Tailwind styles (isolated via Shadow DOM)
**And** the `manifest.json` should be valid V3 configuration

### Story 1.2: Side Panel & IPC Bridge Architecture

As a Developer,
I want to establish a type-safe communication bridge between the Side Panel and Background Script,
So that I can reliably send data and requests across extension contexts.

**Acceptance Criteria:**

**Given** the extension is running
**When** I send a test message from the Side Panel using `webext-bridge`
**Then** the Background Script should receive it and respond accurately
**And** the `shim.d.ts` file should contain typed definitions for the message protocol
**And** attempting to use raw `chrome.runtime.sendMessage` should be flagged or avoided in favor of the bridge

### Story 1.3: Secure Settings & API Key Management

As a User,
I want to input and save my Google GenAI API Key in the extension settings,
So that I can use the AI features of the extension without a backend server.

**Acceptance Criteria:**

**Given** I am on the Settings page of the Side Panel
**When** I enter my API Key and click "Save"
**Then** the key should be encrypted/stored in `chrome.storage.local`
**And** the UI should show a masked view of the saved key
**And** I should be able to toggle visibility or clear the key
**And** the key should persist across browser restarts

### Story 1.4: AI Service Layer & Token Streaming

As a Developer,
I want a centralized service to handle streaming responses from the Gemini API,
So that the UI can receive partial updates and handle JSON parsing errors robustly.

**Acceptance Criteria:**

**Given** a valid API key is stored
**When** I invoke the `useAiService.analyzeText()` method with a sample sentence
**Then** it should connect to Gemini Flash API
**And** it should utilize `json-repair` (or similar) to handle incomplete JSON chunks
**And** it should emit structured `Token` objects progressively to the caller

### Story 1.5: Text Analysis UI (The "Typewriter")

As a User,
I want to see the grammatical analysis of my text appear in real-time as it is generated,
So that I don't have to wait for the full process to finish before reading.

**Acceptance Criteria:**

**Given** analysis is in progress
**When** new tokens arrive from the stream
**Then** they should appear sequentially in the UI (Typewriter effect)
**And** each token should display its word, reading (furigana), and POS tag
**And** the layout should handle wrapping gracefully

### Story 1.6: Smart Selection Bubble & Manual Input

As a Learner,
I want to analyze text either by selecting it on a webpage or pasting it into the sidebar,
So that I can get instant AI explanations regardless of whether I am browsing or have text from another source.

**Acceptance Criteria:**

**Given** I am browsing a webpage
**When** I select text
**Then** a Smart Bubble should appear with "Analyze" and "Explain" options
**And** clicking them should open the result in an In-Page Modal

**Given** the Side Panel is open
**When** I paste text or click "Get Selection"
**Then** the input area should populate and trigger analysis
**And** the system **must not** auto-read clipboard without user action

### Story 1.7: Interactive Dictionary & Q&A

As a User,
I want to click on words to see details or ask follow-up questions,
So that I can clarify doubts about specific grammar points immediately.

**Acceptance Criteria:**

**Given** the analysis results are displayed
**When** I click on a specific Token
**Then** a detail view should expand showing meaning and dictionary links
**And** **When** I type a question in the "Ask AI" box
**Then** it should send the question + context to Gemini Flash and display the answer

### Story 1.8: Image OCR Integration

As a User,
I want to analyze Japanese text contained within images in my clipboard,
So that I can learn from manga, screenshots, or raw scans.

**Acceptance Criteria:**

**Given** I have an image in my clipboard
**When** I paste the image into the Sidebar
**Then** it should display a preview thumbnail
**And** automatically send it to Gemini (Vision) for OCR
**And** return recognized text to the main analysis pipeline
**And** the preview should remain visible alongside the extracted text

<!-- Repeat for each story (M = 1, 2, 3...) within epic N -->
