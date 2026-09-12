import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

const storageKey = 'aurex_sidebar_collapsed'
const collapsedClass = 'aurex-sidebar-collapsed'

export default function GlobalSidebarToggle() {
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(storageKey) === 'true',
  )
  const [isVisible, setIsVisible] = useState(false)
  const [mountNode, setMountNode] = useState(null)

  useEffect(() => {
    localStorage.setItem(storageKey, String(isCollapsed))
    document.body.classList.toggle(collapsedClass, isCollapsed)
  }, [isCollapsed])

  useEffect(() => {
    const syncVisibility = () => {
      const sidebar = document.querySelector('aside.hidden.lg\\:flex')
      const logoBlock = sidebar?.querySelector(':scope > div.mb-8') ?? null

      setIsVisible(Boolean(sidebar))
      setMountNode(logoBlock)
    }

    syncVisibility()

    const observer = new MutationObserver(syncVisibility)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    window.addEventListener('resize', syncVisibility)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncVisibility)
    }
  }, [])

  if (!isVisible) {
    return null
  }

  if (!mountNode) {
    return null
  }

  return createPortal(
    <div className="mt-4 flex justify-center">
      <button
        type="button"
        onClick={() => setIsCollapsed((current) => !current)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-[#0f0f0f]/90 text-gray-200 hover:border-[#C8A13A] hover:text-[#C8A13A] backdrop-blur-sm"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        <span className="text-xs font-semibold">
          {isCollapsed ? 'Expand' : 'Collapse'}
        </span>
      </button>
    </div>,
    mountNode,
  )
}