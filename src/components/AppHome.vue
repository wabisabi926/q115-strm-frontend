<script setup lang="ts">
import { ref } from 'vue'
import { Document } from '@element-plus/icons-vue'
import VersionManager from './VersionManager.vue'
import QueueStatsCard from './QueueStatsCard.vue'
import HourlyStatsChart from './HourlyStatsChart.vue'

import AppLogViewer from './AppLogViewer.vue'

const showLogDialog = ref(false)
const logViewerRef = ref<InstanceType<typeof AppLogViewer> | null>(null)

const handleLogDialogClose = () => {
  if (logViewerRef.value) {
    logViewerRef.value.disconnect()
  }
}
</script>

<template>
  <div class="home-container">
    <div class="header-section">
      <div class="header-title">
        <h1>控制台</h1>
        <p>系统运行状态监控与管理</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showLogDialog = true" :icon="Document" round>
          运行日志
        </el-button>
      </div>
    </div>

    <div class="stats-section">
      <div class="stats-row">
        <QueueStatsCard />
        <HourlyStatsChart />
      </div>
    </div>

    <div class="info-section">
      <div class="info-grid">
        <VersionManager />

        <div class="info-card notice-card">
          <div class="info-card-header">
            <span class="info-icon">📝</span>
            <span>使用须知</span>
          </div>
          <div class="notice-list">
            <div class="notice-item notice-important">
              <span class="notice-number">1</span>
              <span>本项目使用115开放平台，QPS受限，介意勿用</span>
            </div>
            <div class="notice-item">
              <span class="notice-number">2</span>
              <span>播放、下载、媒体提取等操作并发总和勿超5</span>
            </div>
            <div class="notice-item">
              <span class="notice-number">3</span>
              <span>神医助手线程数建议调整为1或2</span>
            </div>
            <div class="notice-item">
              <span class="notice-number">4</span>
              <span
                >问题请在
                <a href="https://github.com/wabisabi926/qmediasync" target="_blank">GitHub</a> 提交issue
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 日志查看弹窗 -->
  <el-dialog
    v-model="showLogDialog"
    title="运行日志"
    class="log-dialog"
    :fullscreen="true"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    show-close="true"
    :destroy-on-close="true"
    @close="handleLogDialogClose"
  >
    <div class="log-dialog-content">
      <AppLogViewer ref="logViewerRef" log-path="app.log" :is-real-time="true" />
    </div>
  </el-dialog>
</template>

<style scoped>
.home-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: 0;
  --home-side-col: 320px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5) var(--space-6);
  background: var(--gradient-hero);
  border-radius: var(--radius-xl);
  color: white;
}

.header-title h1 {
  margin: 0 0 var(--space-1) 0;
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
}

.header-title p {
  margin: 0;
  font-size: var(--text-base);
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: var(--space-3);
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.stats-row {
  display: grid;
  grid-template-columns: var(--home-side-col) 1fr;
  gap: var(--space-5);
}

.info-section {
  display: flex;
  flex-direction: column;
}

.info-grid {
  display: grid;
  grid-template-columns: var(--home-side-col) 1fr;
  gap: var(--space-5);
}

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
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
}

.info-icon {
  font-size: var(--text-xl);
}

.sponsor-content {
  display: flex;
  justify-content: center;
}

.sponsor-content img {
  max-width: 100%;
  border-radius: var(--radius-md);
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
}

.notice-item.notice-important {
  color: var(--danger-600);
}

.notice-number {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  background: var(--neutral-100);
  border-radius: var(--radius-full);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.notice-item.notice-important .notice-number {
  background: var(--danger-50);
  color: var(--danger-600);
}

.notice-item a {
  color: var(--brand-500);
  text-decoration: none;
}

.notice-item a:hover {
  text-decoration: underline;
}

.log-dialog {
  display: flex;
  align-items: center;
  justify-content: center;
}

.log-dialog-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.log-dialog-content :deep(.el-dialog__body) {
  padding: 0;
  overflow: hidden;
  height: calc(100% - 60px);
}

.log-dialog-content :deep(.el-dialog__header) {
  padding: 10px var(--space-5);
  border-bottom: 1px solid var(--color-border-subtle);
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    gap: var(--space-4);
    text-align: center;
    padding: var(--space-4);
  }

  .header-title h1 {
    font-size: var(--text-3xl);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>