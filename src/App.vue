<template>
  <!-- 登录页面 -->
  <div v-if="$route.name === 'login'" class="login-layout">
    <router-view />
  </div>

  <!-- 主应用布局 -->
  <div v-else class="common-layout">
    <el-container>
      <!-- 移动端遮罩层 -->
      <div v-if="isMobile && isMenuOpen" class="mobile-overlay" @click="toggleMenu"></div>

      <!-- 侧边栏 -->
      <el-aside
        :width="isMobile ? '250px' : '200px'"
        :class="{ 'mobile-aside': isMobile, 'mobile-aside-open': isMobile && isMenuOpen }"
      >
        <!-- 用户信息 -->
        <div class="user-info">
          <div class="user-avatar">
            <img src="/favicon.ico" alt="QMS" class="qms-icon" />
          </div>
          <div class="user-details">
            <div class="username">{{ authStore.user?.username || '用户' }}</div>
            <el-button type="text" size="small" class="logout-btn" @click="handleLogout">
              退出登录
            </el-button>
          </div>
        </div>

        <el-menu
          :default-active="$route.path"
          :default-openeds="getDefaultOpeneds()"
          router
          class="el-menu-vertical"
          @select="handleMenuSelect"
        >
          <!-- 遍历一级菜单 -->
          <template v-for="menu in menuItems" :key="menu.path">
            <!-- 如果是子菜单 -->
            <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path">
              <template #title>
                <el-icon>
                  <component :is="Icons[menu.meta.icon as keyof typeof Icons]" />
                </el-icon>
                <span>{{ menu.meta.title }}</span>
              </template>
              <!-- 遍历子菜单 -->
              <el-menu-item v-for="child in menu.children" :key="child.path" :index="child.path">
                <el-icon>
                  <component :is="Icons[child.meta.icon as keyof typeof Icons]" />
                </el-icon>
                <span>{{ child.meta.title }}</span>
              </el-menu-item>
            </el-sub-menu>
            <!-- 如果是普通菜单 -->
            <el-menu-item v-else :index="menu.path">
              <el-icon>
                <component :is="Icons[menu.meta.icon as keyof typeof Icons]" />
              </el-icon>
              <span>{{ menu.meta.title }}</span>
            </el-menu-item>
          </template>
          <!-- 使用帮助 -->
          <!-- 使用帮助 -->
          <el-menu-item index="help" @click="openHelp">
            <el-icon>
              <QuestionFilled />
            </el-icon>
            <span>使用帮助</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="main-content cn-en-spacing" v-cn-en-spacing>
        <!-- 移动端顶部栏 -->
        <div v-if="isMobile" class="mobile-header">
          <div class="left-section">
            <el-button type="text" class="menu-toggle" @click="toggleMenu">
              <el-icon size="20">
                <Menu />
              </el-icon>
            </el-button>
            <h2 class="page-title">{{ getCurrentPageTitle() }}</h2>
          </div>
          <el-dropdown class="user-dropdown">
            <el-button type="text" class="user-btn">
              <el-icon>
                <User />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>{{ authStore.user?.username }}</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <router-view />
      </el-main>
    </el-container>
  </div>

  <!-- 全局备份/恢复进度弹窗 -->
  <el-dialog
    v-model="backupStore.showProgressDialog"
    :title="backupStore.taskType === 'backup' ? '备份进行中' : '数据库恢复中'"
    :width="isMobile ? '90%' : '600px'"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
  >
    <div class="backup-progress-content">
      <!-- 进度条 -->
      <el-progress
        :percentage="backupStore.progress?.progress || 0"
        :status="getProgressStatus()"
        :stroke-width="20"
      />

      <!-- 当前步骤 -->
      <div v-if="backupStore.progress?.current_step" class="progress-step">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span>{{ backupStore.progress.current_step }}</span>
      </div>

      <!-- 表处理进度 -->
      <div v-if="backupStore.progress?.total_tables" class="progress-tables">
        <span
          >已处理：{{ backupStore.progress.processed_tables || 0 }} /
          {{ backupStore.progress.total_tables }} 个表</span
        >
      </div>

      <!-- 时间信息 -->
      <div v-if="backupStore.progress?.elapsed_seconds !== undefined" class="progress-time">
        <div class="time-item">
          <span class="label">已耗时：</span>
          <span class="value">{{ formatDuration(backupStore.progress.elapsed_seconds) }}</span>
        </div>
        <div v-if="backupStore.progress.estimated_seconds" class="time-item">
          <span class="label">预计剩余：</span>
          <span class="value">{{
            formatDuration(
              backupStore.progress.estimated_seconds - backupStore.progress.elapsed_seconds,
            )
          }}</span>
        </div>
      </div>

      <!-- 错误重试提示 -->
      <el-alert
        v-if="backupStore.errorRetryCount > 0"
        :title="`网络异常，正在重试 (${backupStore.errorRetryCount}/${3})...`"
        type="warning"
        :closable="false"
        style="margin-top: 16px"
      />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { User, Menu, Loading, QuestionFilled } from '@element-plus/icons-vue'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBackupStore } from '@/stores/backup'
