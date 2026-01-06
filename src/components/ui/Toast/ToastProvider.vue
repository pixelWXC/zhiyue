<script setup lang="ts">
import { ToastProvider as RadixToastProvider, ToastViewport } from 'radix-vue'
import ToastItem from './ToastItem.vue'
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <RadixToastProvider>
    <ToastItem 
        v-for="toast in toasts" 
        :key="toast.id" 
        :toast="toast" 
    />

    <ToastViewport class="fixed z-[100] bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm flex flex-col items-center gap-2 outline-none p-4" />
  </RadixToastProvider>
</template>
