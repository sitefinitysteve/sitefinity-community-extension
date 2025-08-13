<template>
  <div class="flex flex-col h-full bg-vue-dark" style="min-height: 600px;">
    <!-- Top Header Row -->
    <div class="border-b border-vue-border bg-vue-darkest p-3 flex items-center justify-between">
      <!-- Left: Extension Info and Site Status -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-3">
          <img 
            src="/sitefinity-cms-logo_u5.png" 
            alt="Sitefinity CMS" 
            class="h-8 w-auto"
          />
          <div>
            <div class="text-xs text-text-muted italic uppercase tracking-wide">
              Unofficial Extension
            </div>
          </div>
        </div>
        <div 
          :class="statusClasses"
          class="text-xs font-medium px-2 py-1 rounded-sm border"
        >
          {{ statusText }}
        </div>
      </div>

      <!-- Right: Created By -->
      <div>
        <a 
          href="https://www.sitefinitysteve.com" 
          target="_blank" 
          rel="noopener"
          class="flex items-center gap-2 p-2 rounded transition-all duration-200 hover:bg-sitefinity-blue/10"
        >
          <div class="text-right">
            <div class="text-xs text-gray-500 uppercase tracking-wide">Created by</div>
            <div class="text-xs font-semibold text-sitefinity-green tracking-wide">SitefinitySteve</div>
          </div>
          <div class="text-xs text-sitefinity-blue">↗</div>
        </a>
      </div>
    </div>

    <!-- Tools and Content Row -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Tools Sidebar -->
      <div class="w-52 bg-vue-darker border-r border-vue-border flex flex-col">
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
      </div>

      <!-- Main Content Panel -->
      <div class="flex-1 flex overflow-hidden">
        <!-- API Tester -->
        <ApiTester
          v-if="selectedTool === 'api-tester'"
          ref="apiTesterRef"
          :site-info="siteInfo"
          @response-update="onResponseUpdate"
        />

        <!-- API Discovery -->
        <ApiDiscovery
          v-else-if="selectedTool === 'api-discovery'"
          :site-info="siteInfo"
          @load-type-into-tester="onLoadTypeIntoTester"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ApiTester from './components/ApiTester/ApiTester.vue'
import ApiDiscovery from './components/ApiDiscovery.vue'

// Reactive state
const siteInfo = ref({ isSitefinity: false, version: 'Unknown' })
const apiTesterRef = ref(null)

// Tool configuration
const tools = ref([
  { id: 'api-tester', name: 'API Tester', icon: '🔧', active: true, disabled: false },
  { id: 'api-discovery', name: 'API Discovery', icon: '🔍', active: false, disabled: false }
])

const selectedTool = ref('api-tester')

// Computed properties
const statusClasses = computed(() => {
  if (siteInfo.value.isSitefinity) {
    return 'bg-sitefinity-blue/15 text-sitefinity-blue border-sitefinity-blue/30'
  }
  return 'bg-red-500/15 text-red-400 border-red-500/30'
})

const statusText = computed(() => {
  if (siteInfo.value.isSitefinity) {
    return `✓ Sitefinity ${siteInfo.value.version} Detected`
  }
  return '✗ Not a Sitefinity Site'
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
              return { 
                isSitefinity: true, 
                generator: meta.content, 
                version: version,
                url: window.location.origin
              };
            }
          }
          return { 
            isSitefinity: false,
            url: window.location.origin
          };
        })()
      `, resolve);
    });

    siteInfo.value = result
  } catch (error) {
    console.error('Error checking Sitefinity:', error)
    siteInfo.value = { isSitefinity: false, version: 'Unknown', url: '' }
  }
}

const selectTool = (toolId) => {
  // Update active states
  tools.value.forEach(tool => {
    tool.active = tool.id === toolId
  })
  selectedTool.value = toolId
}

const onResponseUpdate = (response) => {
  // Handle response updates from ApiTester component
  console.log('Response updated:', response)
}

const onLoadTypeIntoTester = ({ service, type }) => {
  // Switch to API Tester
  selectTool('api-tester')
  
  // Wait for next tick to ensure component is rendered
  setTimeout(() => {
    if (apiTesterRef.value) {
      const typeNamePath = type.Name.toLowerCase().replace(/\s+/g, '')
      const route = `/api/${service.UrlName}/${typeNamePath}`
      apiTesterRef.value.setApiRoute(route)
    }
  }, 0)
}

// Lifecycle
onMounted(async () => {
  await checkSitefinitySite()
  await loadHistory()
})
</script>