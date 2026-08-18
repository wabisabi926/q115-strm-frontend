<template>
  <div class="main-content-container emby-content" v-cn-en-spacing>
    <PageHeader title="Emby 设置" subtitle="配置 Emby 服务器连接、通知与同步功能" :icon="Monitor" />

    <div class="emby-settings-wrapper">
      <el-form
        :model="embyData"
        :rules="formRules"
        :label-position="isMobile ? 'top' : 'left'"
        :label-width="200"
        class="emby-form settings-form"
        ref="formRef"
      >
        <el-card class="settings-card emby-server-card" shadow="hover">
          <template #header>
            <div class="card-header-wrapper">
              <div class="card-header-icon server-icon">
                <el-icon :size="24"><Monitor /></el-icon>
              </div>
              <div class="card-header-content">
                <h3 class="card-title">Emby服务器配置</h3>
                <p class="card-subtitle">配置Emby服务器连接信息</p>
              </div>
            </div>
          </template>

          <el-form-item label="Emby服务器地址" prop="emby_url">
            <el-input
              v-model="embyData.emby_url"
              placeholder="请输入Emby服务器地址，格式：http://ip:port"
              :disabled="embyLoading"
              class="limited-width-input"
              @input="updateEmbyExample"
              :prefix-icon="Link"
              clearable
            />
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>输入Emby地址后，页面往下滚，点击"保存设置"按钮后，重启QMediaSync才能生效</span>
            </div>
            <div v-if="embyExample" class="emby-example-inline">
              <span class="example-label">示例格式：</span>
              <code class="example-url">{{ embyExample }}</code>
            </div>
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span
                >想使用Emby外网302必须输入Emby服务器地址，不要以/结尾，输入emby的内网地址即可，比如：http://192.168.1.100:8096
                或者docker容器的地址</span
              >
            </div>
          </el-form-item>

          <el-form-item label="Emby API密钥" prop="emby_api_key">
            <el-input
              v-model="embyData.emby_api_key"
              placeholder="请输入Emby API密钥"
              :disabled="embyLoading"
              class="limited-width-input"
              @input="updateEmbyExample"
              :prefix-icon="Key"
            />
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>API 密钥用来提取 strm 的视频、音频、内封字幕信息，如果不需要该功能，可以不填</span></div>
            </el-form-item>
        </el-card>

        <div class="form-actions-wrapper">
          <el-button
            type="primary"
            @click="praseEmby"
            :loading="embyLoading"
            :icon="Refresh"
            :disabled="!embyData.emby_url || !embyData.emby_api_key"
            size="large"
            class="extract-btn"
          >
            提取媒体信息
          </el-button>
          <div class="extract-help">
            <p>
              该功能会将Emby没有提取媒体信息的项目全部触发提取，如果是重建媒体库或者新Emby可以执行一次。进度或者详情请在<router-link
                to="/download-queue"
                class="help-link"
                >下载队列页</router-link
              >面查看
            </p>
          </div>
        </div>

        <el-card class="settings-card webhook-card" shadow="hover">
          <template #header>
            <div class="card-header-wrapper">
              <div class="card-header-icon webhook-icon">
                <el-icon :size="24"><Connection /></el-icon>
              </div>
              <div class="card-header-content">
                <h3 class="card-title">通知链接配置</h3>
                <p class="card-subtitle">Emby 通知链接、鉴权与播放通知设置已移至独立页面</p>
              </div>
            </div>
          </template>

          <div class="form-help">
            <el-icon><InfoFilled /></el-icon>
            <span
              >通知链接配置已迁移至
              <router-link to="/notification-settings/emby" class="help-link"
                >通知设置</router-link
              >，请前往「通知设置 > Emby 通知配置」进行配置。</span
            >
          </div>
        </el-card>

        <el-card class="settings-card sync-features-card" shadow="hover">
          <template #header>
            <div class="card-header-wrapper">
              <div class="card-header-icon features-icon">
                <el-icon :size="24"><Setting /></el-icon>
              </div>
              <div class="card-header-content">
                <h3 class="card-title">同步和功能配置</h3>
                <p class="card-subtitle">配置STRM同步与媒体库联动功能</p>
              </div>
            </div>
          </template>

          <div class="feature-item">
            <el-form-item label="入库后提取媒体信息" prop="enable_extract_media_info">
              <div class="switch-wrapper">
                <el-switch
                  v-model="embyData.enable_extract_media_info"
                  :active-value="1"
                  :inactive-value="0"
                  :disabled="embyLoading"
                  active-color="#67c23a"
                  inactive-color="#dcdfe6"
                />
                <span
                  class="switch-label"
                  :class="{ 'is-active': embyData.enable_extract_media_info }"
                >
                  {{ embyData.enable_extract_media_info ? '启用' : '禁用' }}
                </span>
              </div>
            </el-form-item>
            <div class="feature-description">
              <div class="config-links">
                <span>该功能需要在Emby中配置通知才能生效，</span>
                <a
                  :href="embyData.emby_url + '/web/index.html#!/settings/notifications.html'"
                  target="_blank"
                  class="help-link action-link"
                  >去配置</a
                >
              </div>
              <p class="feature-note">
                功能解释：QMediaSync在收到Emby的通知某个资源入库后，自动触发提取该资源的媒体信息，加快起播速度。媒体信息指：视频、音频、内封字幕等详细信息
              </p>
            </div>
          </div>

          <el-divider class="feature-divider" />

          <div class="feature-item">
            <el-form-item label="启用同步" prop="sync_enabled">
              <div class="switch-wrapper">
                <el-switch
                  v-model="embyData.sync_enabled"
                  :active-value="1"
                  :inactive-value="0"
                  :disabled="embyLoading"
                  active-color="#67c23a"
                  inactive-color="#dcdfe6"
                />
                <span class="switch-label" :class="{ 'is-active': embyData.sync_enabled }">
                  {{ embyData.sync_enabled ? '已启用' : '已禁用' }}
                </span>
              </div>
            </el-form-item>
            <div class="feature-description">
              <p class="feature-note">
                启用后可以将Emby中的资源同步到QMediaSync中和网盘文件建立联系，来实现同步后刷新媒体库和联动删除网盘文件功能
              </p>
            </div>
          </div>

          <div v-if="embyData.sync_enabled === 1" class="library-selection-section">
            <el-form-item label="同步模式">
              <el-radio-group v-model="embyData.sync_all_libraries" @change="handleSyncModeChange">
                <el-radio :label="1">全部媒体库</el-radio>
                <el-radio :label="0">指定媒体库</el-radio>
              </el-radio-group>
              <div class="form-help">
                <el-icon><InfoFilled /></el-icon>
                <span>选择"全部媒体库"将同步所有媒体库（包括未来新增的），选择"指定媒体库"可手动选择需要同步的媒体库</span>
              </div>
            </el-form-item>

            <el-form-item label="选择媒体库" v-if="embyData.sync_all_libraries === 0">
              <el-checkbox-group v-model="selectedLibraryIds" class="library-checkbox-group">
                <el-checkbox
                  v-for="lib in availableLibraries"
                  :key="lib.library_id"
                  :label="lib.library_id"
                  class="library-checkbox"
                >
                  {{ lib.name }}
                </el-checkbox>
              </el-checkbox-group>
              <div class="form-help" v-if="availableLibraries.length === 0">
                <el-icon><WarningFilled /></el-icon>
                <span class="warning-text">请先配置Emby服务器地址并保存，然后执行一次同步以获取媒体库列表</span>
              </div>
            </el-form-item>
          </div>

          <el-divider class="feature-divider" />

          <div class="feature-item" :class="{ 'is-disabled': !embyData.sync_enabled }">
            <el-form-item label="同步时间" prop="sync_cron">
              <el-input
                v-model="embyData.sync_cron"
                placeholder="请输入Cron表达式，如：0 2 * * *"
                :disabled="embyLoading || !embyData.sync_enabled"
                class="limited-width-input"
                @blur="fetchCronNextTimes"
                clearable
              />
              <div class="form-help">
                <el-icon><InfoFilled /></el-icon>
                <span
                  >Cron表达式，格式：秒 分 时 日 月 周（如：0 2 * * * 表示每天凌晨2点执行）</span
                >
              </div>
            </el-form-item>
            <div v-if="cronNextTimes.length > 0" class="cron-next-times">
              <div class="cron-times-header">
                <el-icon><Clock /></el-icon>
                <span>接下来5次执行时间：</span>
              </div>
              <ul class="cron-times-list">
                <li v-for="(time, index) in cronNextTimes" :key="index">{{ time }}</li>
              </ul>
            </div>
          </div>

          <el-divider class="feature-divider" />

          <div class="feature-item" :class="{ 'is-disabled': !embyData.sync_enabled }">
            <el-form-item label="同步后刷新媒体库" prop="enable_refresh_library">
              <div class="switch-wrapper">
                <el-switch
                  v-model="embyData.enable_refresh_library"
                  :active-value="1"
                  :inactive-value="0"
                  :disabled="embyLoading || !embyData.sync_enabled"
                  active-color="#67c23a"
                  inactive-color="#dcdfe6"
                />
                <span
                  class="switch-label"
                  :class="{ 'is-active': embyData.enable_refresh_library }"
                >
                  {{ embyData.enable_refresh_library ? '启用' : '禁用' }}
                </span>
              </div>
            </el-form-item>
            <div class="feature-description">
              <p>
                该功能需要至少同步完一次Emby媒体库才能生效，如果下方同步管理卡片中的总项目数为0，请点击下方：启动同步
                按钮触发一次同步。
              </p>
              <p>
                STRM同步完成后会延迟30s执行刷新动作，以供元数据下载（如果开启了下载），但是可能下载不完就触发了刷新，做为备份手段：请开启Emby的实时监控
              </p>
              <p class="feature-note">
                功能解释：某个STRM同步目录同步完成后会自动触发相关联的Emby媒体库刷新，这样可以及时的将新增加的STRM文件入库
              </p>
            </div>
          </div>

          <el-divider class="feature-divider" />

          <div class="feature-item danger-item" :class="{ 'is-disabled': !embyData.sync_enabled }">
            <el-form-item label="删除联动删除网盘文件" prop="enable_delete_netdisk">
              <div class="switch-wrapper">
                <el-switch
                  v-model="embyData.enable_delete_netdisk"
                  :active-value="1"
                  :inactive-value="0"
                  :disabled="embyLoading || !embyData.sync_enabled"
                  active-color="#f56c6c"
                  inactive-color="#dcdfe6"
                />
                <span class="switch-label" :class="{ 'is-danger': embyData.enable_delete_netdisk }">
                  {{ embyData.enable_delete_netdisk ? '启用' : '禁用' }}
                </span>
              </div>
            </el-form-item>
            <div class="feature-description">
              <el-alert type="warning" :closable="false" class="danger-alert">
                <template #default>
                  <strong>⚠ 谨慎启用：</strong>
                  启用后，删除Emby中的项目时，对应的网盘文件也会被删除<br />
                  <strong
                    >由于Emby的特性如果strm文件内容变更，Emby会先删除再新增，这时有概率导致：STRM变更→Emby通知删除→QMS联动删除网盘→Emby新增项目→播放失败</strong
                  >，这个问题暂时无解<br />
                  <strong
                    >如果打开了Emby的实时监控，在文件系统内删除Strm或者文件夹也会导致Emby触发删除通知→QMS联动删除网盘，所有删除文件一定要谨慎。</strong
                  >
                </template>
              </el-alert>
              <div class="config-links">
                <span>该功能需要在Emby中配置通知才能生效，</span>
                <a
                  :href="embyData.emby_url + '/web/index.html#!/settings/notifications.html'"
                  target="_blank"
                  class="help-link action-link"
                  >去配置</a
                >
              </div>
              <ul class="delete-rules">
                <li>如果在Emby中删除了电影，会在网盘中将视频文件的父目录一起删除</li>
                <li>如果在Emby中删除了剧，会在网盘中将tvshow.nfo的父目录删除</li>
                <li>
                  如果在Emby中删除了季，会先检查视频文件的父目录，如果父目录是季文件夹则删除该文件夹；如果父目录是有tvshow的目录则仅删除季下所有集对应的视频文件+元数据（nfo、封面）
                </li>
                <li>如果在Emby中删了集，会删除视频文件+元数据（nfo、封面）</li>
              </ul>
            </div>
          </div>
        </el-card>

      </el-form>

      <el-card class="settings-card save-config-card" shadow="hover">
        <div class="save-config-content">
          <el-button
            type="success"
            @click="saveEmbyConfig"
            :loading="embyLoading"
            :icon="Check"
            size="large"
            class="save-btn"
          >
            保存设置
          </el-button>
          <div class="form-help save-config-help">
            <el-icon><InfoFilled /></el-icon>
            <span>保存以上所有修改，重启后生效</span>
          </div>
        </div>
      </el-card>

      <el-card class="sync-management-card" shadow="hover">
        <template #header>
          <div class="card-header-wrapper">
            <div class="card-header-icon sync-icon">
              <el-icon :size="24"><Refresh /></el-icon>
            </div>
            <div class="card-header-content">
              <h3 class="card-title">同步管理</h3>
              <p class="card-subtitle">管理Emby媒体库同步状态</p>
            </div>
            <div class="card-header-action">
              <el-button
                type="primary"
                @click="startSync"
                :loading="syncStartLoading"
                :icon="Refresh"
                :disabled="!embyData.emby_url || !embyData.sync_enabled || syncPolling"
                size="default"
              >
                {{ syncPolling ? '同步进行中...' : '启动同步' }}
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="syncInfo" class="sync-info-grid">
          <div class="sync-stat-card">
            <div class="stat-icon auto-sync-icon">
              <el-icon :size="28"><Timer /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">自动同步</div>
              <div class="stat-value" :class="{ 'is-enabled': syncInfo.sync_enabled }">
                {{ syncInfo.sync_enabled ? '已启用' : '已禁用' }}
              </div>
            </div>
          </div>

          <div class="sync-stat-card">
            <div class="stat-icon cycle-icon">
              <el-icon :size="28"><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">同步周期</div>
              <div class="stat-value">{{ syncInfo.sync_cron }}</div>
            </div>
          </div>

          <div class="sync-stat-card">
            <div class="stat-icon items-icon">
              <el-icon :size="28"><FolderOpened /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">关联Item数</div>
              <div class="stat-value highlight">{{ syncInfo.total_items || 0 }}</div>
            </div>
          </div>

          <div class="sync-stat-card">
            <div class="stat-icon time-icon">
              <el-icon :size="28"><Calendar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">最后同步时间</div>
              <div class="stat-value">{{ formatLastSyncTime(syncInfo.last_sync_time) }}</div>
            </div>
          </div>
        </div>

        <div v-if="syncPolling" class="sync-progress">
          <div class="progress-indicator">
            <el-icon class="is-loading" :size="20"><Loading /></el-icon>
            <span>同步进行中，请稍候...</span>
          </div>
        </div>

        <div v-if="!syncInfo" class="sync-empty">
          <el-empty description="暂无同步数据，请点击上方按钮启动同步" :image-size="80" />
        </div>
      </el-card>

      <el-alert
        v-if="embyStatus"
        :title="embyStatus.title"
        :type="embyStatus.type"
        :description="embyStatus.description"
        :closable="false"
        show-icon
        class="emby-status-alert"
      />

      <div class="form-help usage-tip">
        <el-icon><InfoFilled /></el-icon>
        <div class="usage-tip-content">
          <p class="usage-tip-title">使用提示</p>
          <p>只要填写了Emby服务器地址和API密钥，就可以触发提取媒体信息，提取完成后Emby可以显示出来音视频和内封字幕信息，可以切换字幕</p>
          <p>如果需要同步，可以点击上方的 "提取媒体信息" 按钮</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue'
