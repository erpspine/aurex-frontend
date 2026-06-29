import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Edit,
  Eye,
  Plus,
  Settings,
  ShieldCheck,
  Smartphone,
  Target,
  ToggleLeft,
  ToggleRight,
  Trophy,
  UserCog,
  Users,
  Utensils,
  Wrench,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', name: 'Members', icon: Users },
  { id: 'plans', name: 'Membership Plans', icon: CreditCard },
  { id: 'trainers', name: 'Trainers', icon: UserCog },
  { id: 'exercises', name: 'Exercises', icon: Dumbbell },
  { id: 'body-parts', name: 'Body Parts', icon: Target },
  { id: 'equipment', name: 'Equipment', icon: Wrench },
  { id: 'workouts', name: 'Workouts', icon: Activity },
  { id: 'levels', name: 'Workout Levels', icon: Trophy },
  { id: 'diet', name: 'Diet Plans', icon: Utensils },
  { id: 'classes', name: 'Classes', icon: CalendarDays },
  { id: 'attendance', name: 'Attendance', icon: ClipboardList },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'users', name: 'Users & Roles', icon: ShieldCheck },
  { id: 'mobile', name: 'Mobile App', icon: Smartphone },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
]

const moduleIcons = {
  Activity,
  BarChart3,
  CalendarDays,
  Dumbbell,
  Utensils,
}

