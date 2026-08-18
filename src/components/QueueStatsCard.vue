<script setup lang="ts">
import { useQueueStats } from '@/composables/useQueueStats'

const { queueStats, queueStatsLoading } = useQueueStats()
</script>

<template>
  <div class="stats-card-main" v-loading="queueStatsLoading">
    <div class="stats-card-header">
      <div class="stats-card-title">
        <span class="title-icon">📊</span>
        <span>115接口监控</span>
      </div>
      <div
        class="status-badge"
        :class="queueStats?.is_throttled ? 'status-warning' : 'status-success'"
      >
        {{ queueStats?.is_throttled ? '限流中' : '运行正常' }}
      </div>
    </div>

    <div v-if="queueStats" class="stats-content">
      <div v-if="queueStats.is_throttled" class="throttle-warning">
        <div class="throttle-icon">⚠️</div>
        <div class="throttle-details">
          <div class="throttle-item">
            <span class="label">等待时间</span>
            <span class="value">{{ queueStats.throttle_wait_time }}</span>
          </div>
          <div class="throttle-item">
            <span class="label">已过时间</span>
            <span class="value">{{ queueStats.throttled_elapsed_time }}</span>
          </div>
          <div class="throttle-item">
            <span class="label">剩余时间</span>
            <span class="value">{{ queueStats.throttled_remaining_time }}</span>
          </div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-item" :class="{ 'metric-warning': queueStats.qps_count > 3 }">
          <div class="metric-value">{{ queueStats.qps_count }}</div>
          <div class="metric-label">QPS</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ queueStats.qpm_count }}</div>
          <div class="metric-label">QPM</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ queueStats.qph_count }}</div>
          <div class="metric-label">QPH</div>
        </div>
        <div class="metric-item">
          <div class="metric-value">{{ queueStats.avg_response_time_ms }}</div>
          <div class="metric-label">响应(ms)</div>
        </div>
        <div class="metric-item" :class="{ 'metric-danger': queueStats.throttled_count > 0 }">
          <div class="metric-value">{{ queueStats.throttled_count }}</div>
          <div class="metric-label">限流次数</div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无统计数据" :image-size="60" />
    </div>
  </div>
</template>

<style scoped>
.stats-card-main {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-subtle);
}

.stats-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.stats-card-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.title-icon {
  font-size: 20px;
}

.status-badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
}

.status-success {
  background: var(--success-50);
  color: var(--success-600);
}

.status-warning {
  background: var(--warning-50);
  color: var(--warning-600);
  animation: pulse-bg 2s ease-in-out infinite;
}

@keyframes pulse-bg {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.throttle-warning {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  background: linear-gradient(135deg, var(--warning-50) 0%, var(--warning-100) 100%);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
}

.throttle-icon {
  font-size: 24px;
}

.throttle-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  flex: 1;
}

.throttle-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.throttle-item .label {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.throttle-item .value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: var(--space-3);
}

.metric-item {
  text-align: center;
  padding: var(--space-4) var(--space-2);
  background: var(--neutral-50);
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
}

.metric-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.metric-item.metric-warning {
  background: linear-gradient(135deg, var(--warning-50) 0%, var(--warning-100) 100%);
}

.metric-item.metric-danger {
  background: linear-gradient(135deg, var(--danger-50) 0%, var(--danger-100) 100%);
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
}

.metric-item.metric-warning .metric-value {
  color: var(--warning-600);
}

.metric-item.metric-danger .metric-value {
  color: var(--danger-600);
}

.metric-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
}

.empty-state {
  padding: var(--space-10) var(--space-5);
  text-align: center;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .metric-value {
    font-size: 20px;
  }
}
</style>
