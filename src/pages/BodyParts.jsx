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
  Image,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Smartphone,
  Target,
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
  { id: 'body-parts', name: 'Body Parts', icon: Target },
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

export default function BodyParts({ onNavigate, onLogout }) {
  const [bodyParts, setBodyParts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')

  useEffect(() => {
    let shouldUpdate = true

    const loadBodyParts = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/body-parts`, {
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

          throw new Error(payload.message || 'Unable to load body parts.')
        }

        if (shouldUpdate) setBodyParts(payload.body_parts || [])
      } catch (caughtError) {
        if (shouldUpdate) {
          setError(caughtError.message || 'Unable to load body parts.')
        }
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadBodyParts()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const filteredBodyParts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return bodyParts.filter((item) => {
      const matchesSearch =
        !search ||
        item.name?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      const matchesStatus =
        statusFilter === 'All Status' || item.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [bodyParts, searchTerm, statusFilter])

  const stats = useMemo(
    () => ({
      total: bodyParts.length,
      active: bodyParts.filter((item) => item.status === 'Active').length,
      images: bodyParts.filter((item) => item.image_url).length,
      exercises: bodyParts.reduce(
        (sum, item) => sum + Number(item.exercises_count || 0),
        0,
      ),
    }),
    [bodyParts],
  )

  const handleViewBodyPart = (item) => {
    Swal.fire({
      title: '',
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          ${
            item.image_url
              ? `<div style="height:240px;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);margin-bottom:18px">
                  <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" style="display:block;width:100%;height:100%;object-fit:cover" />
                </div>`
              : ''
          }
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div>
              <div style="font-size:30px;font-weight:900;line-height:1.15">${escapeHtml(item.name)}</div>
              <div style="color:#9ca3af;font-size:14px;margin-top:8px">${escapeHtml(item.exercises_count || 0)} linked exercises</div>
            </div>
            <span style="white-space:nowrap;border-radius:999px;background:rgba(200,161,58,0.16);color:#C8A13A;font-size:12px;font-weight:900;padding:8px 11px">${escapeHtml(item.status)}</span>
          </div>
          ${
            item.description
              ? `<div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px;color:#d1d5db;line-height:1.65">${escapeHtml(item.description)}</div>`
              : ''
          }
        </div>
      `,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      confirmButtonText: 'Close',
      width: 760,
    })
  }

  const handleDeleteBodyPart = async (item) => {
    const confirmation = await Swal.fire({
      title: 'Delete body part?',
      text: `${item.name} will be removed. Linked exercises will keep their text label.`,
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
      const response = await fetch(`${apiBaseUrl}/body-parts/${item.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to delete body part.')
      }

      setBodyParts((current) => current.filter((entry) => entry.id !== item.id))

      await Swal.fire({
        title: 'Body part deleted',
        text: payload.message || 'Body part deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete body part.',
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
            const active = item.id === 'body-parts'

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
              const active = item.id === 'body-parts'

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
            <h1 className="text-4xl font-black">Body Parts</h1>
            <p className="text-gray-400 mt-1">
              Manage body-part categories and images used by exercises.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('add-body-part')}
            className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Body Part
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Target} title="Total Body Parts" value={stats.total} />
          <StatCard icon={Activity} title="Active" value={stats.active} />
          <StatCard icon={Image} title="With Images" value={stats.images} />
          <StatCard icon={Dumbbell} title="Linked Exercises" value={stats.exercises} />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input
                placeholder="Search body parts..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder:text-gray-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-gray-300 outline-none [color-scheme:dark]"
            >
              {['All Status', 'Active', 'Draft', 'Hidden'].map((item) => (
                <option key={item} className="bg-[#050505] text-white">
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            Loading body parts...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredBodyParts.length === 0 && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            No body parts found.
          </div>
        )}

        {!isLoading && !error && filteredBodyParts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBodyParts.map((item) => (
              <div
                key={item.id}
                className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden hover:border-[#C8A13A]/60 transition"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="h-44 bg-[#050505] flex items-center justify-center text-gray-600">
                    <Image size={38} />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black">{item.name}</h3>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {item.description || 'No description added.'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold h-fit ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-4 mt-6 pt-5 border-t border-white/10">
                    <p className="text-sm text-gray-500">
                      {item.exercises_count || 0} linked exercises
                    </p>
                    <div className="flex gap-2">
                      <ActionButton
                        icon={Eye}
                        label="View body part"
                        onClick={() => handleViewBodyPart(item)}
                      />
                      <ActionButton
                        icon={Edit}
                        label="Edit body part"
                        onClick={() => onNavigate('edit-body-part', item.id)}
                      />
                      <ActionButton
                        icon={Trash2}
                        label="Delete body part"
                        danger
                        onClick={() => handleDeleteBodyPart(item)}
                      />
                    </div>
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

function ActionButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
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

function statusClass(status) {
  if (status === 'Active') return 'bg-green-500/15 text-green-400'
  if (status === 'Draft') return 'bg-blue-500/15 text-blue-300'
  return 'bg-orange-500/15 text-orange-300'
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
