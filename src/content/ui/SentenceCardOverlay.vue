<template>
  <div v-if="visible" class="fixed inset-0 z-[10000] flex items-center justify-center font-sans pointer-events-auto">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-pointer" 
      @click="$emit('close')"
    ></div>
    
    <!-- Content -->
    <div class="relative z-[10001] max-w-[90vw] max-h-[90vh] w-auto bg-rice-paper/90 backdrop-blur-md rounded-2xl p-6 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95">
      <div class="flex flex-col items-center gap-4">
        <!-- Close Button -->
        <button 
          class="absolute -top-5 -right-5 flex items-center justify-center w-10 h-10 bg-rice-paper/80 hover:bg-white rounded-full text-deep-tea cursor-pointer shadow-md transition-all hover:rotate-90 hover:scale-110" 
          @click="$emit('close')"
        >
          <X class="w-6 h-6" />
        </button>

        <!-- Image -->
        <img 
          :src="image" 
          alt="Magic Card" 
          class="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain bg-rice-paper" 
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  image: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

