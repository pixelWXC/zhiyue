<template>
  <div class="card-flip-container">
    <div class="card-shell" :class="{ 'is-image': isImageView }" @click="handleCardClick">
      <!-- Front Side (Word Info) -->
      <div v-if="!isImageView" class="card-front bg-rice-paper">
        <!-- Header with word and reading -->
        <div class="w-full pb-4 border-b border-matcha/20 bg-gradient-to-br from-matcha/10 to-deep-tea/5 px-6 pt-6 mb-4">
          <div class="flex items-start justify-between">
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <h2 class="text-4xl font-bold tracking-tight text-foreground">
                  {{ card.word }}
                </h2>
                <button 
                  @click.stop="handleSpeak"
                  class="p-2 rounded-full hover:bg-matcha/20 transition-colors"
                  aria-label="播放发音"
                >
                  <Volume2 
                    class="w-5 h-5"
                    :class="isPlaying ? 'text-deep-tea animate-pulse' : 'text-charcoal/50'" 
                  />
                </button>
              </div>
              <p class="text-xl text-deep-tea font-medium font-jp">{{ card.reading }}</p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <!-- Level Badge -->
              <span 
                v-if="card.level" 
                class="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                :class="getLevelClass(card.level)"
              >
                {{ getLevelLabel(card.level) }}
              </span>
              
              <!-- POS Badge -->
              <div class="flex gap-1.5 flex-wrap justify-end">
                <span 
                  v-for="(p, i) in getPosList(card.pos)" 
                  :key="i"
                  class="px-2.5 py-0.5 rounded-full text-xs font-normal border"
                  :class="getPosClass(p.type)"
                >
                  {{ p.label }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Meaning -->
          <div class="mt-4 pt-2">
            <p class="text-lg text-foreground/90 font-medium">{{ card.meaning }}</p>
          </div>
        </div>

        <div class="card-body space-y-6 px-6 pb-6">
          <!-- Pitch Accent -->
          <div v-if="(card.pitch || (card.tones && card.tones.length))" class="space-y-2">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span>声调</span>
              <span v-if="card.pitch" class="inline-flex items-center rounded-full border border-transparent bg-secondary px-2 py-0.5 text-xs font-semibold transition-colors hover:bg-secondary/80 text-foreground">
                {{ card.pitch === "0" ? "平板型" : `${card.pitch}型` }}
              </span>
            </div>
            <div class="flex items-end gap-1 h-12">
              <div 
                v-for="(mora, index) in getToneData()"
                :key="index"
                class="flex flex-col items-center gap-1"
              >
                <!-- Circle Visualizer -->
                <div 
                  class="w-3.5 h-3.5 rounded-full border-2 transition-all relative"
                  :class="mora.high 
                    ? 'border-deep-tea bg-matcha/30 -translate-y-2' 
                    : 'border-charcoal/30 bg-transparent'"
                >
                  <!-- Connector line to next mora if high-high or low-low? Usually just individual points -->
                  <!-- Reference just uses individual points, we stick to that -->
                </div>
                <span class="text-xs text-muted-foreground font-jp">{{ mora.char }}</span>
              </div>
            </div>
          </div>

          <!-- Examples -->
          <div v-if="card.examples && card.examples.length > 0" class="space-y-3">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MessageCircle class="w-4 h-4" />
              <span>例句</span>
            </div>
            <div class="space-y-3">
              <div 
                v-for="(example, index) in card.examples" 
                :key="index"
                class="p-3 rounded-lg bg-secondary/50 border border-border/30 space-y-1"
              >
                <p class="text-sm font-medium text-foreground leading-loose">
                  <span v-for="(part, pIndex) in parseRuby(example.japanese)" :key="pIndex">
                    <ruby v-if="part.reading" class="group mx-0.5">
                      {{ part.text }}
                      <rp>(</rp>
                      <rt class="text-[0.6em] text-muted-foreground font-normal group-hover:text-deep-tea transition-colors">{{ part.reading }}</rt>
                      <rp>)</rp>
                    </ruby>
                    <span v-else>{{ part.text }}</span>
                  </span>
                </p>
                <p class="text-sm text-muted-foreground">{{ example.chinese }}</p>
              </div>
            </div>
          </div>

          <!-- Collocations -->
          <div v-if="card.collocations && card.collocations.length > 0" class="space-y-3">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BookOpen class="w-4 h-4" />
              <span>常用搭配</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <div 
                v-for="(col, index) in card.collocations" 
                :key="index"
                class="px-3 py-2 rounded-lg bg-matcha/10 border border-matcha/30 hover:bg-matcha/20 transition-colors"
              >
                <span class="text-sm font-medium text-foreground">{{ col.pattern }}</span>
                <span class="text-xs text-muted-foreground ml-2">{{ col.meaning }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card-toggle">
          <button class="toggle-button" @click.stop="toggleView">
            <ImageIcon class="w-4 h-4" />
            查看图片
          </button>
        </div>
      </div>
      
      <!-- Back Side (Image) -->
      <div v-else class="card-back">
        <div class="image-wrapper">
        <img 
          v-if="card.imageUrl" 
          :src="card.imageUrl" 
          :alt="card.word"
          class="back-image"
        />
        <div v-else class="no-image">
          <ImageIcon class="w-12 h-12" />
          <p>暂无图片</p>
        </div>
        
        <!-- Word Overlay -->
        <div class="word-overlay">
          <span class="overlay-word">{{ card.word }}</span>
          <span class="overlay-meaning line-clamp-2 md:line-clamp-3 text-center px-4">{{ card.meaning }}</span>
        </div>

        </div>

        <div class="card-toggle card-toggle-back">
          <button class="toggle-button toggle-button-back" @click.stop="toggleView">
            <BookOpen class="w-4 h-4" />
            查看释义
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Volume2, ImageIcon, MessageCircle, BookOpen } from 'lucide-vue-next'
import type { VocabCard } from '@/types/vocab-card'

interface Props {
  card: VocabCard
}

const props = defineProps<Props>()

const isImageView = ref(false)
const isPlaying = ref(false)

function toggleView() {
  isImageView.value = !isImageView.value
}

function handleSpeak() {
  if (!window.speechSynthesis) return
  
  if (isPlaying.value) {
    window.speechSynthesis.cancel()
    isPlaying.value = false
    return
  }

  isPlaying.value = true
  // Cancel previous
  window.speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(props.card.word)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.9
  
  // Try to find a JA voice
  const voices = window.speechSynthesis.getVoices()
  const jaVoice = voices.find(v => v.lang.includes('ja'))
  if (jaVoice) utterance.voice = jaVoice
  
  utterance.onend = () => {
    isPlaying.value = false
  }
  utterance.onerror = () => {
    isPlaying.value = false
  }
  
  window.speechSynthesis.speak(utterance)
}

async function openFullscreen() {
  if (!props.card.imageUrl) return
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'show-sentence-card',
        image: props.card.imageUrl
      })
    }
  } catch (e) {
    console.error('Failed to open fullscreen', e)
  }
}

