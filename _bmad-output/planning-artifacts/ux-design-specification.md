---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '详细设计方案.md']
workflowType: 'ux-design'
lastStep: 14
project_name: 'zhiyue'
user_name: '老大'
date: '2025-12-25'
---

# UX Design Specification zhiyue

**Author:** 老大
**Date:** 2025-12-25

---

## Executive Summary

### Project Vision

**Zhiyue (智阅)** is an intelligent, context-aware Japanese learning assistant integrated as a browser extension. It aims to seamlessly assist learners in analyzing, understanding, and memorizing Japanese content found on the web without disrupting their reading flow. By leveraging Generative AI (Gemini), it provides deep linguistic analysis, instant syntax Q&A, and personalized flashcard generation with AI illustrations.

### Target Users

-   **Japanese Learners (All Levels)**: Users consuming Japanese content (news, blogs, etc.) on the web who need instant assistance.
-   **Anki Power Users**: Learners who value efficient workflows for creating high-quality flashcards with context and imagery.
-   **Linguistics Enthusiasts**: Users interested in deep grammatical breakdown, syntax trees, and dependency parsing.

### Key Design Challenges

1.  **Information Density vs. Simplicity**: Presenting complex linguistic data (tokens, POS, readings, syntax trees) within the constrained space of a browser side panel without overwhelming the user.
2.  **Latency & Flow**: Managing user expectations and maintaining flow during potentially high-latency AI operations (Vision OCR, deep syntax analysis, image generation).
3.  **Seamless Context Switching**: intelligently handling the transition between browsing and analyzing (text vs. image clipboard content) to minimize friction.

### Design Opportunities

1.  **"Magic Card" Workflow**: Turning the chore of flashcard creation into a delightful, creative "Wow Moment" with AI-generated illustrations and one-click export.
2.  **Context-Aware Conversation**: Enabling users to ask "Why?" about the specific grammar in the text they are reading, creating a personalized tutor experience.

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Desired Emotional Response

### Primary Emotional Goals

-   **Encouraged (被鼓励感)**: Zhiyue should act as a supportive study buddy. Through friendly UI and constructive feedback, it should make users feel "I can understand this" and "I'm improving," lowering the barrier to reading difficult Japanese content.
-   **Intellectually Satisfied (智识满足)**: Answers to syntax questions should be precise, deep, and enlightening, satisfying the user's curiosity.
-   **Delighted (惊喜)**: The "Magic Card" generation should feel like a reward, creating a "this software gets me" moment.

### Emotional Journey Mapping

-   **Trigger**: **Flow (流畅)**. Muscle-memory activation (Alt+U) feels extensions of the user's intent.
-   **Waiting**: **Anticipation (期待)**. Streaming tokens and OCR animations transform "loading" into "detective work in progress."
-   **Exploring**: **Control (掌控)**. Complex linguistic data is available but layered; users feel they control the depth of information.
-   **Error/Failure**: **Empathy (共情)**. When analysis fails, the system expresses humility ("I couldn't quite see that") rather than cold incompetence ("Error 500"), turning frustration into a moment of shared effort.
-   **End/Card**: **Achievement (成就)**. Saving a card feels like collecting a beautiful souvenir of the learning journey.

### Micro-Emotions

-   **Trust (信任)**: Built through transparency (Local Keys) and humility in error handling.
-   **Calm (平静)**: A quiet, low-saturation interface that respects the reading atmosphere.
-   **Amusement (会心一笑)**: Witty, non-robotic microcopy that feels like a human coach.

### Design Implications

-   **"Coach" Persona**: Microcopy should banish technical jargon (no "Tokenization Error"). Use supportive language: "Japanese is hard! Let's try that again?" instead of "Analysis Failed."
-   **Delightful Error States**: Use generative UI or charming mascots (e.g., a squinting robot) to visualizae errors, softening the blow of failure.
-   **Generative Reward**: In the Anki card preview, use micro-animations (card flip, shimmer) to reinforce the sense of a "rare drop" or reward.

### Emotional Design Principles

1.  **Celebrate Curiosity**: Reward every interaction with immediate, rich feedback.
2.  **Respect the Flow**: Be a quiet companion, not a noisy intruder.
3.  **Humanize the AI**: The AI is a patient, humble tutor. It admits when it's wrong and celebrates when the user learns.

