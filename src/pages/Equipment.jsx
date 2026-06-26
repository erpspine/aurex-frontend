import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Edit,
  Eye,
  Filter,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  Trophy,
  UserCog,
  Users,
  Utensils,
  Wrench,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', name: 'Members', icon: Users },
  { id: 'plans', name: 'Membership Plans', icon: CreditCard },
  { id: 'trainers', name: 'Trainers', icon: UserCog },
  { id: 'exercises', name: 'Exercises', icon: Dumbbell },
  { id: 'body-parts', name: 'Body Parts', icon: Wrench },
  { id: 'equipment', name: 'Equipment', icon: Wrench },
  { id: 'workouts', name: 'Workouts', icon: Activity },
  { id: 'levels', name: 'Workout Levels', icon: Trophy },
  { id: 'diet', name: 'Diet Plans', icon: Utensils },
  { id: 'classes', name: 'Classes', icon: CalendarDays },
  { id: 'attendance', name: 'Attendance', icon: ClipboardList },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'mobile', name: 'Mobile App', icon: Smartphone },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
]

const categories = [
  'All Categories',
  'Machines',
  'Free Weights',
  'Cardio',
  'Benches',
  'Accessories',
]

export default function Equipment({ onNavigate, onLogout }) {
  const [equipment, setEquipment] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [statusFilter, setStatusFilter] = useState('All Status')

  useEffect(() => {
    let shouldUpdate = true

    const loadEquipment = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/equipment`, {
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

          throw new Error(payload.message || 'Unable to load equipment.')
        }

        if (shouldUpdate) setEquipment(payload.equipment || [])
      } catch (caughtError) {
        if (shouldUpdate) {
          setError(caughtError.message || 'Unable to load equipment.')
        }
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadEquipment()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const filteredEquipment = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return equipment.filter((item) => {
      const matchesSearch =
        !search ||
        item.name?.toLowerCase().includes(search) ||
        item.category?.toLowerCase().includes(search) ||
        item.location?.toLowerCase().includes(search) ||
        item.serial_number?.toLowerCase().includes(search)
      const matchesCategory =
        categoryFilter === 'All Categories' || item.category === categoryFilter
      const matchesStatus =
        statusFilter === 'All Status' || item.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [categoryFilter, equipment, searchTerm, statusFilter])

  const stats = useMemo(
    () => ({
      total: equipment.length,
      active: equipment.filter((item) => item.status === 'Active').length,
      maintenance: equipment.filter((item) => item.status === 'Maintenance')
        .length,
      linkedExercises: equipment.reduce(
        (sum, item) => sum + Number(item.linked_exercises || 0),
        0,
      ),
    }),
    [equipment],
  )

  const handleViewEquipment = (item) => {
    const statusColor = statusTone(item.status)

    Swal.fire({
      title: '',
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:4px 2px 22px;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div style="display:flex;align-items:center;gap:16px;min-width:0">
              <div style="width:70px;height:70px;border-radius:20px;background:rgba(200,161,58,0.16);border:1px solid rgba(200,161,58,0.35);display:flex;align-items:center;justify-content:center;color:#C8A13A;font-size:30px;font-weight:900">
                ${equipmentIcon(item.category)}
              </div>
              <div style="min-width:0">
                <div style="font-size:27px;font-weight:900;line-height:1.15;overflow-wrap:anywhere">${escapeHtml(item.name)}</div>
                <div style="color:#9ca3af;font-size:14px;margin-top:7px">${escapeHtml(item.category)} - ${escapeHtml(item.location || 'No location')}</div>
              </div>
            </div>
            <span style="display:inline-flex;align-items:center;white-space:nowrap;border-radius:999px;background:${statusColor}22;color:${statusColor};font-size:12px;font-weight:900;padding:8px 11px">
              ${escapeHtml(item.status)}
            </span>
          </div>

          <div class="equipment-modal-grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px">
            ${metricCard('Exercises', item.linked_exercises || 0)}
            ${metricCard('Priority', item.maintenance_priority || 'Low')}
            ${metricCard('Next Service', formatDate(item.next_service_date))}
          </div>

          <div class="equipment-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
            ${detailCard('Brand', item.brand || 'Not set')}
            ${detailCard('Model', item.model || 'Not set')}
            ${detailCard('Serial Number', item.serial_number || 'Not set')}
            ${detailCard('Purchase Price', formatCurrency(item.purchase_price))}
            ${detailCard('Primary Muscle', item.primary_muscle_group || 'Not set')}
            ${detailCard('Secondary Muscle', item.secondary_muscle_group || 'Not set')}
          </div>

          <div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
            <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:13px">Maintenance</div>
            <div class="equipment-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
              ${compactRow('Purchase Date', formatDate(item.purchase_date))}
              ${compactRow('Last Service', formatDate(item.last_service_date))}
              ${compactRow('Next Service', formatDate(item.next_service_date))}
              ${compactRow('Supported Level', item.supported_level || 'Not set')}
            </div>
          </div>

          <div style="margin-top:18px;background:rgba(200,161,58,0.09);border:1px solid rgba(200,161,58,0.25);border-radius:18px;padding:16px">
            <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Mobile App</div>
            <div class="equipment-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
              ${compactRow('Visible', item.show_in_mobile_app ? 'Yes' : 'No')}
              ${compactRow('Access Type', item.access_type || 'Not set')}
              ${compactRow('Publish Status', item.publish_status || 'Not set')}
              ${compactRow('Location', item.location || 'Not set')}
            </div>
          </div>

          ${operationVideoBlock(item.operation_video_url)}

          ${
            item.description || item.safety_instructions
              ? `<div class="equipment-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
                  ${noteCard('Description', item.description || 'Not set')}
                  ${noteCard('Safety Instructions', item.safety_instructions || 'Not set')}
                </div>`
              : ''
          }
        </div>
      `,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      confirmButtonText: 'Close',
      width: 820,
      customClass: {
        popup: 'aurex-equipment-modal',
      },
    })
  }

  const handleDeleteEquipment = async (item) => {
    const confirmation = await Swal.fire({
      title: 'Delete equipment?',
      text: `${item.name} will be removed permanently.`,
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
      const response = await fetch(`${apiBaseUrl}/equipment/${item.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to delete equipment.')
      }

      setEquipment((current) => current.filter((entry) => entry.id !== item.id))

      await Swal.fire({
        title: 'Equipment deleted',
        text: payload.message || 'Equipment deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete equipment.',
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

        <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = item.id === 'equipment'

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
          <p className="text-xs text-gray-500">Total Equipment</p>
          <h3 className="text-xl font-bold mt-1">{stats.total}</h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {stats.active} active items
          </p>
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
            {menuItems.slice(0, 8).map((item) => {
              const Icon = item.icon
              const active = item.id === 'equipment'

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

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black">Equipment</h1>
            <p className="text-gray-400 mt-1">
              Manage gym equipment, machines and linked exercises.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('add-equipment')}
            className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Equipment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Dumbbell} title="Total Equipment" value={stats.total} />
          <StatCard
            icon={ShieldCheck}
            title="Active Equipment"
            value={stats.active}
          />
          <StatCard icon={Wrench} title="Maintenance" value={stats.maintenance} />
          <StatCard
            icon={Activity}
            title="Linked Exercises"
            value={stats.linkedExercises}
          />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder:text-gray-600"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-gray-300 outline-none [color-scheme:dark]"
            >
              {categories.map((item) => (
                <option key={item} className="bg-[#050505] text-white">
                  {item}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-gray-300 outline-none [color-scheme:dark]"
            >
              {['All Status', 'Active', 'Maintenance', 'Inactive', 'Damaged'].map(
                (item) => (
                  <option key={item} className="bg-[#050505] text-white">
                    {item}
                  </option>
                ),
              )}
            </select>

            <button
              type="button"
              className="border border-white/10 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-gray-300 hover:border-[#C8A13A]"
            >
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategoryFilter(item)}
              className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap ${
                categoryFilter === item
                  ? 'bg-[#C8A13A] text-black'
                  : 'bg-[#111] border border-white/10 text-gray-400'
              }`}
            >
              {item.replace('All Categories', 'All')}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            Loading equipment...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredEquipment.length === 0 && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            No equipment found.
          </div>
        )}

        {!isLoading && !error && filteredEquipment.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredEquipment.map((item) => (
              <div
                key={item.id}
                className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden hover:border-[#C8A13A]/60 transition"
              >
                <div className="h-44 bg-gradient-to-br from-[#151515] to-black flex items-center justify-center relative">
                  <Settings size={70} className="text-[#C8A13A]" />

                  <span
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === 'Active'
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-orange-500/15 text-orange-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-black">{item.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{item.category}</p>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <MiniBox label="Exercises" value={item.linked_exercises} />
                    <MiniBox label="Location" value={item.location || 'Not set'} />
                  </div>

                  <div className="flex gap-2 mt-5">
                    <ActionButton
                      icon={Eye}
                      onClick={() => handleViewEquipment(item)}
                    />
                    <ActionButton
                      icon={Edit}
                      onClick={() => onNavigate('edit-equipment', item.id)}
                    />
                    <ActionButton
                      icon={Trash2}
                      danger
                      onClick={() => handleDeleteEquipment(item)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function equipmentIcon(category) {
  const icons = {
    Machines: 'M',
    'Free Weights': 'F',
    Cardio: 'C',
    Benches: 'B',
    Accessories: 'A',
  }

  return icons[category] || 'E'
}

function statusTone(status) {
  if (status === 'Active') return '#22c55e'
  if (status === 'Maintenance') return '#f59e0b'
  if (status === 'Damaged') return '#ef4444'

  return '#9ca3af'
}

function metricCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:15px">
      <div style="color:#8f8f8f;font-size:12px;font-weight:800;margin-bottom:7px">${escapeHtml(label)}</div>
      <div style="color:#C8A13A;font-size:18px;font-weight:900;overflow-wrap:anywhere">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
}

function detailCard(label, value) {
  return `
    <div style="background:#0b0b0b;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;min-width:0">
      <div style="color:#8f8f8f;font-size:12px;font-weight:800;margin-bottom:7px">${escapeHtml(label)}</div>
      <div style="color:#ffffff;font-size:15px;font-weight:800;overflow-wrap:anywhere">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
}

function compactRow(label, value) {
  return `
    <div>
      <div style="color:#8f8f8f;font-size:12px;font-weight:800;margin-bottom:5px">${escapeHtml(label)}</div>
      <div style="color:#ffffff;font-size:14px;font-weight:800;overflow-wrap:anywhere">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
}

function noteCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px;min-width:0">
      <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:9px">${escapeHtml(label)}</div>
      <div style="color:#d1d5db;font-size:14px;line-height:1.7;overflow-wrap:anywhere">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
}

function operationVideoBlock(url) {
  if (!url) return ''

  const embedUrl = toEmbedUrl(url)

  if (!embedUrl) {
    return `
      <div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
        <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Operation Video</div>
        <a href="${escapeHtml(url)}" target="_blank" rel="noreferrer" style="color:#C8A13A;font-weight:900;overflow-wrap:anywhere">Open operation video</a>
      </div>
    `
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return `
      <div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
        <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Operation Video</div>
        <video controls style="width:100%;aspect-ratio:16/9;border-radius:14px;background:#000">
          <source src="${escapeHtml(url)}" />
        </video>
      </div>
    `
  }

  return `
    <div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
      <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Operation Video</div>
      <iframe title="Equipment operation video" src="${escapeHtml(embedUrl)}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:14px;background:#000" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
  `
}

function toEmbedUrl(url) {
  if (!url) return ''

  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
    }

    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace('/', '')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const videoId = parsed.pathname.split('/').filter(Boolean).pop()
      return videoId ? `https://player.vimeo.com/video/${videoId}` : ''
    }

    if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) {
      return url
    }
  } catch {
    return ''
  }

  return ''
}

function formatCurrency(value) {
  if (!value) return 'Not set'

  return `TZS ${Number(value).toLocaleString()}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatDate(value) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
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

function MiniBox({ label, value }) {
  return (
    <div className="bg-[#050505] border border-white/10 rounded-2xl p-3">
      <p className="text-gray-500 text-xs">{label}</p>
      <h4 className="font-bold text-sm mt-1 break-words">{value}</h4>
    </div>
  )
}

function ActionButton({ icon: Icon, danger = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 ${
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-gray-400 hover:text-[#C8A13A] hover:bg-white/5'
      }`}
    >
      <Icon size={17} />
    </button>
  )
}