function handleCardClick() {
  if (!isImageView.value || !props.card.imageUrl) return
  openFullscreen()
}

// Level Helpers
function getLevelLabel(level: number) {
  const labels = ["", "N5", "N4", "N3", "N2", "N1"]
  return labels[level] || `N${level}`
}

function getLevelClass(level: number) {
  // Reference colors:
  // N5 (1): matcha/20 deep-tea matcha/40
  // N4 (2): matcha/30 deep-tea matcha/50
  // N3 (3): deep-tea rice-paper
  // N2 (4): charcoal/80 rice-paper
  // N1 (5): charcoal rice-paper
  const classes = [
    "",
    "bg-matcha/20 text-deep-tea border-matcha/40",
    "bg-matcha/30 text-deep-tea border-matcha/50",
    "bg-deep-tea text-rice-paper border-transparent",
    "bg-charcoal/80 text-rice-paper border-transparent",
    "bg-charcoal text-rice-paper border-transparent"
  ]
  return classes[level] || "bg-gray-100 text-gray-800"
}

// POS Helpers
function getPosList(posStr: string) {
  if (!posStr) return []
  return posStr.split(/[,\/]/).map(p => {
    const raw = p.trim().toLowerCase()
    const map: Record<string, { label: string, type: string }> = {
      "n": { label: "名词", type: "noun" },
      "v": { label: "动词", type: "verb" },
      "vs": { label: "サ变", type: "verb" },
      "vi": { label: "自", type: "verb" },
      "vt": { label: "他", type: "verb" },
      "adj": { label: "形容词", type: "other" },
      "i-adj": { label: "形一", type: "other" },
      "na-adj": { label: "形二", type: "other" },
      "adv": { label: "副词", type: "other" },
      "art": { label: "连体", type: "other" },
      "prt": { label: "助词", type: "other" },
      "uk": { label: "通常假名", type: "other" }
    }
    return map[raw] || { label: raw, type: "other" }
  })
}

