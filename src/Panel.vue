<template>
  <div class="flex h-screen bg-vue-dark">
    <!-- Tools Sidebar -->
    <div class="w-52 bg-vue-darker border-r border-vue-border flex flex-col">
      <!-- Header -->
      <div class="p-3 border-b border-vue-border bg-vue-darkest">
        <h1 class="text-sm font-semibold text-sitefinity-pink mb-1 tracking-wider">
          Sitefinity Community
        </h1>
        <div class="text-xs text-text-muted italic uppercase tracking-wide mb-2">
          Unofficial Extension
        </div>
        <div 
          :class="statusClasses"
          class="text-xs font-medium px-2 py-1 rounded-sm border inline-block"
        >
          {{ statusText }}
        </div>
      </div>

      <!-- Tools List -->
      <div class="flex-1 overflow-y-auto">
        <div 
          v-for="tool in tools" 
          :key="tool.id"
          @click="selectTool(tool.id)"
          :class="[
            'flex items-center py-2 px-4 cursor-pointer transition-colors duration-200 border-b border-vue-border-light',
            tool.active ? 'bg-sitefinity-blue/15 text-sitefinity-blue border-r-2 border-r-sitefinity-blue' : 'text-text-secondary hover:bg-vue-dark hover:text-text-primary',
            tool.disabled && 'opacity-50 cursor-not-allowed'
          ]"
        >
          <span class="mr-3 text-sm">{{ tool.icon }}</span>
          <span class="text-xs font-medium">{{ tool.name }}</span>
        </div>
      </div>

      <!-- Branding Footer -->
      <div class="border-t border-vue-border p-4 bg-vue-darkest">
        <a 
          href="https://www.sitefinitysteve.com" 
          target="_blank" 
          rel="noopener"
          class="block text-center p-1 rounded transition-all duration-200 hover:bg-sitefinity-blue/10 hover:-translate-y-0.5"
        >
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Created by</div>
          <div class="text-xs font-semibold text-sitefinity-pink mb-1 tracking-wide">SitefinitySteve</div>
          <div class="text-xs text-sitefinity-blue">www.sitefinitysteve.com</div>
        </a>
      </div>
    </div>

    <!-- API Tester Panel -->
    <div class="flex-1 bg-vue-dark border-r border-vue-border flex flex-col">
      <div class="p-4 border-b border-vue-border bg-vue-darker">
        <h2 class="text-sm font-semibold text-text-primary">API Tester</h2>
      </div>

      <!-- Request Form -->
      <div class="p-4 border-b border-vue-border">
        <div class="mb-3">
          <label class="block text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
            API Route:
          </label>
          <div class="flex gap-2">
            <input
              v-model="apiRoute"
              @input="processRouteInput"
              type="text"
              placeholder="e.g., /api/default/newsitems"
              class="flex-1 px-2 py-1.5 text-xs font-mono bg-vue-darkest text-text-primary border border-vue-border rounded focus:outline-none focus:border-sitefinity-blue focus:ring-1 focus:ring-sitefinity-blue/30 transition-all"
            />
            <button
              @click="executeRequest"
              :disabled="!siteInfo.isSitefinity || !apiRoute.trim()"
              class="px-3 py-1.5 text-xs font-medium bg-sitefinity-blue text-vue-dark rounded transition-all duration-200 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Execute
            </button>
          </div>
        </div>

        <div class="mb-3">
          <label class="block text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
            Method:
          </label>
          <select
            v-model="httpMethod"
            @change="onMethodChange"
            class="w-full px-2 py-1.5 text-xs font-mono bg-vue-darkest text-text-primary border border-vue-border rounded focus:outline-none focus:border-sitefinity-blue focus:ring-1 focus:ring-sitefinity-blue/30 transition-all"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div v-if="showRequestBody" class="mb-3">
          <label class="block text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
            Request Body (JSON):
          </label>
          <textarea
            v-model="requestBody"
            placeholder='{"key": "value"}'
            rows="4"
            class="w-full px-2 py-1.5 text-xs font-mono bg-vue-darkest text-text-primary border border-vue-border rounded focus:outline-none focus:border-sitefinity-blue focus:ring-1 focus:ring-sitefinity-blue/30 transition-all resize-y"
          ></textarea>
        </div>
      </div>

      <!-- Request History -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex justify-between items-center p-3 border-b border-vue-border bg-vue-darker">
          <h3 class="text-xs font-semibold text-text-primary">Request History</h3>
          <button
            @click="clearAllHistory"
            class="px-2 py-1 text-xs font-medium bg-sitefinity-pink/10 text-sitefinity-pink border border-sitefinity-pink/30 rounded transition-all hover:bg-sitefinity-pink/20"
          >
            Clear All
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto bg-vue-dark">
          <div v-if="history.length === 0" class="p-8 text-center text-text-muted text-xs italic">
            No requests made yet
          </div>
          <div
            v-for="(item, index) in history"
            :key="index"
            class="flex items-center border-b border-vue-border-light hover:bg-vue-darker transition-all duration-200"
          >
            <div 
              @click="loadFromHistory(item)"
              class="flex-1 p-3 cursor-pointer"
            >
              <div class="flex items-center gap-2 mb-1">
                <span 
                  :class="methodBadgeClasses"
                  class="px-1.5 py-0.5 text-xs font-semibold rounded border uppercase min-w-[35px] text-center"
                >
                  {{ item.method }}
                </span>
                <span 
                  :class="[
                    'text-xs font-mono',
                    item.success ? 'text-sitefinity-blue' : 'text-sitefinity-pink'
                  ]"
                >
                  {{ item.route }}
                </span>
              </div>
              <div class="flex gap-3 text-xs text-text-muted">
                <span>{{ item.status }}</span>
                <span>{{ formatTime(item.timestamp) }}</span>
              </div>
            </div>
            <button
              @click="deleteHistoryItem(index)"
              class="p-3 text-sitefinity-pink/60 hover:text-sitefinity-pink hover:bg-sitefinity-pink/10 transition-all duration-200"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Response Panel -->
    <div class="flex-1 bg-vue-dark flex flex-col">
      <div class="flex justify-between items-center p-4 border-b border-vue-border bg-vue-darker">
        <h2 class="text-sm font-semibold text-text-primary">Response</h2>
        <button
          @click="clearResponse"
          class="px-2 py-1 text-xs font-medium bg-sitefinity-pink/10 text-sitefinity-pink border border-sitefinity-pink/30 rounded transition-all hover:bg-sitefinity-pink/20"
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
            <span class="px-2 py-1 text-xs font-semibold text-sitefinity-pink bg-sitefinity-pink/15 border border-sitefinity-pink/30 rounded uppercase">
              Error
            </span>
            <span class="px-2 py-1 text-xs font-semibold text-sitefinity-yellow bg-sitefinity-yellow/15 border border-sitefinity-yellow/30 rounded uppercase">
              {{ currentResponse.method }}
            </span>
          </div>
          
          <div class="text-xs text-text-secondary break-all font-mono">
            {{ currentResponse.url }}
          </div>
          
          <div class="bg-vue-darker border border-sitefinity-pink/30 rounded p-3">
            <div class="text-xs text-sitefinity-pink">{{ currentResponse.error }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Reactive state
const siteInfo = ref({ isSitefinity: false, version: 'Unknown' })
const apiRoute = ref('')
const httpMethod = ref('GET')
const requestBody = ref('')
const history = ref([])
const currentResponse = ref(null)

// Tool configuration
const tools = ref([
  { id: 'api-tester', name: 'API Tester', icon: '🔧', active: true, disabled: false },
  { id: 'api-discovery', name: 'API Discovery', icon: '🔍', active: false, disabled: true }
])

// Computed properties
const statusClasses = computed(() => {
  if (siteInfo.value.isSitefinity) {
    return 'bg-sitefinity-blue/15 text-sitefinity-blue border-sitefinity-blue/30'
  }
  return 'bg-sitefinity-pink/15 text-sitefinity-pink border-sitefinity-pink/30'
})

const statusText = computed(() => {
  if (siteInfo.value.isSitefinity) {
    return `✓ Sitefinity ${siteInfo.value.version} Detected`
  }
  return '✗ Not a Sitefinity Site'
})

const showRequestBody = computed(() => {
  return httpMethod.value === 'POST' || httpMethod.value === 'PUT'
})

const methodBadgeClasses = computed(() => {
  return 'bg-sitefinity-yellow/15 text-sitefinity-yellow border-sitefinity-yellow/30'
})

const formattedResponseData = computed(() => {
  if (!currentResponse.value || !currentResponse.value.data) return 'No response data'
  
  if (typeof currentResponse.value.data === 'object') {
    return JSON.stringify(currentResponse.value.data, null, 2)
  }
  return String(currentResponse.value.data)
})

// Methods
const checkSitefinitySite = async () => {
  try {
    const result = await new Promise((resolve) => {
      chrome.devtools.inspectedWindow.eval(`
        (function() {
          const metaTags = document.querySelectorAll('meta[name="Generator"]');
          for (const meta of metaTags) {
            if (meta.content && meta.content.toLowerCase().includes('sitefinity')) {
              const versionMatch = meta.content.match(/sitefinity\\s+([\\d.]+)/i);
              const version = versionMatch ? versionMatch[1] : 'Unknown';
              return { isSitefinity: true, generator: meta.content, version: version };
            }
          }
          return { isSitefinity: false };
        })()
      `, resolve);
    });

    siteInfo.value = result
  } catch (error) {
    console.error('Error checking Sitefinity:', error)
    siteInfo.value = { isSitefinity: false, version: 'Unknown' }
  }
}

const processRouteInput = () => {
  const value = apiRoute.value.trim()
  if (!value) return

  try {
    if (value.includes('://') || value.startsWith('www.')) {
      const url = new URL(value.startsWith('www.') ? 'https://' + value : value)
      const pathOnly = url.pathname + url.search + url.hash
      apiRoute.value = pathOnly
    }
  } catch (error) {
    // Not a valid URL, leave as is
  }
}

const onMethodChange = () => {
  if (!showRequestBody.value) {
    requestBody.value = ''
  }
}

const executeRequest = async () => {
  const route = apiRoute.value.trim()
  if (!route) return

  const method = httpMethod.value
  const body = requestBody.value.trim()

  try {
    const result = await new Promise((resolve, reject) => {
      const executeCode = `
        (function() {
          const route = ${JSON.stringify(route)};
          const method = ${JSON.stringify(method)};
          const bodyData = ${JSON.stringify(body)};
          
          const fullUrl = window.location.origin + (route.startsWith('/') ? route : '/' + route);
          console.log('Sitefinity Community: Making ' + method + ' request to: ' + fullUrl);
          
          const options = {
            method: method,
            headers: {
              'X-Requested-With': 'Browser',
              'Content-Type': 'application/json'
            }
          };
          
          if ((method === 'POST' || method === 'PUT') && bodyData) {
            options.body = bodyData;
          }
          
          fetch(fullUrl, options)
            .then(response => {
              return response.text().then(responseText => {
                let data;
                try {
                  data = JSON.parse(responseText);
                } catch (e) {
                  data = responseText;
                }
                
                console.log('Sitefinity Community Response:', data);
                
                window.__sitefinityResult = {
                  success: true,
                  status: response.status,
                  statusText: response.statusText,
                  data: data,
                  url: fullUrl,
                  method: method,
                  body: bodyData
                };
              });
            })
            .catch(error => {
              console.error('Sitefinity Community Request failed:', error);
              window.__sitefinityResult = {
                success: false,
                error: error.message,
                url: fullUrl,
                method: method,
                body: bodyData
              };
            });
          
          return 'REQUEST_INITIATED';
        })()
      `;

      chrome.devtools.inspectedWindow.eval(executeCode, (result, isException) => {
        if (isException) {
          reject(new Error(isException.value || 'Execution failed'));
        } else {
          setTimeout(() => {
            chrome.devtools.inspectedWindow.eval('window.__sitefinityResult', (asyncResult, asyncException) => {
              if (asyncException) {
                reject(new Error('Failed to retrieve result'));
              } else if (asyncResult) {
                resolve(asyncResult);
              } else {
                reject(new Error('No result available'));
              }
            });
          }, 2000);
        }
      });
    });

    currentResponse.value = result
    
    const requestData = {
      route,
      method,
      body: body || undefined,
      url: result.url,
      timestamp: new Date().toISOString(),
      status: result.success ? result.status : 'Error',
      success: result.success
    }

    if (!result.success) {
      requestData.error = result.error
    }

    await saveToHistory(requestData)
    await loadHistory()
    
    requestBody.value = ''
    
  } catch (error) {
    console.error('Panel execution error:', error)
    
    currentResponse.value = {
      success: false,
      error: error.message,
      url: 'Unknown',
      method: method
    }
  }
}

const saveToHistory = async (requestData) => {
  const { history: storedHistory = [] } = await chrome.storage.local.get('history')
  
  const requestKey = `${requestData.method}:${requestData.route}${requestData.body ? ':' + requestData.body : ''}`
  
  const filteredHistory = storedHistory.filter(item => {
    const itemKey = `${item.method}:${item.route}${item.body ? ':' + item.body : ''}`
    return itemKey !== requestKey
  })
  
  filteredHistory.unshift(requestData)
  
  if (filteredHistory.length > 10) {
    filteredHistory.splice(10)
  }
  
  await chrome.storage.local.set({ history: filteredHistory })
}

const loadHistory = async () => {
  const { history: storedHistory = [] } = await chrome.storage.local.get('history')
  history.value = storedHistory
}

const loadFromHistory = (item) => {
  apiRoute.value = item.route
  httpMethod.value = item.method
  if (item.body) {
    requestBody.value = item.body
  }
}

const deleteHistoryItem = async (index) => {
  const { history: storedHistory = [] } = await chrome.storage.local.get('history')
  storedHistory.splice(index, 1)
  await chrome.storage.local.set({ history: storedHistory })
  await loadHistory()
}

const clearAllHistory = async () => {
  await chrome.storage.local.set({ history: [] })
  await loadHistory()
}

const clearResponse = () => {
  currentResponse.value = null
}

const selectTool = (toolId) => {
  // For now, only API Tester is active
  console.log('Selected tool:', toolId)
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

// Lifecycle
onMounted(async () => {
  await checkSitefinitySite()
  await loadHistory()
})
</script>