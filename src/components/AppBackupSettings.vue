<template>
  <div class="main-content-container">
    <PageHeader title="备份设置" subtitle="配置数据库自动备份策略" :icon="Setting" :icon-size="24" />

    <div class="page-content">
      <el-form
        ref="configFormRef"
        :model="configForm"
        label-width="120px"
        :label-position="isMobile ? 'top' : 'right'"
        class="settings-form"
      >
        <el-form-item label="启用自动备份">
          <el-switch v-model="configForm.backup_enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>

        <el-form-item label="定时策略" required>
          <cron-selector v-model="configForm.backup_cron" />
          <div v-if="cronTimes.length > 0" class="cron-next-times">
            <p><strong>下5次执行时间：</strong></p>
            <div v-loading="cronTimesLoading" class="cron-times-list">
              <div v-for="(time, index) in cronTimes" :key="index" class="cron-time-item">
                <el-tag type="info" size="small">{{ time }}</el-tag>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="保留天数" required>
          <el-input-number
            v-model="configForm.backup_retention"
            :min="1"
            :max="365"
            controls-position="right"
          />
          <span class="unit-label">天</span>
        </el-form-item>

        <el-form-item label="最大备份数" required>
          <el-input-number
            v-model="configForm.backup_max_count"
            :min="1"
            :max="100"
            controls-position="right"
          />
          <span class="unit-label">个</span>
        </el-form-item>

        <el-form-item>
          <div class="form-actions">
            <el-button type="primary" :loading="configSaving" @click="saveConfig">
              保存配置
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, inject, watch } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { AxiosStatic } from 'axios'
import { SERVER_URL } from '@/const'
import type { BackupConfig } from '@/typing'
import { isMobile as checkIsMobile } from '@/utils/deviceUtils'
import CronSelector from './CronSelector.vue'

const http = inject<AxiosStatic>('$http')
const isMobile = checkIsMobile()
const API_SUCCESS_CODE = 200

const configForm = reactive({
  backup_enabled: 1 as 0 | 1,
  backup_cron: '0 3 * * *',
  backup_retention: 7,
  backup_max_count: 10,
  backup_compress: 1 as 0 | 1,
})

const configSaving = ref(false)
const cronTimes = ref<string[]>([])
const cronTimesLoading = ref(false)

const loadBackupConfig = async () => {
  if (!http) return

  try {
    const res = await http.get<{ code: number; data: BackupConfig }>(`${SERVER_URL}/backup/config`)

    if (res.data.code === API_SUCCESS_CODE && res.data.data) {
      const config = res.data.data
      const cronExpression = config.backup_cron || '0 3 * * *'

      Object.assign(configForm, {
        backup_enabled: config.backup_enabled,
        backup_cron: cronExpression,
        backup_retention: config.backup_retention,
        backup_max_count: config.backup_max_count,
        backup_compress: config.backup_compress,
      })
      await loadCronTimes()
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '加载备份配置失败'
    ElMessage.error(errorMsg)
  }
}

const saveConfig = async () => {
  if (!http) return

  configSaving.value = true
  try {
    const res = await http.put(`${SERVER_URL}/backup/config`, configForm)

    if (res.data.code === API_SUCCESS_CODE) {
      ElMessage.success('备份配置保存成功')
      await loadCronTimes()
    } else {
      ElMessage.error(res.data.message || '保存配置失败')
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '保存配置失败'
    ElMessage.error(errorMsg)
  } finally {
    configSaving.value = false
  }
}

const loadCronTimes = async () => {
  if (!configForm.backup_cron || !http) {
    cronTimes.value = []
    return
  }

  try {
    cronTimesLoading.value = true
    const response = await http.get(`${SERVER_URL}/setting/cron`, {
      params: { cron: configForm.backup_cron },
    })

    if (response?.data.code === 200 && response.data.data) {
      cronTimes.value = response.data.data || []
    } else {
      cronTimes.value = []
    }
  } catch (error) {
    console.error('查询Cron执行时间错误:', error)
    cronTimes.value = []
  } finally {
    cronTimesLoading.value = false
  }
}

watch(
  () => configForm.backup_cron,
  (newCron) => {
    if (newCron && newCron.trim()) {
      loadCronTimes()
    } else {
      cronTimes.value = []
    }
  },
)

onMounted(() => {
  loadBackupConfig()
})
</script>

<style scoped>
.page-content {
  padding: 0 var(--space-3) var(--space-3);
}

.cron-next-times {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background-color: var(--color-bg-muted);
  border-radius: var(--radius-sm);
}

.cron-next-times p {
  margin: 0 0 var(--space-2);
  color: var(--color-text-secondary);
}

.cron-times-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.cron-time-item {
  display: inline-flex;
}

.unit-label {
  margin-left: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .page-content {
    padding: 0;
  }
}
</style>