function getPosClass(type: string) {
  switch (type) {
    case "noun": return "bg-noun/10 text-noun border-noun/30"
    case "verb": return "bg-verb/10 text-verb border-verb/30"
    default: return "bg-muted text-muted-foreground border-border"
  }
}

// Tone Data Helper
function getToneData() {
  // Use existing tones if available
  if (props.card.tones && props.card.tones.length > 0) {
    return props.card.tones
  }
  
  // Fallback to generating from reading + pitch string
  // Note: This logic follows the reference provided but may not be linguistically perfect for all cases
  const reading = props.card.reading || ""
  const pitchStr = props.card.pitch || "0"
  const pitchNum = parseInt(pitchStr) || 0
  const morae = reading.split("")
  
  return morae.map((char, index) => {
    // Reference logic:
    // Pitch 0 means flat: Low High High... (index > 0)
    // Pitch n means drop after n: High Low... or Low High...
    // The reference used:
    // const isHigh = pitchNum === 0 ? index > 0 : index > 0 && index < pitchNum
    
    // This logic produces L H H H (0)
    // And L H L L (2)
    // But for pitch 1 (Atamadaka), it produces L L L... which is wrong (should be H L L)
    
    // I will adjust SLIGHTLY for pitch 1 to be safe: If pitch 1, first is High, others Low.
    // Standard rule: 
    // If pitch = 1: H L L ...
    // If pitch = 0: L H H ...
    // If pitch > 1: L H ... H (at p-1) L ...
    
    let isHigh = false
    if (pitchNum === 0) {
      isHigh = index > 0
    } else if (pitchNum === 1) {
      isHigh = index === 0
    } else {
      isHigh = index > 0 && index < pitchNum
    }
    
    // However, to match the reference VISUALS exactly, sticking to their logic might be what they want 'visually', 
    // but the logic `index > 0 && index < pitchNum` implies [1 .. pitchNum-1] are high. 
    // For n=1, range is [1..0] -> empty. So all low.
    // I will use the corrected standard logic above to avoid user seeing wrong pitch for Atamadaka.
    
    return { char, high: isHigh }
  })
}

// Ruby Parsing
function parseRuby(text: string) {
  const parts: { text: string; reading?: string }[] = []
  const regex = /\[([^:]+):([^\]]+)\]/g
  let lastIndex = 0
  let match
  
  while ((match = regex.exec(text)) !== null) {
    // Text before
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) })
    }
    // Match
    parts.push({ text: match[1]!, reading: match[2] })
    lastIndex = regex.lastIndex
  }
  
  // Remaining
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) })
  }
  
  return parts
}
</script>

<style scoped>
.card-flip-container {
  @apply w-full p-4 flex items-start justify-center;
}

.card-shell {
  position: relative;
  width: 100%;
  max-width: 520px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.05);
  @apply border border-border/50;
  transition: box-shadow 0.2s ease;
}

.card-shell.is-image {
  cursor: pointer;
}

.card-shell.is-image:hover {
  box-shadow: 0 14px 36px -6px rgba(0, 0, 0, 0.18), 0 6px 14px -3px rgba(0, 0, 0, 0.08);
}

.card-shell.is-image:has(.image-wrapper:hover) {
  box-shadow: none;
}

.card-front {
  @apply flex flex-col;
}

.card-back {
  background: #1f2937;
  display: flex;
  flex-direction: column;
}

.image-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #111827;
}

.back-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  gap: 8px;
  padding: 48px 24px;
}

.word-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px 24px 48px;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: opacity 0.3s ease;
}

.image-wrapper:hover .word-overlay {
  opacity: 0;
}

.overlay-word {
  font-size: 32px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  margin-bottom: 8px;
}

.overlay-meaning {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

.font-jp {
  font-family: "Noto Sans JP", sans-serif;
}

.card-toggle {
  @apply flex items-center justify-center gap-2 px-4 py-3 border-t border-border/10 text-sm text-muted-foreground;
}

.card-toggle-back {
  border-top-color: rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.6);
}

.toggle-button {
  @apply inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 bg-white/70 text-sm font-medium text-foreground transition-colors;
}

.toggle-button:hover {
  @apply bg-matcha/10 text-deep-tea;
}

.toggle-button-back {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(15, 23, 42, 0.4);
  color: rgba(255, 255, 255, 0.9);
}

.toggle-button-back:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}
</style>