import { ElMessage, ElMessageBox } from 'element-plus'
import { isMobile as checkIsMobile, onDeviceTypeChange } from '@/utils/deviceUtils'
import { formatDuration } from '@/utils/timeUtils'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const backupStore = useBackupStore()
const isMobile = ref(false)
const isMenuOpen = ref(false)

// 导入所有图标
import * as Icons from '@element-plus/icons-vue'

// 定义菜单项类型
interface MenuItem {
  path: string
  name?: string
  meta: {
    title: string
    icon: string
    showInMenu: boolean
    parent?: string
  }
  children?: MenuItem[]
}

// 计算属性：生成菜单数据
const menuItems = computed(() => {
  // 使用 router.options.routes 保持路由定义的顺序
  type RouteConfig = {
    path: string
    name?: string
    meta?: {
      title: string
      requiresAuth: boolean
      parent?: string
      icon?: string
      showInMenu?: boolean
    }
    redirect?: string
  }
  const routes = router.options.routes as RouteConfig[]
  // 获取所有需要在菜单中显示的路由
  const allRoutes = routes.filter((route) => route.meta?.showInMenu)

  // 构建菜单结构
  const menuMap = new Map<string, MenuItem>()
  const rootMenus: MenuItem[] = []

  // 首先处理所有路由，构建菜单映射
  allRoutes.forEach((route) => {
    // 如果有父菜单
    if (route.meta?.parent) {
      // 确保父菜单存在
      if (!menuMap.has(route.meta.parent)) {
        // 查找父菜单路由
        const parentRoute = routes.find((r) => r.name === route.meta?.parent)
        if (parentRoute && parentRoute.meta) {
          const parentMenuItem: MenuItem = {
            path: parentRoute.path,
            name: typeof parentRoute.name === 'string' ? parentRoute.name : undefined,
            meta: {
              title: parentRoute.meta.title,
              icon: parentRoute.meta.icon || 'Setting',
              showInMenu: parentRoute.meta.showInMenu || false,
              parent: parentRoute.meta.parent,
            },
            children: [],
          }
          menuMap.set(route.meta.parent, parentMenuItem)
          rootMenus.push(parentMenuItem)
        }
      }
      // 将当前路由添加到父菜单的子菜单中
      if (route.meta.parent && menuMap.has(route.meta.parent) && route.meta) {
        const childMenuItem: MenuItem = {
          path: route.path,
          name: typeof route.name === 'string' ? route.name : undefined,
          meta: {
            title: route.meta.title,
            icon: route.meta.icon || 'Setting',
            showInMenu: route.meta.showInMenu || false,
            parent: route.meta.parent,
          },
        }
        menuMap.get(route.meta.parent)?.children?.push(childMenuItem)
      }
    } else if (route.meta) {
      // 没有父菜单，是一级菜单
      const routeNameKey = typeof route.name === 'string' ? route.name : ''
      if (!menuMap.has(routeNameKey)) {
        const menuItem: MenuItem = {
          path: route.path,
          name: typeof route.name === 'string' ? route.name : undefined,
          meta: {
            title: route.meta.title,
            icon: route.meta.icon || 'Setting',
            showInMenu: route.meta.showInMenu || false,
            parent: route.meta.parent,
          },
          children: [],
        }
        menuMap.set(routeNameKey, menuItem)
        rootMenus.push(menuItem)
      }
    }
  })

  return rootMenus
})

