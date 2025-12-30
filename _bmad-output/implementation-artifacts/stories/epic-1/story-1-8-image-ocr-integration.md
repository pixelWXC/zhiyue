# Story 1.8: Image OCR Integration

**Parent Epic:** Epic 1 - Instant Analysis Companion

## User Story

As a User,
I want to paste images (e.g., manga panels, screenshots) directly into the sidebar to analyze the Japanese text within them,
So that I can learn from visual content without manually typing out the characters.

## Acceptance Criteria

### 1. Unified Clipboard Handling (Mixed Content)
1.  **Given** the Side Panel manual input area is focused.
2.  **When** I trigger a Paste action (Ctrl+V) containing **ANY image data**.
3.  **Then** the system should **Prioritize** the image content over plain text.
4.  **And** identify the clipboard item type using the `DataTransfer` API (looking for `image/*`).
5.  **And** capture the image binary (Blob) for processing.
    *   *Note*: If the clipboard contains ONLY text, it follows the existing Story 1.5/1.6 text flow.

### 2. Image Preview & State Management
1.  **Given** an image has been successfully pasted.
2.  **Then** the Input Area should transition to a **"Image + Text" Dual State**:
    *   **Preview Area**: Display a thumbnail of the pasted image (verifying what is being analyzed).
    *   **Action Area**: Show a "Remove Image" (X) button to allow canceling/clearing the image.
    *   **Loading State**: Show a subtle "Extracting text..." indicator.
3.  **And** any existing text in the input box should NOT be automatically cleared unless it conflicts (Developer choice: append vs replace. Decision: **Replace** text with OCR result, as the intent is usually to analyze the image).

### 3. Automatic OCR Processing
1.  **Given** the image is pasted and previewed.
2.  **Then** the system should automatically convert the Blob to Base64.
3.  **And** send it to Gemini (Vision) using the **Gemini 3 Flash** model.
4.  **And** use the specific prompt: `"Extract all Japanese text from this image. Return ONLY the text content."`
5.  **And** **When** the result arrives:
    *   The extracted text should populate the text input field below the image.
    *   The "Extracting..." indicator disappears.
    *   The standard Text Analysis (Story 1.5) triggers automatically on the extracted text.

### 4. Screenshot Feature
*   **Status**: DE-SCOPED to Low Priority / Future Release. Not included in this story.

## Technical Implementation

### AI Service (OCR)
Use `@google/genai` SDK.

```typescript
import { GoogleGenAI } from "@google/genai";

// In src/services/ai/gemini.ts

export async function recognizeTextFromImage(base64Image: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });
  
  const contents = [
    {
      inlineData: {
        mimeType: "image/jpeg", // or detect from blob.type
        data: base64Image,
      },
    },
    // Prompt focus: Extraction only
    { text: "Extract all Japanese text from this image. Return ONLY the text content, no markdown or explanations." },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash",
    contents: contents,
  });

  return response.text(); 
}
```

### UI Interaction (ManualInput.vue)

The `ManualInput.vue` component needs to handle the `paste` event manually to intercept images.

```typescript
const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      // 1. Found an image!
      event.preventDefault(); // Stop text pasting if image exists
      const blob = item.getAsFile();
      
      // 2. Set Preview
      // 3. Trigger OCR
      return; 
    }
  }
  // If no image, let default text paste happen
};
```

## UI Design Reference
*   **Layout**: Stacked.
    *   [Image Preview (Dismissable)]
    *   [Text Input Area (Auto-filled by OCR)]
    *   [Analyze Button]
