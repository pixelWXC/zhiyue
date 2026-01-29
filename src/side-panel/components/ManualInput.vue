<script setup lang="ts">
import { ref } from 'vue'
import { Loader2, X, ImageIcon } from 'lucide-vue-next'
import { blobToBase64, getMimeType } from '@/lib/utils'
import { recognizeTextFromImage } from '@/logic/ai/client'
import { hasAnyApiKeyConfigured } from '@/logic/storage'

// Props/Emits
const emit = defineEmits<{
  (e: 'analyze', text: string): void
}>()

const inputText = ref('')

// Image OCR state
const imagePreview = ref<string | null>(null)
const isProcessingOcr = ref(false)
const imageMimeType = ref('')

// Actions
const onPaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    // Check for image first (priority over text)
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            e.preventDefault() // Prevent default text paste
            const blob = item.getAsFile()
            if (blob) {
                await handleImagePaste(blob)
                return
            }
        }
    }
    
    // If no image, handle text paste
    const text = e.clipboardData?.getData('text')
    if (text && text.trim().length > 0) {
        inputText.value = text
        emit('analyze', text)
    }
}

const handleImagePaste = async (blob: Blob) => {
    try {
        // Create preview URL
        imagePreview.value = URL.createObjectURL(blob)
        imageMimeType.value = getMimeType(blob)
        isProcessingOcr.value = true

        // Convert to Base64
        const base64 = await blobToBase64(blob)

        // Check if any API key is configured
        const hasApiKey = await hasAnyApiKeyConfigured()
        if (!hasApiKey) {
            throw new Error('请先配置 API 密钥')
        }

        // Call OCR (apiKey 参数已弃用，内部通过 SceneService 获取)
        const extractedText = await recognizeTextFromImage('', base64, imageMimeType.value)
        
        // Fill input with extracted text
        inputText.value = extractedText.trim()
        
        // Auto-trigger analysis if text was extracted
        if (inputText.value) {
            emit('analyze', inputText.value)
        }
    } catch (error) {
        console.error('OCR 失败:', error)
        alert(`图片识别失败: ${(error as Error).message}`)
        removeImage()
    } finally {
        isProcessingOcr.value = false
    }
}

const removeImage = () => {
    if (imagePreview.value) {
        URL.revokeObjectURL(imagePreview.value)
    }
    imagePreview.value = null
    imageMimeType.value = ''
    inputText.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-4 p-4 border-2 border-dashed border-matcha/20 dark:border-zinc-800 rounded-xl bg-matcha/5 dark:bg-zinc-900/50 transition-colors hover:border-matcha/50 dark:hover:border-indigo-700 group">
      
      <!-- Image Preview Area -->
      <div v-if="imagePreview" class="relative rounded-lg border border-matcha/20 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-800">
          <img :src="imagePreview" alt="Preview" class="w-full h-auto max-h-[200px] object-contain" />
          <button 
            @click="removeImage"
            class="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
            title="移除图片"
          >
            <X class="w-4 h-4" />
          </button>
          <div v-if="isProcessingOcr" class="absolute inset-0 bg-deep-tea/50 flex items-center justify-center">
              <div class="flex flex-col items-center gap-2 text-white">
                  <Loader2 class="w-8 h-8 animate-spin" />
                  <p class="text-sm font-medium">正在提取文本...</p>
              </div>
          </div>
      </div>
      
      <!-- Placeholder / Empty State Visual -->
      <div v-if="!inputText && !imagePreview" class="flex flex-col items-center justify-center py-6 text-charcoal/40 dark:text-zinc-400 gap-2 pointer-events-none">
          <ImageIcon class="w-8 h-8 opacity-50 mb-1" />
          <p class="text-xs font-medium">粘贴文本或图片 (Ctrl+V)</p>
      </div>
      
      <textarea
        v-model="inputText"
        @paste="onPaste"
        placeholder="在此输入或粘贴文本/图片..."
        class="w-full bg-transparent border-none resize-none focus:ring-0 text-sm text-charcoal dark:text-zinc-200 placeholder-charcoal/40 min-h-[100px]"
      ></textarea>
      
      <div class="flex justify-end" v-if="inputText">
          <button 
            @click="$emit('analyze', inputText)"
            class="px-3 py-1.5 bg-deep-tea hover:bg-deep-tea/90 text-rice-paper rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            开始分析
          </button>
      </div>
  </div>
</template>