## Core User Experience

### Defining Experience

**Zhiyue**'s core experience is defined by **"Capture & Comprehend" (瞬时捕获与理解)**. Users should not feel like they are "using a tool," but rather operating an "external linguistic brain" that is always on call. The core loop is: **Trigger (via muscle-memory shortcut) -> Instant Streaming Analysis -> Interactive Exploration -> Retention (One-click Anki/Card)**.

### Platform Strategy

-   **Platform**: Browser Side Panel (Chrome/Edge Extension).
-   **Interaction Paradigm**:
    -   **Keyboard First**: Designed for high-frequency triggering (Alt+U) to build muscle memory.
    -   **Non-modal Companion**: Side panel format avoids blocking main content, allowing rapid visual switching between "reading original content" and "viewing analysis."
-   **Constraints**: Limited width (typically ~300-400px), requiring highly compact yet hierarchical information layout, avoiding horizontal scrolling.

### Effortless Interactions

-   **Smart Clipboard Sensing**: Eliminates the redundant steps of "Copy -> Open Extension -> Paste -> Click Analyze." Triggering automatically analyzes clipboard content, distinguishing between text and images.
-   **Streaming Analysis**: Eliminates "loading spinner anxiety." Utilizing Token streaming output to render analysis like a typewriter, giving real-time "thinking" feedback.
-   **One-Click Magic Card**: Compresses complex flashcard creation workflows (finding examples, definitions, images, formatting) into a single click.

### Critical Success Moments

1.  **The "Instant" Start**: The moment the side panel slides out, analysis is already pulsating—zero latency delight.
2.  **The "Clarification"**: When a user is confused by a particle, clicking provides an explanation tailored to the *current context*, not a generic dictionary definition.
3.  **The "Souvenir"**: Generating an Anki card with an AI illustration. It's not just study material; it's a beautiful souvenir of their reading journey.

### Experience Principles

-   **Flow-Preserving**: Intervene without interrupting. The extension is the supporting actor; the web content is the protagonist.
-   **Intellectual Density with Clarity**: Linguistic data is complex (POS, conjugation, readings); design must ensure it is "clear at a glance, rich in detail."
-   **Delightful Utility**: Infusing the emotional element of AI generative art into an otherwise hardcore linguistic analysis tool.
-   **Privacy by Architecture**: Making users feel the transparency and security of data flow (Local Key, no backend).

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

| Product | Core Philosophy | UX Highlights | Key Takeaways for Zhiyue |
| :--- | :--- | :--- | :--- |
| **Yomitan** (Efficiency) | **"Flow is King"** <br> (阅读心流至上) | **Zero-Click**: Shift+Hover for instant meaning.<br>**Direct Integration**: One-click AnkiConnect sync without leaving the page. | **Different Layers of Interaction**: We need a "Light Mode" (Hover/Select) for quick checks and a "Deep Mode" (Side Panel) for AI analysis. Don't use a cannon (AI) to kill a mosquito (simple word). |
| **MOJiDict** (Aesthetics) | **"Beauty is Function"** <br> (颜值即正义) | **Structured Visuals**: Color-coded POS (Red verbs, Blue nouns).<br>**Ritualistic Saving**: Beautiful, shareable card designs create a sense of achievement. | **Visual Granularity**: Raw JSON is boring. Use colors/capsules to represent syntax (Subject/Predicate).<br>**Premium Souvenirs**: Generated Anki cards must look like art, not just data dumps. |
| **Immersive Translate** (Context) | **"Cognitive Ease"** <br> (降低认知负荷) | **Bilingual View**: Embeds translation *below* text, preserving context.<br>**Streaming UI**: Visualizes the AI "thinking" process, reducing wait anxiety. | **Contextual Embedding**: Don't hide the original text. Show analysis alongside or inline.<br>**Process Visualization**: Make the AI streaming visible and satisfying (typewriter effect). |

### Transferable UX Patterns

1.  **"Hover & Reveal" Layering (分层交互)**:
    *   *From Yomitan*: Adopt "Shift+Hover" or efficient text selection for immediate, low-latency dictionary lookups.
    *   *Adaptation*: If the user wants "More", a clear trigger expands the sidebar for the full AI syntax breakdown.

