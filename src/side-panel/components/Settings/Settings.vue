<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Settings as SettingsIcon, FileText, AlertTriangle } from 'lucide-vue-next'
import { usePromptService, type PromptKey } from '@/logic/prompts/prompt-service'
import PromptEditor from './PromptEditor.vue'
import ApiKeyInput from '@/components/Settings/ApiKeyInput.vue'

// Prompt Management
const promptService = usePromptService()
const prompts = ref<{
  id: PromptKey
  metadata: any
  isCustomized: boolean
  current: string
  default: string
}[]>([])
const selectedPromptId = ref<PromptKey | null>(null)
const isPromptsLoading = ref(false)

// Warning Modal
const showWarning = ref(false)
const pendingPromptId = ref<PromptKey | null>(null)

/**
 * Load all prompts status
 */
async function loadPrompts() {
  isPromptsLoading.value = true
  try {
    prompts.value = await promptService.getAllPromptsStatus()
  } catch (error) {
    console.error('Failed to load prompts:', error)
  } finally {
    isPromptsLoading.value = false
  }
}

/**
 * Handle prompt edit click
 */
function handleEditPrompt(promptId: PromptKey) {
  const prompt = prompts.value.find(p => p.id === promptId)
  if (!prompt) return

  // Show warning for JSON output prompts
  if (prompt.metadata.isJsonOutput) {
    pendingPromptId.value = promptId
    showWarning.value = true
  } else {
    selectedPromptId.value = promptId
  }
}

/**
 * Confirm warning and proceed to edit
 */
function confirmWarning() {
  if (pendingPromptId.value) {
    selectedPromptId.value = pendingPromptId.value
    pendingPromptId.value = null
  }
  showWarning.value = false
}

/**
 * Cancel warning
 */
function cancelWarning() {
  pendingPromptId.value = null
  showWarning.value = false
}

/**
 * Handle prompt save
 */
async function handleSavePrompt(promptId: PromptKey, content: string) {
  try {
    await promptService.savePrompt(promptId, content)
    await loadPrompts() // Reload to update customization status
    selectedPromptId.value = null
  } catch (error) {
    console.error('Failed to save prompt:', error)
  }
}

/**
 * Handle prompt reset
 */
async function handleResetPrompt(promptId: PromptKey) {
  try {
    await promptService.resetPrompt(promptId)
    await loadPrompts() // Reload to update customization status
  } catch (error) {
    console.error('Failed to reset prompt:', error)
  }
}

/**
 * Handle prompt editor close
 */
function handleCloseEditor() {
  selectedPromptId.value = null
}

// Initialize
onMounted(async () => {
  await loadPrompts()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-gray-100">
    <!-- Header -->
    <header class="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 sticky top-0 z-10">
      <div class="flex items-center gap-3">
        <SettingsIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 class="text-lg font-bold">系统设置</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">配置 API 密钥和自定义提示词</p>
        </div>
      </div>
    </header>

    <main class="p-6 max-w-3xl mx-auto space-y-8">
      <!-- API Key Section -->
      <ApiKeyInput />

      <!-- Prompt Management Section -->
      <section class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
        <div class="flex items-center gap-2 mb-4">
          <FileText class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 class="text-sm font-semibold tracking-wide uppercase text-indigo-600 dark:text-indigo-400">
            提示词实验室
          </h2>
        </div>

        <div v-if="isPromptsLoading" class="text-center py-8 text-gray-400">
          <div class="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p class="text-xs mt-2">加载中...</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="prompt in prompts"
            :key="prompt.id"
            class="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-medium text-sm">{{ prompt.metadata.name }}</h3>
                  <span
                    v-if="prompt.isCustomized"
                    class="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-full"
                  >
                    已自定义
                  </span>
                  <span
                    v-if="prompt.metadata.isJsonOutput"
                    class="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full"
                    title="修改此提示词可能导致 JSON 输出格式错误"
                  >
                    JSON
                  </span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ prompt.metadata.description }}</p>
              </div>

              <div class="flex items-center gap-2 ml-4">
                <button
                  v-if="prompt.isCustomized"
                  @click="handleResetPrompt(prompt.id)"
                  class="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                >
                  重置
                </button>
                <button
                  @click="handleEditPrompt(prompt.id)"
                  class="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                >
                  编辑
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Prompt Editor Modal -->
    <PromptEditor
      v-if="selectedPromptId"
      :prompt-id="selectedPromptId"
      :prompts="prompts"
      @save="handleSavePrompt"
      @close="handleCloseEditor"
    />

    <!-- Warning Modal -->
    <Transition name="modal">
      <div
        v-if="showWarning"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="cancelWarning"
      >
        <div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 max-w-md w-full shadow-xl">
          <div class="flex items-start gap-4 mb-4">
            <div class="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <AlertTriangle class="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 class="font-bold text-lg mb-2">⚠️ 高级用户功能</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                修改此提示词可能会破坏 JSON 输出格式，导致系统功能异常。
                <strong class="text-amber-600 dark:text-amber-400">仅建议高级用户修改。</strong>
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 mt-6">
            <button
              @click="cancelWarning"
              class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="confirmWarning"
              class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              我了解风险，继续编辑
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
