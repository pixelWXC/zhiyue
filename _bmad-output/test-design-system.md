# System-Level Test Design

**Project**: zhiyue  
**Date**: 2025-12-25  
**Author**: Test Architect (Tea)  
**Phase**: Solutioning (System Testability Review)

## Testability Assessment

### Criteria Evaluation

- **Controllability**: **PASS**
  - **State**: Centralized state management via `Pinia` allows easy state injection and clearing for tests.
  - **Dependencies**: The `useAiService` pattern with a distinct client layer (`src/logic/ai/client.ts`) allows straightforward mocking of the Google GenAI SDK for deterministic definition of "AI responses".
  - **Configuration**: `chrome.storage.local` abstraction via `useStorageAsync` permits easy programmatic setting of user preferences (API keys, prompts) before test execution.

- **Observability**: **PASS**
  - **Inspection**: The stream parser (`stream-parser.ts`) processes chunks, offering granular instrumentation points to measure latency and parsing success/failure.
  - **Logging**: Centralized error handling in the AI Service Layer facilitates monitoring of JSON repair failures or network issues.

- **Reliability**: **PASS (with High Risk Note)**
  - **Architecture**: `webext-bridge` significantly improves reliability of IPC over raw `chrome.runtime`, reducing flaky tests caused by "port closed" errors.
  - **Isolation**: Strict Shadow DOM strategy (`zy-` prefix) isolates the extension from host page styles, reducing "environmental" flakiness in E2E tests across different target sites.
  - **Risk**: The ephemeral nature of Manifest V3 Service Workers poses a reliability risk for long streams. Tests must verify state recovery if the SW suspends (though less likely in short interactions).

## Architecturally Significant Requirements (ASRs)

These requirements drive the testing strategy due to their complexity and risk.

| ASR ID | Requirement | Probability (1-3) | Impact (1-3) | Risk Score | Mitigation Strategy |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **ASR-1** | **Service Worker State Persistence** (MV3 constraint) | 2 | 3 | **6 (HIGH)** | Validated "Rehydration" tests; Ensure Pinia state syncs to storage immediately. |
| **ASR-2** | **AI Stream JSON Resilience** (FR-005) | 3 | 2 | **6 (HIGH)** | Extensive unit testing of `stream-parser.ts` with malformed/partial JSON chunks. |
| **ASR-3** | **Performance: Streaming Latency < 1s** (NFR-002) | 2 | 2 | 4 (MED) | E2E Performance tests measuring TTFB (Time To First Byte) from UI trigger to first token render. |
| **ASR-4** | **Style Isolation** (Shadow DOM) | 2 | 2 | 4 (MED) | Visual Regression Testing on complex host pages (e.g., sites with aggressive CSS resets). |

## Test Levels Strategy

Given the **Browser Extension** nature and **AI reliance**, the strategy shifts heavily towards Unit tests for logic and robust E2E for integration.

- **Unit Testing: 60%**
  - **Focus**: `stream-parser.ts` (Critical), `useAiService` logic, `useStorageAsync` wrappers, JSON Repair logic.
  - **Rationale**: The core complexity is parsing fragile LLM outputs. This allows fast, deterministic verification without browser overhead.
  - **Tooling**: Vitest + Mock Service Worker (or simple mocks).

- **Component Testing: 20%**
  - **Focus**: Side Panel components (Shadcn), Injected Floating UI (`ResultModal.vue`), "Magic Card" preview rendering.
  - **Rationale**: Validating UI states (loading, streaming, error, success) in isolation from the backend.
  - **Tooling**: Vue Test Utils / CyComponent.

- **E2E Testing: 20%**
  - **Focus**: Critical User Journeys (CUJ) - "Capture -> Analyze -> Result". Extension loading, IPC bridge verification, Permissions flow.
  - **Rationale**: Essential to verify the `Side Panel <-> Background <-> Content Script` orchestration which cannot be unit tested easily.
  - **Tooling**: Playwright (with experimental extension support).

## NFR Testing Approach

- **Security (Client-Side)**:
  - **API Key Handling**: Unit test to verify key is *never* logged and is masked in UI.
  - **CSP Compliance**: Build-time check to ensure no `unsafe-eval` is generated.
  - **Data Leakage**: E2E test to monitor network requests, ensuring only `generativelanguage.googleapis.com` is contacted during analysis.

- **Performance (Latency)**:
  - **Metric**: Time from "Shortcut Press" to "First Token Rendered".
  - **Method**: Instrumented E2E tests using mock AI responses (to measure system overhead, removing network variance).

- **Reliability (Network)**:
  - **Chaos**: simulate network interruptions during the streaming phase to verify `json-repair` and error UI robustness.

## Test Environment Requirements

1.  **Browser Harness**: Ability to load unpacked extension in Chrome Headless (new mode) or Headed for E2E.
2.  **Mock AI Provider**: A local proxy or interceptor pattern to simulate Gemini responses (Streaming & Non-streaming) to avoid API costs and non-determinism during CI.
3.  **Host Page Fixtures**: Static HTML pages enabling consistent testing of Content Script injection and OCR/Clipboard logic.

## Testability Concerns

- **Concern 1: Playwright + Extensions**: Testing Chrome Extensions with Playwright has known limitations (e.g., testing the Side Panel specifically).
  - *Recommendation*: Use a "Pop-out" URL approach for Side Panel E2E testing if direct panel interaction is flaky.
- **Concern 2: Service Worker Debugging**: Automating the inspection of Background Service Worker logs/state in CI can be difficult.
  - *Recommendation*: Ensure robust application-level logging that can be surfaced to the UI or storage for test reading.

## Recommendations for Implementation Phase

1.  **Prioritize the "Mock AI" Layer**: Build the `client.ts` to easily switch between "Real API" and "Mock/Fixture" mode via an env var (`VITE_AI_MODE=mock`). This is critical for stable TDD.
2.  **Unit Test the Stream Parser First**: Before building the UI, write the `stream-parser.ts` with TDD to handle broken JSON, multiple chunks, and edge cases.
3.  **Setup E2E Harness Early**: Configure the CRXJS + Playwright setup in "Sprint 0" to ensure the build pipeline supports extension loading from day one.
