<template>
  <div class="flex h-full w-full">
    <!-- Left: History Sidebar (collapsible) -->
    <div
      :class="[
        'bg-vue-darker border-r border-vue-border flex flex-col transition-all duration-200',
        showHistory ? 'w-64' : 'w-10'
      ]"
    >
      <!-- Sidebar Header -->
      <div class="flex items-center justify-between p-2 border-b border-vue-border bg-vue-darkest">
        <button
          @click="showHistory = !showHistory"
          class="p-1 text-text-muted hover:text-text-primary transition-colors"
          :title="showHistory ? 'Collapse history' : 'Expand history'"
        >
          <span v-if="showHistory">◀</span>
          <span v-else>▶</span>
        </button>
        <template v-if="showHistory">
          <span class="text-xs font-medium text-text-secondary">History</span>
          <button
            @click="clearAllHistory"
            class="p-1 text-xs text-text-muted hover:text-red-400 transition-colors"
            title="Clear all history"
          >
            ×
          </button>
        </template>
      </div>

      <!-- History Content (when expanded) -->
      <template v-if="showHistory">
        <!-- Record Toggle -->
        <div class="p-2 border-b border-vue-border">
          <button
            @click="toggleXhrWatch"
            :class="[
              'w-full px-3 py-2 text-xs font-medium rounded transition-all flex items-center justify-center gap-2',
              isWatchingXhr
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-vue-darkest text-text-muted border border-vue-border hover:text-text-primary hover:border-sitefinity-blue'
            ]"
          >
            <span :class="['w-2 h-2 rounded-full', isWatchingXhr ? 'bg-red-500 animate-pulse' : 'bg-gray-500']"></span>
            {{ isWatchingXhr ? 'Recording...' : 'Record Requests' }}
          </button>
        </div>

        <!-- Tab Buttons -->
        <div class="flex border-b border-vue-border bg-vue-darkest">
          <button
            @click="historyTab = 'internal'"
            :class="[
              'flex-1 px-2 py-1.5 text-xs font-medium transition-all',
              historyTab === 'internal'
                ? 'text-sitefinity-blue border-b-2 border-sitefinity-blue bg-vue-dark'
                : 'text-text-muted hover:text-text-primary'
            ]"
          >
            Site ({{ internalHistory.length }})
          </button>
          <button
            @click="historyTab = 'external'"
            :class="[
              'flex-1 px-2 py-1.5 text-xs font-medium transition-all',
              historyTab === 'external'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-vue-dark'
                : 'text-text-muted hover:text-text-primary'
            ]"
          >
            Ext ({{ externalHistory.length }})
          </button>
        </div>

        <!-- History List -->
        <div class="flex-1 overflow-y-auto">
          <div
            v-if="(historyTab === 'internal' ? internalHistory : externalHistory).length === 0"
            class="p-4 text-center text-text-muted text-xs italic"
          >
            No requests
          </div>
          <div
            v-for="item in (historyTab === 'internal' ? internalHistory : externalHistory)"
            :key="item.timestamp"
            @click="loadFromHistory(item)"
            class="p-2 border-b border-vue-border-light hover:bg-vue-dark cursor-pointer transition-colors"
          >
            <div class="flex items-center gap-1 mb-1">
              <span v-if="item.captured" class="text-amber-400 text-xs">●</span>
              <span :class="getMethodColor(item.method)" class="text-xs font-semibold">{{ item.method }}</span>
              <span class="text-xs text-text-muted">{{ item.status }}</span>
            </div>
            <div class="text-xs font-mono text-text-secondary truncate" :title="item.route">
              {{ item.route }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- URL Bar (Postman style) -->
      <div class="p-3 border-b border-vue-border bg-vue-darker">
        <div class="flex gap-0">
          <!-- Method Dropdown -->
          <select
            v-model="httpMethod"
            @change="onMethodChange"
            :class="[
              'px-3 py-2 text-sm font-semibold border border-vue-border bg-vue-darkest rounded-l transition-all cursor-pointer',
              getMethodColor(httpMethod)
            ]"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>

          <!-- URL Input -->
          <input
            v-model="apiRoute"
            @input="processRouteInput"
            @keyup.enter="executeRequest"
            type="text"
            placeholder="Enter request URL or path (e.g., /api/default/newsitems)"
            class="flex-1 px-3 py-2 text-sm font-mono bg-vue-darkest text-text-primary border-y border-vue-border focus:outline-none focus:border-sitefinity-blue transition-all"
          />

          <!-- Send Button -->
          <button
            @click="executeRequest"
            :disabled="!siteInfo.isSitefinity || !apiRoute.trim() || isLoading"
            class="px-6 py-2 text-sm font-semibold bg-sitefinity-blue text-vue-dark rounded-r transition-all hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Sending...' : 'Send' }}
          </button>
        </div>
      </div>

      <!-- Scrollable content area (Request config + Response) -->
      <div ref="scrollContainerRef" class="flex-1 overflow-y-auto">
        <!-- Request Tabs -->
        <div class="border-b border-vue-border bg-vue-dark sticky top-0 z-10">
          <div class="flex items-center">
            <button
              @click="showRequestConfig = !showRequestConfig"
              class="px-2 py-2 text-text-muted hover:text-text-primary transition-colors"
              :title="showRequestConfig ? 'Collapse request config' : 'Expand request config'"
            >
              <span v-if="showRequestConfig">▼</span>
              <span v-else>▶</span>
            </button>
            <button
              v-for="tab in requestTabs"
              :key="tab.id"
              @click="activeRequestTab = tab.id; showRequestConfig = true; scrollToTop()"
              :class="[
                'px-4 py-2 text-xs font-medium transition-all border-b-2',
                activeRequestTab === tab.id
                  ? 'text-sitefinity-blue border-sitefinity-blue'
                  : 'text-text-muted border-transparent hover:text-text-primary'
              ]"
            >
              {{ tab.label }}
              <span v-if="tab.count" class="ml-1 text-text-muted">({{ tab.count }})</span>
            </button>
          </div>
        </div>

        <!-- Request Tab Content (collapsible) -->
        <div v-if="showRequestConfig" class="border-b border-vue-border bg-vue-dark">
          <!-- Headers Tab -->
          <div v-if="activeRequestTab === 'headers'" class="p-3">
            <div class="text-xs text-text-muted mb-2">Request headers will be shown here. Custom headers coming soon.</div>
            <div class="bg-vue-darker rounded p-2 text-xs font-mono text-text-primary">
              <div><span class="text-sitefinity-blue">Content-Type:</span> application/json</div>
              <div><span class="text-sitefinity-blue">X-Requested-With:</span> Browser</div>
            </div>
          </div>

          <!-- Body Tab -->
          <div v-if="activeRequestTab === 'body'" class="p-3">
            <div class="flex items-center gap-4 mb-2">
              <label class="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input type="radio" v-model="bodyType" value="none" class="text-sitefinity-blue" />
                none
              </label>
              <label class="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input type="radio" v-model="bodyType" value="json" class="text-sitefinity-blue" />
                JSON
              </label>
            </div>
            <textarea
              v-if="bodyType === 'json'"
              v-model="requestBody"
              placeholder='{"key": "value"}'
              rows="6"
              class="w-full px-3 py-2 text-xs font-mono bg-vue-darkest text-text-primary border border-vue-border rounded focus:outline-none focus:border-sitefinity-blue transition-all resize-y"
            ></textarea>
            <div v-else class="text-xs text-text-muted italic">This request does not have a body</div>
          </div>

          <!-- Params Tab -->
          <div v-if="activeRequestTab === 'params'" class="p-3">
            <div class="text-xs text-text-muted">Query parameters are automatically parsed from the URL.</div>
            <div v-if="queryParams.length" class="mt-2 bg-vue-darker rounded p-2">
              <div v-for="(param, i) in queryParams" :key="i" class="text-xs font-mono mb-1">
                <span class="text-sitefinity-blue">{{ param.key }}:</span>
                <span class="text-text-primary ml-2">{{ param.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Response Section (inline, scrolls with above) -->
        <ResponsePanel
          :current-response="currentResponse"
          :loading="isLoading"
          @clear-response="clearResponse"
          class="min-h-[300px]"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ResponsePanel from './ResponsePanel.vue'
import { sitefinityStatusService } from '../../services/sitefinityStatusService.js'
import { xhrMonitorService } from '../../services/xhrMonitorService.js'

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
const isLoading = ref(false)
const isWatchingXhr = ref(false)
const historyTab = ref('internal') // 'internal' or 'external'
const showHistory = ref(true)
const activeRequestTab = ref('body')
const bodyType = ref('json')
const showRequestConfig = ref(true)
const scrollContainerRef = ref(null)
let xhrUnsubscribe = null

// Request tabs configuration
const requestTabs = computed(() => [
  { id: 'params', label: 'Params', count: queryParams.value.length || null },
  { id: 'headers', label: 'Headers', count: 2 },
  { id: 'body', label: 'Body', count: null }
])

// Computed properties
const showRequestBody = computed(() => {
  return httpMethod.value === 'POST' || httpMethod.value === 'PUT'
})

const methodBadgeClasses = computed(() => {
  return 'bg-sitefinity-yellow/15 text-sitefinity-yellow border-sitefinity-yellow/30'
})

// Get current domain from siteInfo
const currentDomain = computed(() => {
  if (props.siteInfo?.url) {
    try {
      return new URL(props.siteInfo.url).hostname
    } catch (e) {
      return ''
    }
  }
  return ''
})

// Split history into internal and external requests
const internalHistory = computed(() => {
  if (!currentDomain.value) return history.value
  return history.value.filter(item => {
    if (!item.url) return true // Manual requests without full URL are internal
    try {
      const itemDomain = new URL(item.url).hostname
      return itemDomain === currentDomain.value
    } catch (e) {
      return true
    }
  })
})

const externalHistory = computed(() => {
  if (!currentDomain.value) return []
  return history.value.filter(item => {
    if (!item.url) return false
    try {
      const itemDomain = new URL(item.url).hostname
      return itemDomain !== currentDomain.value
    } catch (e) {
      return false
    }
  })
})

// Truncate long routes for display
const truncateRoute = (route, maxLength = 50) => {
  if (!route || route.length <= maxLength) return route
  return route.substring(0, maxLength) + '...'
}

// Parse query params from URL
const queryParams = computed(() => {
  if (!apiRoute.value) return []
  try {
    const queryString = apiRoute.value.includes('?') ? apiRoute.value.split('?')[1] : ''
    if (!queryString) return []
    const params = new URLSearchParams(queryString)
    return Array.from(params.entries()).map(([key, value]) => ({ key, value }))
  } catch (e) {
    return []
  }
})

// Get method color class
const getMethodColor = (method) => {
  const colors = {
    GET: 'text-green-400',
    POST: 'text-yellow-400',
    PUT: 'text-blue-400',
    PATCH: 'text-purple-400',
    DELETE: 'text-red-400'
  }
  return colors[method] || 'text-text-primary'
}

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

const executeRequestWithParams = async (routeParam, methodParam, bodyParam) => {
  if (!routeParam) return

  const route = routeParam
  const method = methodParam
  const body = bodyParam

  console.log('Executing request with params:', { route, method, body })

  isLoading.value = true
  currentResponse.value = null

  try {
    const result = await performRequest(route, method, body)
    
    if (!result) {
      throw new Error('No response received from request')
    }
    
    // Check if response contains status page and notify service
    if (result.isStatusPage) {
      console.log('Status page detected in API response, notifying service');
      sitefinityStatusService.checkResponseForStatusPage(
        typeof result.data === 'string' ? result.data : JSON.stringify(result.data),
        result.url
      );
    } else if (result.data && typeof result.data === 'string') {
      // Additional check for status pages that might not have been caught
      const responseText = result.data;
      const isStatusPage = responseText.includes('appStatusApp') || 
                          responseText.includes('ng-app="appStatusApp"') ||
                          responseText.includes("ng-app='appStatusApp'") ||
                          (responseText.includes('<html') && responseText.includes('ng-app'));
      
      if (isStatusPage) {
        console.log('Status page detected in post-processing, notifying service');
        sitefinityStatusService.checkResponseForStatusPage(responseText, result.url);
        
        // Add this request to be retried when Sitefinity is ready
        const requestId = `${method}-${route}-${Date.now()}`;
        sitefinityStatusService.addPendingRequest(requestId, { route, method, body }, (params) => {
          console.log('Auto-retrying request after Sitefinity loading completed:', params);
          // Execute the request directly with stored parameters instead of current form values
          executeRequestWithParams(params.route, params.method, params.body || '');
        });
      }
    }
    
    // Update local response and emit to parent
    currentResponse.value = result
    emit('response-update', result)
    
    const requestData = {
      route,
      method,
      body: body || undefined,
      url: result.url || 'Unknown',
      timestamp: new Date().toISOString(),
      status: result.success ? result.status : 'Error',
      success: result.success
    }

    if (!result.success) {
      requestData.error = result.error
    }

    await saveToHistory(requestData)
    await loadHistory()
    
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
  } finally {
    isLoading.value = false
  }
}

const executeRequest = async () => {
  const route = apiRoute.value.trim()
  if (!route) return

  const method = httpMethod.value
  const body = requestBody.value.trim()

  await executeRequestWithParams(route, method, body)
  requestBody.value = ''
}

const performRequest = async (route, method, body) => {
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
              
              // Check if response is a Sitefinity status page
              const isStatusPage = responseText && (
                responseText.includes('appStatusApp') || 
                responseText.includes('ng-app="appStatusApp"') ||
                responseText.includes("ng-app='appStatusApp'") ||
                responseText.includes('Sitefinity is starting') ||
                responseText.includes('Please wait while the system is loading') ||
                responseText.includes('moduleStatusApp') ||
                responseText.includes('startup-status') ||
                (responseText.includes('<html') && responseText.includes('ng-app')) ||
                responseText.includes('<!DOCTYPE html')
              );
              
              console.log('Sitefinity Community Response data:', data);
              if (isStatusPage) {
                console.log('Sitefinity Community: Status page detected in response');
              }
              
              window.__sitefinityResult = {
                success: response.ok,
                status: response.status,
                statusText: response.statusText,
                data: data,
                url: fullUrl,
                method: method,
                body: bodyData,
                isStatusPage: isStatusPage,
                error: !response.ok ? \`HTTP \${response.status} \${response.statusText}\` : null
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
        const maxAttempts = 30;
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

  return result;
}

const saveToHistory = async (requestData) => {
  const { history: storedHistory = [] } = await chrome.storage.local.get('history')
  
  const requestKey = `${requestData.method}:${requestData.route}${requestData.body ? ':' + requestData.body : ''}`
  
  const filteredHistory = storedHistory.filter(item => {
    const itemKey = `${item.method}:${item.route}${item.body ? ':' + item.body : ''}`
    return itemKey !== requestKey
  })
  
  filteredHistory.unshift(requestData)
  
  if (filteredHistory.length > 30) {
    filteredHistory.splice(30)
  }
  
  await chrome.storage.local.set({ history: filteredHistory })
}

const loadHistory = async () => {
  const { history: storedHistory = [] } = await chrome.storage.local.get('history')
  history.value = storedHistory
}

const loadFromHistory = (item) => {
  // If it's a captured request with response data, load the response directly
  if (item.captured && item.responseData) {
    loadCapturedResponse(item)
  }

  // Also populate the form fields so user can re-execute
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
  history.value = [] // Immediately clear UI
  await chrome.storage.local.set({ history: [] })
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const clearResponse = () => {
  currentResponse.value = null
}

const scrollToTop = () => {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
  }
}

// XHR Monitor methods
const toggleXhrWatch = () => {
  isWatchingXhr.value = xhrMonitorService.toggle()

  if (isWatchingXhr.value) {
    // Subscribe to captured requests
    xhrUnsubscribe = xhrMonitorService.onRequest(handleCapturedRequest)
  } else {
    // Unsubscribe
    if (xhrUnsubscribe) {
      xhrUnsubscribe()
      xhrUnsubscribe = null
    }
  }
}

const handleCapturedRequest = async (capturedRequest) => {
  // Add to history (captured requests go to the front)
  const { history: storedHistory = [] } = await chrome.storage.local.get('history')

  // Add captured flag and format for history
  const historyItem = {
    route: capturedRequest.route,
    method: capturedRequest.method,
    url: capturedRequest.url,
    timestamp: capturedRequest.timestamp,
    status: capturedRequest.status,
    success: capturedRequest.success,
    captured: true,
    responseData: capturedRequest.responseData
  }

  storedHistory.unshift(historyItem)

  // Keep only the last 30 items
  if (storedHistory.length > 30) {
    storedHistory.splice(30)
  }

  await chrome.storage.local.set({ history: storedHistory })
  await loadHistory()
}

const loadCapturedResponse = (item) => {
  if (item.captured && item.responseData) {
    currentResponse.value = item.responseData
    emit('response-update', item.responseData)
  }
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

onUnmounted(() => {
  // Cleanup XHR monitor subscription
  if (xhrUnsubscribe) {
    xhrUnsubscribe()
    xhrUnsubscribe = null
  }
  // Stop monitoring if it was running
  if (isWatchingXhr.value) {
    xhrMonitorService.stop()
  }
})
</script>