<script setup lang="ts">
import { useVersion } from '@/composables/useVersion'

const { versionInfo, versionLoading } = useVersion()
</script>

<template>
  <div class="info-card system-info" v-loading="versionLoading">
    <div class="info-card-header">
      <span class="info-icon">⚙️</span>
      <span>系统信息</span>
    </div>
    <div v-if="versionInfo" class="info-content">
      <div class="info-row">
        <span class="info-label">版本</span>
        <span class="info-value version-tag">{{ versionInfo.version }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">编译时间</span>
        <span class="info-value">{{ versionInfo.date }}</span>
      </div>
    </div>
    <div v-else class="empty-state-small">
      <el-empty description="暂无信息" :image-size="40" />
    </div>
  </div>
</template>

<style scoped>
.info-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-subtle);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
}

.info-icon {
  font-size: 18px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.info-value {
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.version-tag {
  background: linear-gradient(135deg, var(--brand-500) 0%, var(--brand-700) 100%);
  color: var(--color-text-inverse);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
}

.empty-state-small {
  padding: var(--space-5);
  text-align: center;
}
</style>