2.  **Streaming "Typewriter" Feedback (流式反馈)**:
    *   *From Immersive Translate*: Use streaming text generation to show immediate responsiveness.
    *   *Adaptation*: Apply this to the linguistic analysis – let users see the sentence being parsed token by token.

3.  **Semantic Color Coding (语义色彩系统)**:
    *   *From MOJi*: Use a consistent color system for grammar structures (e.g., Particles = Grey, Verbs = Red, Nouns = Blue).
    *   *Adaptation*: Apply this visualization to both the Analysis Panel (UI) and the generated Flashcards (Anki).

4.  **Bilingual/Annotation Embedding (嵌入式对照)**:
    *   *From Immersive Translate*: Keep original text visible.
    *   *Adaptation*: **"Light Embedding, Deep Sidebar"** principle. Use ruby text or light underlines for inline annotations to avoid clutter, saving detailed trees for the sidebar.

### Anti-Patterns to Avoid

1.  **The "Heavy Hand" (杀鸡用牛刀)**: forcing users to open a full AI side panel just to look up a single word's meaning.
2.  **The "Black Box" (黑盒等待)**: Showing a spinning loader while the AI thinks. (Must use streaming/skeleton screens).
3.  **"Data Dump" Aesthetics (数据堆砌感)**: Presenting analysis as raw text or generic tables without visual hierarchy or design polish.
4.  **Total Replacement (完全替换)**: Hiding the original Japanese text and only showing the translation/analysis.

### Design Inspiration Strategy

