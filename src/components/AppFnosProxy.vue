<template>
  <div class="main-content-container fnos-proxy-content">
    <div class="fnos-proxy-wrapper">
      <el-form
        :model="formData"
        :label-position="isMobile ? 'top' : 'left'"
        :label-width="180"
        class="fnos-form"
      >
        <el-card class="settings-card" shadow="hover">
          <template #header>
            <div class="card-header-wrapper">
              <div class="card-header-icon">
                <el-icon :size="24"><Connection /></el-icon>
              </div>
              <div class="card-header-content">
                <h3 class="card-title">飞牛影视反代配置</h3>
                <p class="card-subtitle">解决 senplayer、爆米花、vidhub 等播放器无法播放飞牛影视 STRM 的问题</p>
              </div>
            </div>
          </template>

          <el-form-item label="启用反代">
            <div class="switch-wrapper">
              <el-switch
                v-model="formData.enabled"
                :disabled="loading"
                active-color="#67c23a"
                inactive-color="#dcdfe6"
              />
              <span class="switch-label" :class="{ 'is-active': formData.enabled }">
                {{ formData.enabled ? '已启用' : '已禁用' }}
              </span>
            </div>
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>启用后将在指定端口启动飞牛影视反向代理服务</span>
            </div>
          </el-form-item>

          <el-form-item label="飞牛影视地址">
            <el-input
              v-model="formData.fnos_url"
              placeholder="http://192.168.1.10:8005"
              :disabled="loading"
              class="limited-width-input"
              clearable
            >
              <template #append>
                <el-button @click="testConnection" :loading="testing" :icon="Connection">测试</el-button>
              </template>
            </el-input>
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>飞牛影视服务地址，不要以 / 结尾</span>
            </div>
          </el-form-item>

          <el-form-item label="反代端口">
            <el-input
              v-model="formData.port"
              placeholder="如 8006"
              :disabled="loading"
              class="port-input"
              clearable
            />
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>反代服务监听端口，播放器需用此端口作为飞牛影视服务器地址</span>
            </div>
          </el-form-item>

          <el-form-item v-if="showPathMaps" label="STRM 路径映射">
            <el-input
              v-model="formData.path_maps"
              type="textarea"
              :rows="5"
              placeholder="/vol1/1000/strm|/app/strm&#10;每行一个映射，格式：飞牛路径|本地路径"
              :disabled="loading"
              class="limited-width-input"
            />
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>Docker 环境下需要填写，将飞牛上的 STRM 文件路径映射到容器内可访问的路径。格式：每行一个映射，飞牛路径|本地路径</span>
            </div>
          </el-form-item>

          <div class="form-actions-wrapper">
            <el-button
              type="success"
              @click="saveConfig"
              :loading="loading"
              :icon="Check"
              size="large"
            >
              保存配置
            </el-button>
          </div>
        </el-card>

        <el-card class="settings-card status-card" shadow="hover" v-if="configData.running || configData.last_error">
          <template #header>
            <div class="card-header-wrapper">
              <div class="card-header-icon" :class="configData.running ? 'status-running' : 'status-error'">
                <el-icon :size="24">
                  <CircleCheck v-if="configData.running" />
                  <CircleClose v-else />
                </el-icon>
              </div>
              <div class="card-header-content">
                <h3 class="card-title">运行状态</h3>
                <p class="card-subtitle">{{ configData.running ? '反代服务运行中' : '反代服务异常' }}</p>
              </div>
            </div>
          </template>

          <div v-if="configData.running" class="status-info">
            <div class="status-row">
              <span class="status-label">访问地址：</span>
              <code class="status-value">{{ configData.proxy_url }}</code>
            </div>
            <div class="status-row">
              <span class="status-label">监听端口：</span>
              <span class="status-value">{{ configData.port }}</span>
            </div>
            <div class="form-help">
              <el-icon><InfoFilled /></el-icon>
              <span>在播放器中添加飞牛影视服务器时，使用上方的访问地址</span>
            </div>
          </div>

          <el-alert
            v-if="configData.last_error"
            :title="configData.last_error"
            type="error"
            :closable="false"
            show-icon
          />
        </el-card>

        <el-alert title="使用说明" type="info" :closable="false" show-icon class="tips-alert">
          <template #default>
            <div class="tips-content">
              <p>1. 填写飞牛影视地址（如 http://192.168.1.10:8005）</p>
              <p>2. 填写反代端口（如 8006，不能与主服务或 emby302 端口重复）</p>
              <p>3. 在 senplayer / 爆米花 / vidhub 等播放器中添加飞牛影视服务器，地址填反代的访问地址</p>
              <p v-if="showPathMaps">4. Docker 环境需配置 STRM 路径映射（飞牛路径|容器内路径）</p>
            </div>
          </template>
        </el-alert>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SERVER_URL } from '@/const'
