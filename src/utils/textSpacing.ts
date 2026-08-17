/**
 * 中英文混排间距工具
 * 自动在中文字符与英文/数字之间添加空格，提升可读性
 */

/**
 * 对单个字符串添加中英文间距
 * 规则：中文字符紧跟英文/数字，或英文/数字紧跟中文字符时，在边界处插入空格
 */
export function addCnEnSpacing(text: string): string {
  if (!text) return ''
  return text
    .replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2')
    .replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2')
}

/**
 * 对整个元素树应用间距处理
 */
function processElementTree(el: HTMLElement) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
        return NodeFilter.FILTER_ACCEPT
      }
      return NodeFilter.FILTER_REJECT
    },
  })

  const textNodes: Text[] = []
  let node = walker.nextNode()
  while (node) {
    textNodes.push(node as Text)
    node = walker.nextNode()
  }

  for (const textNode of textNodes) {
    const original = textNode.nodeValue || ''
    const spaced = addCnEnSpacing(original)
    if (spaced !== original) {
      textNode.nodeValue = spaced
    }
  }
}

/**
 * 全局 MutationObserver — 持续监听 DOM 变化，对新增文本节点自动应用间距
 */
let globalObserver: MutationObserver | null = null

function ensureGlobalObserver() {
  if (globalObserver) return
  globalObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // 处理新增的节点
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          processElementTree(node as HTMLElement)
        } else if (node.nodeType === Node.TEXT_NODE) {
          const textNode = node as Text
          const original = textNode.nodeValue || ''
          const spaced = addCnEnSpacing(original)
          if (spaced !== original) {
            textNode.nodeValue = spaced
          }
        }
      })

      // 处理 characterData 变更（动态文本更新）
      if (mutation.type === 'characterData') {
        const textNode = mutation.target as Text
        const original = textNode.nodeValue || ''
        const spaced = addCnEnSpacing(original)
        if (spaced !== original) {
          textNode.nodeValue = spaced
        }
      }
    }
  })
}

/**
 * Vue 指令版本 — 在元素挂载时处理 + 启动持续监听
 * 使用方式：v-cn-en-spacing
 */
import type { Directive } from 'vue'

export const cnEnSpacing: Directive = {
  mounted(el: HTMLElement) {
    // 立即处理当前所有文本
    processElementTree(el)

    // 启动全局 MutationObserver 监听整个 body
    ensureGlobalObserver()
    if (document.body) {
      globalObserver!.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }
  },
  updated(el: HTMLElement) {
    processElementTree(el)
  },
  beforeUnmount() {
    // 注意：全局 observer 不会断开，因为可能有其他组件也在使用
    // 如果需要精确管理，可以在这里跟踪每个元素的 observer
  },
}

/**
 * composable 版本 — 用于在组件中处理响应式文本
 */
export function useCnEnSpacing() {
  return { addCnEnSpacing }
}