**What to Adopt (Directly):**
*   **AnkiConnect Integration**: Seamless, no-file-download workflow for local Anki users.
*   **Source Context**: Generated cards should include "Source Context" (Page Title/Favicon) to create a stronger memory anchor (adapted from Sally's feedback).

**What to Adapt (Improve):**
*   **True JSON Streaming**: Unlike simple text streaming, we will implement resilient **Buffered Line Processing**. We will parse the LLM's streaming JSON output line-by-line, handling incomplete tags and unclosed brackets, to render tokens *one by one* as they arrive, ensuring a visually smooth "typewriter" effect for structured data.
*   **Visual Granularity**: Take MOJi's static color coding and make it interactive. Hovering a "Verb" in the analysis should highlight it in the original sentence.

**What to Innovate (Our Unique Value):**
*   **The "Syntax Tutor"**: Zhiyue focuses on *explaining structure*. The **"One-Shot Q&A"** button will be elevated to a primary UI element given high visibility, encouraging users to ask "Why?".

## Design System Foundation

### 1.1 Design System Choice

**Shadcn-vue + Tailwind CSS** (with strict scoping architecture)

### Rationale for Selection

1.  **Customizability**: Critical for the Side Panel's specialized UI needs. Unlike traditional libraries (Element Plus), Shadcn-vue provides source code for components, allowing us to strip down functionality or aggressively modify layout logic to save space.
2.  **Performance**: Minimal bundle size using atomic CSS (Tailwind). We only ship the CSS and JS we actually use, crucial for instant extension startup (NFR-002).
3.  **Aesthetics**: The default minimalist, clean aesthetic of Shadcn aligns perfectly with Zhiyue's "Calm" and "Intellectually Satisfied" emotional goals.

### Component Specifications
 
#### Side Panel (Sidebar)
*   **Structure**:
    *   **Header**: Logo + Settings Trigger.
    *   **Content Area**:
        *   **Manual Input**:
            *   **Rich Input Container**: Supports Text and **Image Paste**.
            *   **Image State**: When an image is pasted, display a thumbnail preview ABOVE the text field with a "Remove" button. The text field remains editable to display the OCR result or for manual correction.
        *   **Analysis Feed**: Scrollable area for result cards.
        *   **Sticky Bottom Input** (Optional): For Q&A.
    *   **State**: Persistent state across tab switches (via Pinia).

*   **Prefixing**: Apply a `zy-` prefix to all Tailwind classes to prevent conflicts with host pages.
*   **Shared Tokens**: Define colors/spacing as CSS Variables at the root, shared by both the Side Panel and Shadow DOM styles to ensure visual consistency.
*   **Scoped Preflight**: Disable Tailwind's default global reset to protect the host page appearance.
*   **Atomic Components**: We will build our unique "Syntax Capsules" and "Streaming Text Block" components using Tailwind utilities directly.

## 2. Core User Experience

### 2.1 Defining Experience

**"The Magic Souvenir" (魔法纪念品时刻)** 🎨✨

The defining experience of Zhiyue is the **creation of a personalized, hand-drawn study card** that captures the user's "Aha!" moment. It transforms the ephemeral act of looking up a word into a tangible, collectible asset. This is not just a study tool; it's a creative reward for curiosity.

*   **The "Hook"**: Turning a dry Japanese sentence into a lively **"Hand-Drawn Grammar Scenario" (手绘语法百景图)**.
*   **The Difference**: Unlike generic AI images, Zhiyue's visuals are **didactic and specifically styled**:
    *   **Style**: Pure hand-drawn/doodle aesthetics (friendly, rough lines, not AI-photorealistic) to evoke a "study notebook" feel.
    *   **Grammar Personification**: **Verbs** become action characters, **Nouns** become scene props, **Adjectives** become exaggerated expressions.
    *   **Bilingual Integration**: Handwritten labels point directly to elements in the scene (e.g., an arrow pointing to a cat saying "猫 Neko").

### 2.2 User Mental Model

*   **Metaphor**: **"The Empathetic Tutor" (共情的私教)**.
    *   *Old Model (Dictionary)*: "I am a database. Query me." (Functional, Cold).
    *   *Zhiyue Model (Tutor)*: "I see you're stuck. Let me draw you a picture to explain this." (Supportive, Warm).
*   **Pain Point Shift**: Transitions from "disruptive labor" (copy-paste, switch tabs, search, read definitions) to "instant clarification" (single click/shortcut).

### 2.3 Success Criteria

1.  **Metric: "The Keeper Rate" (收藏率)**: Users should feel the generated card is "too good to throw away." It's a digital souvenir of their learning journey.
2.  **Metric: "Visual Clarity" (图解力)**: The image must successfully *explain* the sentence logic to a human (e.g., if the sentence is about "eating apples", the image *must* show the action of eating and the apple).
3.  **Metric: "Zero-Friction Access"**: From "I'm curious" to "I understand" should happen without leaving the current webpage context.

### 2.4 Novel UX Patterns

1.  **"Didactic Generative Art" (教学式生成艺术)**: Using image generation prompts not for aesthetics alone, but for *syntax visualization*. It's a functional application of Generative AI.
2.  **"Generative Skeleton Loading"**: Instead of a spinning circle, show a "sketching" animation or placeholder that builds anticipation for the "Magic Souvenir."
3.  **"Semantic Paste"**: Treating an *image* in the clipboard as a valid query object. The system unintrusively detects image context and offers OCR analysis seamlessly.

### 2.5 Experience Mechanics

1.  **Initiation (The Ask)**:
    *   *Text Trigger*: User selects text -> subtly animated "Ask Zhiyue" bubble appears -> Click to expand.
    *   *Image Trigger*: User screenshots a raw manga page -> Focuses Sidebar -> Pastes (Ctrl+V) -> System recognizes image data and starts OCR.
    *   *Muscle Memory*: `Alt+U` bypasses visual triggers for power users.
2.  **Interaction (The Explanation)**:
    *   **Streaming Analysis**: The linguistic breakdown (Subject/Predicate) streams in like a typewriter to keep user engagement during AI latency.
    *   **Tutor Mode**: User interacts with the analysis (clicking tokens, asking "Why?").
3.  **Creation (The Magic Moment)**:
    *   User clicks "Generate Magic Card" (生成魔法卡片).
    *   **Doodle Animation**: A playful "sketching" animation plays while the specific prompt (Hand-drawn, no 3D, bilingual labels) is processed.
4.  **Completion (The Souvenir)**:
    *   The card is revealed: clear Japanese sentence, translation, and the **Hand-Drawn Grammar Scenario**.
    *   **Satisfaction**: One-click "Save to Anki" shows a delightful "Collected!" animation.
