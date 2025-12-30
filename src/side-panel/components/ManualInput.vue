<script setup lang="ts">
import { ref } from 'vue'
import { Clipboard, ArrowDownToLine, Loader2 } from 'lucide-vue-next'

// Props/Emits
const emit = defineEmits<{
  (e: 'analyze', text: string): void
}>()

const inputText = ref('')
const isGettingSelection = ref(false)

// Actions
const onPaste = (e: ClipboardEvent) => {
    // Basic text paste handled by v-model usually, but we want to auto-submit?
    // Story says: "Text: Automatically trigger the Analysis flow."
    // We should probably wait for a small delay or check if it's substantial.
    // Or just let user press Enter / Click button?
    // "When the user pastes (Ctrl+V) text... The application should process the input immediately"
    
    // Let's grab the text
    const text = e.clipboardData?.getData('text')
    if (text) {
        inputText.value = text // Update model
        // Auto-analyze after a tick to ensure UI updates?
        // Or just emit immediately.
        if (text.trim().length > 0) {
            emit('analyze', text)
        }
    }
    
    // Image handling (Story 1.8 reserved, but good to have placeholder)
    if (e.clipboardData?.files.length) {
        // Placeholder for image
        console.log('Image pasted', e.clipboardData.files)
    }
}

const onGetSelection = async () => {
    isGettingSelection.value = true
    try {
        // Send message to active tab to get selection
        // We can use `sendMessage` with destination 'content-script' and specific tabId?
        // webext-bridge handles 'content-script' destination as active tab usually? 
        // Or we need to specify tabId.
        
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tabs[0]?.id) {
             // We can use scripting API if content script isn't responsive, but we have a content script.
             // Let's try sending message.
             // We need to implement 'get-selection' handler in content script?
             // Or better: Use scripting execution to get selection text which is more robust if CS is not loaded.
             
            const results = await chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => window.getSelection()?.toString() || ''
            })
            
            const text = results[0]?.result
            if (text) {
                inputText.value = text.trim()
                if (inputText.value) {
                    emit('analyze', inputText.value)
                }
            } else {
                 // Nothing selected
                 // Maybe flash a toast?
            }
        }
    } catch (e) {
        console.error('Failed to get selection:', e)
    } finally {
        isGettingSelection.value = false
    }
}
</script>

<template>
  <div class="flex flex-col gap-4 p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors hover:border-indigo-300 dark:hover:border-indigo-700 group">
      
      <!-- Placeholder / Empty State Visual -->
      <div v-if="!inputText" class="flex flex-col items-center justify-center py-6 text-zinc-400 gap-2 pointer-events-none">
          <Clipboard class="w-8 h-8 opacity-50 mb-1" />
          <p class="text-xs font-medium">粘贴文本 (Ctrl+V) 或</p>
          <button class="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 hover:border-indigo-200 transition-all" @click.stop="onGetSelection">
              <Loader2 v-if="isGettingSelection" class="w-3.5 h-3.5 animate-spin" />
              <ArrowDownToLine v-else class="w-3.5 h-3.5" />
              获取选中
          </button>
      </div>

      <!-- Real Input (Invisible opacity but covers area to catch paste?) 
           Actually user needs to focus it to paste. 
           So we should make it visible or use a global listner?
           "Sidebar Manual Input" -> A dedicated input area.
      -->
      
      <textarea
        v-model="inputText"
        @paste="onPaste"
        placeholder="在此输入或粘贴文本..."
        class="w-full bg-transparent border-none resize-none focus:ring-0 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 min-h-[100px]"
      ></textarea>
      
      <div class="flex justify-end" v-if="inputText">
          <button 
            @click="$emit('analyze', inputText)"
            class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            开始分析
          </button>
      </div>
  </div>
</template>
