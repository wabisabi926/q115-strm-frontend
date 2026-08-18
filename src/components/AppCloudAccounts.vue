<template>
  <div class="main-content-container main-content-container--list cloud-accounts-page">
    <PageHeader title="网盘账号管理" subtitle="管理网盘账号授权与绑定" :icon="Cloudy" variant="list">
      <template #toolbar>
        <div class="toolbar-right">
          <el-button
            type="primary"
            class="add-btn"
            :icon="Plus"
            @click="showAddAccountDialog = true"
          >
            <span class="btn-text">添加账号</span>
          </el-button>
        </div>
      </template>
    </PageHeader>
    <div class="stats-bar mobile-hidden">
        <div class="stat-item">
          <div class="stat-icon total">
            <el-icon>
              <User />
            </el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ accounts.length }}</span>
            <span class="stat-label">总账号数</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon authorized">
            <el-icon>
              <CircleCheck />
            </el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ authorizedCount }}</span>
            <span class="stat-label">已授权</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon unauthorized">
            <el-icon>
              <WarningFilled />
            </el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ unauthorizedCount }}</span>
            <span class="stat-label">未授权</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon failed">
            <el-icon>
              <CircleClose />
            </el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ failedCount }}</span>
            <span class="stat-label">授权失败</span>
          </div>
        </div>
      </div>

    <div class="accounts-content">
      <div class="accounts-grid" v-if="accounts.length > 0">
        <div
          class="account-card"
          v-for="account in accounts"
          :key="account.id"
          :class="getCardStatusClass(account)"
        >
          <div class="card-status-bar" :class="getStatusClass(account)"></div>
          <div class="card-main">
            <div class="card-header">
              <div class="card-title-wrapper">
                <el-tooltip :content="'账号 ID：' + account.id" placement="bottom">
                  <span class="card-id">#{{ account.id }}</span>
                </el-tooltip>
                <span class="card-name">{{ account.name }}</span>
              </div>
              <el-tag
                :type="sourceTypeTagMap[account.source_type]"
                class="source-tag"
                effect="light"
              >
                {{ sourceTypeMap[account.source_type] }}
              </el-tag>
            </div>

            <div class="card-body">
              <div
                class="info-row"
                v-for="appInfo in account.source_type === '115' ? getV115AppInfoRows(account) : []"
                :key="appInfo.label"
              >
                <div class="info-icon">
                  <el-icon>
                    <Key />
                  </el-icon>
                </div>
                <div class="info-content">
                  <span class="info-label">{{ appInfo.label }}</span>
                  <span class="info-value">{{ appInfo.value }}</span>
                </div>
              </div>

              <template v-if="account.source_type === 'openlist'">
                <div class="info-row">
                  <div class="info-icon">
                    <el-icon>
                      <Link />
                    </el-icon>
                  </div>
                  <div class="info-content">
                    <span class="info-label">访问地址</span>
                    <span class="info-value path-value">{{ account.base_url }}</span>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-icon">
                    <el-icon>
                      <Postcard />
                    </el-icon>
                  </div>
                  <div class="info-content">
                    <span class="info-label">用户 ID</span>
                    <span class="info-value">{{ account.user_id || '-' }}</span>
                  </div>
                </div>
              </template>

              <div class="info-row">
                <div class="info-icon">
                  <el-icon>
                    <Calendar />
                  </el-icon>
                </div>
                <div class="info-content">
                  <span class="info-label">添加时间</span>
                  <span class="info-value">{{ formatTimestamp(account.created_at) }}</span>
                </div>
              </div>

              <template
                v-if="
                  (account.source_type === '115' || account.source_type === 'baidupan') &&
                  account.token
                "
              >
                <div class="status-divider"></div>
                <div class="disk-status-section">
                  <div class="status-header">
                    <span class="status-title">网盘状态</span>
                    <el-button
                      type="primary"
                      size="small"
                      text
                      :icon="RefreshRight"
                      :loading="account.statusLoading"
                      @click="loadAccountStatus(account)"
                    >
                      刷新
                    </el-button>
                  </div>
                  <template v-if="account.status">
                    <div class="info-row" v-if="account.status.member_level">
                      <div class="info-icon member-icon">
                        <el-icon>
                          <Postcard />
                        </el-icon>
                      </div>
                      <div class="info-content">
                        <span class="info-label">用户 ID</span>
                        <span class="info-value">{{ account.user_id }}</span>
                      </div>
                    </div>
                    <div class="info-row" v-if="account.status.member_level">
                      <div class="info-icon member-icon">
                        <el-icon>
                          <Postcard />
                        </el-icon>
                      </div>
                      <div class="info-content">
                        <span class="info-label">用户名</span>
                        <span class="info-value">{{ account.username }}</span>
                      </div>
                    </div>
                    <div class="info-row space-row">
                      <div class="info-icon space-icon">
                        <el-icon>
                          <Cloudy />
                        </el-icon>
                      </div>
                      <div class="info-content space-content">
                        <span class="info-label">空间使用</span>
                        <div class="space-info">
                          <el-progress
                            style="width: 80%"
                            :percentage="
                              account.status.total_space > 0
                                ? Math.round(
                                    (account.status.used_space / account.status.total_space) * 100,
                                  )
                                : 0
                            "
                            :stroke-width="10"
                            :show-text="false"
                            :color="
                              getSpaceColor(account.status.used_space, account.status.total_space)
                            "
                          />
                          <span class="space-text"
                            >{{ formatFileSize(account.status.used_space) }} /
                            {{ formatFileSize(account.status.total_space) }}</span
                          >
                        </div>
                      </div>
                    </div>
                    <div class="info-row" v-if="account.status.member_level">
                      <div class="info-icon member-icon">
                        <el-icon>
                          <Postcard />
                        </el-icon>
                      </div>
                      <div class="info-content">
                        <span class="info-label">会员等级</span>
                        <el-tag size="small" type="warning" effect="plain">{{
                          account.status.member_level
                        }}</el-tag>
                      </div>
                    </div>
                    <div
                      class="info-row"
                      v-if="
                        account.status.expire_time &&
                        account.status.expire_time !== '0001-01-01T00:00:00Z'
                      "
                    >
                      <div class="info-icon expire-icon">
                        <el-icon>
                          <Calendar />
                        </el-icon>
                      </div>
                      <div class="info-content">
                        <span class="info-label">到期时间</span>
                        <span
                          class="info-value"
                          :class="{ 'expire-warning': isExpiringSoon(account.status.expire_time) }"
                        >
                          {{ formatExpireTime(account.status.expire_time) }}
                        </span>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="!account.statusLoading">
                    <div class="no-status">暂无状态信息</div>
                  </template>
                </div>
              </template>

              <div class="status-row">
                <div class="status-indicator" :class="getStatusClass(account)">
                  <el-icon v-if="account.token_failed_reason && !account.token">
                    <CircleClose />
                  </el-icon>
                  <el-icon v-else-if="account.token">
                    <CircleCheck />
                  </el-icon>
                  <el-icon v-else>
                    <WarningFilled />
                  </el-icon>
                  <span>{{ getStatusText(account) }}</span>
                </div>
                <el-tooltip
                  v-if="account.token_failed_reason && !account.token"
                  :content="account.token_failed_reason"
                  placement="top"
                >
                  <el-icon class="error-help-icon">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </div>
            </div>

            <div class="card-footer">
              <el-button
                type="danger"
                size="small"
                plain
                :icon="Delete"
                @click="handleDelete(account)"
              >
                删除
              </el-button>

              <el-button
                type="warning"
                size="small"
                plain
                :icon="Key"
                @click="handleAuthorize(account)"
                v-if="account.source_type !== 'openlist'"
              >
                授权
              </el-button>

              <el-button
                type="primary"
                size="small"
                plain
                :icon="Edit"
                @click="handleEdit(account)"
              >
                编辑
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else-if="!loading">
        <div class="empty-illustration">
          <el-icon class="empty-icon">
            <Cloudy />
          </el-icon>
          <div class="empty-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <h3 class="empty-title">暂无网盘账号</h3>
        <p class="empty-description">点击上方按钮添加第一个网盘账号</p>
      </div>

      <div class="loading-state" v-if="loading">
        <el-icon class="loading-icon rotating">
          <Loading />
        </el-icon>
        <span>加载中…</span>
      </div>

      <div class="page-footer-tips">
        <div class="tips-header">
          <el-icon class="tips-icon">
            <InfoFilled />
          </el-icon>
          <span>使用说明</span>
        </div>
        <div class="tips-content">
          <div class="tip-group">
            <div class="tip-group-title">
              <el-icon>
                <Warning />
              </el-icon>
              <span>操作流程</span>
            </div>
            <div class="tip-group-items">
              <div class="tip-item">
                <span class="tip-bullet">1.</span>
                <span>点击"添加账号"，选择网盘类型并填写相关信息</span>
              </div>
              <div class="tip-item">
                <span class="tip-bullet">2.</span>
                <span>添加成功后，点击列表中的"授权"完成账号绑定</span>
              </div>
              <div class="tip-item tip-highlight">
                <span class="tip-bullet">★</span>
                <span>只有已授权的账号才能用于 STRM 同步目录配置</span>
              </div>
            </div>
          </div>
          <div class="tip-group">
            <div class="tip-group-title">
              <el-icon>
                <Key />
              </el-icon>
              <span>授权说明</span>
            </div>
            <div class="tip-group-items">
              <div class="tip-item">
                <span class="tip-bullet">•</span>
                <span>115 网盘：支持扫码授权和网页授权两种方式</span>
              </div>
              <div class="tip-item">
                <span class="tip-bullet">•</span>
                <span>百度网盘：通过 OAuth 授权，将跳转到授权页面</span>
              </div>
              <div class="tip-item">
                <span class="tip-bullet">•</span>
                <span>OpenList：支持用户名密码或令牌两种认证方式</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <el-dialog v-model="showAddAccountDialog" title="添加账号" :width="isMobile ? '90%' : '500px'">
    <el-form :model="newAccountForm" label-width="120px">
      <el-form-item label="网盘类型">
        <el-select v-model="newAccountForm.type" placeholder="请选择网盘类型">
          <template v-for="typeItem in sourceTypeOptions" :key="typeItem.value">
            <el-option
              v-if="typeItem.value !== 'local'"
              :label="typeItem.label"
              :value="typeItem.value"
            ></el-option>
          </template>
        </el-select>
      </el-form-item>
      <el-form-item label="账号备注" v-if="newAccountForm.type !== 'openlist'">
        <el-input v-model="newAccountForm.name" placeholder="请输入账号备注" />
      </el-form-item>
      <el-form-item label="访问地址" v-if="newAccountForm.type === 'openlist'">
        <el-input
          v-model="newAccountForm.base_url"
          placeholder="请输入 OpenList 地址：http://ip:5244"
        />
      </el-form-item>
      <el-form-item label="认证方式" v-if="newAccountForm.type === 'openlist'">
        <el-select v-model="newAccountForm.auth_type" placeholder="请选择认证方式">
          <el-option label="用户名密码" value="password"></el-option>
          <el-option label="令牌" value="token"></el-option>
        </el-select>
      </el-form-item>
      <template
        v-if="newAccountForm.type === 'openlist' && newAccountForm.auth_type === 'password'"
      >
        <el-form-item label="用户名">
          <el-input v-model="newAccountForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="newAccountForm.password" placeholder="请输入密码" />
        </el-form-item>
      </template>
      <el-form-item
        label="令牌"
        v-if="newAccountForm.type === 'openlist' && newAccountForm.auth_type === 'token'"
      >
        <el-input type="password" v-model="newAccountForm.token" placeholder="请输入令牌" />
      </el-form-item>
      <V115AppSelector
        v-if="newAccountForm.type === '115'"
        v-model:auth-mode="newAccountForm.auth_mode"
        v-model:selected-qr-app="newAccountForm.selected_qr_app"
        v-model:selected-web-provider="newAccountForm.selected_web_provider"
        v-model:custom-app-id="newAccountForm.custom_v115_app_id"
        v-model:custom-app-name="newAccountForm.custom_v115_app_name"
      />
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showAddAccountDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddAccount" :loading="addAccountLoading"
          >确定</el-button
        >
      </span>
    </template>
  </el-dialog>

  <el-dialog
    v-model="showEditAccountDialog"
    :title="editDialogTitle"
    :width="isMobile ? '90%' : '500px'"
  >
    <el-form :model="editAccountForm" label-width="100px">
      <el-form-item label="账号备注">
        <el-input v-model="editAccountForm.name" placeholder="请输入账号备注" />
      </el-form-item>
      <template v-if="canEditCustomAppName">
        <el-form-item label="应用名">
          <el-input
            v-model="editAccountForm.app_id_name"
            placeholder="请输入应用名，可留空"
            clearable
          />
        </el-form-item>
        <el-form-item label="APP ID">
          <el-input v-model="editAccountForm.app_id" disabled />
        </el-form-item>
      </template>
      <template v-if="editAccountForm.source_type === 'openlist'">
        <el-form-item label="访问地址" prop="baseUrl">
          <el-input
            v-model="editAccountForm.base_url"
            placeholder="请输入 OpenList 地址：http://ip:5244"
          />
        </el-form-item>
        <el-form-item label="认证方式">
          <el-select v-model="editAccountForm.auth_type" placeholder="请选择认证方式">
            <el-option label="用户名密码" value="password"></el-option>
            <el-option label="令牌" value="token"></el-option>
          </el-select>
        </el-form-item>
        <template v-if="editAccountForm.auth_type === 'password'">
          <el-form-item label="用户名">
            <el-input v-model="editAccountForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              type="password"
              v-model="editAccountForm.password"
              placeholder="请输入密码（留空则不修改）"
            />
          </el-form-item>
        </template>
        <el-form-item label="令牌" v-if="editAccountForm.auth_type === 'token'">
          <el-input type="password" v-model="editAccountForm.token" placeholder="请输入令牌" />
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showEditAccountDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateAccount">确定</el-button>
      </span>
    </template>
  </el-dialog>

  <V115AuthorizationDialog
    v-model:visible="showV115AuthDialog"
    :account-id="selectedV115Account?.id ?? null"
    :account-name="selectedV115Account?.name ?? ''"
    @confirmed="loadAccounts"
  />