// 检测是否为移动设备
const checkMobile = () => {
  isMobile.value = checkIsMobile()
  if (!isMobile.value) {
    isMenuOpen.value = false
  }
}

// 切换菜单显示状态
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// 处理菜单选择，移动端选择后关闭菜单
const handleMenuSelect = () => {
  if (isMobile.value) {
    isMenuOpen.value = false
  }
}

// 处理登出
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // 用户取消
  }
}

// 获取当前页面标题
const getCurrentPageTitle = (): string => {
  return (route.meta.title as string) || '首页'
}

// 获取默认展开的子菜单
const getDefaultOpeneds = () => {
  const openeds = []
  if (route.path.startsWith('/settings') || route.path.startsWith('/proxy')) {
    openeds.push('/settings')
  }
  if (route.path.startsWith('/instant-upload') || route.path.startsWith('/media-import')) {
    openeds.push('/instant')
  }
  if (route.path.startsWith('/sync')) {
    openeds.push('/sync')
  }

  if (route.path.includes('upload-queue') || route.path.includes('download-queue')) {
    openeds.push('/upload-queue')
  }
  if (route.path.startsWith('/database/backup')) {
    openeds.push('database')
  }
  return openeds
}

// 获取进度状态样式
const getProgressStatus = () => {
  if (!backupStore.progress?.status) return undefined
  switch (backupStore.progress.status) {
    case 'completed':
      return 'success'
    case 'failed':
    case 'timeout':
      return 'exception'
    case 'cancelled':
      return 'warning'
    default:
      return undefined
  }
}

const openHelp = () => {
  window.open('https://qmediasync.cn/', '_blank')
}

// 组件挂载时加载数据
let removeDeviceTypeListener: (() => void) | null = null

onMounted(() => {
  checkMobile()
  removeDeviceTypeListener = onDeviceTypeChange((newIsMobile) => {
    isMobile.value = newIsMobile
    if (!newIsMobile) {
      isMenuOpen.value = false
    }
  })
})

onUnmounted(() => {
  if (removeDeviceTypeListener) {
    removeDeviceTypeListener()
  }
  // 清理轮询定时器
  backupStore.stopProgressPolling()
})
</script>

<style>
#app {
  font-family: var(--font-family-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--color-text-primary);
  height: 100vh;
  overflow: hidden;
}

.common-layout {
  height: 100vh;
}

.login-layout {
  height: 100vh;
}

.el-container {
  height: 100%;
  position: relative;
}

