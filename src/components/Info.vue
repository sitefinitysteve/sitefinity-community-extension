<template>
  <div class="flex-1 bg-vue-dark flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="flex justify-between items-center p-4 border-b border-vue-border bg-vue-darker">
      <h2 class="text-sm font-semibold text-text-primary">Page Information</h2>
      <button
        @click="refreshInfo"
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
        <!-- JavaScript Frameworks & Libraries -->
        <InfoSection 
          v-if="info.jsFrameworks.length > 0"
          title="JavaScript Frameworks & Libraries" 
          :items="info.jsFrameworks" 
        />
        
        <!-- CSS Frameworks -->
        <InfoSection 
          v-if="info.cssFrameworks.length > 0"
          title="CSS Frameworks" 
          :items="info.cssFrameworks" 
        />
        
        <!-- UI Libraries -->
        <InfoSection 
          v-if="info.uiLibraries.length > 0"
          title="UI Libraries" 
          :items="info.uiLibraries" 
        />
        
        <!-- Page Meta Information -->
        <InfoSection title="Page Information" :items="info.pageInfo" />
        
        <!-- Development Tools -->
        <InfoSection 
          v-if="info.devTools.length > 0"
          title="Development Tools" 
          :items="info.devTools" 
        />

        <!-- No items detected message -->
        <div v-if="info.jsFrameworks.length === 0 && info.cssFrameworks.length === 0 && info.uiLibraries.length === 0 && info.devTools.length === 0" 
             class="text-center text-text-muted text-sm p-8">
          No frameworks or libraries detected on this page
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import InfoSection from './Info/InfoSection.vue'

// Props
const props = defineProps({
  siteInfo: {
    type: Object,
    default: () => ({ isSitefinity: false, version: 'Unknown' })
  }
})

// State
const loading = ref(false)
const info = ref({
  jsFrameworks: [],
  cssFrameworks: [],
  uiLibraries: [],
  pageInfo: [],
  devTools: []
})