import type { AxiosStatic } from 'axios'
import { Check, Connection, InfoFilled, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { inject, onMounted, ref, reactive, computed } from 'vue'
import { isMobile as checkIsMobile } from '@/utils/deviceUtils'

const http: AxiosStatic | undefined = inject('$http')
const isMobile = ref(checkIsMobile())

const loading = ref(false)
const testing = ref(false)

const formData = reactive({
  enabled: false,
  fnos_url: '',
  port: '',
  path_maps: '',
})

const configData = ref<{
  running: boolean
  port: string
  proxy_url: string
  last_error: string
  env: string
}>({
  running: false,
  port: '',
  proxy_url: '',
  last_error: '',
  env: 'docker',
})

const showPathMaps = computed(() => configData.value.env === 'docker')

const loadConfig = async () => {
  try {
    loading.value = true
    const response = await http?.get(`${SERVER_URL}/setting/fnos-proxy/config`)
    if (response?.data.code === 200) {
      const data = response.data.data
      formData.enabled = data.enabled || false
      formData.fnos_url = data.fnos_url || ''
      formData.port = data.port || ''
      formData.path_maps = data.path_maps || ''
      configData.value.running = data.running || false
      configData.value.port = data.port || ''
      configData.value.proxy_url = data.proxy_url || ''
      configData.value.last_error = data.last_error || ''
      configData.value.env = data.env || 'docker'
    }
  } catch (error) {
    console.error('加载飞牛反代配置错误:', error)
    ElMessage.error('加载配置失败')
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  try {
    loading.value = true
    const response = await http?.post(`${SERVER_URL}/setting/fnos-proxy/config`, {
      enabled: formData.enabled,
      fnos_url: formData.fnos_url.trim(),
      port: formData.port.trim(),
      path_maps: formData.path_maps.trim(),
    })
    if (response?.data.code === 200) {
      ElMessage.success('配置已保存')
      const data = response.data.data
      configData.value.running = data.running || false
      configData.value.port = data.port || ''
      configData.value.proxy_url = data.proxy_url || ''
      configData.value.last_error = data.last_error || ''
      configData.value.env = data.env || 'docker'
    } else {
      ElMessage.error(response?.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存飞牛反代配置错误:', error)
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

const testConnection = async () => {
  if (!formData.fnos_url.trim()) {
    ElMessage.warning('请先填写飞牛影视地址')
    return
  }
  try {
    testing.value = true
    const response = await http?.post(`${SERVER_URL}/setting/fnos-proxy/test`, {
      enabled: formData.enabled,
      fnos_url: formData.fnos_url.trim(),
      port: formData.port.trim(),
      path_maps: formData.path_maps.trim(),
    })
    if (response?.data.code === 200) {
      ElMessage.success('飞牛影视地址连接正常')
    } else {
      ElMessage.error(response?.data.message || '连接失败')
    }
  } catch (error) {
    console.error('测试飞牛影视地址错误:', error)
    ElMessage.error('测试失败')
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped lang="css">
.fnos-proxy-content {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.fnos-proxy-wrapper {
  margin: 0 auto;
}

.fnos-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.settings-card {
  border-radius: 12px;
  border: none;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 100%;
}

.settings-card:hover {
  transform: translateY(-2px);
}

.card-header-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-header-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-header-icon.status-running {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-header-icon.status-error {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.card-header-content {
  flex: 1;
}

.card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #909399;
}

.limited-width-input {
  max-width: 600px;
}

.port-input {
  max-width: 200px;
}

.form-help {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 14px;
  color: #3c3d40;
  margin-top: 8px;
  line-height: 1.5;
}

.form-help .el-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.switch-label.is-active {
  color: #67c23a;
}

.form-actions-wrapper {
  display: flex;
  gap: 16px;
  padding: 20px 0;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.status-value {
  font-size: 14px;
  color: #409eff;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.tips-alert {
  border-radius: 8px;
}

.tips-content p {
  margin: 4px 0;
  line-height: 1.8;
}

@media (max-width: 768px) {
  .fnos-proxy-content {
    padding: 12px;
  }

  .limited-width-input {
    max-width: 100%;
  }

  .port-input {
    max-width: 100%;
  }

  .card-header-wrapper {
    flex-wrap: wrap;
  }

  .card-header-icon {
    width: 40px;
    height: 40px;
  }

  .card-title {
    font-size: 16px;
  }

  .form-actions-wrapper {
    flex-direction: column;
  }
}
</style>
