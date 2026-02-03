<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, LogIn, User, Lock, AlertCircle, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/composables/useToast'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const authStore = useAuthStore()
const { toast } = useToast()

// Form state
const username = ref('')
const password = ref('')
const showPassword = ref(false)

// Validation
const isFormValid = computed(() => 
  username.value.length >= 3 && password.value.length >= 6
)

/**
 * Handle login form submission
 */
async function handleLogin() {
  if (!isFormValid.value || authStore.isLoading) return

  const user = await authStore.login({
    username: username.value,
    password: password.value,
  })

  if (user) {
    toast({
      title: '🎉 登录成功',
      description: `欢迎回来，${user.username}！`,
      variant: 'success',
    })
    emit('success')
    emit('close')
  }
}

/**
 * Handle close button click
 */
function handleClose() {
  emit('close')
}
</script>

<template>
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div class="bg-white dark:bg-[#111815] rounded-2xl border border-matcha/30 dark:border-[#243128] shadow-2xl w-full max-w-md overflow-hidden">
      <!-- Header -->
      <div class="relative px-6 pt-6 pb-4 border-b border-matcha/20 dark:border-[#243128]">
        <button
          @click="handleClose"
          class="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a2420] transition-colors"
        >
          <X class="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-matcha/30 to-deep-tea/30 rounded-xl">
            <LogIn class="w-6 h-6 text-deep-tea dark:text-matcha" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-charcoal dark:text-gray-100">用户登录</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">登录后可使用官方配额</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="p-6 space-y-5">
        <!-- Error Message -->
        <div 
          v-if="authStore.error"
          class="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <AlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
          <span class="text-sm text-red-600 dark:text-red-400">{{ authStore.error }}</span>
        </div>

        <!-- Username -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-charcoal dark:text-gray-200">
            用户名
          </label>
          <div class="relative">
            <div class="absolute left-3 top-1/2 -translate-y-1/2">
              <User class="w-4 h-4 text-gray-400" />
            </div>
            <input
              v-model="username"
              type="text"
              placeholder="请输入用户名"
              autocomplete="username"
              class="w-full pl-10 pr-4 py-3 rounded-xl border bg-rice-paper/50 dark:bg-[#0f1a17] border-matcha/30 dark:border-[#2a3a32] focus:outline-none focus:ring-2 focus:ring-matcha/40 focus:border-deep-tea transition-all"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-charcoal dark:text-gray-200">
            密码
          </label>
          <div class="relative">
            <div class="absolute left-3 top-1/2 -translate-y-1/2">
              <Lock class="w-4 h-4 text-gray-400" />
            </div>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              autocomplete="current-password"
              class="w-full pl-10 pr-12 py-3 rounded-xl border bg-rice-paper/50 dark:bg-[#0f1a17] border-matcha/30 dark:border-[#2a3a32] focus:outline-none focus:ring-2 focus:ring-matcha/40 focus:border-deep-tea transition-all"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span class="text-xs">{{ showPassword ? '隐藏' : '显示' }}</span>
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="!isFormValid || authStore.isLoading"
          class="w-full py-3 px-4 bg-gradient-to-r from-deep-tea to-matcha hover:from-deep-tea/90 hover:to-matcha/90 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-deep-tea/25 disabled:shadow-none flex items-center justify-center gap-2"
        >
          <Loader2 v-if="authStore.isLoading" class="w-4 h-4 animate-spin" />
          <LogIn v-else class="w-4 h-4" />
          <span>{{ authStore.isLoading ? '登录中...' : '登录' }}</span>
        </button>

        <!-- Test Account Hint -->
        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            测试账号：<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-[#1a2420] rounded">tester</code> / 
            <code class="px-1.5 py-0.5 bg-gray-100 dark:bg-[#1a2420] rounded">test123</code>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>