// Methods
const analyzePageInfo = async () => {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(`
      (function() {
        const results = {
          jsFrameworks: [],
          cssFrameworks: [],
          uiLibraries: [],
          pageInfo: [],
          devTools: []
        };

        // Helper function to check if script/library is loaded
        function isScriptLoaded(identifier, method = 'global') {
          try {
            if (method === 'global') {
              return window[identifier] !== undefined;
            } else if (method === 'selector') {
              return document.querySelector(identifier) !== null;
            } else if (method === 'text') {
              return document.documentElement.innerHTML.includes(identifier);
            }
          } catch (e) {
            return false;
          }
        }

        function getVersion(obj, paths) {
          for (const path of paths) {
            try {
              const version = path.split('.').reduce((o, p) => o && o[p], window);
              if (version) return version;
            } catch (e) {}
          }
          return null;
        }

        // JavaScript Frameworks Detection
        const jsChecks = [
          // React
          {
            name: 'React',
            check: () => {
              return isScriptLoaded('React') || 
                     document.querySelector('[data-reactroot]') || 
                     document.querySelector('[data-react-checksum]') ||
                     document.querySelector('[data-reactid]') ||
                     document.querySelector('#react-root') ||
                     document.querySelector('.react-component') ||
                     document.documentElement.innerHTML.includes('react') ||
                     !!document.querySelector('script[src*="react"]') ||
                     (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== undefined);
            },
            version: () => {
              if (window.React) {
                return window.React.version || getVersion(window, ['React.version']);
              }
              return null;
            }
          },
          // Vue
          {
            name: 'Vue.js',
            check: () => isScriptLoaded('Vue') || document.querySelector('[data-v-]') || document.querySelector('#app').__vue__,
            version: () => {
              if (window.Vue) {
                return window.Vue.version || getVersion(window, ['Vue.version']);
              }
              return null;
            }
          },
          // Angular / AngularJS
          {
            name: 'Angular/AngularJS',
            check: () => {
              // AngularJS (1.x) detection
              const hasAngularJS = isScriptLoaded('angular') || 
                                  document.querySelector('[ng-app]') || 
                                  document.querySelector('[data-ng-app]') ||
                                  document.querySelector('[ng-controller]') ||
                                  document.querySelector('[ng-repeat]') ||
                                  document.querySelector('.ng-scope') ||
                                  !!document.querySelector('script[src*="angular.js"]') ||
                                  !!document.querySelector('script[src*="angular.min.js"]');
              
              // Angular (2+) detection
              const hasAngular = isScriptLoaded('ng') ||
                                document.querySelector('app-root') ||
                                document.querySelector('[ng-version]') ||
                                document.querySelector('ng-component') ||
                                document.querySelector('router-outlet') ||
                                !!document.querySelector('script[src*="@angular"]') ||
                                (window.ng !== undefined) ||
                                (window.Zone !== undefined && window.Zone.__symbol__);
              
              return hasAngularJS || hasAngular;
            },
            version: () => {
              // Try AngularJS version first
              if (window.angular && window.angular.version) {
                return 'AngularJS ' + window.angular.version.full;
              }
              
              // Try Angular 2+ version
              const versionElement = document.querySelector('[ng-version]');
              if (versionElement) {
                return 'Angular ' + versionElement.getAttribute('ng-version');
              }
              
              // Check for Angular in window.ng
              if (window.ng && window.ng.core) {
                return 'Angular 2+';
              }
              
              return null;
            }
          },
          // jQuery
          {
            name: 'jQuery',
            check: () => isScriptLoaded('jQuery') || isScriptLoaded('$'),
            version: () => {
              if (window.jQuery) {
                return window.jQuery.fn.jquery || getVersion(window, ['jQuery.fn.jquery', '$.fn.jquery']);
              }
              return null;
            }
          },
          // Kendo UI
          {
            name: 'Kendo UI',
            check: () => isScriptLoaded('kendo'),
            version: () => {
              if (window.kendo) {
                return window.kendo.version || getVersion(window, ['kendo.version']);
              }
              return null;
            }
          }
        ];

        jsChecks.forEach(item => {
          if (item.check()) {
            const version = item.version();
            results.jsFrameworks.push({
              name: item.name,
              detected: true,
              version: version || 'Unknown',
              icon: '✓'
            });
          }
        });


        // CSS Framework Detection
        const cssChecks = [
          {
            name: 'Bootstrap',
            check: () => {
              // Check for Bootstrap CSS classes
              const hasBootstrapClasses = document.querySelector('.container, .row, .col, .btn, .navbar, .modal');
              // Check for Bootstrap CSS file
              const hasBootstrapCSS = Array.from(document.styleSheets).some(sheet => {
                try {
                  return sheet.href && sheet.href.includes('bootstrap');
                } catch (e) {
                  return false;
                }
              });
              return hasBootstrapClasses || hasBootstrapCSS;
            },
            version: () => {
              // Try to detect Bootstrap version from URL or class patterns
              const bootstrapLink = document.querySelector('link[href*="bootstrap"]');
              if (bootstrapLink) {
                const versionMatch = bootstrapLink.href.match(/bootstrap[\\/@]([\\d.]+)/);
                if (versionMatch) return versionMatch[1];
              }
              
              // Fallback to class-based detection
              if (document.querySelector('.d-flex, .justify-content-center')) return '4.x or 5.x';
              if (document.querySelector('.hidden-xs, .visible-xs')) return '3.x';
              return 'Unknown';
            }
          },
          {
            name: 'Tailwind CSS',
            check: () => {
              // Check for common Tailwind classes
              const tailwindClasses = [
                'flex', 'grid', 'text-center', 'bg-blue-500', 'p-4', 'm-4', 
                'w-full', 'h-full', 'rounded', 'shadow', 'space-x-', 'space-y-',
                'divide-x-', 'divide-y-', 'ring-', 'backdrop-blur'
              ];
              const hasClasses = tailwindClasses.some(cls => document.querySelector('.' + cls));
              const hasCDN = document.querySelector('link[href*="tailwindcss"]') || document.querySelector('script[src*="tailwindcss"]');
              const hasCSS = document.documentElement.innerHTML.includes('tailwind');
              
              return hasClasses || hasCDN || hasCSS;
            },
            version: () => {
              // Check for Tailwind CDN link with version
              const cdnLink = document.querySelector('link[href*="tailwindcss"]');
              if (cdnLink) {
                const versionMatch = cdnLink.href.match(/tailwindcss@([\d.]+)/);
                if (versionMatch) return versionMatch[1];
              }
              
              return 'Unknown';
            }
          },
          {
            name: 'Bulma',
            check: () => document.querySelector('.hero, .section, .container, .column, .button') &&
                         document.documentElement.innerHTML.includes('bulma'),
            version: () => 'Unknown'
          }
        ];

        // Handle CSS framework detection
        cssChecks.forEach(item => {
          if (item.check()) {
            const version = item.version();
            results.cssFrameworks.push({
              name: item.name,
              detected: true,
              version: version,
              icon: '✓'
            });
          }
        });

        // UI Libraries Detection
        const uiChecks = [
          {
            name: 'Material-UI / MUI',
            check: () => isScriptLoaded('MaterialUI') || document.querySelector('[class*="Mui"], [class*="makeStyles"]'),
            version: () => 'Unknown'
          },
          {
            name: 'Ant Design',
            check: () => document.querySelector('.ant-btn, .ant-input, .ant-table, .ant-menu'),
            version: () => 'Unknown'
          },
          {
            name: 'Semantic UI',
            check: () => document.querySelector('.ui.button, .ui.menu, .ui.grid, .ui.container'),
            version: () => 'Unknown'
          },
        ];

        uiChecks.forEach(item => {
          if (item.check()) {
            results.uiLibraries.push({
              name: item.name,
              detected: true,
              version: item.version(),
              icon: '✓'
            });
          }
        });

        // Page Meta Information
        const title = document.title || 'No title';
        const charset = document.characterSet || document.charset || 'Unknown';
        const doctype = document.doctype ? document.doctype.name : 'Unknown';
        const viewport = document.querySelector('meta[name="viewport"]')?.content || 'Not set';
        const description = document.querySelector('meta[name="description"]')?.content || 'Not set';
        
        results.pageInfo = [
          { name: 'Document Title', version: title, icon: '📄', detected: true },
          { name: 'Character Set', version: charset, icon: '🔤', detected: true },
          { name: 'Document Type', version: doctype, icon: '📋', detected: true },
          { name: 'Viewport', version: viewport, icon: '📱', detected: !!document.querySelector('meta[name="viewport"]') },
          { name: 'Meta Description', version: description.substring(0, 100) + (description.length > 100 ? '...' : ''), icon: '📝', detected: !!document.querySelector('meta[name="description"]') }
        ];

        // Development Tools Detection
        const devChecks = [
          {
            name: 'Google Analytics',
            check: () => isScriptLoaded('gtag') || isScriptLoaded('ga') || document.querySelector('script[src*="google-analytics"]'),
            icon: '📊'
          },
          {
            name: 'Google Tag Manager',
            check: () => isScriptLoaded('dataLayer') || document.querySelector('script[src*="googletagmanager"]'),
            icon: '🏷️'
          },
          {
            name: 'Hotjar',
            check: () => isScriptLoaded('hj') || document.querySelector('script[src*="hotjar"]'),
            icon: '🔥'
          },
          {
            name: 'Facebook Pixel',
            check: () => isScriptLoaded('fbq') || document.querySelector('script[src*="facebook"]'),
            icon: '👥'
          }
        ];

        devChecks.forEach(item => {
          if (item.check()) {
            results.devTools.push({
              name: item.name,
              detected: true,
              version: 'Detected',
              icon: item.icon
            });
          }
        });

        // Don't add empty states - only show what was actually detected

        return results;
      })()
    `, resolve);
  });
}

const refreshInfo = async () => {
  loading.value = true
  try {
    const result = await analyzePageInfo()
    info.value = result || {
      jsFrameworks: [],
      cssFrameworks: [],
      uiLibraries: [],
      pageInfo: [],
      devTools: []
    }
  } catch (error) {
    console.error('Error analyzing page info:', error)
    // Reset to default structure on error
    info.value = {
      jsFrameworks: [],
      cssFrameworks: [],
      uiLibraries: [],
      pageInfo: [],
      devTools: []
    }
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await refreshInfo()
})
</script>