export default function MobileApp({ onNavigate, onLogout }) {
  const [mobileData, setMobileData] = useState({
    stats: {
      app_users: 0,
      active_devices: 0,
      push_notifications: 0,
      workout_starts: 0,
    },
    modules: [],
    home_sections: [],
    settings: [],
    banners: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let shouldUpdate = true

    const loadMobileApp = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/mobile-app`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })
        const payload = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            onLogout()
            return
          }

          throw new Error(payload.message || 'Unable to load mobile app data.')
        }

        if (shouldUpdate) setMobileData(payload)
      } catch (caughtError) {
        if (shouldUpdate) {
          setError(caughtError.message || 'Unable to load mobile app data.')
        }
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadMobileApp()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const heroBanner = useMemo(
    () => mobileData.banners?.[0] || null,
    [mobileData.banners],
  )

  const handleViewBanner = (banner) => {
    const statusColor = statusTone(banner.publish_status)
    const accentColor = banner.accent_color || '#C8A13A'
    const background =
      banner.background_style === 'Solid Color'
        ? banner.background_color || '#050505'
        : `linear-gradient(135deg, ${accentColor}, #8A6A18)`

    Swal.fire({
      title: '',
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:4px 2px 22px;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div style="display:flex;align-items:center;gap:16px;min-width:0">
              <div style="width:74px;height:74px;border-radius:22px;background:rgba(200,161,58,0.16);border:1px solid rgba(200,161,58,0.35);display:flex;align-items:center;justify-content:center;color:#C8A13A;font-size:30px;font-weight:900">BN</div>
              <div style="min-width:0">
                <div style="font-size:29px;font-weight:900;line-height:1.15;overflow-wrap:anywhere">${escapeHtml(banner.title)}</div>
                <div style="color:#9ca3af;font-size:14px;margin-top:7px">${escapeHtml(banner.banner_type)} | ${escapeHtml(banner.target_audience)} | Order #${escapeHtml(banner.display_order)}</div>
              </div>
            </div>
            <span style="white-space:nowrap;border-radius:999px;background:${statusColor}22;color:${statusColor};font-size:12px;font-weight:900;padding:8px 11px">${escapeHtml(banner.publish_status)}</span>
          </div>

          ${
            banner.image_url
              ? `<div style="height:220px;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);margin-top:18px">
                  <img src="${escapeHtml(banner.image_url)}" alt="${escapeHtml(banner.title)}" style="display:block;width:100%;height:100%;object-fit:cover" />
                </div>`
              : ''
          }

          <div style="margin-top:18px;background:#050505;border:1px solid rgba(255,255,255,0.1);border-radius:22px;padding:18px">
            <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Mobile Preview</div>
            <div style="max-width:330px;border-radius:26px;background:#000;border:4px solid #222;padding:14px;margin:auto">
              <div style="height:150px;border-radius:22px;background:${background};color:#050505;padding:18px;display:flex;flex-direction:column;justify-content:space-between;text-align:${String(banner.text_alignment || 'Left').toLowerCase()}">
                <div>
                  <div style="font-size:22px;font-weight:900;line-height:1.12;overflow-wrap:anywhere">${escapeHtml(banner.title)}</div>
                  <div style="font-size:12px;margin-top:8px;line-height:1.35">${escapeHtml(banner.subtitle || 'No subtitle')}</div>
                </div>
                <span style="background:#000;color:#C8A13A;font-size:12px;font-weight:900;padding:8px 12px;border-radius:12px;width:max-content;max-width:100%">${escapeHtml(banner.button_text || 'Open')}</span>
              </div>
            </div>
          </div>

          <div class="mobile-banner-modal-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px">
            ${metricCard('Priority', banner.priority || 'Normal')}
            ${metricCard('Audience', banner.target_audience || 'All Users')}
            ${metricCard('Dismiss', banner.allow_dismiss ? 'Allowed' : 'Locked')}
            ${metricCard('Visible', banner.show_in_mobile_app ? 'Yes' : 'No')}
          </div>

          <div class="mobile-banner-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
            ${detailCard('Button Action', banner.button_action || 'Not set')}
            ${detailCard('Action URL / Route', banner.action_url || 'Not set')}
            ${detailCard('Start Date', formatBannerDate(banner.start_date))}
            ${detailCard('End Date', formatBannerDate(banner.end_date))}
            ${detailCard('Background Style', banner.background_style || 'Not set')}
            ${detailCard('Text Alignment', banner.text_alignment || 'Not set')}
            ${detailCard('Background Color', banner.background_color || 'Not set')}
            ${detailCard('Accent Color', banner.accent_color || 'Not set')}
          </div>

          ${banner.description ? noteCard('Description', banner.description) : ''}
        </div>
      `,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      confirmButtonText: 'Close',
      width: 920,
      customClass: {
        popup: 'aurex-mobile-banner-modal',
      },
    })
  }

  const handleViewModule = (module) => {
    const statusColor = module.status === 'Enabled' ? '#4ade80' : '#fdba74'
    const route = moduleRouteLabel(module.name)

    Swal.fire({
      title: '',
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:4px 2px 22px;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div style="display:flex;align-items:center;gap:16px;min-width:0">
              <div style="width:74px;height:74px;border-radius:22px;background:rgba(200,161,58,0.16);border:1px solid rgba(200,161,58,0.35);display:flex;align-items:center;justify-content:center;color:#C8A13A;font-size:30px;font-weight:900">MD</div>
              <div style="min-width:0">
                <div style="font-size:29px;font-weight:900;line-height:1.15;overflow-wrap:anywhere">${escapeHtml(module.name)}</div>
                <div style="color:#9ca3af;font-size:14px;margin-top:7px">Mobile app content module</div>
              </div>
            </div>
            <span style="white-space:nowrap;border-radius:999px;background:${statusColor}22;color:${statusColor};font-size:12px;font-weight:900;padding:8px 11px">${escapeHtml(module.status)}</span>
          </div>

          <div class="mobile-module-modal-grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px">
            ${metricCard('Content', module.items || '0 items')}
            ${metricCard('Admin Source', route)}
            ${metricCard('Visibility', module.status === 'Enabled' ? 'Visible' : 'Hidden')}
          </div>

          <div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
            <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">How this module works</div>
            <div style="color:#d1d5db;font-size:14px;line-height:1.65">
              This module appears in the mobile app and pulls its content from the linked admin area. Records marked visible for the mobile app are counted and exposed to members based on their access rules.
            </div>
          </div>

          <div class="mobile-module-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
            ${detailCard('Current Status', module.status || 'Not set')}
            ${detailCard('Linked Admin Page', route)}
            ${detailCard('Displayed Items', module.items || 'Not set')}
            ${detailCard('Module Icon', module.icon || 'Not set')}
          </div>
        </div>
      `,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      confirmButtonText: 'Close',
      width: 820,
      customClass: {
        popup: 'aurex-mobile-module-modal',
      },
    })
  }

  const handleEditModule = (module) => {
    const route = moduleRoute(module.name)

    if (route) {
      onNavigate(route)
      return
    }

    Swal.fire({
      title: 'Edit module',
      text: `${module.name} does not have a linked admin page yet.`,
      icon: 'info',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
    })
  }

  const handleModuleSettings = (module) => {
    Swal.fire({
      title: `${module.name} settings`,
      html: `
        <div style="text-align:left;color:#d1d5db">
          ${detailRow('Current Status', module.status)}
          ${detailRow('Displayed Items', module.items)}
          ${detailRow('Admin Page', moduleRouteLabel(module.name))}
          <div style="margin-top:14px;background:rgba(200,161,58,0.1);border:1px solid rgba(200,161,58,0.25);border-radius:16px;padding:14px;color:#d1d5db;font-size:14px;line-height:1.6">
            Module content is controlled by its linked admin page and records marked visible for the mobile app.
          </div>
        </div>
      `,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      confirmButtonText: 'Close',
      width: 620,
    })
  }

  const handleToggleModule = async (module) => {
    const nextStatus = module.status === 'Enabled' ? 'Disabled' : 'Enabled'

    setMobileData((current) => ({
      ...current,
      modules: current.modules.map((item) =>
        item.name === module.name ? { ...item, status: nextStatus } : item,
      ),
    }))

    await Swal.fire({
      title: `${module.name} ${nextStatus.toLowerCase()}`,
      text: 'This updates the module state on this dashboard. Persistent module settings can be added to the backend when needed.',
      icon: 'success',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
    })
  }

  const handleManageSection = (section) => {
    if (section === 'Hero Banner') {
      Swal.fire({
        title: 'Hero Banner',
        html: `
          <div style="text-align:left;color:#d1d5db">
            <div style="margin-bottom:14px">Manage mobile app banners from the App Banners panel or create a new banner.</div>
            ${mobileData.banners.length ? mobileData.banners.map((banner) => detailRow(banner.title, `${banner.banner_type} - ${banner.publish_status}`)).join('') : detailRow('Banners', 'No banners added yet')}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Add Banner',
        cancelButtonText: 'Close',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
        cancelButtonColor: '#2a2a2a',
        width: 640,
      }).then((result) => {
        if (result.isConfirmed) onNavigate('add-banner')
      })
      return
    }

    const route = sectionRoute(section)

    if (route) {
      onNavigate(route)
      return
    }

    Swal.fire({
      title: section,
      text: 'This home section does not have a linked management page yet.',
      icon: 'info',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
    })
  }

  const handleDeleteBanner = async (banner) => {
    const confirmation = await Swal.fire({
      title: 'Delete banner?',
      text: `${banner.title} will be removed permanently.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      cancelButtonColor: '#2a2a2a',
    })

    if (!confirmation.isConfirmed) return

    try {
      const response = await fetch(`${apiBaseUrl}/app-banners/${banner.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to delete banner.')
      }

      setMobileData((current) => ({
        ...current,
        banners: current.banners.filter((item) => item.id !== banner.id),
      }))

      await Swal.fire({
        title: 'Banner deleted',
        text: payload.message || 'App banner deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete banner.',
        icon: 'error',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <aside className="hidden lg:flex w-72 bg-[#090909] border-r border-white/10 p-5 flex-col">
        <div className="mb-8 px-2">
          <h1 className="text-3xl font-black tracking-wide">
            AUR<span className="text-[#C8A13A]">EX</span>
          </h1>
          <p className="text-[#C8A13A] text-xs tracking-[0.25em]">
            PERFORMANCE ARENA
          </p>
        </div>

        <nav className="space-y-1 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = item.id === 'mobile'

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition text-sm ${
                  active
                    ? 'bg-[#C8A13A] text-black font-bold shadow-lg shadow-[#C8A13A]/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-6 bg-[#111] rounded-2xl p-4 border border-white/10">
          <p className="text-xs text-gray-500">Mobile App</p>
          <h3 className="text-xl font-bold mt-1">
            {mobileData.stats.active_devices}
          </h3>
          <p className="text-xs text-[#C8A13A] mt-1">active devices</p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-5 flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      <main className="flex-1 min-w-0 bg-gradient-to-br from-[#050505] via-[#080808] to-[#111] p-5 sm:p-8 overflow-y-auto">
        <div className="lg:hidden bg-[#090909] border border-white/10 rounded-3xl p-3 mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = item.id === 'mobile'

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm ${
                    active
                      ? 'bg-[#C8A13A] text-black font-bold'
                      : 'text-gray-400 bg-white/5'
                  }`}
                >
                  <Icon size={17} />
                  {item.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black">Mobile App</h1>
            <p className="text-gray-400 mt-1">
              Manage what users see in the AUREX fitness mobile app.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('add-banner')}
            className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add App Banner
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Users} title="App Users" value={mobileData.stats.app_users} />
          <StatCard
            icon={Smartphone}
            title="Active Devices"
            value={mobileData.stats.active_devices}
          />
          <StatCard
            icon={Bell}
            title="Push Notifications"
            value={mobileData.stats.push_notifications}
          />
          <StatCard
            icon={Activity}
            title="Workout Starts"
            value={mobileData.stats.workout_starts}
          />
        </div>

        {isLoading && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 mb-6 text-center text-gray-400">
            Loading mobile app data...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 mb-6 text-center text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-5">App Modules</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {mobileData.modules.map((module) => {
                  const Icon = moduleIcons[module.icon] || Dumbbell

                  return (
                    <div
                      key={module.name}
                      className="bg-[#050505] border border-white/10 rounded-3xl p-5 hover:border-[#C8A13A]/60 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center">
                          <Icon size={22} className="text-[#C8A13A]" />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C8A13A]">
                            {module.status}
                          </span>
                          <button
                            type="button"
                            title={`Toggle ${module.name}`}
                            aria-label={`Toggle ${module.name}`}
                            onClick={() => handleToggleModule(module)}
                            className="text-[#C8A13A] hover:text-white"
                          >
                            {module.status === 'Enabled' ? (
                              <ToggleRight size={30} />
                            ) : (
                              <ToggleLeft size={30} />
                            )}
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-black mt-5">{module.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{module.items}</p>

                      <div className="flex gap-2 mt-5">
                        <ActionButton
                          icon={Eye}
                          label="View module"
                          onClick={() => handleViewModule(module)}
                        />
                        <ActionButton
                          icon={Edit}
                          label="Edit module"
                          onClick={() => handleEditModule(module)}
                        />
                        <ActionButton
                          icon={Settings}
                          label="Module settings"
                          onClick={() => handleModuleSettings(module)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-5">Home Screen Sections</h2>

              {mobileData.home_sections.map((item, index) => (
                <div
                  key={item}
                  className="flex justify-between items-center gap-4 py-4 border-b border-white/10 last:border-b-0"
                >
                  <div>
                    <h4 className="font-bold">{item}</h4>
                    <p className="text-gray-500 text-sm">
                      Display order #{index + 1}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleManageSection(item)}
                    className="text-[#C8A13A] font-bold text-sm"
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#111] border border-[#C8A13A]/50 rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-5">Mobile Preview</h2>

              <div className="mx-auto w-full max-w-[260px] h-[540px] rounded-[36px] bg-black border-4 border-[#222] p-4">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="text-xl font-black">
                      AUR<span className="text-[#C8A13A]">EX</span>
                    </h3>
                    <p className="text-gray-500 text-xs">Welcome back</p>
                  </div>
                  <div className="w-9 h-9 bg-[#C8A13A] rounded-full" />
                </div>

                <div className="h-28 rounded-3xl bg-[#C8A13A] text-black p-4 mb-4">
                  <h4 className="font-black">
                    {heroBanner?.title || 'Today Workout'}
                  </h4>
                  <p className="text-xs mt-1">
                    {heroBanner?.subtitle || 'Upper Body Strength'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <MiniAppCard title="Body Parts" />
                  <MiniAppCard title="Equipment" />
                  <MiniAppCard title="Workouts" />
                  <MiniAppCard title="Diet" />
                </div>

                <div className="bg-[#111] rounded-3xl p-4">
                  <p className="text-sm font-bold">Progress</p>
                  <div className="h-2 bg-[#222] rounded-full mt-3">
                    <div className="h-2 w-2/3 bg-[#C8A13A] rounded-full" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">68% weekly goal</p>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-5">App Settings</h2>

              {mobileData.settings.map((setting) => (
                <SettingRow
                  key={setting.label}
                  label={setting.label}
                  value={setting.value}
                />
              ))}
            </div>

            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-5">App Banners</h2>
              <div className="space-y-4">
                {mobileData.banners.length === 0 && (
                  <p className="text-gray-400 text-sm">No banners added yet.</p>
                )}
                {mobileData.banners.map((banner) => (
                  <div
                    key={banner.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleViewBanner(banner)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        handleViewBanner(banner)
                      }
                    }}
                    className="bg-[#050505] border border-white/10 rounded-2xl p-4 cursor-pointer hover:border-[#C8A13A]/60 transition"
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold truncate">{banner.title}</h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {banner.banner_type} - {banner.publish_status}
                        </p>
                      </div>
                      <span className="text-xs text-[#C8A13A] font-bold">
                        #{banner.display_order}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <ActionButton
                        icon={Eye}
                        label="View banner"
                        onClick={() => handleViewBanner(banner)}
                      />
                      <ActionButton
                        icon={Edit}
                        label="Edit banner"
                        onClick={() => onNavigate('add-banner')}
                      />
                      <ActionButton
                        icon={Settings}
                        label="Delete banner"
                        onClick={() => handleDeleteBanner(banner)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, title, value }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
      <div className="w-12 h-12 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center mb-4">
        <Icon className="text-[#C8A13A]" size={22} />
      </div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-2xl font-black mt-1">{value}</h3>
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
      className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-gray-400 hover:text-[#C8A13A] hover:bg-white/5"
    >
      <Icon size={17} />
    </button>
  )
}

function detailRow(label, value) {
  return `
    <div style="display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid rgba(255,255,255,0.1);padding:12px 0">
      <span style="color:#8f8f8f">${escapeHtml(label)}</span>
      <strong style="color:#fff;text-align:right">${escapeHtml(value || 'Not set')}</strong>
    </div>
  `
}

function metricCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;min-width:0">
      <div style="color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase">${escapeHtml(label)}</div>
      <div style="color:#ffffff;font-size:17px;font-weight:900;margin-top:8px;overflow-wrap:anywhere">${escapeHtml(String(value || 'Not set'))}</div>
    </div>
  `
}

function detailCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;min-width:0">
      <div style="color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase">${escapeHtml(label)}</div>
      <div style="color:#d1d5db;font-size:14px;font-weight:700;margin-top:7px;overflow-wrap:anywhere">${escapeHtml(String(value || 'Not set'))}</div>
    </div>
  `
}

function noteCard(label, value) {
  return `
    <div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
      <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">${escapeHtml(label)}</div>
      <div style="color:#d1d5db;font-size:14px;line-height:1.65">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
}

function statusTone(status) {
  if (status === 'Published') return '#4ade80'
  if (status === 'Draft') return '#93c5fd'
  return '#fdba74'
}

function formatBannerDate(value) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function moduleRoute(name) {
  const routes = {
    'Body Part Exercises': 'body-parts',
    'Equipment Exercises': 'exercises',
    Workouts: 'workouts',
    'Workout Levels': 'levels',
    'Diet Plans': 'diet',
    'Class Booking': 'classes',
  }

  return routes[name] || null
}

function moduleRouteLabel(name) {
  const route = moduleRoute(name)

  if (!route) return 'Not linked'

  const labels = {
    'body-parts': 'Body Parts',
    exercises: 'Exercises',
    workouts: 'Workouts',
    levels: 'Workout Levels',
    diet: 'Diet Plans',
    classes: 'Classes',
  }

  return labels[route] || route
}

function sectionRoute(section) {
  const routes = {
    'Today Workout': 'workouts',
    'Body Part Exercises': 'body-parts',
    'Equipment Based Exercises': 'exercises',
    'Popular Workouts': 'workouts',
    'Diet Plan Suggestions': 'diet',
    'Class Schedule': 'classes',
  }

  return routes[section] || null
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function MiniAppCard({ title }) {
  return (
    <div className="bg-[#111] rounded-2xl p-3">
      <p className="text-xs font-bold">{title}</p>
      <p className="text-[10px] text-gray-500 mt-1">Open</p>
    </div>
  )
}

function SettingRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-4 border-b border-white/10 last:border-b-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-[#C8A13A] font-bold">{value}</span>
    </div>
  )
}
