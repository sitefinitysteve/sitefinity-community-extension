<template>
  <div class="flex-1 bg-vue-dark flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="flex justify-between items-center p-4 border-b border-vue-border bg-vue-darker">
      <h2 class="text-sm font-semibold text-text-primary">Page Analytics</h2>
      <button
        @click="analyzeScripts"
        :disabled="loading"
        class="px-3 py-1.5 text-xs font-medium bg-sitefinity-green/10 text-sitefinity-green border border-sitefinity-green/30 rounded transition-all hover:bg-sitefinity-green/20 disabled:opacity-50"
      >
        {{ loading ? 'Analyzing...' : 'Refresh' }}
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-4 animate-pulse">
        <div class="h-8 w-48 bg-vue-darker rounded"></div>
        <div class="space-y-2">
          <div class="h-4 w-full bg-vue-darker rounded"></div>
          <div class="h-4 w-3/4 bg-vue-darker rounded"></div>
          <div class="h-4 w-1/2 bg-vue-darker rounded"></div>
        </div>
      </div>

      <!-- Results -->
      <div v-else class="space-y-6">
        <!-- Script Placement Summary -->
        <AnalyticsSection 
          title="Script Placement Summary"
          :items="scriptSummary"
          icon="📊"
        />

        <!-- Head Scripts -->
        <AnalyticsSection 
          v-if="headScripts.length > 0"
          title="Scripts in &lt;head&gt;"
          :items="headScripts"
          icon="⬆️"
          :show-recommendations="true"
          recommendation="Scripts in &lt;head&gt; block HTML parsing. Consider moving non-critical scripts to the end of &lt;body&gt; or adding async/defer attributes."
        />

        <!-- Body Scripts -->
        <AnalyticsSection 
          v-if="bodyScripts.length > 0"
          title="Scripts at End of &lt;body&gt;"
          :items="bodyScripts"
          icon="⬇️"
          :show-recommendations="true"
          recommendation="✓ Good practice! Scripts at the end of &lt;body&gt; don't block HTML parsing and page rendering."
        />

        <!-- Inline Scripts -->
        <AnalyticsSection 
          v-if="inlineScripts.length > 0"
          title="Inline Scripts"
          :items="inlineScripts"
          icon="📝"
          :show-recommendations="true"
          recommendation="Consider moving inline scripts to external files for better caching and maintainability. Use async/defer when possible."
        />

        <!-- Best Practices -->
        <div class="bg-vue-darker border border-sitefinity-blue/30 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-sitefinity-blue mb-3 flex items-center gap-2">
            <span class="text-lg">💡</span>
            Script Loading Best Practices
          </h3>
          <div class="space-y-2 text-xs text-text-secondary">
            <div class="flex items-start gap-2">
              <span class="text-sitefinity-green">✓</span>
              <span>Place scripts at the end of &lt;body&gt; to prevent blocking HTML parsing</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-sitefinity-green">✓</span>
              <span>Use <code class="bg-vue-darkest px-1 rounded">async</code> for scripts that don't depend on DOM or other scripts</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-sitefinity-green">✓</span>
              <span>Use <code class="bg-vue-darkest px-1 rounded">defer</code> for scripts that need DOM but can wait until parsing is complete</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-sitefinity-green">✓</span>
              <span>Minimize inline scripts and prefer external files for better caching</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-sitefinity-yellow">⚠</span>
              <span>Critical scripts (like analytics) may need to be in &lt;head&gt; but should use async</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AnalyticsSection from './Analytics/AnalyticsSection.vue'

// Props
const props = defineProps({
  siteInfo: {
    type: Object,
    default: () => ({ isSitefinity: false, version: 'Unknown' })
  }
})

// State
const loading = ref(false)
const headScripts = ref([])
const bodyScripts = ref([])
const inlineScripts = ref([])
const scriptSummary = ref([])