</template>

<script setup lang="ts">
import { SERVER_URL } from '@/const'
import V115AuthorizationDialog from '@/components/cloud-auth/V115AuthorizationDialog.vue'
import V115AppSelector from '@/components/cloud-auth/V115AppSelector.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import type { AxiosError, AxiosStatic } from 'axios'
import { inject, ref, computed, onMounted, onUnmounted } from 'vue'

import {
  WarningFilled,
  Plus,
  Loading,
  User,
  Key,
  Link,
  Calendar,
  Delete,
  Edit,
  Cloudy,
  CircleCheck,
  CircleClose,
  InfoFilled,
  QuestionFilled,
  Postcard,
  RefreshRight,
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { formatTimestamp } from '@/utils/timeUtils'
import { sourceTypeMap, sourceTypeOptions, sourceTypeTagMap } from '@/utils/sourceTypeUtils'
import { isMobile as checkIsMobile, onDeviceTypeChange } from '@/utils/deviceUtils'
import {
  buildV115CreatePayload,
  defaultWebAuthProviderValue,
  getV115AuthAction,
  type V115AuthMode,
  type V115AuthProvider,
  type V115AuthSourceType,
  type V115SelectedQrApp,
  type V115WebAuthProviderValue,
} from '@/components/cloud-auth/v115AuthSources'

const isMobile = ref(checkIsMobile())

interface CloudDiskStatus {
  user_id: string
  username: string
  used_space: number
  total_space: number
  member_level: string
  expire_time: string
}

interface CloudAccount {
  id: number
  source_type: string
  name: string
  user_id: string
  username: string
  password: string
  base_url: string
  created_at: number
  token: string
  auth_type?: string
  app_id_name?: string
  app_name?: string
  display_name?: string
  app_id?: string
  auth_source_type?: V115AuthSourceType
  auth_provider?: V115AuthProvider
  requires_encryption_key?: boolean
  token_failed_reason?: string
  status?: CloudDiskStatus
  statusLoading?: boolean
}

interface V115OAuthURLData {
  auth_url?: string
  state?: string
  polling?: boolean
}

const http: AxiosStatic | undefined = inject('$http')

const accounts = ref<CloudAccount[]>([])
const loading = ref(false)
const showAddAccountDialog = ref(false)
const addAccountLoading = ref(false)

const newAccountForm = ref({
  type: '',
  name: '',
  base_url: '',
  username: '',
  password: '',
  token: '',
  auth_type: 'password',
  auth_mode: 'qr' as V115AuthMode,
  selected_qr_app: { appId: '100197849', appName: 'QMediaSync' } as V115SelectedQrApp,
  selected_web_provider: defaultWebAuthProviderValue as V115WebAuthProviderValue,
  custom_v115_app_id: '',
  custom_v115_app_name: '',
})

const showEditAccountDialog = ref(false)
const currentEditAccount = ref<CloudAccount | null>(null)
const editAccountForm = ref({
  id: 0,
  source_type: '',
  base_url: '',
  username: '',
  password: '',
  token: '',
  auth_type: 'password',
  token_failed_reason: '',
  name: '',
  app_id: '',
  app_id_name: '',
})

const selectedAccountId = ref<number | undefined>(undefined)
const show123AuthDialog = ref(false)
const selectedV115Account = ref<CloudAccount | null>(null)
const showV115AuthDialog = ref(false)

const authorizedCount = computed(
  () => accounts.value.filter((a) => a.token && !a.token_failed_reason).length,
)
const unauthorizedCount = computed(
  () => accounts.value.filter((a) => !a.token && !a.token_failed_reason).length,
)
const failedCount = computed(
  () => accounts.value.filter((a) => a.token_failed_reason && !a.token).length,
)
const editDialogTitle = computed(() =>
  editAccountForm.value.source_type === 'openlist' ? '编辑 OpenList 账号' : '编辑账号',
)
const canEditCustomAppName = computed(() => {
  return (
    editAccountForm.value.source_type === '115' &&
    editAccountForm.value.app_id &&
    !['100197849', '100197665', '100197847', '100197303', '100195313', '100195125'].includes(editAccountForm.value.app_id)
  )
})

let removeDeviceTypeListener: (() => void) | null = null

const getStatusClass = (account: CloudAccount) => {
  if (account.token_failed_reason && !account.token) return 'status-failed'
  if (account.token) return 'status-authorized'
  return 'status-unauthorized'
}

const getStatusText = (account: CloudAccount) => {
  if (account.token_failed_reason && !account.token) return '授权失败'
  if (account.token) return '已授权'
  return '未授权'
}

const getCardStatusClass = (account: CloudAccount) => {
  if (account.token_failed_reason && !account.token) return 'is-failed'
  if (account.token) return 'is-authorized'
  return 'is-unauthorized'
}

const getV115AppInfoRows = (account: CloudAccount) => {
  const rows: { label: string; value: string }[] = []
  if (account.app_id_name) {
    rows.push({ label: '应用名', value: account.app_id_name })
  }
  if (account.app_id) {
    rows.push({ label: 'APP ID', value: account.app_id })
  }
  if (account.auth_source_type) {
    const typeMap: Record<string, string> = {
      built_in_appid: '内置 APP ID',
      built_in_relay: '内置中继',
      third_party_service: '第三方服务',
      custom_appid: '自定义 APP ID',
    }
    rows.push({ label: '授权类型', value: typeMap[account.auth_source_type] || account.auth_source_type })
  }
  return rows
}

const loadAccounts = async () => {
  try {
    loading.value = true
    const response = await http?.get(`${SERVER_URL}/account/list`)

    if (response?.data.code === 200) {
      const data = response.data.data
      accounts.value = data.map((item: CloudAccount) => ({
        id: item.id,
        source_type: item.source_type,
        name: item.name,
        user_id: item.user_id,
        username: item.username,
        created_at: item.created_at,
        token: item.token,
        base_url: item.base_url,
        password: item.password,
        auth_type: item.auth_type,
        app_id_name: item.app_id_name,
        app_name: item.app_name,
        display_name: item.display_name,
        app_id: item.app_id,
        auth_source_type: item.auth_source_type,
        auth_provider: item.auth_provider,
        requires_encryption_key: item.requires_encryption_key,
        token_failed_reason: item.token_failed_reason || '',
        status: undefined,
        statusLoading: false,
      }))
      accounts.value.forEach((account) => {
        if (
          (account.source_type === '115' || account.source_type === 'baidupan') &&
          account.token
        ) {
          loadAccountStatus(account)
        }
      })
    } else {
      console.error('加载账号列表失败：', response?.data.message || '未知错误')
      accounts.value = []
    }
  } catch (error) {
    console.error('加载账号列表失败：', error)
    accounts.value = []
  } finally {
    loading.value = false
  }
}

const loadAccountStatus = async (account: CloudAccount) => {
  const index = accounts.value.findIndex((a) => a.id === account.id)
  if (index === -1) return

  accounts.value[index].statusLoading = true

  try {
    let url = ''
    if (account.source_type === '115') {
      url = `${SERVER_URL}/115/status`
    } else if (account.source_type === 'baidupan') {
      url = `${SERVER_URL}/baidupan/status`
    } else {
      return
    }

    const response = await http?.get(url, {
      params: { account_id: account.id },
    })

    if (response?.data.code === 200 && response.data.data) {
      accounts.value[index].status = response.data.data
    }
  } catch (error) {
    console.error(`获取 ${account.source_type} 状态失败：`, error)
  } finally {
    accounts.value[index].statusLoading = false
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

const formatExpireTime = (expireTime: string): string => {
  if (
    !expireTime ||
    expireTime === '0001-01-01T00:00:00Z' ||
    expireTime === '1970-01-01T00:00:00Z'
  ) {
    return '-'
  }
  try {
    const date = new Date(expireTime)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return '-'
  }
}

const getSpaceColor = (used: number, total: number): string => {
  if (total === 0) return 'var(--success)'
  const percentage = used / total
  if (percentage < 0.5) return 'var(--success)'
  if (percentage < 0.8) return 'var(--warning)'
  return 'var(--danger)'
}

const isExpiringSoon = (expireTime: string): boolean => {
  if (!expireTime) return false
  try {
    const date = new Date(expireTime)
    if (isNaN(date.getTime())) return false
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30
  } catch {
    return false
  }
}

const handleDelete = async (row: CloudAccount) => {
  try {
    await ElMessageBox.confirm(`确定要删除账号 "${row.name}" 吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const response = await http?.post(
      `${SERVER_URL}/account/delete`,
      { id: row.id },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (response?.data.code === 200) {
      ElMessage.success('账号删除成功')
      loadAccounts()
    } else {
      ElMessage.error(response?.data.message || '删除账号失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除账号失败：', error)
      ElMessage.error('删除账号失败')
    }
  }
}

const handleEdit = (account: CloudAccount) => {
  currentEditAccount.value = account

  const authType =
    account.auth_type || (account.username && account.password ? 'password' : 'token')

  editAccountForm.value = {
    id: account.id,
    source_type: account.source_type,
    name: account.name,
    base_url: account.base_url,
    username: account.username,
    password: account.password || '',
    token: account.token || '',
    auth_type: authType,
    token_failed_reason: account.token_failed_reason || '',
    app_id: account.app_id || '',
    app_id_name: account.app_id_name || '',
  }
  showEditAccountDialog.value = true
}

const hasOpenListConfigChanged = (): boolean => {
  const original = currentEditAccount.value
  if (!original || editAccountForm.value.source_type !== 'openlist') {
    return false
  }
  return (
    editAccountForm.value.base_url !== original.base_url ||
    editAccountForm.value.auth_type !== original.auth_type ||
    editAccountForm.value.username !== original.username ||
    editAccountForm.value.token !== (original.token || '') ||
    editAccountForm.value.password !== ''
  )
}

const handleUpdateAccount = async () => {
  try {
    if (hasOpenListConfigChanged()) {
      const openListRequestData = {
        id: editAccountForm.value.id,
        base_url: editAccountForm.value.base_url,
        auth_type: editAccountForm.value.auth_type,
        ...(editAccountForm.value.auth_type === 'token'
          ? { token: editAccountForm.value.token }
          : {
              username: editAccountForm.value.username,
              password: editAccountForm.value.password,
            }),
      }

      const openListResponse = await http?.post(
        `${SERVER_URL}/account/openlist`,
        openListRequestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (openListResponse?.data.code !== 200) {
        console.error('更新 OpenList 账号失败：', openListResponse?.data.message || '未知错误')
        ElMessage.error(openListResponse?.data.message || '更新账号失败')
        return
      }
    }

    const response = await http?.post(
      `${SERVER_URL}/account/update`,
      {
        id: editAccountForm.value.id,
        name: editAccountForm.value.name,
        app_id_name: editAccountForm.value.app_id_name,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (response?.data.code === 200) {
      showEditAccountDialog.value = false
      loadAccounts()
      ElMessage.success('账号更新成功')
    } else {
      console.error('更新账号失败：', response?.data.message || '未知错误')
      ElMessage.error(response?.data.message || '更新账号失败')
    }
  } catch (error) {
    console.error('更新账号错误：', error)
    ElMessage.error('更新账号失败')
  }
}

const handleAuthorize = (row: CloudAccount) => {
  if (row.source_type === '115') {
    const action = getV115AuthAction(row)
    if (action === 'pkce') {
      selectedV115Account.value = row
      showV115AuthDialog.value = true
      return
    }
    if (action === 'oauth') {
      void handle115OAuth(row.id)
      return
    }
    ElMessage.error('不支持的 115 开放平台应用')
    return
  }
  if (row.source_type === '123') {
    selectedAccountId.value = row.id
    show123AuthDialog.value = true
    return
  }
  if (row.source_type === 'baidupan') {
    void handleBaiduOAuth(row.id)
  }
}

const handle115OAuth = async (accountId?: number) => {
  try {
    await ElMessageBox.confirm(
      '即将跳转到 115 网盘授权页面，请在新页面完成授权后返回本页面。',
      '授权提示',
      {
        confirmButtonText: '前往授权',
        cancelButtonText: '取消',
        type: 'info',
      },
    )

    const redirectUrl = window.location.href.split('?')[0]
    const response = await http?.get(`${SERVER_URL}/115/oauth-url`, {
      params: {
        account_id: accountId,
        redirect_url: redirectUrl,
      },
    })

    if (response?.data.code === 200 && response.data.data) {
      const data = response.data.data as V115OAuthURLData | string
      if (typeof data === 'string') {
        window.location.href = data
        return
      }
      if (data.polling && data.state) {
        if (data.auth_url) {
          window.open(data.auth_url, '_blank', 'noopener,noreferrer')
        }
        poll115OAuthStatus(accountId, data.state)
        return
      }
      if (data.auth_url) {
        window.location.href = data.auth_url
        return
      }
      ElMessage.error('授权服务未返回授权地址')
    } else {
      ElMessage.error(response?.data.message || '获取授权地址失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('115 OAuth 授权错误：', error)
      ElMessage.error('获取授权地址失败')
    }
  }
}

const poll115OAuthStatus = (accountId: number | undefined, state: string) => {
  if (!accountId) return
  let retries = 0
  const maxRetries = 60
  const timer = window.setInterval(async () => {
    retries += 1
    try {
      const response = await http?.get(`${SERVER_URL}/115/oauth-status`, {
        params: { account_id: accountId, state },
      })
      if (response?.data.code === 200 && response.data.data?.done) {
        window.clearInterval(timer)
        ElMessage.success('授权成功')
        await loadAccounts()
        return
      }
      if (response?.data.code !== 200) {
        window.clearInterval(timer)
        ElMessage.error(response?.data.message || '授权状态查询失败')
        return
      }
      if (retries >= maxRetries) {
        window.clearInterval(timer)
        ElMessage.error('授权等待超时')
      }
    } catch (error) {
      window.clearInterval(timer)
      console.error('115 OAuth 状态查询错误：', error)
      ElMessage.error('授权状态查询失败')
    }
  }, 3000)
}

const handleBaiduOAuth = async (accountId?: number) => {
  try {
    await ElMessageBox.confirm(
      '即将跳转到百度网盘授权页面，请在新页面完成授权后返回本页面。',
      '授权提示',
      {
        confirmButtonText: '前往授权',
        cancelButtonText: '取消',
        type: 'info',
      },
    )

    const redirectUrl = window.location.href.split('?')[0]
    const response = await http?.get(`${SERVER_URL}/baidupan/oauth-url`, {
      params: {
        account_id: accountId,
        redirect_url: redirectUrl,
      },
    })

    if (response?.data.code === 200 && response.data.data) {
      window.location.href = response.data.data
    } else {
      ElMessage.error(response?.data.message || '获取授权地址失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('百度网盘 OAuth 授权错误：', error)
      ElMessage.error('获取授权地址失败')
    }
  }
}

const resetForm = () => {
  newAccountForm.value = {
    type: '',
    name: '',
    base_url: '',
    username: '',
    password: '',
    token: '',
    auth_type: 'password',
    auth_mode: 'qr',
    selected_qr_app: { appId: '100197849', appName: 'QMediaSync' },
    selected_web_provider: defaultWebAuthProviderValue,
    custom_v115_app_id: '',
    custom_v115_app_name: '',
  }
}

const getAddAccountValidationMessage = (): string | null => {
  const form = newAccountForm.value
  const sourceType = form.type.trim()
  if (!sourceType) {
    return '请先选择网盘类型'
  }

  if (sourceType === 'openlist') {
    if (!form.base_url.trim()) {
      return '请先填写 OpenList 访问地址'
    }
    if (form.auth_type === 'token') {
      return form.token.trim() ? null : '请先填写 OpenList 令牌'
    }
    if (!form.username.trim()) {
      return '请先填写 OpenList 用户名'
    }
    if (!form.password.trim()) {
      return '请先填写 OpenList 密码'
    }
    return null
  }

  const accountName = form.name.trim()
  if (!accountName) {
    return '请先填写账号备注'
  }
  if (Array.from(accountName).length > 64) {
    return '账号备注不能超过 64 个字符'
  }
  return null
}

const handleAddAccount = async () => {
  try {
    const validationMessage = getAddAccountValidationMessage()
    if (validationMessage) {
      ElMessage.warning(validationMessage)
      return
    }

    const data: Record<string, string | number> = {
      source_type: newAccountForm.value.type,
      name: newAccountForm.value.name,
    }
    let url = `${SERVER_URL}/account/add`
    if (newAccountForm.value.type === '115') {
      Object.assign(data, {
        ...buildV115CreatePayload({
          authMode: newAccountForm.value.auth_mode,
          selectedQrApp: newAccountForm.value.selected_qr_app,
          selectedWebProvider: newAccountForm.value.selected_web_provider,
          customAppId: newAccountForm.value.custom_v115_app_id,
          customAppName: newAccountForm.value.custom_v115_app_name,
        }),
      })
    } else if (newAccountForm.value.type === 'openlist') {
      url = `${SERVER_URL}/account/openlist`
      Object.assign(data, {
        base_url: newAccountForm.value.base_url,
        auth_type: newAccountForm.value.auth_type,
      })
      if (newAccountForm.value.auth_type === 'token') {
        data.token = newAccountForm.value.token
      } else {
        data.username = newAccountForm.value.username
        data.password = newAccountForm.value.password
      }
    }

    const response = await http?.post(url, data)

    if (response?.data.code === 200) {
      ElMessage.success('添加账号成功')
      showAddAccountDialog.value = false
      loadAccounts()
      resetForm()
    } else {
      ElMessage.error(`添加账号失败：${response?.data.message || '未知错误'}`)
    }
  } catch (error) {
    console.error('添加账号失败：', error)
    const err: AxiosError = error as AxiosError
    const errData = err.response?.data as { message?: string }
    const status = err.response?.status || err.status
    const message = status
      ? `HTTP ${status}，${errData.message || err.message}`
      : errData.message || err.message
    ElMessage.error(`添加账号失败：${message}`)
  }
}

const confirmOAuth = async (
  source: string,
  accountId: number,
  tokenData: string,
  payload: Record<string, string> = {},
): Promise<void> => {
  try {
    let url = ''
    if (source === '' || source === '115') {
      url = `${SERVER_URL}/115/oauth-confirm`
    } else if (source === 'baidupan') {
      url = `${SERVER_URL}/baidupan/oauth-confirm`
    } else {
      return
    }

    const response = await http?.post(
      url,
      {
        account_id: accountId,
        ...(tokenData ? { data: tokenData } : { payload }),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (response?.data.code === 200) {
      ElMessage.success({ message: '授权成功，2 秒后将自动刷新页面', duration: 2000 })
      setTimeout(() => {
        const hash = window.location.hash
        const cleanHash = hash.split('?')[0]
        window.location.href = window.location.origin + cleanHash
      }, 2000)
    } else {
      ElMessage.error(response?.data.message || '授权确认失败')
    }
  } catch (error) {
    console.error('OAuth 确认错误：', error)
    ElMessage.error('授权确认失败')
  }
}

const collectOAuthCallbackParams = (search: string, hash: string): URLSearchParams => {
  const params = new URLSearchParams()
  if (search) {
    const parsed = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    parsed.forEach((value, key) => params.set(key, value))
  }
  const hashQueryIndex = hash.indexOf('?')
  if (hashQueryIndex >= 0) {
    const parsed = new URLSearchParams(hash.substring(hashQueryIndex))
    parsed.forEach((value, key) => params.set(key, value))
  }
  return params
}

const checkOAuthCallback = async () => {
  const urlParams = collectOAuthCallbackParams(window.location.search, window.location.hash)
  const accountId = urlParams.get('account_id')
  const tokenData = urlParams.get('token_data')
  const source = urlParams.get('source') || '115'

  if (accountId && (tokenData || urlParams.get('access_token') || urlParams.get('state'))) {
    const payload = Object.fromEntries(urlParams.entries())
    await confirmOAuth(source, parseInt(accountId), tokenData || '', payload)
  }
}

onMounted(() => {
  checkOAuthCallback()
  loadAccounts()
  removeDeviceTypeListener = onDeviceTypeChange((newIsMobile) => {
    isMobile.value = newIsMobile
  })
})

onUnmounted(() => {
  if (removeDeviceTypeListener) {
    removeDeviceTypeListener()
  }
})
</script>

<style scoped>
.cloud-accounts-page {
  min-height: 100%;
  background: var(--color-bg-muted);
  padding: 0;
}

.add-btn {
  background: var(--brand-500) !important;
  border-color: var(--brand-500) !important;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.add-btn:hover {
  background: var(--brand-600) !important;
  border-color: var(--brand-600) !important;
}

.stats-bar {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
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

.stat-icon.authorized {
  background: var(--success-bg);
  color: var(--success);
}

.stat-icon.unauthorized {
  background: var(--warning-bg);
  color: var(--warning);
}

.stat-icon.failed {
  background: var(--danger-bg);
  color: var(--danger);
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

.accounts-content {
  padding: var(--space-6);
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.account-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  position: relative;
}

.account-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.account-card.is-authorized {
  box-shadow: 0 2px 12px rgba(103, 194, 58, 0.2);
}

.account-card.is-authorized:hover {
  box-shadow: 0 8px 24px rgba(103, 194, 58, 0.3);
}

.account-card.is-unauthorized {
  box-shadow: 0 2px 12px rgba(230, 162, 60, 0.2);
}

.account-card.is-unauthorized:hover {
  box-shadow: 0 8px 24px rgba(230, 162, 60, 0.3);
}

.account-card.is-failed {
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.2);
}

.account-card.is-failed:hover {
  box-shadow: 0 8px 24px rgba(245, 108, 108, 0.3);
}

.card-status-bar {
  height: 4px;
  background: var(--neutral-200);
}

.card-status-bar.status-authorized {
  background: var(--gradient-success);
}

.card-status-bar.status-unauthorized {
  background: var(--gradient-warning);
}

.card-status-bar.status-failed {
  background: var(--gradient-danger);
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
  border-bottom: 1px solid var(--color-border-subtle);
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

.card-name {
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
  align-items: center;
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
}

.info-value {
  font-size: var(--text-base);
  color: var(--color-text-primary);
  text-align: right;
}

.path-value {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: var(--text-xs);
  word-break: break-all;
  max-width: 200px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border-subtle);
}

.status-divider {
  height: 1px;
  background: var(--color-border-subtle);
  margin: var(--space-2) 0;
}

.disk-status-section {
  background: var(--color-bg-muted);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  margin-top: var(--space-1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.status-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
}

.no-status {
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  padding: var(--space-2) 0;
}

.space-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  flex: 1;
}

.space-text {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.expire-warning {
  color: var(--danger);
  font-weight: var(--weight-medium);
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

.status-indicator.status-authorized {
  background: var(--success-bg);
  color: var(--success);
}

.status-indicator.status-unauthorized {
  background: var(--warning-bg);
  color: var(--warning);
}

.status-indicator.status-failed {
  background: var(--danger-bg);
  color: var(--danger);
}

.error-help-icon {
  font-size: var(--text-lg);
  color: var(--danger);
  cursor: help;
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
  border-top: 1px solid var(--color-border-subtle);
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
  color: var(--neutral-200);
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
  background: var(--neutral-200);
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
  border-right: 1px solid var(--color-border-subtle);
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
  border-bottom: 2px solid var(--color-border-subtle);
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
  color: var(--neutral-300);
  text-align: center;
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

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
}

.oauth-iframe-container {
  width: 100%;
  height: 500px;
  overflow: hidden;
}

.oauth-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

@media (max-width: 768px) {
  .mobile-hidden {
    display: none !important;
  }

  .accounts-content {
    padding: var(--space-3);
  }

  .accounts-grid {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .account-card {
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

  .card-name {
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

  .disk-status-section {
    padding: 10px;
  }

  .status-header {
    margin-bottom: 10px;
  }

  .status-title {
    font-size: var(--text-xs);
  }

  .space-info {
    align-items: flex-start;
  }
}
</style>