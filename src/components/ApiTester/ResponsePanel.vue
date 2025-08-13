<template>
  <div class="flex-1 bg-vue-dark flex flex-col">
    <div class="flex justify-between items-center p-4 border-b border-vue-border bg-vue-darker">
      <h2 class="text-sm font-semibold text-text-primary">Response</h2>
      <button
        @click="clearResponse"
        class="px-2 py-1 text-xs font-medium bg-sitefinity-green/10 text-sitefinity-green border border-sitefinity-green/30 rounded transition-all hover:bg-sitefinity-green/20"
      >
        Clear
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto p-4 bg-vue-dark">
      <div v-if="!currentResponse" class="text-center text-text-muted text-xs italic p-8">
        No request made yet
      </div>
      
      <div v-else-if="currentResponse.success" class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 text-xs font-semibold text-sitefinity-blue bg-sitefinity-blue/15 border border-sitefinity-blue/30 rounded uppercase">
            {{ currentResponse.status }} {{ currentResponse.statusText }}
          </span>
          <span class="px-2 py-1 text-xs font-semibold text-sitefinity-yellow bg-sitefinity-yellow/15 border border-sitefinity-yellow/30 rounded uppercase">
            {{ currentResponse.method }}
          </span>
        </div>
        
        <div class="text-xs text-text-secondary break-all font-mono">
          {{ currentResponse.url }}
        </div>
        
        <div class="bg-vue-darker border border-vue-border rounded p-3 overflow-x-auto">
          <pre class="text-xs text-text-primary font-mono leading-relaxed whitespace-pre-wrap">{{ formattedResponseData }}</pre>
        </div>
      </div>
      
      <div v-else class="space-y-3">
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 text-xs font-semibold text-sitefinity-green bg-sitefinity-green/15 border border-sitefinity-green/30 rounded uppercase">
            Error
          </span>
          <span class="px-2 py-1 text-xs font-semibold text-sitefinity-yellow bg-sitefinity-yellow/15 border border-sitefinity-yellow/30 rounded uppercase">
            {{ currentResponse.method }}
          </span>
        </div>
        
        <div class="text-xs text-text-secondary break-all font-mono">
          {{ currentResponse.url }}
        </div>
        
        <div class="bg-vue-darker border border-sitefinity-green/30 rounded p-3">
          <div class="text-xs text-sitefinity-green">{{ currentResponse.error }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  currentResponse: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['clear-response'])

// Computed properties
const formattedResponseData = computed(() => {
  if (!props.currentResponse || !props.currentResponse.data) return 'No response data'
  
  if (typeof props.currentResponse.data === 'object') {
    return JSON.stringify(props.currentResponse.data, null, 2)
  }
  return String(props.currentResponse.data)
})

// Methods
const clearResponse = () => {
  emit('clear-response')
}
</script>