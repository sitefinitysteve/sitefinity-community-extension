<template>
  <div class="flex h-full w-full">
    <!-- Left: API Tester Request Panel -->
    <div class="w-80 bg-vue-dark border-r border-vue-border flex flex-col">
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
            class="px-2 py-1 text-xs font-medium bg-sitefinity-green/10 text-sitefinity-green border border-sitefinity-green/30 rounded transition-all hover:bg-sitefinity-green/20"
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
                    item.success ? 'text-sitefinity-blue' : 'text-sitefinity-green'
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
              class="p-3 text-sitefinity-green/60 hover:text-sitefinity-green hover:bg-sitefinity-green/10 transition-all duration-200"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Response Panel (fills remaining space) -->
    <ResponsePanel 
      :current-response="currentResponse"
      @clear-response="clearResponse"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ResponsePanel from './ResponsePanel.vue'

// Props
const props = defineProps({
  siteInfo: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['response-update'])

// Reactive state
const apiRoute = ref('')
const httpMethod = ref('GET')
const requestBody = ref('')
const history = ref([])
const currentResponse = ref(null)

// Computed properties
const showRequestBody = computed(() => {
  return httpMethod.value === 'POST' || httpMethod.value === 'PUT'
})

const methodBadgeClasses = computed(() => {
  return 'bg-sitefinity-yellow/15 text-sitefinity-yellow border-sitefinity-yellow/30'
})

// Methods
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
          
          console.log('Sitefinity Community: Starting request execution');
          console.log('Sitefinity Community: Current URL:', window.location.href);
          console.log('Sitefinity Community: Origin:', window.location.origin);
          
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
          
          console.log('Sitefinity Community: Request options:', options);
          
          try {
            fetch(fullUrl, options)
            .then(response => {
              console.log('Sitefinity Community Response received:', response.status, response.statusText);
              return response.text().then(responseText => {
                let data;
                try {
                  data = JSON.parse(responseText);
                } catch (e) {
                  data = responseText;
                }
                
                console.log('Sitefinity Community Response data:', data);
                
                window.__sitefinityResult = {
                  success: response.ok,
                  status: response.status,
                  statusText: response.statusText,
                  data: data,
                  url: fullUrl,
                  method: method,
                  body: bodyData
                };
                
                console.log('Sitefinity Community Result stored:', window.__sitefinityResult);
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
              
              console.log('Sitefinity Community Error stored:', window.__sitefinityResult);
            });
          } catch (fetchError) {
            console.error('Sitefinity Community Fetch setup failed:', fetchError);
            window.__sitefinityResult = {
              success: false,
              error: 'Fetch setup failed: ' + fetchError.message,
              url: fullUrl,
              method: method,
              body: bodyData
            };
          }
          
          return 'REQUEST_INITIATED';
        })()
      `;

      chrome.devtools.inspectedWindow.eval(executeCode, (result, isException) => {
        if (isException) {
          console.error('Code execution failed:', isException);
          reject(new Error(isException.value || 'Execution failed'));
        } else {
          console.log('Code executed successfully, result:', result);
          // Poll for result with multiple attempts
          let attempts = 0;
          const maxAttempts = 10;
          const pollInterval = 500;
          
          const pollForResult = () => {
            chrome.devtools.inspectedWindow.eval('window.__sitefinityResult', (asyncResult, asyncException) => {
              if (asyncException) {
                console.error('Error polling for result:', asyncException);
                reject(new Error('Failed to retrieve result: ' + asyncException.value));
              } else if (asyncResult) {
                console.log('Result found on attempt', attempts + 1, ':', asyncResult);
                // Clear the result to avoid conflicts
                chrome.devtools.inspectedWindow.eval('delete window.__sitefinityResult');
                resolve(asyncResult);
              } else {
                attempts++;
                console.log('Polling attempt', attempts, 'of', maxAttempts, '- no result yet');
                if (attempts < maxAttempts) {
                  setTimeout(pollForResult, pollInterval);
                } else {
                  // Check console for any errors before timing out
                  console.error('Request timed out after', maxAttempts, 'attempts. Check the browser console for fetch errors.');
                  reject(new Error('Request timeout - no result available after ' + (maxAttempts * pollInterval / 1000) + ' seconds. Check browser console for fetch errors.'));
                }
              }
            });
          };
          
          setTimeout(pollForResult, 500);
        }
      });
    });

    // Update local response and emit to parent
    currentResponse.value = result
    emit('response-update', result)
    
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
    
    const errorResponse = {
      success: false,
      error: error.message,
      url: 'Unknown',
      method: method
    }
    
    currentResponse.value = errorResponse
    emit('response-update', errorResponse)
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

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const clearResponse = () => {
  currentResponse.value = null
}

// Expose methods for parent component
const setApiRoute = (route) => {
  apiRoute.value = route
}

defineExpose({
  setApiRoute
})

// Lifecycle
onMounted(async () => {
  await loadHistory()
})
</script>