import { SERVER_URL } from '@/const'
import type { AxiosStatic } from 'axios'
import {
  Check,
  Refresh,
  Loading,
  Monitor,
  Link,
  Key,
  Connection,
  Setting,
  InfoFilled,
  WarningFilled,
  Timer,
  Clock,
  FolderOpened,
  Calendar,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { inject, onMounted, ref, reactive, onBeforeUnmount } from 'vue'
import { isMobile as checkIsMobile } from '@/utils/deviceUtils'

const http: AxiosStatic | undefined = inject('$http')

const formRef = ref<FormInstance>()

const isMobile = ref(checkIsMobile())

const embyLoading = ref(false)

const syncStartLoading = ref(false)
const syncPolling = ref(false)
const syncInfo = ref<{
  sync_enabled: boolean
  sync_cron: string
  total_items: number
  last_sync_time: number | null
} | null>(null)
let syncPollTimer: number | null = null

const cronNextTimes = ref<string[]>([])

const embyData = reactive({
  emby_url: '',
  emby_api_key: '',
  sync_enabled: 1,
  sync_cron: '0 2 * * *',
  enable_refresh_library: 1,
  enable_extract_media_info: 1,
  enable_delete_netdisk: 0,
  enable_auth: 1,
  sync_all_libraries: 1,
  selected_libraries: '[]',
  enable_playback_overview: 0,
  enable_playback_progress: 0,
})

const availableLibraries = ref<Array<{ library_id: string; name: string }>>([])
const selectedLibraryIds = ref<string[]>([])

const embyExample = ref('http://192.168.1.100:8096')

const embyStatus = ref<{
  title: string
  type: 'success' | 'warning' | 'error' | 'info'
  description: string
} | null>(null)

const formRules: FormRules = {
  emby_url: [
    {
      message: '请输入Emby服务器地址',
      trigger: 'blur',
    },
    {
      pattern: /^(http|https):\/\/[^\s/$.?#].[^\s]*$/,
      message: '请输入有效的URL格式，如：http://ip:port',
      trigger: 'blur',
    },
  ],
}

const defaultConfig = {
  emby_url: '',
  emby_api_key: '',
  sync_enabled: 1,
  sync_cron: '0 2 * * *',
  enable_refresh_library: 1,
  enable_extract_media_info: 1,
  enable_delete_netdisk: 0,
  enable_auth: 0,
  sync_all_libraries: 1,
  selected_libraries: '[]',
}

const loadEmbyConfig = async () => {
  try {
    embyLoading.value = true
    const response = await http?.get(`${SERVER_URL}/setting/emby-config`)

    if (response?.data.code === 200) {
      if (response.data.data?.exists && response.data.data?.config) {
        const config = response.data.data.config
        embyData.emby_url = config.emby_url || ''
        embyData.emby_api_key = config.emby_api_key || ''
        embyData.sync_enabled = config.sync_enabled ?? 1
        embyData.sync_cron = config.sync_cron || '0 2 * * *'
        embyData.enable_refresh_library = config.enable_refresh_library ?? 1
        embyData.enable_extract_media_info = config.enable_extract_media_info ?? 1
        embyData.enable_delete_netdisk = config.enable_delete_netdisk ?? 0
        embyData.enable_auth = config.enable_auth ?? 1
        embyData.sync_all_libraries = config.sync_all_libraries ?? 1
        embyData.selected_libraries = config.selected_libraries || '[]'
        embyData.enable_playback_overview = config.enable_playback_overview ?? 0
        embyData.enable_playback_progress = config.enable_playback_progress ?? 0

        try {
          selectedLibraryIds.value = JSON.parse(embyData.selected_libraries)
        } catch (e) {
          selectedLibraryIds.value = []
        }

        await loadEmbyLibraries()
      } else {
        Object.assign(embyData, defaultConfig)
      }
    } else {
      Object.assign(embyData, defaultConfig)
      ElMessage.warning('加载Emby配置失败，使用默认配置')
    }
  } catch (error) {
    console.error('加载Emby配置错误:', error)
    Object.assign(embyData, defaultConfig)
    ElMessage.error('加载Emby配置失败')
  } finally {
    embyLoading.value = false
  }
}

const loadEmbyLibraries = async () => {
  try {
    const response = await http?.get(`${SERVER_URL}/emby/libraries`)
    if (response?.data.code === 200 && response.data.data) {
      availableLibraries.value = response.data.data.map((lib: any) => ({
        library_id: lib.library_id,
        name: lib.name,
      }))
    }
  } catch (error) {
    console.error('加载媒体库列表错误:', error)
  }
}

const handleSyncModeChange = (value: number) => {
  if (value === 0) {
    loadEmbyLibraries()
  }
}

const saveEmbyConfig = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    embyLoading.value = true

    const response = await http?.post(
      `${SERVER_URL}/setting/emby-config`,
      {
        emby_url: embyData.emby_url.trim(),
        emby_api_key: embyData.emby_api_key.trim(),
        sync_enabled: embyData.sync_enabled,
        sync_cron: embyData.sync_cron,
        enable_refresh_library: embyData.enable_refresh_library,
        enable_extract_media_info: embyData.enable_extract_media_info,
        enable_delete_netdisk: embyData.enable_delete_netdisk,
        enable_auth: embyData.enable_auth,
        sync_all_libraries: embyData.sync_all_libraries,
        selected_libraries: JSON.stringify(selectedLibraryIds.value),
        enable_playback_overview: embyData.enable_playback_overview,
        enable_playback_progress: embyData.enable_playback_progress,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (response?.data.code === 200) {
      embyStatus.value = {
        title: '保存成功',
        type: 'success',
        description: 'Emby配置已成功保存',
      }
      ElMessage.success('Emby配置已成功保存')
      await loadEmbyConfig()
    } else {
      embyStatus.value = {
        title: '保存失败',
        type: 'error',
        description: response?.data.message || '保存Emby配置失败',
      }
      ElMessage.error(response?.data.message || '保存失败')
    }

    setTimeout(() => {
      embyStatus.value = null
    }, 3000)
  } catch (error) {
    console.error('保存Emby配置错误:', error)
    embyStatus.value = {
      title: '保存失败',
      type: 'error',
      description: '保存Emby配置时出现错误',
    }
    ElMessage.error('保存失败')
  } finally {
    embyLoading.value = false
  }
}

const praseEmby = async () => {
  try {
    embyLoading.value = true
    const response = await http?.post(
      `${SERVER_URL}/setting/emby/parse`,
      {
        emby_url: embyData.emby_url.trim(),
        emby_api_key: embyData.emby_api_key.trim(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (response?.data.code === 200) {
      embyStatus.value = {
        title: '触发提取媒体信息成功',
        type: 'success',
        description: '已成功触发提取媒体信息',
      }
      ElMessage.success('已成功触发提取媒体信息')
    } else {
      embyStatus.value = {
        title: '触发提取媒体信息失败',
        type: 'error',
        description: response?.data.message || '触发提取媒体信息失败',
      }
      ElMessage.error(response?.data.message || '触发提取媒体信息失败')
    }
  } catch (error) {
    console.error('触发提取媒体信息错误:', error)
    embyStatus.value = {
      title: '触发提取媒体信息失败',
      type: 'error',
      description: '触发提取媒体信息时出现错误',
    }
    ElMessage.error('触发提取媒体信息失败')
  } finally {
    embyLoading.value = false
  }
}

const updateEmbyExample = () => {}

const fetchCronNextTimes = async () => {
  if (!embyData.sync_cron || !embyData.sync_cron.trim()) {
    cronNextTimes.value = []
    return
  }

  try {
    const response = await http?.get(`${SERVER_URL}/setting/cron`, {
      params: { cron: embyData.sync_cron.trim() },
    })

    if (response?.data.code === 200 && response.data.data) {
      cronNextTimes.value = response.data.data
    } else {
      cronNextTimes.value = []
      if (response?.data.message) {
        ElMessage.warning(response.data.message)
      }
    }
  } catch (error) {
    console.error('获取Cron执行时间错误:', error)
    cronNextTimes.value = []
    ElMessage.error('获取Cron执行时间失败，请检查表达式格式')
  }
}

const startSync = async () => {
  try {
    syncStartLoading.value = true
    const response = await http?.post(`${SERVER_URL}/emby/sync/start`)

    if (response?.data.code === 200) {
      ElMessage.success('同步已启动')
      syncPolling.value = true
      await querySyncStatus()
      startSyncPolling()
    } else {
      ElMessage.error(response?.data.message || '启动同步失败')
    }
  } catch (error) {
    console.error('启动同步错误:', error)
    ElMessage.error('启动同步失败')
  } finally {
    syncStartLoading.value = false
  }
}

const querySyncStatus = async () => {
  try {
    const response = await http?.get(`${SERVER_URL}/emby/sync/status`)

    if (response?.data.code === 200) {
      syncInfo.value = response.data.data
      syncPolling.value = response.data.data?.is_running
      if (syncPolling.value) {
      } else {
        stopSyncPolling()
      }
    }
  } catch (error) {
    console.error('查询同步状态错误:', error)
  }
}

const startSyncPolling = () => {
  syncPollTimer = window.setInterval(async () => {
    try {
      const response = await http?.get(`${SERVER_URL}/emby/sync/status`)

      if (response?.data.code === 200) {
        syncInfo.value = response.data.data
        syncPolling.value = response.data.data?.is_running
        console.log(syncPolling.value)
        if (!syncPolling.value) {
          stopSyncPolling()
        }
      }
    } catch (error) {
      console.error('轮询同步状态错误:', error)
    }
  }, 3000)
}

const stopSyncPolling = () => {
  syncPolling.value = false
  if (syncPollTimer !== null) {
    clearInterval(syncPollTimer)
    syncPollTimer = null
  }
}

const formatLastSyncTime = (timestamp: number | null | undefined) => {
  if (!timestamp) return '未同步'

  try {
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp

    const date = new Date(timestampMs)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    if (diffMs < 0) return date.toLocaleString('zh-CN')

    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffSecs / 3600)
    const diffDays = Math.floor(diffSecs / 86400)

    if (diffSecs < 60) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 30) return `${diffDays}天前`

    return date.toLocaleString('zh-CN')
  } catch {
    return String(timestamp)
  }
}

onMounted(() => {
  loadEmbyConfig()
  querySyncStatus()
})

onBeforeUnmount(() => {
  stopSyncPolling()
})
</script>

<style scoped lang="css">
.emby-content {
  background: var(--gradient-card);
}

.emby-settings-wrapper {
  margin: 0 auto;
}

.emby-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.settings-card {
  border-radius: var(--radius-lg);
  border: none;
  overflow: hidden;
  transition: all var(--duration-base) var(--ease-out);
  width: 100%;
}

.settings-card:hover {
  transform: translateY(-2px);
}

.library-selection-section {
  padding: var(--space-2) 0;
}

.save-config-card {
  margin-top: var(--space-6);
}

.save-config-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
}

.save-config-content .save-btn {
  min-width: 140px;
}

.save-config-help {
  justify-content: flex-start;
}

.card-header-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.card-header-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-inverse);
}

