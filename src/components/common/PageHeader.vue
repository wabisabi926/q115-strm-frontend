<template>
  <div class="page-header" :class="{ 'page-header--list': variant === 'list' }">
    <div class="header-content">
      <div class="header-icon" :class="{ 'header-icon--md': variant === 'list' }">
        <el-icon :size="innerIconSize">
          <component :is="icon" />
        </el-icon>
      </div>
      <div class="header-text">
        <h2>{{ title }}</h2>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <div v-if="$slots.actions" class="header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    icon: Component
    iconSize?: number
    variant?: 'config' | 'list'
  }>(),
  {
    iconSize: 24,
    variant: 'config',
  }
)

const innerIconSize = computed(() => props.iconSize)
</script>
