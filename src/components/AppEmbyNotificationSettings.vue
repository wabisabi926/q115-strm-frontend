<template>
  <div class="emby-notification-page main-content-container">
    <PageHeader title="Emby通知配置" subtitle="配置 Emby 与 QMediaSync 的通知链接及鉴权" :icon="Bell" variant="list">
    </PageHeader>

    <div class="page-content">
      <el-card class="settings-card webhook-card" shadow="never">
        <el-form :model="notificationData" :label-position="isMobile ? 'top' : 'left'" :label-width="isMobile ? 'auto' : '160px'" class="emby-form">
          <el-form-item label="Emby通知链接">
            <el-input
              v-model="displayWebhookUrl"
              readonly
              class="limited-width-input webhook-input"
              :prefix-icon="Link"
            >
              <template #append>
                <el-button @click="copyWebhookUrl" :icon="DocumentCopy">复制</el-button>
              </template>
            </el-input>
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>将此链接配置到 Emby 的通知设置中</span>
            </div>
            <div class="form-help" v-if="notificationData.enable_auth && !selectedApiKeyId">
              <el-icon><WarningFilled /></el-icon>
              <span class="warning-text">已开启鉴权，但尚未选择 API Key，请在下方选择或创建一个 Key，然后将拼接后的完整 URL 复制到 Emby 后台。</span>
            </div>
            <div class="form-help" v-if="notificationData.enable_auth && selectedApiKeyId">
              <el-icon><WarningFilled /></el-icon>
              <span class="warning-text"
                >已开启鉴权，请确保复制上方完整 URL（已带 api_key 参数）到 Emby 通知链接配置中。示例：<code
                  class="inline-code"
                  >{{ displayWebhookUrl }}</code
                ></span
              >
            </div>
          </el-form-item>

          <el-form-item label="API Key 快速访问">
            <div class="api-key-row">
              <el-select
                v-model="selectedApiKeyId"
                placeholder="请选择 API Key"
                class="key-select"
                clearable
                @change="handleApiKeyChange"
                :loading="apiKeyLoading"
              >
                <el-option
                  v-for="k in activeApiKeys"
                  :key="k.id"
                  :value="k.id"
                  :label="`${k.name}（前缀 ${k.key_prefix}）`"
                />
              </el-select>
              <el-button type="primary" plain :icon="Plus" @click="openApiKeyCreateDialog" :loading="apiKeyCreating">
                新建 Key
              </el-button>
              <el-button :icon="Refresh" text @click="loadActiveApiKeys" :loading="apiKeyLoading">
                刷新列表
              </el-button>
            </div>
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>选中后，上方通知链接会自动拼接 <code class="inline-code">api_key</code> 参数；开启鉴权前请先选好 Key，并使用拼接后的完整 URL 去 Emby 后台配置。</span>
            </div>
          </el-form-item>

          <el-form-item label="通知链接鉴权" prop="enable_auth">
            <div class="switch-wrapper">
              <el-switch
                v-model="notificationData.enable_auth"
                :active-value="1"
                :inactive-value="0"
                :disabled="saving"
                active-color="#67c23a"
                inactive-color="#dcdfe6"
              />
              <span class="switch-label" :class="{ 'is-active': notificationData.enable_auth }">
                {{ notificationData.enable_auth ? '已启用鉴权' : '已禁用鉴权' }}
              </span>
            </div>
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>启用后，Emby 的 Webhook 请求需要携带 Api Key 才能生效。如果要在外网使用 Emby 通知链接建议启用以提高安全性。未创建可在上方直接「新建 Key」，或到<router-link
                to="/notification-settings/api-keys"
                class="help-link"
                >API Key 模块</router-link
              >管理。</span>
            </div>
          </el-form-item>

          <el-form-item label="播放通知显示剧情简介" prop="enable_playback_overview">
            <div class="switch-wrapper">
              <el-switch
                v-model="notificationData.enable_playback_overview"
                :active-value="1"
                :inactive-value="0"
                :disabled="saving"
                active-color="#67c23a"
                inactive-color="#dcdfe6"
              />
              <span class="switch-label" :class="{ 'is-active': notificationData.enable_playback_overview }">
                {{ notificationData.enable_playback_overview ? '已启用' : '已禁用' }}
              </span>
            </div>
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>启用后，Emby 播放通知中会显示当前播放内容的剧情简介</span>
            </div>
          </el-form-item>

          <el-form-item label="播放通知显示播放进度" prop="enable_playback_progress">
            <div class="switch-wrapper">
              <el-switch
                v-model="notificationData.enable_playback_progress"
                :active-value="1"
                :inactive-value="0"
                :disabled="saving"
                active-color="#67c23a"
                inactive-color="#dcdfe6"
              />
              <span class="switch-label" :class="{ 'is-active': notificationData.enable_playback_progress }">
                {{ notificationData.enable_playback_progress ? '已启用' : '已禁用' }}
              </span>
            </div>
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>启用后，Emby 播放通知中会显示当前播放进度信息</span>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="settings-card save-config-card" shadow="never">
        <div class="save-config-content" :class="{ 'save-config-content--mobile': isMobile }">
          <el-button
            type="primary"
            :icon="Check"
            @click="saveConfig"
            :loading="saving"
            :size="isMobile ? 'default' : 'large'"
            class="save-btn"
          >
            保存设置
          </el-button>
          <div class="save-help">保存以上所有修改，即时生效</div>
        </div>
      </el-card>

      <el-dialog
        v-model="apiKeyCreateDialogVisible"
        title="新建 API Key"
        :width="isMobile ? '90%' : '480px'"
        :close-on-click-modal="false"
      >
        <el-form :model="apiKeyCreateForm" :label-position="isMobile ? 'top' : 'left'" label-width="100px">
          <el-form-item label="名称" required>
            <el-input
              v-model="apiKeyCreateForm.name"
              placeholder="用于区分用途的名称，例如: Emby 通知鉴权"
              maxlength="60"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="apiKeyCreateDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="apiKeyCreating" @click="submitCreateApiKey">生成</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="apiKeyCreatedDialogVisible"
        title="请立即保存新密钥"
        :width="isMobile ? '90%' : '520px'"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <el-alert type="warning" show-icon :closable="false" class="created-warning">
          <template #title>只会显示一次，关闭后无法再次查看完整密钥。</template>
          <p class="alert-tip">
            调用接口或拼接在通知链接 URL 中时使用，例如 /emby/webhook?api_key=...
          </p>
        </el-alert>
        <div class="created-key-box" v-if="apiKeyCreated">
          <div class="key-row">
            <span class="key-label">完整密钥</span>
            <div class="key-value">
              <el-input v-model="apiKeyCreated.key" readonly />
              <el-button type="primary" plain :icon="DocumentCopy" @click="copyCreatedApiKey">复制</el-button>
            </div>
          </div>
          <div class="key-meta">
            <span>名称：{{ apiKeyCreated.name }}</span>
            <span>前缀：{{ apiKeyCreated.key_prefix }}</span>
          </div>
          <div class="key-row key-autofill-row">
            <el-checkbox v-model="autoFillApiKeyAfterCreate">
              关闭后自动选择该 Key 并填入上方通知链接
            </el-checkbox>
          </div>
        </div>
        <template #footer>
          <el-button type="primary" @click="closeCreatedApiKeyDialog">我已妥善保存</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue'