.server-icon {
  background: var(--gradient-hero);
}

.webhook-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.features-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.sync-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-header-content {
  flex: 1;
}

.card-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.card-subtitle {
  margin: var(--space-1) 0 0;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.card-header-action {
  margin-left: auto;
}

.limited-width-input {
  max-width: 600px;
}

.emby-example-inline {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, var(--color-bg-muted) 0%, #e8eef5 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border: 1px solid var(--neutral-200);
}

.example-label {
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.example-url {
  color: var(--brand-500);
  font-family: var(--font-family-mono);
  font-size: var(--text-sm);
  background: var(--color-bg-elevated);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--brand-100);
}

.form-help {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-3);
  line-height: var(--leading-normal);
  width: 100%;
}

.form-help:has(.el-icon) {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.form-help .el-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.author-credit {
  margin-top: var(--space-1);
}

.help-link {
  color: var(--brand-500);
  text-decoration: none;
  font-weight: var(--weight-medium);
  transition: color var(--duration-fast);
}

.help-link:hover {
  color: var(--brand-600);
  text-decoration: underline;
}

.action-link {
  margin-left: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: var(--brand-50);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.action-link:hover {
  background: var(--brand-100);
}

.inline-code {
  background: var(--danger-bg);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-xs);
  font-family: var(--font-family-mono);
  font-size: var(--text-2xs);
  color: var(--danger);
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.switch-label {
  font-size: var(--text-base);
  color: var(--color-text-tertiary);
  font-weight: var(--weight-medium);
  transition: color var(--duration-base);
}

.switch-label.is-active {
  color: var(--success);
}

.switch-label.is-danger {
  color: var(--danger);
}

.warning-text {
  color: var(--warning);
}

.feature-item {
  padding: var(--space-4) 0;
}

.feature-item:first-child {
  padding-top: 0;
}

.feature-item.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.danger-item {
  background: linear-gradient(135deg, var(--danger-bg) 0%, var(--color-bg-elevated) 100%);
  margin: 0 calc(-1 * var(--space-5));
  padding: var(--space-5);
  border-radius: var(--radius-md);
  border: 1px solid #fde2e2;
}

.danger-alert {
  margin-bottom: var(--space-3);
  border-radius: var(--radius-md);
}

.feature-description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  margin-top: var(--space-2);
}

.feature-description p {
  margin: var(--space-2) 0;
}

.feature-note {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.cron-next-times {
  margin-top: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, var(--brand-50) 0%, #e0f2fe 100%);
  border-radius: var(--radius-md);
  border: 1px solid #bae6fd;
}

.cron-times-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--brand-600);
  margin-bottom: var(--space-2);
}

