<script setup lang="ts">
import { ToastRoot, ToastTitle, ToastDescription, ToastClose } from 'radix-vue'
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-vue-next'
import { computed } from 'vue'
import type { ToastProps } from '@/composables/useToast'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  toast: ToastProps
}>()

const { dismiss } = useToast()

const iconMap = {
  default: Info,
  success: Check,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info
}

const variantStyles = {
  default: 'bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100',
  success: 'bg-green-50/90 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
  warning: 'bg-amber-50/90 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
  error: 'bg-red-50/90 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100',
  info: 'bg-blue-50/90 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100'
}

const Icon = computed(() => iconMap[props.toast.variant || 'default'])
const styles = computed(() => variantStyles[props.toast.variant || 'default'])

// Handle open state binding
const isOpen = computed({
  get: () => true,
  set: (val) => {
    if (!val) dismiss(props.toast.id)
  }
})
</script>

<template>
  <ToastRoot
    v-model:open="isOpen"
    :duration="toast.duration" 
    class="group relative flex w-[90vw] max-w-[340px] items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full backdrop-blur-md"
    :class="styles"
  >
    <div class="flex items-start gap-3 w-full">
        <!-- Icon -->
        <component :is="Icon" class="w-5 h-5 mt-0.5 shrink-0" />
        
        <div class="flex-1 space-y-1">
            <ToastTitle v-if="toast.title" class="text-sm font-semibold leading-none opacity-90">
                {{ toast.title }}
            </ToastTitle>
            <ToastDescription v-if="toast.description" class="text-xs opacity-80 leading-relaxed">
                {{ toast.description }}
            </ToastDescription>
        </div>
    </div>

    <!-- Close Button -->
    <ToastClose class="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all text-current">
        <X class="w-4 h-4" />
    </ToastClose>
  </ToastRoot>
</template>