// Methods
const analyzePageScripts = async () => {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(`
      (function() {
        const results = {
          headScripts: [],
          bodyScripts: [],
          inlineScripts: [],
          summary: {}
        };

        // Get all script elements
        const allScripts = document.querySelectorAll('script');
        const headElement = document.head;
        const bodyElement = document.body;

        let headCount = 0;
        let bodyEndCount = 0;
        let inlineCount = 0;
        let totalSize = 0;

        allScripts.forEach((script, index) => {
          const scriptInfo = {
            index: index + 1,
            src: script.src || null,
            type: script.type || 'text/javascript',
            async: script.async,
            defer: script.defer,
            hasContent: !script.src && script.textContent.trim().length > 0,
            size: script.textContent ? script.textContent.length : null,
            location: 'unknown'
          };

          // Determine location
          if (headElement && headElement.contains(script)) {
            scriptInfo.location = 'head';
            headCount++;
            results.headScripts.push({
              ...scriptInfo,
              name: script.src ? script.src.split('/').pop() || script.src : 'Inline Script #' + (inlineCount + 1),
              description: script.src ? script.src : 'Inline script (' + script.textContent.length + ' characters)',
              warning: !script.async && !script.defer ? 'Blocks HTML parsing' : null,
              icon: script.src ? '🔗' : '📝'
            });
          } else if (bodyElement && bodyElement.contains(script)) {
            // Check if script is near the end of body
            const bodyChildren = Array.from(bodyElement.children);
            const scriptPosition = Array.from(bodyElement.querySelectorAll('*')).indexOf(script);
            const totalElements = bodyElement.querySelectorAll('*').length;
            const isNearEnd = scriptPosition > (totalElements * 0.8); // Last 20% of elements
            
            scriptInfo.location = isNearEnd ? 'body-end' : 'body-middle';
            
            if (isNearEnd) {
              bodyEndCount++;
              results.bodyScripts.push({
                ...scriptInfo,
                name: script.src ? script.src.split('/').pop() || script.src : 'Inline Script #' + (inlineCount + 1),
                description: script.src ? script.src : 'Inline script (' + script.textContent.length + ' characters)',
                icon: script.src ? '🔗' : '📝'
              });
            } else {
              results.bodyScripts.push({
                ...scriptInfo,
                name: script.src ? script.src.split('/').pop() || script.src : 'Inline Script #' + (inlineCount + 1),
                description: script.src ? script.src : 'Inline script (' + script.textContent.length + ' characters)',
                warning: 'Script in middle of body may block rendering',
                icon: script.src ? '🔗' : '📝'
              });
            }
          }

          // Count inline scripts
          if (!script.src && script.textContent.trim().length > 0) {
            inlineCount++;
            totalSize += script.textContent.length;
            
            results.inlineScripts.push({
              ...scriptInfo,
              name: 'Inline Script #' + inlineCount,
              description: script.textContent.substring(0, 100) + (script.textContent.length > 100 ? '...' : ''),
              size: script.textContent.length,
              location: scriptInfo.location,
              icon: '📝'
            });
          }
        });

        // Create summary
        results.summary = {
          total: allScripts.length,
          head: headCount,
          bodyEnd: bodyEndCount,
          inline: inlineCount,
          totalInlineSize: totalSize
        };

        // Format summary for display
        const summaryItems = [
          {
            name: 'Total Scripts',
            value: allScripts.length.toString(),
            icon: '📜',
            description: 'Total number of script tags found on the page'
          },
          {
            name: 'Scripts in <head>',
            value: headCount.toString(),
            icon: '⬆️',
            description: 'Scripts that may block HTML parsing',
            warning: headCount > 3 ? 'Consider moving non-critical scripts' : null
          },
          {
            name: 'Scripts at End of <body>',
            value: bodyEndCount.toString(),
            icon: '⬇️',
            description: 'Scripts that don\\'t block rendering (good practice)',
            status: 'good'
          },
          {
            name: 'Inline Scripts',
            value: inlineCount.toString(),
            icon: '📝',
            description: 'Scripts embedded directly in HTML',
            warning: inlineCount > 5 ? 'Consider externalizing for better caching' : null
          }
        ];

        if (totalSize > 0) {
          summaryItems.push({
            name: 'Total Inline Size',
            value: (totalSize / 1024).toFixed(1) + ' KB',
            icon: '📏',
            description: 'Total size of all inline script content',
            warning: totalSize > 10240 ? 'Large inline scripts may impact performance' : null
          });
        }

        return {
          headScripts: results.headScripts,
          bodyScripts: results.bodyScripts,
          inlineScripts: results.inlineScripts,
          scriptSummary: summaryItems
        };
      })()
    `, resolve);
  });
}

const analyzeScripts = async () => {
  loading.value = true
  try {
    const result = await analyzePageScripts()
    headScripts.value = result.headScripts || []
    bodyScripts.value = result.bodyScripts || []
    inlineScripts.value = result.inlineScripts || []
    scriptSummary.value = result.scriptSummary || []
  } catch (error) {
    console.error('Error analyzing scripts:', error)
    // Reset to empty arrays on error
    headScripts.value = []
    bodyScripts.value = []
    inlineScripts.value = []
    scriptSummary.value = []
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await analyzeScripts()
})
</script>