.cron-times-list {
  margin: 0;
  padding-left: var(--space-5);
  list-style: decimal;
}

.cron-times-list li {
  font-size: var(--text-sm);
  color: var(--brand-700);
  line-height: var(--leading-relaxed);
  font-family: var(--font-family-mono);
}

.feature-divider {
  margin: var(--space-4) 0;
}

.config-links {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
}

.config-links span {
  flex-shrink: 1;
  min-width: 0;
}

.config-links .help-link {
  flex-shrink: 0;
  white-space: nowrap;
}

.delete-rules {
  margin: var(--space-3) 0 0;
  padding-left: var(--space-5);
  color: var(--color-text-tertiary);
}

.delete-rules li {
  margin: var(--space-2) 0;
  line-height: var(--leading-relaxed);
}

.form-actions-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  align-items: center;
  margin: var(--space-4) 0;
}

.save-btn,
.extract-btn {
  min-width: 140px;
}

.extract-help {
  flex: 1;
  min-width: 200px;
}

.extract-help p {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: var(--leading-relaxed);
}

.sync-management-card {
  border-radius: var(--radius-lg);
  border: none;
  margin-bottom: var(--space-5);
  width: 100%;
}

.sync-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-5);
}

.sync-stat-card {
  display: flex;
  align-items: center;
  width: 100%;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--gradient-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--neutral-100);
  transition: all var(--duration-base) var(--ease-out);
}

