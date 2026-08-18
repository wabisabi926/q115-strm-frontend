<script setup lang="ts">
import { ref, inject } from 'vue'
import { ElMessage } from 'element-plus'
import { SERVER_URL } from '@/const'
import type { AxiosStatic } from 'axios'
import { Tools } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'

const http: AxiosStatic | undefined = inject('$http')
const loading = ref(false)

const repairDatabase = async () => {
  try {
    loading.value = true
    const response = await http?.post(`${SERVER_URL}/database/repair`)
    if (response?.data.code === 200) {
      ElMessage.success('数据库修复成功')
    } else {
      ElMessage.error(response?.data.message || '数据库修复失败')
    }
  } catch (error) {
    console.error('数据库修复失败:', error)
    ElMessage.error('数据库修复失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="main-content-container database-repair-container">
    <PageHeader title="数据库修复" subtitle="重建缺失的数据库表结构" :icon="Tools" />

    <div class="section-card">
      <div class="section-header">
        <span class="section-icon">🔧</span>
        <span>数据库修复</span>
      </div>
      <div class="repair-content">
        <p class="repair-description">
          本操作会重建所有数据库表（不会影响已存在的表和数据），如果有以下问题：<br />
          日志错误提示：SQL logic error: no such table: 表名 <br />
          日志错误提示：pg duplicate key value violates unique constraint "表名_pkey" <br />
          <br />

          都可以执行修复数据库来解决问题。
        </p>
        <el-button type="primary" size="large" :loading="loading" @click="repairDatabase" round>
          {{ loading ? '修复中...' : '修复数据库' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.database-repair-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: 0;
}

.section-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-subtle);
}

.section-header {
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

.section-icon {
  font-size: 20px;
}

.repair-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-5);
  padding: var(--space-5) var(--space-4);
}

.repair-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  text-align: left;
  margin: 0;
  line-height: var(--leading-relaxed);
}
</style>