.el-aside {
  background-color: var(--color-bg-muted);
  transition: transform var(--duration-base) var(--ease-out);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.user-info {
  padding: var(--space-5) var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.qms-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.username {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  margin-bottom: var(--space-1);
  word-break: break-all;
  color: var(--color-text-primary);
}

.logout-btn {
  color: var(--color-text-tertiary) !important;
  font-size: var(--text-xs);
  padding: 0 !important;
  height: auto !important;
}

.logout-btn:hover {
  color: var(--brand-500) !important;
}

.el-menu-vertical {
  background-color: var(--color-bg-muted);
  flex: 1;
  border-right: none !important;
}

/* 菜单项对齐 — 文字和图标统一左对齐，右侧留出空间 */
.el-menu-vertical .el-menu-item,
.el-menu-vertical .el-sub-menu__title {
  padding: 0 var(--space-5) !important;
  height: 44px !important;
  line-height: 44px !important;
  display: flex !important;
  align-items: center !important;
  gap: var(--space-3);
  font-size: var(--text-sm) !important;
  color: var(--color-text-secondary) !important;
  position: relative;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.el-menu-vertical .el-menu-item .el-icon,
.el-menu-vertical .el-sub-menu__title .el-icon {
  margin-right: 0 !important;
  font-size: var(--text-lg);
  width: 20px;
  text-align: center;
}

/* 菜单 active 态 — 左侧色条 + 背景色 */
.el-menu-vertical .el-menu-item.is-active {
  background-color: var(--color-bg-elevated) !important;
  color: var(--brand-500) !important;
  font-weight: var(--weight-medium) !important;
}

.el-menu-vertical .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--brand-500);
}

/* 子菜单 active 态 */
.el-menu-vertical .el-sub-menu.is-active > .el-sub-menu__title {
  color: var(--brand-500) !important;
}

.el-menu-vertical .el-menu-item.is-active .el-icon {
  color: var(--brand-500);
}

/* 菜单项 hover 态 */
.el-menu-vertical .el-menu-item:hover,
.el-menu-vertical .el-sub-menu__title:hover {
  background-color: var(--color-bg-elevated) !important;
  color: var(--color-text-primary) !important;
}

/* 子菜单展开动画 */
.el-menu-vertical .el-sub-menu .el-menu-item {
  padding-left: var(--space-8) !important;
  font-size: var(--text-sm) !important;
  height: 40px !important;
  line-height: 40px !important;
}

.el-menu-vertical .el-sub-menu .el-menu-item .el-icon {
  font-size: var(--text-base);
}

.main-content {
  padding: var(--content-padding);
  background-color: var(--color-bg-elevated);
  overflow-y: auto;
  transition: margin-left var(--duration-base) var(--ease-out);
}

/* 移动端样式 */
@media (max-width: 768px) {
  .mobile-aside {
    position: fixed !important;
    top: 0;
    left: 0;
    height: 100vh !important;
    transform: translateX(-100%);
    z-index: 1001;
  }

  .mobile-aside-open {
    transform: translateX(0) !important;
  }

  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  .main-content {
    padding: var(--space-3);
    margin-left: 0 !important;
    width: 100% !important;
  }

  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-bg-elevated);
    padding: var(--space-3) var(--space-4);
    margin: calc(-1 * var(--space-3)) calc(-1 * var(--space-3)) var(--space-4)
      calc(-1 * var(--space-3));
    box-shadow: var(--shadow-sm);
    border-radius: 0 0 var(--radius-md) var(--radius-md);
  }

  .mobile-header .left-section {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  .menu-toggle {
    margin-right: var(--space-3);
    font-size: var(--text-xl);
    color: var(--color-text-secondary) !important;
  }

  .page-title {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
    color: var(--color-text-primary);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-dropdown {
    margin-left: var(--space-2);
    flex-shrink: 0;
  }

  .user-btn {
    color: var(--color-text-secondary) !important;
    font-size: var(--text-xl);
  }

  /* 移动端菜单项 — 覆盖桌面端样式 */
  .el-menu-vertical .el-menu-item,
  .el-menu-vertical .el-sub-menu__title {
    padding: 0 var(--space-4) !important;
    height: 52px !important;
    line-height: 52px !important;
    font-size: var(--text-base) !important;
  }

  .el-menu-vertical .el-menu-item .el-icon,
  .el-menu-vertical .el-sub-menu__title .el-icon {
    font-size: var(--text-xl);
    width: 22px;
  }

  .el-menu-vertical .el-sub-menu .el-menu-item {
    padding-left: var(--space-6) !important;
    height: 46px !important;
    line-height: 46px !important;
    font-size: var(--text-sm) !important;
  }

  .el-menu-vertical .el-sub-menu .el-menu-item .el-icon {
    font-size: var(--text-base);
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }
}

/* 桌面端隐藏移动端头部 */
@media (min-width: 769px) {
  .mobile-header {
    display: none;
  }
}

/* 平板端适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .main-content {
    padding: var(--space-4);
  }
}

/* 小屏移动设备优化 */
@media (max-width: 480px) {
  .mobile-aside {
    width: 280px !important;
  }

  .main-content {
    padding: var(--space-2);
  }

  .mobile-header {
    padding: var(--space-2) var(--space-3);
    margin: calc(-1 * var(--space-2)) calc(-1 * var(--space-2)) var(--space-3)
      calc(-1 * var(--space-2));
  }

  .page-title {
    font-size: var(--text-lg);
  }
}

/* 备份进度弹窗样式 */
.backup-progress-content {
  padding: var(--space-5) 0;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-5);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
}

.progress-tables {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  text-align: center;
}

.progress-time {
  display: flex;
  justify-content: space-around;
  margin-top: var(--space-4);
  padding: var(--space-3);
  background-color: var(--color-bg-muted);
  border-radius: var(--radius-sm);
}

.progress-time .time-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.progress-time .label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.progress-time .value {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--brand-500);
}
</style>
