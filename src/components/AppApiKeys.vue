<template>
  <div class="main-content-container">
    <PageHeader title="API Key 管理" subtitle="管理 API 密钥用于外部访问" :icon="Lock" :icon-size="24" variant="list">
      <template #toolbar>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">
            <span class="btn-text">新建 API Key</span>
          </el-button>
          <el-button :icon="Refresh" @click="loadKeys" :loading="loading">
            <span class="btn-text">刷新</span>
          </el-button>
        </div>
      </template>
    </PageHeader>

    <div class="page-content">
      <el-table
        :data="apiKeys"
        v-loading="loading"
        border
        stripe
        class="keys-table"
        empty-text="暂无 API Key"
      >
        <el-table-column prop="name" label="名称" min-width="80" />
        <el-table-column prop="key_prefix" label="Key 前缀" width="160">
          <template #default="{ row }">
            <el-tag type="info">{{ row.key_prefix }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="200">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              :loading="row._updating"
              active-text="启用"
              inactive-text="停用"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="最后使用" min-width="200">
          <template #default="{ row }">
            {{ formatDateSafe(row.last_used_at) }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="200">
          <template #default="{ row }">
            {{ formatDateSafe(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" size="small" :icon="Delete" @click="confirmDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="createDialogVisible"
      title="生成 API Key"
      :width="isMobileView ? '90%' : '480px'"
      :close-on-click-modal="false"
    >
      <el-form
        :model="createForm"
        :label-position="isMobileView ? 'top' : 'left'"
        label-width="100px"
      >
        <el-form-item label="名称" required>
          <el-input
            v-model="createForm.name"
            placeholder="用于区分用途的名称，例如: CI 脚本"
            maxlength="60"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createKey">生成</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="createdKeyDialogVisible"
      title="请立即保存新密钥"
      :width="isMobileView ? '90%' : '520px'"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-alert type="warning" show-icon :closable="false" class="created-warning">
        <template #title>只会显示一次，关闭后无法再次查看完整密钥。</template>
        <p class="alert-tip">
          调用接口时在 URL 追加 api_key 参数即可使用，例如 /api/user/info?api_key=...
        </p>
      </el-alert>

      <div class="created-key-box" v-if="createdKey">
        <div class="key-row">
          <span class="key-label">完整密钥</span>
          <div class="key-value">
            <el-input v-model="createdKey.key" readonly />
            <el-button type="primary" plain :icon="CopyDocument" @click="copyContent(createdKey.key)">
              复制
            </el-button>
          </div>
        </div>
        <div class="key-meta">
          <span>名称：{{ createdKey.name }}</span>
          <span>前缀：{{ createdKey.key_prefix }}</span>
          <span>创建时间：{{ formatDateTime(createdKey.created_at) }}</span>
        </div>
      </div>

      <template #footer>
        <el-button type="primary" @click="createdKeyDialogVisible = false">我已妥善保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import { Plus, Refresh, Delete, CopyDocument, Lock } from '@element-plus/icons-vue'
import type { AxiosStatic } from 'axios'
import { SERVER_URL } from '@/const'
import { formatDateTime } from '@/utils/timeUtils'
import { isMobile } from '@/utils/deviceUtils'

interface ApiKey {
  id: number
  name: string
  key_prefix: string
  last_used_at?: number | null
  created_at: number
  is_active: boolean
}

interface CreatedApiKey extends ApiKey {
  key?: string
}

type ApiKeyItem = ApiKey & { _updating?: boolean }

const http = inject<AxiosStatic>('$http')
const apiKeys = ref<ApiKeyItem[]>([])
const loading = ref(false)
const createDialogVisible = ref(false)
const createdKeyDialogVisible = ref(false)
const createForm = reactive({ name: '' })
const creating = ref(false)
const createdKey = ref<CreatedApiKey | null>(null)
const isMobileView = ref(isMobile())

const formatDateSafe = (value?: number | null) => {
  return formatDateTime(value || 0)
}

const loadKeys = async () => {
  try {
    loading.value = true
    const response = await http?.get(`${SERVER_URL}/api-keys`)
    if (response?.data.code === 200) {
      apiKeys.value = (response.data.data || []).map((item: ApiKey) => ({
        ...item,
        _updating: false,
      }))
    } else {
      apiKeys.value = []
      ElMessage.error(response?.data.message || '加载 API Key 列表失败')
    }
  } catch (error) {
    console.error('加载 API Key 失败:', error)
    apiKeys.value = []
    ElMessage.error('加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  createForm.name = ''
  createDialogVisible.value = true
}

const createKey = async () => {
  if (!createForm.name.trim()) {
    ElMessage.warning('请输入 API Key 名称')
    return
  }
  try {
    creating.value = true
    const response = await http?.post(`${SERVER_URL}/api-keys`, {
      name: createForm.name.trim(),
    })

    if (response?.data.code === 200) {
      createdKey.value = response.data.data
      createDialogVisible.value = false
      createdKeyDialogVisible.value = true
      ElMessage.success('API Key 创建成功')
      loadKeys()
    } else {
      ElMessage.error(response?.data.message || '创建失败')
    }
  } catch (error) {
    console.error('创建 API Key 失败:', error)
    ElMessage.error('创建失败，请稍后重试')
  } finally {
    creating.value = false
  }
}

const toggleStatus = async (row: ApiKeyItem) => {
  const original = row.is_active
  row._updating = true
  try {
    const response = await http?.put(`${SERVER_URL}/api-keys/${row.id}/status`, {
      is_active: row.is_active,
    })

    if (response?.data.code === 200) {
      ElMessage.success(row.is_active ? '已启用' : '已禁用')
      loadKeys()
    } else {
      row.is_active = original
      ElMessage.error(response?.data.message || '状态更新失败')
    }
  } catch (error) {
    console.error('更新 API Key 状态失败:', error)
    row.is_active = original
    ElMessage.error('状态更新失败，请稍后重试')
  } finally {
    row._updating = false
  }
}

const confirmDelete = async (row: ApiKey) => {
  try {
    await ElMessageBox.confirm(
      `确认删除【${row.name}】(前缀 ${row.key_prefix}) 吗？删除后无法恢复。`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    )

    const response = await http?.delete(`${SERVER_URL}/api-keys/${row.id}`)
    if (response?.data.code === 200) {
      ElMessage.success('删除成功')
      loadKeys()
    } else {
      ElMessage.error(response?.data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除 API Key 失败:', error)
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

const copyContent = async (content?: string) => {
  if (!content) return
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

onMounted(() => {
  loadKeys()
})
</script>

<style scoped>
.page-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.keys-table {
  width: 100%;
}

.alert-tip {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
}

.created-warning {
  margin-bottom: var(--space-3);
}

.created-key-box {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.key-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.key-label {
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.key-value {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.key-meta {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

@media (max-width: 768px) {
  .page-content {
    padding: var(--space-3);
  }

  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .toolbar-right .el-button {
    flex: 1 1 calc(50% - var(--space-2));
    min-width: 0;
  }

  .keys-table {
    font-size: var(--text-xs);
  }

  .keys-table :deep(.el-table__cell) {
    padding: 6px 8px;
  }

  .keys-table :deep(.el-table__header th) {
    padding: 6px 8px;
  }

  .key-value {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .page-content {
    padding: var(--space-2);
  }

  .toolbar-right {
    gap: var(--space-2);
  }

  .keys-table {
    font-size: var(--text-xs);
  }

  .keys-table :deep(.el-table__cell) {
    padding: 4px 6px;
  }

  .keys-table :deep(.el-table__header th) {
    padding: 4px 6px;
  }
}
</style>