import { SERVER_URL } from '@/const'
import type { AxiosStatic } from 'axios'
import {
  Bell,
  Check,
  Link,
  Plus,
  Refresh,
  DocumentCopy,
  InfoFilled,
  WarningFilled,
} from '@element-plus/icons-vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { inject, onMounted, ref, reactive, computed } from 'vue'
import { isMobile as checkIsMobile } from '@/utils/deviceUtils'

const http: AxiosStatic | undefined = inject('$http')
const isMobile = ref(checkIsMobile())

const saving = ref(false)

const notificationData = reactive({
  emby_url: '',
  enable_auth: 0,
  enable_playback_overview: 0,
  enable_playback_progress: 0,
})

interface QuickApiKey {
  id: number
  name: string
  key_prefix: string
  last_used_at?: number | null
  created_at: number
  is_active: boolean
}
interface CreatedQuickApiKey extends QuickApiKey {
  key?: string
}
const activeApiKeys = ref<QuickApiKey[]>([])
const apiKeyLoading = ref(false)
const selectedApiKeyId = ref<number | null>(null)
const selectedApiKeyValue = ref<string>('')
const apiKeyCreateDialogVisible = ref(false)
const apiKeyCreatedDialogVisible = ref(false)
const apiKeyCreating = ref(false)
const autoFillApiKeyAfterCreate = ref(true)
const apiKeyCreateForm = reactive({ name: '' })
const apiKeyCreated = ref<CreatedQuickApiKey | null>(null)

