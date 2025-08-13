<template>
  <div class="flex-1 bg-vue-dark flex flex-col min-w-0 overflow-hidden">
    <div class="flex justify-between items-center p-4 border-b border-vue-border bg-vue-darker">
      <h2 class="text-sm font-semibold text-text-primary">Response</h2>
      <button
        @click="clearResponse"
        class="px-2 py-1 text-xs font-medium bg-sitefinity-green/10 text-sitefinity-green border border-sitefinity-green/30 rounded transition-all hover:bg-sitefinity-green/20"
      >
        Clear
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto p-4 bg-vue-dark min-w-0">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="space-y-4 animate-pulse">
        <div class="flex items-center gap-2">
          <div class="h-6 w-20 bg-vue-darker rounded"></div>
          <div class="h-6 w-16 bg-vue-darker rounded"></div>
        </div>
        <div class="h-4 w-3/4 bg-vue-darker rounded"></div>
        <div class="bg-vue-darker rounded p-3">
          <div class="space-y-2">
            <div class="h-4 w-full bg-vue-darkest rounded"></div>
            <div class="h-4 w-5/6 bg-vue-darkest rounded"></div>
            <div class="h-4 w-4/5 bg-vue-darkest rounded"></div>
            <div class="h-4 w-full bg-vue-darkest rounded"></div>
            <div class="h-4 w-3/4 bg-vue-darkest rounded"></div>
            <div class="h-4 w-2/3 bg-vue-darkest rounded"></div>
          </div>
        </div>
      </div>

      <div v-else-if="!currentResponse" class="text-center text-text-muted text-xs italic p-8">
        No request made yet
      </div>
      
      <div v-else-if="currentResponse.success" class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2 py-1 text-xs font-semibold text-sitefinity-blue bg-sitefinity-blue/15 border border-sitefinity-blue/30 rounded uppercase">
            {{ currentResponse.status }} {{ currentResponse.statusText }}
          </span>
          <span class="px-2 py-1 text-xs font-semibold text-sitefinity-yellow bg-sitefinity-yellow/15 border border-sitefinity-yellow/30 rounded uppercase">
            {{ currentResponse.method }}
          </span>
          <!-- View Mode Buttons inline with badges when space allows, otherwise wrap -->
          <template v-if="showViewModeButtons">
            <button
              @click="viewMode = 'source'"
              :class="[
                'px-2 py-1 text-xs font-medium rounded transition-all',
                viewMode === 'source' 
                  ? 'bg-sitefinity-green text-vue-dark' 
                  : 'bg-sitefinity-green/10 text-sitefinity-green border border-sitefinity-green/30 hover:bg-sitefinity-green/20'
              ]"
            >
              Source
            </button>
            <button
              v-if="isHtmlData"
              @click="viewMode = 'rendered'"
              :class="[
                'px-2 py-1 text-xs font-medium rounded transition-all',
                viewMode === 'rendered' 
                  ? 'bg-sitefinity-green text-vue-dark' 
                  : 'bg-sitefinity-green/10 text-sitefinity-green border border-sitefinity-green/30 hover:bg-sitefinity-green/20'
              ]"
            >
              Preview
            </button>
          </template>
        </div>
        
        <!-- URL with copy functionality -->
        <div 
          @click="copyUrl" 
          class="text-xs text-text-secondary break-all font-mono cursor-pointer hover:text-sitefinity-blue transition-colors px-2 py-1 rounded hover:bg-vue-darker"
          :title="urlCopied ? 'Copied!' : 'Click to copy URL'"
        >
          {{ currentResponse.url }}
          <span v-if="urlCopied" class="text-sitefinity-green ml-2">✓ Copied</span>
        </div>
        
        <!-- Word wrap toggle -->
        <div v-if="currentResponse && currentResponse.success" class="flex items-center gap-2">
          <label class="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input 
              v-model="wordWrapEnabled" 
              type="checkbox" 
              class="w-3 h-3 rounded border border-vue-border bg-vue-darkest text-sitefinity-green focus:ring-sitefinity-green/30"
            />
            Word Wrap
          </label>
        </div>
        
        <div class="bg-vue-darker border border-vue-border rounded p-3 overflow-auto min-w-0 max-w-full">
          <!-- Rendered HTML view -->
          <iframe 
            v-if="viewMode === 'rendered' && isHtmlData"
            ref="htmlPreviewFrame"
            class="w-full min-h-[400px] bg-white rounded border-0"
            :srcdoc="displayContent"
            sandbox="allow-same-origin"
          ></iframe>
          <!-- Source view (JSON highlighted or plain text) -->
          <pre 
            v-else
            :class="[
              'text-xs font-mono leading-relaxed',
              wordWrapEnabled 
                ? 'whitespace-pre-wrap break-all word-break-break-all overflow-wrap-anywhere' 
                : 'whitespace-pre'
            ]"
            :style="wordWrapEnabled ? 'word-break: break-all; overflow-wrap: anywhere;' : ''"
            v-html="displayContent"
          ></pre>
        </div>
      </div>
      
      <div v-else class="space-y-3">
        <div class="flex items-center gap-2">
          <!-- Show actual status code if available, otherwise "Error" -->
          <span 
            :class="[
              'px-2 py-1 text-xs font-semibold rounded uppercase',
              currentResponse.status 
                ? 'text-red-400 bg-red-400/15 border border-red-400/30'
                : 'text-sitefinity-green bg-sitefinity-green/15 border border-sitefinity-green/30'
            ]"
          >
            {{ currentResponse.status || 'Error' }}{{ currentResponse.statusText ? ' ' + currentResponse.statusText : '' }}
          </span>
          <span class="px-2 py-1 text-xs font-semibold text-sitefinity-yellow bg-sitefinity-yellow/15 border border-sitefinity-yellow/30 rounded uppercase">
            {{ currentResponse.method }}
          </span>
        </div>
        
        <div class="text-xs text-text-secondary break-all font-mono">
          {{ currentResponse.url }}
        </div>
        
        <div class="bg-vue-darker border border-red-400/30 rounded p-3 space-y-2">
          <!-- Error message -->
          <div v-if="currentResponse.error" class="text-xs text-red-400 font-medium">
            {{ currentResponse.error }}
          </div>
          
          <!-- Response data if available (for failed requests that still return data) -->
          <div v-if="currentResponse.data" class="border-t border-vue-border-light pt-2">
            <div class="text-xs text-text-muted mb-1">Response Data:</div>
            <pre class="text-xs font-mono text-text-primary whitespace-pre-wrap" v-html="formatErrorResponseData"></pre>
          </div>
          
          <!-- Additional debug info -->
          <div v-if="currentResponse.status && currentResponse.status >= 400" class="border-t border-vue-border-light pt-2">
            <div class="text-xs text-text-muted">
              HTTP {{ currentResponse.status }}: {{ getStatusDescription(currentResponse.status) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

// Props
const props = defineProps({
  currentResponse: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Local state for view mode and options
const viewMode = ref('source') // 'source', 'rendered'
const wordWrapEnabled = ref(true) // Default to word wrap enabled
const urlCopied = ref(false)

// Emits
const emit = defineEmits(['clear-response'])

// Computed properties

const isJsonData = computed(() => {
  return props.currentResponse && typeof props.currentResponse.data === 'object'
})

const isHtmlData = computed(() => {
  if (!props.currentResponse || typeof props.currentResponse.data !== 'string') return false
  const data = props.currentResponse.data.toLowerCase().trim()
  return data.startsWith('<!doctype html') || 
         data.startsWith('<html') || 
         data.includes('<body') || 
         data.includes('<head') ||
         data.includes('<title>') ||
         data.includes('<meta') ||
         data.includes('<div') ||
         (data.includes('<') && data.includes('>') && data.match(/<[a-z]+[^>]*>/i))
})

const showViewModeButtons = computed(() => {
  // Show buttons for any string response (not just HTML)
  return props.currentResponse && 
         props.currentResponse.success && 
         typeof props.currentResponse.data === 'string' &&
         props.currentResponse.data.length > 0
})

const displayContent = computed(() => {
  if (!props.currentResponse || !props.currentResponse.data) return '<span class="text-text-muted">No response data</span>'
  
  // JSON data - always show highlighted JSON
  if (isJsonData.value) {
    const jsonString = JSON.stringify(props.currentResponse.data, null, 2)
    return jsonString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"]+)":/g, '<span class="text-sitefinity-blue">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-sitefinity-green">"$1"</span>')
      .replace(/: (true|false)/g, ': <span class="text-sitefinity-yellow">$1</span>')
      .replace(/: (null)/g, ': <span class="text-text-muted">$1</span>')
      .replace(/: (-?\d+\.?\d*)/g, ': <span class="text-orange-400">$1</span>')
      .replace(/(\{|\}|\[|\])/g, '<span class="text-text-primary">$1</span>')
  }
  
  // HTML/String data - depends on view mode
  const stringData = String(props.currentResponse.data)
  
  if (viewMode.value === 'rendered' && isHtmlData.value) {
    return stringData // Raw HTML for direct rendering
  } else {
    // Source view - escape HTML and show as white text
    return `<span class="text-text-primary">${stringData
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</span>`
  }
})


// Format error response data with syntax highlighting if JSON
const formatErrorResponseData = computed(() => {
  if (!props.currentResponse || !props.currentResponse.data) return ''
  
  const data = props.currentResponse.data
  if (typeof data === 'object') {
    const jsonString = JSON.stringify(data, null, 2)
    return jsonString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"([^\"]+)\":/g, '<span class="text-sitefinity-blue">\"$1\"</span>:')
      .replace(/: \"([^\"]+)\"/g, ': <span class="text-sitefinity-green">\"$1\"</span>')
      .replace(/: (true|false)/g, ': <span class="text-sitefinity-yellow">$1</span>')
      .replace(/: (null)/g, ': <span class="text-text-muted">$1</span>')
      .replace(/: (-?\d+\.?\d*)/g, ': <span class="text-orange-400">$1</span>')
  } else {
    return String(data)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
})

// Methods
const clearResponse = () => {
  emit('clear-response')
}

const copyUrl = async () => {
  if (!props.currentResponse?.url) return
  
  try {
    await navigator.clipboard.writeText(props.currentResponse.url)
    urlCopied.value = true
    setTimeout(() => {
      urlCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy URL:', error)
  }
}

const getStatusDescription = (status) => {
  const descriptions = {
    400: 'Bad Request - Invalid request syntax or parameters',
    401: 'Unauthorized - Authentication required or invalid credentials',
    403: 'Forbidden - Access denied to this resource',
    404: 'Not Found - The requested resource could not be found',
    405: 'Method Not Allowed - HTTP method not supported for this resource',
    408: 'Request Timeout - Server timed out waiting for request',
    409: 'Conflict - Request conflicts with current state of resource',
    422: 'Unprocessable Entity - Request syntax is correct but semantically invalid',
    429: 'Too Many Requests - Rate limit exceeded',
    500: 'Internal Server Error - Server encountered an unexpected condition',
    501: 'Not Implemented - Server does not support the functionality required',
    502: 'Bad Gateway - Invalid response from upstream server',
    503: 'Service Unavailable - Server is temporarily unavailable',
    504: 'Gateway Timeout - Upstream server failed to respond in time'
  }
  return descriptions[status] || 'HTTP Error'
}
</script>