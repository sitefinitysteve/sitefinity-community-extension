<template>
  <div class="flex flex-col h-full w-full min-h-0">
    <div class="p-4 border-b border-vue-border bg-vue-darker">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-text-primary">API Discovery</h2>
        <button
          @click="loadApiDiscovery"
          :disabled="discoveryLoading"
          class="px-3 py-1 text-xs font-medium bg-sitefinity-blue text-vue-dark rounded transition-all duration-200 hover:bg-blue-400 disabled:opacity-50"
        >
          {{ discoveryLoading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Discovery Content -->
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- Loading State -->
      <div v-if="discoveryLoading" class="flex-1 flex items-center justify-center">
        <div class="text-center py-8">
          <div class="text-sitefinity-blue text-sm mb-2">🔄 Loading API Services...</div>
          <div class="text-text-muted text-xs">Fetching available REST API endpoints</div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="discoveryError" class="flex-1 flex items-center justify-center">
        <div class="text-center py-8">
          <div class="text-sitefinity-green text-sm mb-2">⚠️ Discovery Failed</div>
          <div class="text-text-muted text-xs mb-4">{{ discoveryError }}</div>
          <button
            @click="loadApiDiscovery"
            class="px-3 py-1.5 text-xs font-medium bg-sitefinity-blue text-vue-dark rounded transition-all duration-200 hover:bg-blue-400"
          >
            Retry
          </button>
        </div>
      </div>

      <!-- No Services State -->
      <div v-else-if="!discoveryData || !discoveryData.Services || discoveryData.Services.length === 0" class="flex-1 flex items-center justify-center">
        <div class="text-center py-8">
          <div class="text-text-muted text-sm mb-2">📭 No API Services Found</div>
          <div class="text-text-muted text-xs mb-4">The site may not have REST API services configured or accessible</div>
          <button
            @click="loadApiDiscovery"
            class="px-3 py-1.5 text-xs font-medium bg-sitefinity-blue text-vue-dark rounded transition-all duration-200 hover:bg-blue-400"
          >
            Refresh
          </button>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div v-else class="flex flex-1">
        <!-- Left Column: Services List -->
        <div class="min-w-[250px] w-[250px] border-r border-vue-border bg-vue-darker overflow-y-auto">
          <div>
            <div 
              v-for="service in discoveryData.Services" 
              :key="service.Name"
              @click="selectService(service)"
              :class="[
                'p-3 border-b border-vue-border-light cursor-pointer transition-all duration-200',
                selectedService?.Name === service.Name ? 'bg-sitefinity-blue/15 border-l-2 border-l-sitefinity-blue' : 'hover:bg-vue-dark'
              ]"
            >
              <div class="flex items-center justify-between mb-1">
                <h4 class="text-xs font-semibold text-text-primary">{{ service.Name }}</h4>
                <span class="px-1.5 py-0.5 text-xs font-medium rounded"
                      :class="service.Enabled ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'">
                  {{ service.Enabled ? '✓' : '✗' }}
                </span>
              </div>
              <div class="text-xs text-text-muted">/api/{{ service.UrlName }}</div>
              <div class="text-xs text-text-secondary">{{ service.Types ? service.Types.length : 0 }} endpoints</div>
            </div>
          </div>
          
          <!-- ServiceStack Item -->
          <div 
            @click="selectServiceStack"
            :class="[
              'p-3 border-b border-vue-border-light cursor-pointer transition-all duration-200',
              selectedServiceStack ? 'bg-sitefinity-blue/15 border-l-2 border-l-sitefinity-blue' : 'hover:bg-vue-dark',
              serviceStackLoading ? 'opacity-50 cursor-not-allowed' : ''
            ]"
          >
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-xs font-semibold text-sitefinity-green">ServiceStack</h4>
              <span class="px-1.5 py-0.5 text-xs font-medium rounded bg-sitefinity-green/15 text-sitefinity-green">
                {{ serviceStackLoading ? '⏳' : '🔧' }}
              </span>
            </div>
            <div class="text-xs text-text-muted">/RestApi/metadata</div>
            <div class="text-xs text-text-secondary">{{ serviceStackLoading ? 'Checking...' : 'Check metadata endpoint' }}</div>
          </div>
        </div>

        <!-- Right Column: Service Details -->
        <div class="flex-1 flex overflow-hidden">
          <!-- ServiceStack Results -->
          <div v-if="selectedServiceStack" class="flex flex-1 overflow-hidden">
            <!-- ServiceStack Status Panel -->
            <div :class="[
              'flex flex-col border-r border-vue-border bg-vue-dark overflow-hidden min-h-0',
              serviceStackStatus?.isActive ? 'w-80' : 'flex-1'
            ]">
            <!-- ServiceStack Header -->
            <div class="p-4 border-b border-vue-border bg-vue-darkest">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-sitefinity-green mb-1">ServiceStack Metadata</h3>
                  <div class="text-xs text-text-muted">/RestApi/metadata</div>
                </div>
                <button
                  @click="checkServiceStack"
                  :disabled="serviceStackLoading"
                  class="px-3 py-1 text-xs font-medium bg-sitefinity-green text-vue-dark rounded transition-all duration-200 hover:bg-green-400 disabled:opacity-50"
                >
                  {{ serviceStackLoading ? 'Checking...' : 'Check Status' }}
                </button>
              </div>
            </div>

            <!-- ServiceStack Content -->
            <div class="flex-1 overflow-y-auto p-4 min-h-0">
              <div v-if="serviceStackLoading" class="text-center py-8">
                <div class="text-sitefinity-blue text-sm mb-2">🔄 Checking ServiceStack...</div>
                <div class="text-text-muted text-xs">Testing /RestApi/metadata endpoint</div>
              </div>
              
              <div v-else-if="serviceStackStatus" class="space-y-4">
                <div class="flex items-center gap-2">
                  <span :class="[
                    'px-2 py-1 text-xs font-semibold rounded uppercase',
                    serviceStackStatus.isActive 
                      ? 'bg-sitefinity-blue/15 text-sitefinity-blue border border-sitefinity-blue/30'
                      : 'bg-sitefinity-green/15 text-sitefinity-green border border-sitefinity-green/30'
                  ]">
                    {{ serviceStackStatus.status }} {{ serviceStackStatus.statusText }}
                  </span>
                </div>
                
                <div class="text-xs text-text-secondary break-all font-mono">
                  {{ serviceStackStatus.url }}
                </div>
                
                <div v-if="serviceStackStatus.isActive" class="bg-vue-darker border border-sitefinity-blue/30 rounded p-3">
                  <div class="text-xs text-sitefinity-blue mb-2">✅ ServiceStack Metadata is ACTIVE!</div>
                  <div class="text-xs text-text-muted mb-2">You can view the metadata at this URL.</div>
                  <div class="text-xs text-text-secondary italic">Note: Open in an incognito tab to avoid cookie restrictions.</div>
                </div>
                
                <div v-else-if="serviceStackStatus.status === 404" class="bg-vue-darker border border-sitefinity-green/30 rounded p-3">
                  <div class="text-xs text-sitefinity-green mb-2">❌ ServiceStack Metadata is NOT ACTIVE (404)</div>
                  <div class="text-xs text-text-muted mb-2">To enable ServiceStack metadata, add this to your web.config &lt;appSettings&gt;:</div>
                  <div class="bg-vue-darkest p-2 rounded text-xs font-mono text-text-primary">
                    &lt;add key="sf:serviceStackEnableFeatures" value="Metadata" /&gt;
                  </div>
                  <div class="text-xs text-sitefinity-green mt-2 font-semibold">⚠️ WARNING: Only do this in development, NOT production!</div>
                </div>
                
                <div v-else class="bg-vue-darker border border-sitefinity-yellow/30 rounded p-3">
                  <div class="text-xs text-sitefinity-yellow mb-2">⚠️ ServiceStack Metadata check returned: {{ serviceStackStatus.status }} {{ serviceStackStatus.statusText }}</div>
                  <div class="text-xs text-text-muted">This might indicate the endpoint exists but has restrictions.</div>
                </div>
              </div>
              
              <div v-else class="text-center py-8 text-text-muted text-xs">
                Click "Check Status" to test the ServiceStack metadata endpoint
              </div>
            </div>
            </div>

            <!-- ServiceStack HTML Content Panel (when active) -->
            <div v-if="serviceStackStatus?.isActive" class="flex-1 flex flex-col overflow-hidden bg-vue-dark">
              <div class="p-4 border-b border-vue-border bg-vue-darkest">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-semibold text-sitefinity-blue">ServiceStack Metadata Content</h3>
                    <div class="text-xs text-text-muted">HTML Response from /RestApi/metadata</div>
                  </div>
                  <button 
                    @click="copyServiceStackUrl"
                    class="px-2 py-1 text-xs font-medium bg-sitefinity-green/10 text-sitefinity-green border border-sitefinity-green/30 rounded transition-all hover:bg-sitefinity-green/20"
                    :title="serviceStackCopied ? 'Paste into incognito window' : 'Copy URL to clipboard'"
                  >
                    {{ serviceStackCopied ? '✓ Copied to Clipboard, paste into incognito window' : '📋 Copy Link' }}
                  </button>
                </div>
              </div>
              
              <div class="flex-1 overflow-hidden">
                <iframe 
                  :srcdoc="serviceStackHtmlContent"
                  class="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts"
                ></iframe>
              </div>
            </div>
          </div>

          <!-- Default state when no service selected -->
          <div v-else-if="!selectedService" class="flex-1 flex items-center justify-center">
            <div class="text-center text-text-muted">
              <div class="text-sm mb-2">🔍 Select an API Service</div>
              <div class="text-xs">Choose a service from the left to view its endpoints</div>
            </div>
          </div>

          <!-- Regular Service Details -->
          <div v-else class="flex flex-1 overflow-hidden">
            <!-- Service Details Panel -->
            <div :class="[
              'flex flex-col border-r border-vue-border bg-vue-dark overflow-hidden min-h-0',
              selectedEndpoint ? 'w-80' : 'flex-1'
            ]">
            <!-- Service Header -->
            <div class="p-4 border-b border-vue-border bg-vue-darkest">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-semibold text-sitefinity-blue mb-1">{{ selectedService.Name }} API</h3>
                  <div class="text-xs text-text-muted">/api/{{ selectedService.Route }}/{{ selectedService.UrlName }}</div>
                </div>
                <div class="flex gap-2">
                  <span class="px-2 py-1 text-xs font-medium bg-sitefinity-yellow/15 text-sitefinity-yellow border border-sitefinity-yellow/30 rounded">
                    {{ selectedService.Protocol }}
                  </span>
                  <a 
                    :href="`${props.siteInfo.url}/api/${selectedService.UrlName}/sfhelp`" 
                    target="_blank"
                    class="px-2 py-1 text-xs font-medium bg-sitefinity-green/10 text-sitefinity-green border border-sitefinity-green/30 rounded transition-all hover:bg-sitefinity-green/20"
                  >
                    📖 Help
                  </a>
                </div>
              </div>
            </div>

            <!-- Endpoints List -->
            <div class="flex-1 overflow-y-auto p-4 min-h-0">
              <div v-if="!selectedService.Types || selectedService.Types.length === 0" class="text-center py-8 text-text-muted text-xs">
                No endpoints available
              </div>
              <div v-else class="space-y-2">
                <div class="text-xs font-medium text-text-primary mb-3 uppercase tracking-wide">Available Endpoints</div>
                <div class="space-y-1">
                  <div 
                    v-for="type in selectedService.Types" 
                    :key="type.Name"
                    @click="selectEndpoint(selectedService, type)"
                    :class="[
                      'p-3 bg-vue-darker border border-vue-border rounded cursor-pointer transition-all group',
                      selectedEndpoint?.Name === type.Name ? 'border-sitefinity-blue bg-sitefinity-blue/10' : 'hover:border-sitefinity-blue hover:bg-vue-dark'
                    ]"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-xs font-medium text-text-primary group-hover:text-sitefinity-blue">{{ type.Name }}</div>
                        <div class="text-xs text-text-muted mt-1">/api/{{ selectedService.UrlName }}/{{ type.Name.toLowerCase().replace(/\s+/g, '') }}</div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="px-1.5 py-0.5 text-xs font-medium rounded"
                              :class="type.ReadOnly ? 'bg-blue-500/15 text-blue-400' : 'bg-green-500/15 text-green-400'">
                          {{ type.ReadOnly ? 'Read' : 'R/W' }}
                        </span>
                        <span class="text-text-secondary group-hover:text-sitefinity-blue">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <!-- Endpoint Help Content Panel (when selected) -->
            <div v-if="selectedEndpoint" class="flex-1 flex flex-col overflow-hidden bg-vue-dark">
              <div class="p-4 border-b border-vue-border bg-vue-darkest">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-semibold text-sitefinity-blue">{{ selectedEndpoint?.Name }} Help</h3>
                    <div class="text-xs text-text-muted">/api/{{ selectedService?.UrlName }}/{{ selectedEndpoint?.Name.toLowerCase().replace(/\s+/g, '') }}/sfhelp</div>
                  </div>
                  <a 
                    :href="`${props.siteInfo.url}/api/${selectedService?.UrlName}/${selectedEndpoint?.Name.toLowerCase().replace(/\s+/g, '')}/sfhelp`" 
                    target="_blank"
                    class="px-2 py-1 text-xs font-medium bg-sitefinity-green/10 text-sitefinity-green border border-sitefinity-green/30 rounded transition-all hover:bg-sitefinity-green/20"
                  >
                    🔗 Open in New Window
                  </a>
                </div>
              </div>
              
              <div class="flex-1 overflow-y-auto p-4">
                <div class="text-center py-8">
                  <div class="text-sitefinity-blue text-sm mb-2">🔒 Content Blocked by Security Policy</div>
                  <div class="text-text-muted text-xs mb-4">This help page cannot be displayed in an iframe due to X-Frame-Options restrictions.</div>
                  <a 
                    :href="`${props.siteInfo.url}/api/${selectedService?.UrlName}/${selectedEndpoint?.Name.toLowerCase().replace(/\s+/g, '')}/sfhelp`" 
                    target="_blank"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-sitefinity-blue text-vue-dark rounded transition-all hover:bg-blue-400"
                  >
                    🔗 Open {{ selectedEndpoint?.Name }} Help
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

