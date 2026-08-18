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
    <div v-if="$slots.toolbar" class="header-toolbar">
      <slot name="toolbar" />
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

<style scoped>
.page-header {
  background: var(--color-bg-elevated, #fff);
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-4, 16px) var(--space-5, 20px);
  margin-bottom: var(--space-5, 20px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04));
  display: flex;
  align-items: center;
  gap: var(--space-4, 16px);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--brand-500, #3b82f6);
  border-radius: 4px 0 0 4px;
}

.page-header--list {
  flex-direction: column;
  align-items: stretch;
  padding-bottom: 0;
}

.page-header--list::before {
  bottom: auto;
  height: 4px;
  width: auto;
  left: 0;
  right: 0;
  top: 0;
  border-radius: 4px 4px 0 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--space-4, 16px);
  flex: 1;
}

.page-header--list .header-content {
  padding-bottom: var(--space-3, 12px);
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-50, #eff6ff);
  color: var(--brand-500, #3b82f6);
  flex-shrink: 0;
}

.header-icon--md {
  width: 48px;
  height: 48px;
}

.header-icon--md .el-icon {
  font-size: 24px;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-text h2 {
  margin: 0;
  font-size: var(--text-lg, 18px);
  font-weight: var(--weight-semibold, 600);
  color: var(--color-text-primary, #1f2937);
}

.header-text p {
  margin: 0;
  font-size: var(--text-sm, 13px);
  color: var(--color-text-secondary, #6b7280);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  margin-left: auto;
  flex-shrink: 0;
}

.page-header--list .header-actions {
  margin-left: 0;
  width: 100%;
  justify-content: flex-end;
  padding-bottom: var(--space-3, 12px);
}

.header-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3, 12px);
  padding-top: var(--space-3, 12px);
  padding-bottom: var(--space-3, 12px);
  border-top: 1px solid var(--color-border-light, #f0f0f0);
  flex-wrap: wrap;
}

.header-toolbar .toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  margin-left: auto;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .page-header {
    padding: var(--space-3, 12px) var(--space-4, 16px);
    flex-direction: column;
    align-items: stretch;
  }

  .header-content {
    gap: var(--space-3, 12px);
  }

  .header-icon {
    width: 36px;
    height: 36px;
  }

  .header-icon--md {
    width: 40px;
    height: 40px;
  }

  .header-text h2 {
    font-size: var(--text-md, 16px);
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: var(--space-2, 8px);
  }

  .header-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .header-toolbar .toolbar-right {
    margin-left: 0;
  }

  .header-toolbar .toolbar-right .el-button {
    flex: 1 1 calc(50% - var(--space-3));
    min-width: 120px;
  }
}
</style>