.sync-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-inverse);
}

.auto-sync-icon {
  background: var(--gradient-hero);
}

.cycle-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.items-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.time-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-1);
}

.stat-value {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}

.stat-value.is-enabled {
  color: var(--success);
}

.stat-value.highlight {
  color: var(--brand-500);
}

.sync-progress {
  margin-top: var(--space-5);
  padding: var(--space-4);
  background: linear-gradient(135deg, var(--brand-50) 0%, #f0f9ff 100%);
  border-radius: var(--radius-md);
  border: 1px solid var(--brand-100);
}

.progress-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--brand-500);
  font-weight: var(--weight-medium);
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.sync-empty {
  padding: var(--space-5);
}

.emby-status-alert {
  margin-bottom: var(--space-5);
  border-radius: var(--radius-md);
}

.tips-alert {
  border-radius: var(--radius-md);
}

/* ======== API Key 快速访问区 ======== */
.api-key-quick-section {
  background: var(--neutral-50);
  border: 1px dashed var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-4);
  margin: var(--space-2) 0 var(--space-4);
}

.quick-section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  margin-bottom: var(--space-3);
}

.quick-section-title .title-icon {
  color: var(--brand-500);
}

.quick-section-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.quick-section-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.quick-row-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  flex: 0 0 auto;
}

