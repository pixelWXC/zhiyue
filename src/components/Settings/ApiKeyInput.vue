<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings-store'
import { storeToRefs } from 'pinia'
import { Eye, EyeOff, Loader2, Check, X, Key as KeyIcon, ExternalLink } from 'lucide-vue-next'


// If utils don't exist, I'll define a simple helper or just use string templates. 
// Given the dependencies, I'll assume standard Tailwind usage without 'cn' for safety unless I check.
// I'll stick to standard class binding to be safe.

const store = useSettingsStore()
const { validationStatus, validationError, apiKey } = storeToRefs(store)

const inputKey = ref(apiKey.value || '')
const isVisible = ref(false)

// Sync local input if store updates externally
watch(apiKey, (newVal) => {
  if (newVal && newVal !== inputKey.value) {
    inputKey.value = newVal
  }
})

async function handleSave() {
  await store.validateAndSaveApiKey(inputKey.value)
}

function toggleVisibility() {
  isVisible.value = !isVisible.value
}
</script>

<template>
  <div class="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <KeyIcon class="w-4 h-4 text-blue-500" />
        Gemini API 密钥
      </h3>
      <a 
        href="https://aistudio.google.com/app/apikey" 
        target="_blank"
        class="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
      >
        获取密钥 <ExternalLink class="w-3 h-3" />
      </a>
    </div>
    
    <div class="space-y-3">
      <div class="relative group">
        <input 
          :type="isVisible ? 'text' : 'password'"
          v-model="inputKey"
          placeholder="在此粘贴您的 API 密钥..."
          class="w-full pl-3 pr-10 py-2.5 text-sm bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 transition-all font-mono"
          :class="[
            validationStatus === 'invalid' 
              ? 'border-red-500/50 focus:ring-red-500/20 focus:border-red-500' 
              : 'focus:ring-blue-500/20 focus:border-blue-500'
          ]"
          @keydown.enter="handleSave"
        />
        
        <button 
          @click="toggleVisibility"
          class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
          type="button"
        >
          <Eye v-if="isVisible" class="w-4 h-4" />
          <EyeOff v-else class="w-4 h-4" />
        </button>
      </div>

      <!-- Status Indicator Line -->
      <div class="min-h-[20px] flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs">
           <template v-if="validationStatus === 'validating'">
             <Loader2 class="w-3 h-3 animate-spin text-blue-600" />
             <span class="text-blue-600 font-medium">正在验证...</span>
           </template>
           
           <template v-else-if="validationStatus === 'valid'">
             <Check class="w-3 h-3 text-green-600" />
             <span class="text-green-600 font-medium">API 密钥有效</span>
           </template>
           
           <template v-else-if="validationStatus === 'invalid'">
             <X class="w-3 h-3 text-red-600" />
             <span class="text-red-600 font-medium">无效密钥: {{ validationError }}</span>
           </template>
           
           <template v-else>
             <span class="text-gray-400 dark:text-zinc-500">密钥仅本地存储，安全可靠。</span>
           </template>
        </div>

        <button 
          @click="handleSave"
          :disabled="validationStatus === 'validating' || !inputKey"
          class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-sm shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all active:scale-95"
        >
          验证并保存
        </button>
      </div>
    </div>
  </div>
</template>
