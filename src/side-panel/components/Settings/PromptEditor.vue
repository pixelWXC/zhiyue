<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, RotateCcw, Save } from 'lucide-vue-next'
import type { PromptKey } from '@/logic/prompts/prompt-service'

interface Props {
  promptId: PromptKey
  prompts: {
    id: PromptKey
    metadata: any
    isCustomized: boolean
    current: string
    default: string
  }[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [promptId: PromptKey, content: string]
  close: []
}>()

// Editor state
const editedContent = ref('')
const isDirty = ref(false)

// Get current prompt data
const currentPrompt = computed(() => {
  return props.prompts.find(p => p.id === props.promptId)
})

// Watch for prompt changes
watch(() => props.promptId, () => {
  if (currentPrompt.value) {
    editedContent.value = currentPrompt.value.current
    isDirty.value = false
  }
}, { immediate: true })

// Track changes
watch(editedContent, (newValue) => {
  if (currentPrompt.value) {
    isDirty.value = newValue !== currentPrompt.value.current
  }
})

/**
 * Handle save
 */
function handleSave() {
  if (!currentPrompt.value || !isDirty.value) return
  emit('save', props.promptId, editedContent.value)
}

/**
 * Handle reset to default
 */
function handleResetToDefault() {
  if (!currentPrompt.value) return
  editedContent.value = currentPrompt.value.default
}

/**
 * Handle close
 */
function handleClose() {
  emit('close')
}

/**
 * Handle keyboard shortcuts
 */
function handleKeydown(event: KeyboardEvent) {
  // Ctrl/Cmd + S to save
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    handleSave()
  }
  // Escape to close
  if (event.key === 'Escape') {
    handleClose()
  }
}
</script>

<template>
  <div
    v-if="currentPrompt"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    @click.self="handleClose"
    @keydown="handleKeydown"
  >
    <div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <h2 class="text-lg font-bold">编辑提示词</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ currentPrompt.metadata.name }} - {{ currentPrompt.metadata.description }}
          </p>
        </div>
        <button
          @click="handleClose"
          class="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="关闭 (Esc)"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Editor Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        <!-- Current Content Editor -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            提示词内容
            <span v-if="isDirty" class="text-indigo-600 dark:text-indigo-400 ml-2">*</span>
          </label>
          <textarea
            v-model="editedContent"
            rows="12"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 font-mono text-sm resize-none transition-all"
            placeholder="输入提示词内容..."
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            提示: 使用 Ctrl/Cmd + S 快速保存
          </p>
        </div>

        <!-- Default Content Reference -->
        <div class="pt-4 border-t border-gray-200 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              默认内容 (参考)
            </label>
            <button
              @click="handleResetToDefault"
              class="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
            >
              <RotateCcw class="w-3 h-3" />
              恢复默认
            </button>
          </div>
          <div class="px-4 py-3 bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono text-sm text-gray-600 dark:text-gray-400 max-h-48 overflow-y-auto whitespace-pre-wrap">
            {{ currentPrompt.default }}
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          <span v-if="currentPrompt.isCustomized" class="text-indigo-600 dark:text-indigo-400">
            ● 当前使用自定义版本
          </span>
          <span v-else>
            ○ 当前使用默认版本
          </span>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="handleClose"
            class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            @click="handleSave"
            :disabled="!isDirty"
            class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save class="w-4 h-4" />
            保存更改
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure modal is above everything */
</style>