// Props
const props = defineProps({
  siteInfo: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['load-type-into-tester'])

// Reactive state
const discoveryData = ref(null)
const discoveryLoading = ref(false)
const discoveryError = ref(null)
const selectedService = ref(null)
const serviceStackLoading = ref(false)
const serviceStackStatus = ref(null)
const selectedServiceStack = ref(false)
const serviceStackHtmlContent = ref(null)
const selectedEndpoint = ref(null)
const serviceStackCopied = ref(false)

// Methods
const loadApiDiscovery = async () => {
  if (!props.siteInfo.isSitefinity) return
  
  discoveryLoading.value = true
  discoveryError.value = null
  
  try {
    const result = await new Promise((resolve, reject) => {
      const executeCode = `
        (function() {
          const apiUrl = window.location.origin + '/restapi/apiservice/services?Types=true&take=50&skip=0&page=1&pageSize=50';
          console.log('Sitefinity Community: Loading API Discovery from: ' + apiUrl);
          
          fetch(apiUrl, {
            method: 'GET',
            headers: {
              'X-Requested-With': 'Browser',
              'Content-Type': 'application/json'
            }
          })
            .then(response => {
              return response.text().then(responseText => {
                let data;
                try {
                  data = JSON.parse(responseText);
                } catch (e) {
                  data = responseText;
                }
                
                console.log('Sitefinity Community API Discovery Response:', data);
                
                window.__sitefinityDiscoveryResult = {
                  success: true,
                  status: response.status,
                  statusText: response.statusText,
                  data: data,
                  url: apiUrl
                };
              });
            })
            .catch(error => {
              console.error('Sitefinity Community API Discovery failed:', error);
              window.__sitefinityDiscoveryResult = {
                success: false,
                error: error.message,
                url: apiUrl
              };
            });
          
          return 'API_DISCOVERY_INITIATED';
        })()
      `;

      chrome.devtools.inspectedWindow.eval(executeCode, (result, isException) => {
        if (isException) {
          reject(new Error(isException.value || 'Execution failed'));
        } else {
          // Poll for result with multiple attempts
          let attempts = 0;
          const maxAttempts = 10;
          const pollInterval = 500;
          
          const pollForResult = () => {
            chrome.devtools.inspectedWindow.eval('window.__sitefinityDiscoveryResult', (asyncResult, asyncException) => {
              if (asyncException) {
                reject(new Error('Failed to retrieve API discovery result'));
              } else if (asyncResult) {
                // Clear the result to avoid conflicts
                chrome.devtools.inspectedWindow.eval('delete window.__sitefinityDiscoveryResult');
                resolve(asyncResult);
              } else {
                attempts++;
                if (attempts < maxAttempts) {
                  setTimeout(pollForResult, pollInterval);
                } else {
                  reject(new Error('API discovery timeout - no result available after ' + (maxAttempts * pollInterval / 1000) + ' seconds'));
                }
              }
            });
          };
          
          setTimeout(pollForResult, 500);
        }
      });
    });

    if (result.success && result.data && result.data.Services) {
      discoveryData.value = result.data
    } else {
      discoveryError.value = result.error || 'Unable to access API services. Backend access may be restricted.'
    }
    
  } catch (error) {
    console.error('API Discovery error:', error)
    discoveryError.value = 'Failed to load API discovery: ' + error.message
  } finally {
    discoveryLoading.value = false
  }
}

const checkServiceStack = async () => {
  if (!props.siteInfo.isSitefinity) return
  
  serviceStackLoading.value = true
  serviceStackStatus.value = null
  serviceStackHtmlContent.value = null
  
  try {
    const result = await new Promise((resolve, reject) => {
      const executeCode = `
        (function() {
          const metadataUrl = window.location.origin + '/RestApi/metadata';
          console.log('Sitefinity Community: Checking ServiceStack metadata at: ' + metadataUrl);
          
          fetch(metadataUrl, {
            method: 'GET',
            headers: {
              'X-Requested-With': 'Browser'
            }
          })
            .then(response => {
              console.log('Sitefinity Community ServiceStack Response:', response.status, response.statusText);
              
              return response.text().then(responseText => {
                window.__sitefinityServiceStackResult = {
                  success: true,
                  status: response.status,
                  statusText: response.statusText,
                  isActive: response.status === 200,
                  url: metadataUrl,
                  htmlContent: response.status === 200 ? responseText : null
                };
              });
            })
            .catch(error => {
              console.error('Sitefinity Community ServiceStack failed:', error);
              window.__sitefinityServiceStackResult = {
                success: false,
                error: error.message,
                isActive: false,
                url: metadataUrl
              };
            });
          
          return 'SERVICESTACK_CHECK_INITIATED';
        })()
      `;

      chrome.devtools.inspectedWindow.eval(executeCode, (result, isException) => {
        if (isException) {
          reject(new Error(isException.value || 'Execution failed'));
        } else {
          let attempts = 0;
          const maxAttempts = 10;
          const pollInterval = 500;
          
          const pollForResult = () => {
            chrome.devtools.inspectedWindow.eval('window.__sitefinityServiceStackResult', (asyncResult, asyncException) => {
              if (asyncException) {
                reject(new Error('Failed to retrieve ServiceStack result'));
              } else if (asyncResult) {
                chrome.devtools.inspectedWindow.eval('delete window.__sitefinityServiceStackResult');
                resolve(asyncResult);
              } else {
                attempts++;
                if (attempts < maxAttempts) {
                  setTimeout(pollForResult, pollInterval);
                } else {
                  reject(new Error('ServiceStack check timeout'));
                }
              }
            });
          };
          
          setTimeout(pollForResult, 500);
        }
      });
    });

    serviceStackStatus.value = result;
    serviceStackHtmlContent.value = result.htmlContent;
    
  } catch (error) {
    console.error('ServiceStack check error:', error);
    serviceStackStatus.value = {
      success: false,
      error: error.message,
      isActive: false
    };
  } finally {
    serviceStackLoading.value = false;
  }
}

const selectService = (service) => {
  selectedService.value = service
  selectedServiceStack.value = false
  serviceStackHtmlContent.value = null
  selectedEndpoint.value = null
}

const selectServiceStack = () => {
  selectedService.value = null
  selectedServiceStack.value = true
  // Auto-check ServiceStack when selected
  if (!serviceStackStatus.value) {
    checkServiceStack()
  }
}

const copyServiceStackUrl = async () => {
  const url = `${props.siteInfo.url}/RestApi/metadata`
  try {
    await navigator.clipboard.writeText(url)
    serviceStackCopied.value = true
    setTimeout(() => {
      serviceStackCopied.value = false
    }, 3000) // Reset after 3 seconds
  } catch (error) {
    console.error('Failed to copy URL:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    serviceStackCopied.value = true
    setTimeout(() => {
      serviceStackCopied.value = false
    }, 3000)
  }
}

const selectEndpoint = (service, type) => {
  selectedEndpoint.value = type
}

const loadTypeIntoTester = (service, type) => {
  // Emit to parent to handle switching tools and setting route
  emit('load-type-into-tester', { service, type })
}

// Auto-load API discovery when component mounts
onMounted(() => {
  loadApiDiscovery()
})
</script>