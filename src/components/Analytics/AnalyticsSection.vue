<template>
  <div class="bg-vue-darker border border-vue-border rounded-lg p-4">
    <h3 class="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-lg">{{ icon }}</span>
      <span class="text-sitefinity-blue" v-html="title"></span>
    </h3>
    
    <!-- Recommendation banner -->
    <div 
      v-if="showRecommendations && recommendation" 
      :class="[
        'mb-4 p-3 rounded text-xs',
        recommendation.includes('✓') 
          ? 'bg-sitefinity-green/10 border border-sitefinity-green/20 text-sitefinity-green' 
          : 'bg-sitefinity-yellow/10 border border-sitefinity-yellow/20 text-sitefinity-yellow'
      ]"
      v-html="recommendation"
    ></div>

    <!-- Items list -->
    <div class="space-y-2">
      <div 
        v-for="item in items" 
        :key="item.name"
        class="flex items-start justify-between py-2 px-3 rounded bg-vue-darkest/50"
      >
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <span class="text-lg flex-shrink-0">{{ item.icon }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-medium text-text-primary">{{ item.name }}</span>
              <span v-if="item.async" class="px-1 py-0.5 text-xs bg-sitefinity-green/20 text-sitefinity-green rounded">async</span>
              <span v-if="item.defer" class="px-1 py-0.5 text-xs bg-sitefinity-blue/20 text-sitefinity-blue rounded">defer</span>
            </div>
            <div class="text-xs text-text-secondary break-all">{{ item.description }}</div>
            <div v-if="item.warning" class="text-xs text-sitefinity-yellow mt-1 flex items-center gap-1">
              <span>⚠</span>
              {{ item.warning }}
            </div>
          </div>
        </div>
        <div class="text-right flex-shrink-0 ml-3">
          <span 
            v-if="item.value"
            :class="[
              'text-xs font-medium',
              item.status === 'good' ? 'text-sitefinity-green' : 
              item.warning ? 'text-sitefinity-yellow' : 'text-text-primary'
            ]"
          >
            {{ item.value }}
          </span>
          <div v-if="item.size" class="text-xs text-text-muted">
            {{ Math.round(item.size / 1024 * 100) / 100 }} KB
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
defineProps({
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  },
  icon: {
    type: String,
    default: '📊'
  },
  showRecommendations: {
    type: Boolean,
    default: false
  },
  recommendation: {
    type: String,
    default: ''
  }
})
</script>