const webhookUrl = ref('')
const updateWebhookUrl = () => {
  let baseUrl: string
  if (SERVER_URL === '/api') {
    baseUrl = window.location.origin
  } else {
    baseUrl = SERVER_URL.replace(/\/api$/, '')
  }
  webhookUrl.value = `${baseUrl}/emby/webhook`
}

const displayWebhookUrl = computed(() => {
  const base = webhookUrl.value || ''
  const keyToUse = selectedApiKeyValue.value || ''
  if (!keyToUse) return base
  if (!base) return ''
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}api_key=${encodeURIComponent(keyToUse)}`
})

const loadNotificationConfig = async () => {
  try {
    const res = await http?.get(`${SERVER_URL}/setting/emby-config`)
    if (res?.data.code === 200) {
      if (res.data.data?.exists && res.data.data?.config) {
        const d = res.data.data.config
        notificationData.emby_url = d.emby_url || ''
        notificationData.enable_auth = d.enable_auth ?? 0
        notificationData.enable_playback_overview = d.enable_playback_overview ?? 0
        notificationData.enable_playback_progress = d.enable_playback_progress ?? 0
      }
    }
  } catch (e) {
    console.error('加载 Emby 通知配置失败:', e)
  }
}

const saveConfig = async () => {
  try {
    saving.value = true
    // 先读取现有配置做字段合并，避免覆盖其他页的设置
    let existing: any = {}
    try {
      const readRes = await http?.get(`${SERVER_URL}/setting/emby-config`)
      if (readRes?.data.code === 200 && readRes.data.data?.exists && readRes.data.data?.config) {
        existing = readRes.data.data.config
      }
    } catch (_) {
      // 读取失败时按空对象合并，只提交当前页字段
    }
    const payload = {
      ...existing,
      enable_auth: notificationData.enable_auth,
      enable_playback_overview: notificationData.enable_playback_overview,
      enable_playback_progress: notificationData.enable_playback_progress,
    }
    const res = await http?.post(
      `${SERVER_URL}/setting/emby-config`,
      payload,
      { headers: { 'Content-Type': 'application/json' } },
    )
    if (res?.data.code === 200) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error(res?.data.message || '保存失败')
    }
  } catch (e) {
    console.error('保存 Emby 通知配置失败:', e)
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

const loadActiveApiKeys = async () => {
  try {
    apiKeyLoading.value = true
    const res = await http?.get(`${SERVER_URL}/api-keys`)
    if (res?.data.code === 200) {
      activeApiKeys.value = (res.data.data || []).filter((k: QuickApiKey) => k.is_active)
    } else {
      activeApiKeys.value = []
    }
  } catch (e) {
    console.error('加载 API Key 列表失败:', e)
    activeApiKeys.value = []
  } finally {
    apiKeyLoading.value = false
  }
}

const handleApiKeyChange = (val: number | null) => {
  if (val) {
    const found = activeApiKeys.value.find((k) => k.id === val)
    if (found) {
      selectedApiKeyValue.value = ''
    }
  } else {
    selectedApiKeyValue.value = ''
  }
}

const openApiKeyCreateDialog = () => {
  apiKeyCreateForm.name = ''
  autoFillApiKeyAfterCreate.value = true
  apiKeyCreateDialogVisible.value = true
}

const submitCreateApiKey = async () => {
  if (!apiKeyCreateForm.name.trim()) {
    ElMessage.warning('请输入 API Key 名称')
    return
  }
  try {
    apiKeyCreating.value = true
    const res = await http?.post(`${SERVER_URL}/api-keys`, {
      name: apiKeyCreateForm.name.trim(),
    })
    if (res?.data.code === 200) {
      apiKeyCreated.value = res.data.data
      apiKeyCreateDialogVisible.value = false
      apiKeyCreatedDialogVisible.value = true
      ElMessage.success('API Key 创建成功')
      await loadActiveApiKeys()
    } else {
      ElMessage.error(res?.data.message || '创建失败')
    }
  } catch (e) {
    console.error('创建 API Key 失败:', e)
    ElMessage.error('创建失败，请稍后重试')
  } finally {
    apiKeyCreating.value = false
  }
}

const copyCreatedApiKey = async () => {
  const content = apiKeyCreated.value?.key
  if (!content) return
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败，请手动复制')
  }
}

const closeCreatedApiKeyDialog = () => {
  if (apiKeyCreated.value && autoFillApiKeyAfterCreate.value && apiKeyCreated.value.key) {
    selectedApiKeyId.value = apiKeyCreated.value.id
    selectedApiKeyValue.value = apiKeyCreated.value.key
  }
  apiKeyCreatedDialogVisible.value = false
  apiKeyCreated.value = null
}

const copyWebhookUrl = async () => {
  const content = displayWebhookUrl.value
  if (!content) return
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败，请手动复制')
  }
}

onMounted(() => {
  updateWebhookUrl()
  loadNotificationConfig()
  loadActiveApiKeys()
})
</script>

<style scoped>
.emby-notification-page {
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5);
}

.settings-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.emby-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.limited-width-input {
  max-width: 600px;
}

.webhook-input {
  font-family: var(--font-mono, monospace);
}

.form-help {
  display: flex;
  align-items: flex-start;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  padding: var(--space-2) 0;
  line-height: 1.5;
}

.form-help .el-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.form-help.warning-text {
  color: var(--warning-500, #e6a23c);
}

.help-link {
  color: var(--brand-500);
  text-decoration: none;
}

.help-link:hover {
  text-decoration: underline;
}

.action-link {
  margin-left: var(--space-1);
}

.inline-code {
  background: var(--neutral-100, #f5f5f5);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-family: var(--font-mono, monospace);
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.switch-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.switch-label.is-active {
  color: var(--success-500, #67c23a);
  font-weight: var(--weight-medium);
}

.api-key-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.key-select {
  width: 320px;
  max-width: 100%;
  flex: 0 0 auto;
}

.created-warning {
  margin-bottom: var(--space-4);
}

.created-key-box {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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
  font-size: var(--text-sm);
}

.key-autofill-row {
  align-items: flex-start;
}

@media (max-width: 768px) {
  .page-content {
    padding: var(--space-3);
    gap: var(--space-4);
  }

  .settings-card {
    border-radius: var(--radius-md);
  }

  .emby-form {
    gap: var(--space-3);
  }

  .limited-width-input {
    max-width: 100%;
  }

  .form-help {
    flex-wrap: nowrap;
    line-height: 1.4;
  }

  .form-help span {
    word-break: break-word;
  }

  .api-key-row {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2);
  }

  .api-key-row .el-button {
    flex: 1 1 100%;
  }

  .key-select {
    width: 100%;
    flex: 1 1 100%;
  }

  .key-value {
    flex-direction: column;
    align-items: stretch;
  }

  .save-config-content {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2);
  }

  .save-btn {
    width: 100%;
    min-width: auto;
  }

  .save-help {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .page-content {
    padding: var(--space-2);
  }
}

.save-config-card {
  margin-top: var(--space-2);
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-elevated);
}

.save-config-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
}

.save-btn {
  min-width: 160px;
}

.save-help {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  padding-left: var(--space-1);
}
</style>
