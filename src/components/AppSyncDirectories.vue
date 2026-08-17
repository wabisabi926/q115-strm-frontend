<template>
  <div class="main-content-container main-content-container--list sync-directories-page">
    <PageHeader title="同步目录管理" subtitle="管理您的云盘与本地目录的同步配置" :icon="FolderOpened" variant="list">
      <template #actions>
        <el-button type="primary" class="add-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          <span class="btn-text">添加同步目录</span>
        </el-button>
      </template>
    </PageHeader>
    <div class="stats-bar mobile-hidden">
      <div class="stat-item">
        <div class="stat-icon total">
          <el-icon><Files /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ directories.length }}</span>
          <span class="stat-label">总目录数</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon running">
          <el-icon><Loading /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ runningCount }}</span>
          <span class="stat-label">运行中</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon waiting">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ waitingCount }}</span>
          <span class="stat-label">等待中</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon cron">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ cronEnabledCount }}</span>
          <span class="stat-label">定时同步</span>
        </div>
      </div>
    </div>

    <div class="directories-content">
      <div class="directories-grid" v-if="directories.length > 0">
        <div
          class="directory-card"
          v-for="(row, index) in directories"
          :key="row.id || index"
          :class="{ 'is-running': row.is_running === 2, 'is-waiting': row.is_running === 1 }"
        >
          <div class="card-status-bar" :class="getStatusClass(row)"></div>
          <div class="card-main">
            <div class="card-header">
              <div class="card-title-wrapper">
                <el-tooltip :content="'目录ID：' + row.base_cid" placement="bottom">
                  <span class="card-id">#{{ row.id }}</span>
                </el-tooltip>
                <span class="card-path">{{ row.remote_path }}</span>
              </div>
              <el-tag :type="sourceTypeTagMap[row.source_type]" class="source-tag" effect="light">
                {{ sourceTypeMap[row.source_type] }}
              </el-tag>
            </div>

            <div class="card-body">
              <div class="info-row" v-if="row.source_type !== 'local'">
                <div class="info-icon">
                  <el-icon><User /></el-icon>
                </div>
                <div class="info-content">
                  <span class="info-label">关联账号</span>
                  <span class="info-value">{{ row.account_name }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-icon">
                  <el-icon><Folder /></el-icon>
                </div>
                <div class="info-content">
                  <span class="info-label">目标路径</span>
                  <span class="info-value path-value">{{ GetFullPath(row) }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-icon">
                  <el-icon><Calendar /></el-icon>
                </div>
                <div class="info-content">
                  <span class="info-label">添加时间</span>
                  <span class="info-value">{{ formatTime(row.created_at) }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-icon">
                  <el-icon><Refresh /></el-icon>
                </div>
                <div class="info-content">
                  <span class="info-label">最后同步</span>
                  <span class="info-value">{{ formatTime(row.last_sync_at) || '从未同步' }}</span>
                </div>
              </div>

              <div class="info-row toggle-row">
                <div class="info-icon">
                  <el-icon><Timer /></el-icon>
                </div>
                <div class="info-content">
                  <el-tooltip
                    effect="dark"
                    content="开启后会根据strm设置中的cron表达式定时同步数据，如果该同步目录内的资源变动概率较小，建议关闭定时同步"
                    placement="top"
                  >
                    <span class="info-label with-tooltip">
                      定时同步
                      <el-icon class="help-icon"><QuestionFilled /></el-icon>
                    </span>
                  </el-tooltip>
                  <el-switch
                    v-model="row.enable_cron"
                    :active-value="true"
                    :inactive-value="false"
                    @change="toggleCron(row)"
                    active-color="var(--success)"
                    inactive-color="var(--color-border)"
                  />
                </div>
              </div>

              <div class="status-row">
                <div class="status-indicator" :class="getStatusClass(row)">
                  <el-icon v-if="row.is_running === 2" class="rotating"><Loading /></el-icon>
                  <el-icon v-else-if="row.is_running === 1"><Clock /></el-icon>
                  <el-icon v-else><CircleCheck /></el-icon>
                  <span>{{ getStatusText(row) }}</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <el-tooltip
                content="删除所有缓存数据后执行同步，可处理所有网盘文件变更"
                placement="top"
              >
                <el-button
                  type="warning"
                  size="small"
                  plain
                  @click="handleFullStart(row, index)"
                  :loading="row.starting"
                  v-if="
                    (row.source_type === '115' || row.source_type === 'baidupan') &&
                    row.is_running === 0
                  "
                >
                  <el-icon><RefreshRight /></el-icon>
                  全量同步
                </el-button>
              </el-tooltip>

              <el-button
                type="success"
                size="small"
                plain
                @click="handleStart(row, index)"
                :loading="row.starting"
                v-if="row.is_running === 0"
              >
                <el-icon><VideoPlay /></el-icon>
                {{ row.source_type == '115' || row.source_type == 'baidupan' ? '增量' : '' }}同步
              </el-button>

              <el-button
                type="info"
                size="small"
                plain
                @click="handleStop(row, index)"
                :loading="row.stopping"
                v-if="row.is_running !== 0"
              >
                <el-icon><VideoPause /></el-icon>
                停止
              </el-button>

              <el-button type="primary" size="small" plain @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>

              <el-button
                type="danger"
                size="small"
                plain
                @click="handleDelete(row, index)"
                :loading="row.deleting"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>

              
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else-if="!loading">
        <div class="empty-illustration">
          <el-icon class="empty-icon"><FolderOpened /></el-icon>
          <div class="empty-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <h3 class="empty-title">暂无同步目录</h3>
        <p class="empty-description">点击上方按钮添加您的第一个同步目录</p>
      </div>

      <div class="loading-state" v-if="loading">
        <el-icon class="loading-icon rotating"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div class="page-footer-tips">
        <div class="tips-header">
          <el-icon class="tips-icon"><InfoFilled /></el-icon>
          <span>使用说明</span>
        </div>
        <div class="tips-content">
          <div class="tip-group">
            <div class="tip-group-title">
              <el-icon><Warning /></el-icon>
              <span>115网盘</span>
            </div>
            <div class="tip-group-items">
              <div class="tip-item">
                <span class="tip-bullet">•</span>
                <span
                  >无法感知网盘的文件夹重命名等操作，如果发现文件夹名字不对可以手动点击：<strong
                    >重置&同步</strong
                  ></span
                >
              </div>
              <div class="tip-item">
                <span class="tip-bullet">•</span>
                <span
                  >"全量同步"会删除所有缓存数据（不会删除本地文件），然后执行同步，可以处理所有网盘文件变更</span
                >
              </div>
              <div class="tip-item tip-highlight">
                <span class="tip-bullet">★</span>
                <span
                  >请按照电影和电视剧分开添加同步目录，电影的同步速度非常快，电视剧的同步速度较慢</span
                >
              </div>
            </div>
          </div>
          <div class="tip-group">
            <div class="tip-group-title">
              <el-icon><Timer /></el-icon>
              <span>百度网盘</span>
            </div>
            <div class="tip-group-items">
              <div class="tip-item">
                <span class="tip-bullet">•</span>
                <span
                  >只查询上次同步时间之后修改的文件列表，不会查询所有文件、无法感知文件和文件夹删除</span
                >
              </div>
              <div class="tip-item">
                <span class="tip-bullet">•</span>
                <span
                  >增量同步只能单线程，每分钟最多执行8次请求，每次请求1000个文件，如果单次变更文件数量大于8000，同步就会很慢</span
                >
              </div>
              <div class="tip-item">
                <span class="tip-bullet">•</span>
                <span>"全量同步"会删除所有缓存数据（不会删除本地文件），然后递归查询所有文件</span>
              </div>
              <div class="tip-item tip-highlight">
                <span class="tip-bullet">★</span>
                <span>每天的第一次同步会执行"全量同步"，后续同步会执行"增量同步"</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SERVER_URL } from '@/const'
import PageHeader from '@/components/common/PageHeader.vue'
import type { AxiosStatic } from 'axios'
import { inject, onMounted, onUnmounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Loading,
  Folder,
  VideoPlay,
  Edit,
  Delete,
  Warning,
  VideoPause,
  InfoFilled,
  Timer,
  FolderOpened,
  Files,
  Clock,
  User,
  Calendar,
  Refresh,
  RefreshRight,
  CircleCheck,
  QuestionFilled,
  Link,
} from '@element-plus/icons-vue'
import { formatTime } from '@/utils/timeUtils'
import { isMobile, onDeviceTypeChange } from '@/utils/deviceUtils'
import { sourceTypeTagMap, sourceTypeMap } from '@/utils/sourceTypeUtils'

interface SyncDirectory {
  id: number
  base_cid: string
  local_path: string
  remote_path: string
  strm_path: string
  created_at: number
  updated_at: number
  last_sync_at: number
  deleting?: boolean
  starting?: boolean
  source_type: string
  account_id: number
  account_name: string
  enable_cron: boolean
  is_running: number
  stopping?: boolean
}

const http: AxiosStatic | undefined = inject('$http')
const router = useRouter()

const directories = ref<SyncDirectory[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(9999)

const checkIsMobile = ref(isMobile())

const currentSyncDirectory = ref<SyncDirectory | null>(null)

const runningCount = computed(() => directories.value.filter((d) => d.is_running === 2).length)
const waitingCount = computed(() => directories.value.filter((d) => d.is_running === 1).length)
const cronEnabledCount = computed(() => directories.value.filter((d) => d.enable_cron).length)

const getStatusClass = (row: SyncDirectory) => {
  if (row.is_running === 2) return 'status-running'
  if (row.is_running === 1) return 'status-waiting'
  return 'status-idle'
}

const getStatusText = (row: SyncDirectory) => {
  if (row.is_running === 2) return '运行中'
  if (row.is_running === 1) return '等待中'
  return '空闲'
}

const checkMobile = () => {
  checkIsMobile.value = isMobile()
}

const GetFullPath = (row: SyncDirectory) => {
  // const pathSeparator = row.local_path.startsWith('/') ? '/' : '\\'
  if (row.source_type == 'local') {
    return row.local_path
  }
  // let remotePath = row.remote_path
  // if (pathSeparator === '/') {
  //   remotePath = remotePath.replace(/\\/g, pathSeparator)
  // } else {
  //   remotePath = remotePath.replace(/\//g, pathSeparator)
  // }
  return `${row.local_path}/${row.remote_path}`
}

const loadDirectories = async () => {
  try {
    loading.value = true
    const response = await http?.get(`${SERVER_URL}/sync/path-list`, {
      timeout: 5000,
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
      },
    })

    if (response?.data.code === 200) {
      directories.value = response.data.data.list || []
      total.value = response.data.data.total || 0
    } else {
      ElMessage.error(response?.data.message || '加载同步目录失败')
      directories.value = []
      total.value = 0
    }
  } catch {
    console.error('加载同步目录错误')
    ElMessage.error('加载同步目录失败')
    directories.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const updatePathesStatus = async () => {
  const response = await http?.get(`${SERVER_URL}/sync/path-list`)

  if (response?.data.code === 200) {
    for (const p of response.data.data.list || []) {
      const path = directories.value.find((pa) => pa.id === p.id)
      if (path) {
        path.is_running = p.is_running
      }
    }
  }
  autoRefreshEnabled = true
}

const handleAdd = () => {
  router.push({ name: 'sync-directory-add' })
}

const handleEdit = (row: SyncDirectory) => {
  router.push({ name: 'sync-directory-edit', params: { id: row.id } })
}

const handleDelete = async (row: SyncDirectory, index: number) => {
  try {
    await ElMessageBox.confirm(
      `不会删除已经同步的元数据和STRM文件，确定要删除同步目录 "${row.local_path}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    directories.value[index].deleting = true

    const formData = {
      id: row.id || '',
    }

    const response = await http?.post(`${SERVER_URL}/sync/path-delete`, formData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response?.data.code === 200) {
      ElMessage.success('删除同步目录成功')
      loadDirectories()
    } else {
      ElMessage.error(response?.data.message || '删除同步目录失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除同步目录错误')
      ElMessage.error('删除同步目录失败')
    }
  } finally {
    if (directories.value[index]) {
      directories.value[index].deleting = false
    }
  }
}

const handleFullStart = async (row: SyncDirectory, index: number) => {
  try {
    directories.value[index].starting = true

    const formData = {
      id: row.id || '',
    }

    const response = await http?.post(`${SERVER_URL}/sync/path/full-start`, formData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response?.data.code === 200) {
      ElMessage.success(`同步目录 "${row.local_path}" 启动成功`)
    } else {
      ElMessage.error(response?.data.message || '启动同步目录失败')
    }
  } catch {
    console.error('启动同步目录错误')
    ElMessage.error('启动同步目录失败')
  } finally {
    if (directories.value[index]) {
      directories.value[index].starting = false
    }
  }
}

const handleStart = async (row: SyncDirectory, index: number) => {
  try {
    directories.value[index].starting = true

    const formData = {
      id: row.id || '',
    }

    const response = await http?.post(`${SERVER_URL}/sync/path/start`, formData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response?.data.code === 200) {
      ElMessage.success(`同步目录 "${row.local_path}" 启动成功`)
    } else {
      ElMessage.error(response?.data.message || '启动同步目录失败')
    }
  } catch {
    console.error('启动同步目录错误')
    ElMessage.error('启动同步目录失败')
  } finally {
    if (directories.value[index]) {
      directories.value[index].starting = false
    }
  }
}

const handleStop = async (row: SyncDirectory, index: number) => {
  try {
    directories.value[index].stopping = true

    const formData = {
      id: row.id || '',
    }

    const response = await http?.post(`${SERVER_URL}/sync/path/stop`, formData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response?.data.code === 200) {
      ElMessage.success(`同步目录 "${row.local_path}" 停止成功`)
    } else {
      ElMessage.error(response?.data.message || '停止同步目录失败')
    }
  } catch {
    console.error('停止同步目录错误')
    ElMessage.error('停止同步目录失败')
  } finally {
    if (directories.value[index]) {
      directories.value[index].stopping = false
    }
  }
}

const toggleCron = async (row: SyncDirectory) => {
  try {
    const formData = {
      id: row.id || '',
    }

    const response = await http?.post(`${SERVER_URL}/sync/path/toggle-cron`, formData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response?.data.code === 200) {
      ElMessage.success(row.enable_cron ? '开启定时同步成功' : '关闭定时同步成功')
    } else {
      row.enable_cron = !row.enable_cron
      ElMessage.error(response?.data.message || '切换定时同步状态失败')
    }
  } catch {
    console.error('切换定时同步状态错误')
    row.enable_cron = !row.enable_cron
    ElMessage.error('切换定时同步状态失败')
  }
}

let autoRefreshEnabled = true
const autoRefreshTimer = ref<number | null>(null)

const checkAndSetAutoRefresh = () => {
  clearAutoRefreshTimer()
  // 不再自动轮询，依赖WebSocket事件
}

const clearAutoRefreshTimer = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
    autoRefreshTimer.value = null
  }
}

// WebSocket事件监听
import { useWSEvent } from '@/composables/useWebSocket'

const onSyncEvent = () => {
  autoRefreshEnabled = true
  updatePathesStatus()
}

useWSEvent('strm_sync_task_start', onSyncEvent)
useWSEvent('strm_sync_task_complete', onSyncEvent)

let removeDeviceTypeListener: (() => void) | null = null

onMounted(() => {
  checkMobile()
  removeDeviceTypeListener = onDeviceTypeChange((newIsMobile) => {
    checkIsMobile.value = newIsMobile
  })
  loadDirectories()
})

onUnmounted(() => {
  if (removeDeviceTypeListener) {
    removeDeviceTypeListener()
  }
  clearAutoRefreshTimer()
})
</script>

<style scoped>
.sync-directories-page {
  min-height: 100%;
  background: var(--color-bg-muted);
  padding: 0;
}

.add-btn {
  background: var(--brand-500) !important;
  border-color: var(--brand-500) !important;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background: var(--brand-600) !important;
  border-color: var(--brand-600) !important;
}

.stats-bar {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: 0 var(--space-6);
  margin-bottom: var(--space-5);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-bg-muted);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  min-width: 140px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-2xl);
}

.stat-icon.total {
  background: var(--brand-50);
  color: var(--brand-500);
}

.stat-icon.running {
  background: var(--success-bg);
  color: var(--success);
}

.stat-icon.waiting {
  background: var(--warning-bg);
  color: var(--warning);
}

.stat-icon.cron {
  background: var(--info-bg);
  color: var(--color-text-tertiary);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  color: var(--color-text-primary);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.directories-content {
  padding: var(--space-6);
}

.directories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.directory-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  position: relative;
}

.directory-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.directory-card.is-running {
  box-shadow: 0 2px 12px rgba(103, 194, 58, 0.2);
}

.directory-card.is-running:hover {
  box-shadow: 0 8px 24px rgba(103, 194, 58, 0.3);
}

.directory-card.is-waiting {
  box-shadow: 0 2px 12px rgba(230, 162, 60, 0.2);
}

.directory-card.is-waiting:hover {
  box-shadow: 0 8px 24px rgba(230, 162, 60, 0.3);
}

.card-status-bar {
  height: 4px;
  background: #e4e7ed;
}

.card-status-bar.status-running {
  background: linear-gradient(90deg, var(--success), #95d475);
  animation: pulse 2s infinite;
}

.card-status-bar.status-waiting {
  background: linear-gradient(90deg, var(--warning), #f0c78a);
  animation: pulse 2s infinite;
}

.card-status-bar.status-idle {
  background: linear-gradient(90deg, var(--color-text-tertiary), var(--color-border-strong));
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.card-main {
  padding: var(--space-4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid #f0f2f5;
}

.card-title-wrapper {
  flex: 1;
  min-width: 0;
}

.card-id {
  display: inline-block;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  background: var(--color-bg-muted);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  margin-right: var(--space-2);
}

.card-path {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  word-break: break-all;
}

.source-tag {
  flex-shrink: 0;
  margin-left: var(--space-2);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.info-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-bg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.info-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 0;
}

.info-label {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.info-label.with-tooltip {
  cursor: help;
}

.help-icon {
  font-size: var(--text-base);
  color: var(--color-border-strong);
}

.info-value {
  font-size: var(--text-base);
  color: var(--color-text-primary);
  text-align: right;
}

.path-value {
  /* font-family: 'SF Mono', Monaco, monospace; */
  font-size: var(--text-base);
  word-break: break-all;
  max-width: 200px;
}

.toggle-row .info-content {
  justify-content: space-between;
}

.status-row {
  margin-top: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border-subtle);
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px var(--space-3);
  border-radius: var(--radius-2xl);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.status-indicator.status-running {
  background: var(--success-bg);
  color: var(--success);
}

.status-indicator.status-waiting {
  background: var(--warning-bg);
  color: var(--warning);
}

.status-indicator.status-idle {
  background: var(--color-bg-muted);
  color: var(--color-text-tertiary);
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-top: var(--space-4);
  margin-top: var(--space-3);
  border-top: 1px solid #f0f2f5;
}

.card-footer .el-button {
  flex: 1;
  min-width: 70px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-6);
}

.empty-illustration {
  position: relative;
  margin-bottom: var(--space-6);
}

.empty-icon {
  font-size: 80px;
  color: var(--color-border);
}

.empty-dots {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.empty-dots span {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  animation: bounce 1.4s infinite ease-in-out both;
}

.empty-dots span:nth-child(1) {
  animation-delay: -0.32s;
}
.empty-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.empty-title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.empty-description {
  margin: 0 0 var(--space-6) 0;
  font-size: var(--text-base);
  color: var(--color-text-tertiary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  color: var(--color-text-tertiary);
  gap: var(--space-3);
}

.loading-icon {
  font-size: 32px;
  color: var(--brand-500);
}

.page-footer-tips {
  border: none;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-md);
}

.tips-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 14px var(--space-5);
  background: var(--gradient-hero);
  color: var(--color-text-inverse);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.tips-icon {
  font-size: var(--text-xl);
}

.tips-content {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

.tip-group {
  flex: 1;
  min-width: 300px;
  padding: var(--space-5);
  border-right: 1px solid #f0f2f5;
}

.tip-group:last-child {
  border-right: none;
}

.tip-group-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f2f5;
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.tip-group-title .el-icon {
  color: var(--warning);
  font-size: var(--text-xl);
}

.tip-group-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
}

.tip-bullet {
  flex-shrink: 0;
  width: 16px;
  color: var(--color-border-strong);
  text-align: center;
}

.tip-item strong {
  color: var(--brand-500);
}

.tip-highlight {
  background: linear-gradient(135deg, var(--warning-bg) 0%, #fef8eb 100%);
  margin: 6px -12px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--warning);
}

.tip-highlight .tip-bullet {
  color: var(--warning);
}

.tip-highlight span:last-child {
  color: #8b6b3d;
}

@media (max-width: 768px) {
  .stats-bar {
    padding: 0 var(--space-3);
  }

  .mobile-hidden {
    display: none !important;
  }

  .directories-content {
    padding: var(--space-3);
  }

  .directories-grid {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .directory-card {
    border-radius: var(--radius-lg);
  }

  .card-main {
    padding: var(--space-3);
  }

  .card-header {
    margin-bottom: var(--space-3);
    padding-bottom: 10px;
  }

  .card-id {
    font-size: var(--text-2xs);
    padding: 2px 6px;
  }

  .card-path {
    font-size: var(--text-base);
  }

  .source-tag {
    font-size: var(--text-2xs);
  }

  .card-body {
    gap: 10px;
  }

  .info-row {
    gap: 10px;
  }

  .info-icon {
    width: 28px;
    height: 28px;
    font-size: var(--text-base);
  }

  .info-label {
    font-size: var(--text-xs);
  }

  .info-value {
    font-size: var(--text-sm);
  }

  .path-value {
    font-size: var(--text-2xs);
    max-width: 140px;
  }

  .status-row {
    margin-top: 6px;
    padding-top: 10px;
  }

  .status-indicator {
    padding: 5px 10px;
    font-size: var(--text-xs);
  }

  .card-footer {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
    padding-top: var(--space-3);
    margin-top: 10px;
  }

  .card-footer .el-button {
    flex: none;
    min-width: 0;
    width: 100%;
    margin: 0;
  }

  .card-footer .el-button :deep(.el-icon) {
    margin-right: var(--space-1);
  }

  .empty-state {
    padding: var(--space-10) var(--space-4);
    border-radius: var(--radius-lg);
  }

  .empty-icon {
    font-size: 60px;
  }

  .empty-title {
    font-size: var(--text-lg);
  }

  .empty-description {
    font-size: var(--text-sm);
    margin-bottom: var(--space-5);
  }

  .page-footer-tips {
    border-radius: var(--radius-lg);
  }

  .tips-header {
    padding: var(--space-3) 14px;
    font-size: var(--text-base);
  }

  .tip-group {
    padding: 14px;
    border-right: none;
    border-bottom: 1px solid #f0f2f5;
  }

  .tip-group:last-child {
    border-bottom: none;
  }

  .tip-group-title {
    font-size: var(--text-base);
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
  }

  .tip-group-items {
    gap: var(--space-2);
  }

  .tip-item {
    font-size: var(--text-xs);
  }

  .tip-highlight {
    margin: var(--space-1) calc(var(--space-2) * -1);
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .info-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .info-value {
    text-align: left;
  }

  .path-value {
    max-width: 100%;
  }

  .toggle-row .info-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .card-footer {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

</style>