.key-select {
  width: 320px;
  max-width: 100%;
}

.api-key-help {
  padding-left: 0;
}

/* ======== API Key 创建 Dialog 样式（复用 AppApiKeys 的同名类名）======== */
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

@media (max-width: 1200px) {
  .sync-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .emby-content {
    padding: var(--space-3);
  }

  .emby-settings-wrapper {
    max-width: 100%;
  }

  .emby-form {
    gap: var(--space-4);
  }

  .settings-card {
    border-radius: var(--radius-md);
  }

  .settings-card:hover {
    transform: none;
  }

  .card-header-wrapper {
    flex-wrap: wrap;
  }

  .card-header-icon {
    width: 40px;
    height: 40px;
  }

  .card-header-icon .el-icon {
    font-size: 20px;
  }

  .card-title {
    font-size: var(--text-lg);
  }

  .card-subtitle {
    font-size: var(--text-xs);
  }

  .card-header-action {
    width: 100%;
    margin-top: var(--space-3);
  }

  .card-header-action .el-button {
    width: 100%;
  }

  .limited-width-input {
    max-width: 100%;
  }

  .emby-example-inline {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .form-help {
    flex-wrap: nowrap;
  }

  .form-help:has(.el-icon) {
    display: flex;
    align-items: flex-start;
  }

  .form-help .el-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .form-help span {
    word-break: break-all;
  }

  .config-links {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }

  .config-links .help-link {
    margin-top: 0;
  }

  .action-link {
    margin-left: var(--space-2);
    margin-top: 0;
  }

  .form-actions-wrapper {
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-4);
    gap: var(--space-3);
  }

  .save-btn,
  .extract-btn {
    width: 100%;
    min-width: auto;
  }

  .extract-help {
    min-width: auto;
  }

  .sync-management-card {
    border-radius: var(--radius-md);
  }

  .sync-info-grid {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }

  .sync-stat-card {
    padding: var(--space-4);
    gap: var(--space-3);
  }

  .sync-stat-card:hover {
    transform: none;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
  }

  .stat-icon .el-icon {
    font-size: 22px;
  }

  .stat-label {
    font-size: var(--text-xs);
  }

  .stat-value {
    font-size: var(--text-md);
  }

  .sync-progress {
    padding: var(--space-3);
  }

  .feature-item {
    padding: var(--space-3) 0;
  }

  .danger-item {
    margin: 0 calc(-1 * var(--space-3));
    padding: var(--space-3);
    border-radius: 0;
  }

  .danger-alert {
    font-size: var(--text-xs);
  }

  .delete-rules {
    font-size: var(--text-xs);
  }

  .delete-rules li {
    margin: var(--space-1) 0;
  }

  .emby-status-alert,
  .tips-alert {
    border-radius: var(--radius-md);
  }

  .key-select {
    width: 100%;
  }

  .quick-section-row {
    align-items: stretch;
  }

  .quick-section-row .el-button {
    flex: 1 1 calc(50% - var(--space-3));
    min-width: 120px;
  }

  .key-value {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .emby-content {
    padding: var(--space-2);
  }

  .card-header-icon {
    width: 36px;
    height: 36px;
  }

  .card-header-icon .el-icon {
    font-size: 18px;
  }

  .card-title {
    font-size: var(--text-base);
  }

  .switch-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .switch-label {
    font-size: var(--text-sm);
  }

  .feature-description {
    font-size: var(--text-xs);
  }

  .sync-stat-card {
    padding: var(--space-3);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-icon .el-icon {
    font-size: 20px;
  }

  .stat-value {
    font-size: var(--text-sm);
  }
}
</style>