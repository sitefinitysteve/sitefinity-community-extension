<template>
  <div class="bg-vue-darker border border-vue-border rounded-lg p-4">
    <h3 class="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
      <span class="text-sitefinity-blue">{{ title }}</span>
    </h3>
    <div class="space-y-2">
      <div 
        v-for="item in items" 
        :key="item.name"
        :class="[
          'flex items-center justify-between py-2 px-3 rounded',
          item.detected ? 'bg-sitefinity-green/10 border border-sitefinity-green/20' : 'bg-vue-darkest/50'
        ]"
      >
        <div class="flex items-center gap-3">
          <span class="text-lg">{{ item.icon }}</span>
          <span 
            :class="[
              'text-xs font-medium',
              item.detected ? 'text-text-primary' : 'text-text-muted'
            ]"
          >
            {{ item.name }}
          </span>
        </div>
        <div v-if="item.version" class="text-right">
          <span 
            :class="[
              'text-xs',
              item.detected ? 'text-sitefinity-green' : 'text-text-muted'
            ]"
          >
            {{ item.version }}
          </span>
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
  }
})
</script>