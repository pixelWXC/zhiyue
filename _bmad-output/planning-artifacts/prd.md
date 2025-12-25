# Product Requirements Document (PRD)

## 1. Product Overview
**Product Name**: 智阅 (Zhiyue) -- 懂你的日语学习助手
**Platform**: Browser Extension (Chrome/Edge)
**Vision**: Create an intelligent, context-aware Japanese learning assistant that helps users analyze, understand, and memorize Japanese content seamlessly while browsing the web. By leveraging generative AI, Zhiyue provides deep linguistic analysis, instant Q&A, and personalized flashcard generation without disrupting the user's reading flow.

## 2. Target Audience
- **Japanese Learners**: From beginner to advanced levels who consume Japanese content (news, blogs, social media) on the web.
- **Anki Users**: Learners who use Anki for spaced repetition and want an efficient workflow to create high-quality cards.
- **Polyglots/Linguists**: Users interested in deep grammatical breakdown of sentences.

## 3. Core User Experience
- **Seamless Activation**: Configurable shortcut (default: Alt+U) to analyze selected text or clipboard content immediately.
- **Intelligent Analysis**: Automatically detects if content is text or image. For images, performs OCR before analysis.
- **Interactive Learning**: Users can click word tokens for details, ask follow-up questions about grammar, and view visual cues.
- **Memory Retention**: One-click generation of Anki cards with AI-generated illustrations and mnemonic aids.

## 4. Functional Requirements

### 4.1. Input & Activation
- **FR-001 Shortcut Activation**: Global shortcut (default Alt+U) to trigger the sidebar.
- **FR-002 Clipboard Handling**:
    - Auto-read system clipboard on activation.
    - **Text Mode**: If clipboard contains text, immediately proceed to analysis.
    - **Image Mode**: If clipboard contains an image, display thumbnail, perform OCR (using Gemini Flash Vision), then proceed to analysis.
    - **Mixed/Error Mode**: If unclear, prompt user to choose between Text or Image analysis.

### 4.2. Sentence Structure Analysis (Core)
- **FR-003 Tokenization & POS Tagging**:
    - Use LLM (Gemini 3 Flash) to break sentences into tokens.
    - Display tokens with: Original Text, Reading (Furigana), Part of Speech (POS), Grammar Role, Translation.
    - Support "Streaming" output for real-time UI rendering.
- **FR-004 Interactive Tokens**:
    - Clicking a token displays detailed dictionary info (Meaning, Pronunciation, Usage).
    - Provide links to external dictionaries (Jisho.org, Weblio).
- **FR-005 Error Handling**:
    - Implement `json-repair` or similar mechanism to handle malformed LLM JSON output.

### 4.3. Advanced Grammatical Analysis
- **FR-006 One-Shot Q&A**:
    - Input field at the top of results for user questions (e.g., "Why using ~ている here?").
    - Use Gemini 3 Flash for quick answers.
- **FR-007 Syntax Tree Visualization**:
    - Use Gemini Pro (Thinking Mode) to generate a dependency grammar tree.
    - Output as nested JSON.
    - Visualization is collapsible by default; user expands to view.
    - Option to auto-expand via settings.

### 4.4. Memory & Flashcards
- **FR-008 Flashcard Generation**:
    - "Wow Moment": Generate a complete Anki card from the analyzed sentence.
    - Content: Front (Sentence/Word), Back (Meaning/Reading), Hint (Grammar point).
- **FR-009 AI Illustration**:
    - Use Nano Banana Pro (or similar image gen model) to create a minimalist, flat-style illustration based on the sentence context.
- **FR-010 Anki Export**:
    - One-click export to TSV format (compatible with Anki import).
    - Copy to clipboard or download `.tsv` file.

### 4.5. Configuration & Personalization
- **FR-011 API Configuration**:
    - Users input their own Google GenAI API Key.
    - Key stored locally (`chrome.storage.local`) - No backend server storage.
- **FR-012 Prompt Customization**:
    - "Developer Mode" for editing system prompts.
    - Safeguards: Warning when editing schema-critical parts.
    - "Restore Defaults" button.

## 5. Non-Functional Requirements (NFRs)
- **NFR-001 Privacy**: All data processing happens client-side or via direct calls to Gemini API from the user's browser. No intermediate backend server.
- **NFR-002 Performance**:
    - Sidebar opening: < 200ms.
    - Analysis start (Streaming): < 1s after request.
    - OCR processing: < 3s.
- **NFR-003 Compatibility**:
    - Chromium-based browsers (Chrome, Edge).
    - Manifest V3 compliant.
- **NFR-004 Cost Efficiency**:
    - Default to cheaper/faster models (Gemini Flash) for high-frequency tasks (Tokenization, Q&A).
    - Use costlier models (Gemini Pro) only for complex tasks (Syntax Tree, Image Gen) or on user demand.

## 6. Technical Constraints & Stack
- **Frontend**: Vue 3 + Vite.
- **UI Framework**: Shadcn-vue or Element Plus (customized).
- **Extension Framework**: CRXJS + Manifest V3.
- **State Management**: Pinia (Sync between Content/Popup/Sidepanel).
- **AI Integration**: Google GenAI SDK (in Service Worker or Sidepanel).

## 7. Future Considerations
- Support for other languages (English, Korean) in the future.
- Local history/log of analyzed sentences.
- Direct integration with AnkiConnect (local Anki API).

