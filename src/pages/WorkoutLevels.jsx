import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Clock,
  CreditCard,
  Dumbbell,
  Edit,
  Eye,
  Filter,
  Flame,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
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
  { id: 'body-parts', name: 'Body Parts', icon: Flame },
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

export default function WorkoutLevels({ onNavigate, onLogout }) {
  const [levels, setLevels] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')

  useEffect(() => {
    let shouldUpdate = true

    const loadLevels = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/workout-levels`, {
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

          throw new Error(payload.message || 'Unable to load workout levels.')
        }

        if (shouldUpdate) setLevels(payload.workout_levels || [])
      } catch (caughtError) {
        if (shouldUpdate) {
          setError(caughtError.message || 'Unable to load workout levels.')
        }
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadLevels()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const filteredLevels = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return levels.filter((level) => {
      const matchesSearch =
        !search ||
        level.name?.toLowerCase().includes(search) ||
        level.description?.toLowerCase().includes(search) ||
        level.intensity?.toLowerCase().includes(search) ||
        level.suitable_for?.toLowerCase().includes(search)
      const matchesStatus =
        statusFilter === 'All Status' || level.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [levels, searchTerm, statusFilter])

  const stats = useMemo(
    () => ({
      total: levels.length,
      workouts: levels.reduce(
        (sum, level) => sum + Number(level.linked_workouts || 0),
        0,
      ),
      exercises: levels.reduce(
        (sum, level) => sum + Number(level.linked_exercises || 0),
        0,
      ),
      active: levels.filter((level) => level.status === 'Active').length,
    }),
    [levels],
  )

  const handleViewLevel = (level) => {
    const statusColor = statusTone(level.status)

    Swal.fire({
      title: '',
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          ${
            level.cover_image_url
              ? `<div style="height:220px;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);margin-bottom:18px">
                  <img src="${escapeHtml(level.cover_image_url)}" alt="${escapeHtml(level.name)}" style="display:block;width:100%;height:100%;object-fit:cover" />
                </div>`
              : ''
          }
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:4px 2px 22px;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div style="display:flex;align-items:center;gap:16px;min-width:0">
              <div style="width:72px;height:72px;border-radius:22px;background:rgba(200,161,58,0.16);border:1px solid rgba(200,161,58,0.35);display:flex;align-items:center;justify-content:center;color:#C8A13A;font-size:30px;font-weight:900">L${escapeHtml(level.difficulty_rank || 1)}</div>
              <div style="min-width:0">
                <div style="font-size:29px;font-weight:900;line-height:1.15;overflow-wrap:anywhere">${escapeHtml(level.name)}</div>
                <div style="color:#9ca3af;font-size:14px;margin-top:7px">${escapeHtml(level.intensity)} | ${escapeHtml(level.recommended_duration || 'No duration')}</div>
              </div>
            </div>
            <span style="white-space:nowrap;border-radius:999px;background:${statusColor}22;color:${statusColor};font-size:12px;font-weight:900;padding:8px 11px">${escapeHtml(level.status)}</span>
          </div>

          <div class="level-modal-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px">
            ${metricCard('Workouts', level.linked_workouts || 0)}
            ${metricCard('Exercises', level.linked_exercises || 0)}
            ${metricCard('Sets', level.recommended_sets || 'Not set')}
            ${metricCard('Reps', level.recommended_reps || 'Not set')}
          </div>

          <div class="level-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
            ${detailCard('Calories', level.calories_range || 'Not set')}
            ${detailCard('Rest Time', level.rest_time || 'Not set')}
            ${detailCard('Frequency', level.training_frequency || 'Not set')}
            ${detailCard('Suitable For', level.suitable_for || 'Not set')}
            ${detailCard('Mobile App', level.show_in_mobile_app ? 'Visible' : 'Hidden')}
            ${detailCard('Access Type', level.access_type || 'Not set')}
          </div>

          ${
            level.description
              ? noteCard('Description', level.description)
              : ''
          }
          ${
            level.trainer_instructions || level.safety_notes
              ? `<div class="level-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
                  ${noteCard('Trainer Instructions', level.trainer_instructions || 'Not set', true)}
                  ${noteCard('Safety Notes', level.safety_notes || 'Not set', true)}
                </div>`
              : ''
          }
        </div>
      `,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      confirmButtonText: 'Close',
      width: 860,
    })
  }

  const handleDeleteLevel = async (level) => {
    const confirmation = await Swal.fire({
      title: 'Delete workout level?',
      text: `${level.name} will be removed permanently.`,
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
      const response = await fetch(`${apiBaseUrl}/workout-levels/${level.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to delete workout level.')
      }

      setLevels((current) => current.filter((item) => item.id !== level.id))

      await Swal.fire({
        title: 'Level deleted',
        text: payload.message || 'Workout level deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete workout level.',
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
            const active = item.id === 'levels'

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
          <p className="text-xs text-gray-500">Active Levels</p>
          <h3 className="text-xl font-bold mt-1">
            {stats.active} / {stats.total}
          </h3>
          <p className="text-xs text-[#C8A13A] mt-1">Used for app filtering</p>
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
            {menuItems.slice(0, 7).map((item) => {
              const Icon = item.icon
              const active = item.id === 'levels'

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
            <h1 className="text-4xl font-black">Workout Levels</h1>
            <p className="text-gray-400 mt-1">
              Manage workout difficulty levels used in the mobile app.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('add-level')}
            className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Level
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Trophy} title="Total Levels" value={stats.total} />
          <StatCard icon={Activity} title="Linked Workouts" value={stats.workouts} />
          <StatCard icon={Dumbbell} title="Linked Exercises" value={stats.exercises} />
          <StatCard icon={Flame} title="Active Levels" value={stats.active} />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input
                placeholder="Search workout level..."
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

            <button
              type="button"
              className="border border-white/10 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-gray-300 hover:border-[#C8A13A]"
            >
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            Loading workout levels...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredLevels.length === 0 && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            No workout levels found.
          </div>
        )}

        {!isLoading && !error && filteredLevels.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredLevels.map((level) => (
              <div
                key={level.id}
                className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden hover:border-[#C8A13A]/60 transition"
              >
                {level.cover_image_url && (
                  <img
                    src={level.cover_image_url}
                    alt={level.name}
                    className="h-44 w-full object-cover"
                  />
                )}

                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center shrink-0">
                        <Trophy size={26} className="text-[#C8A13A]" />
                      </div>

                      <div>
                        <h3 className="text-2xl font-black">{level.name}</h3>
                        <p className="text-gray-400 text-sm mt-1 max-w-md">
                          {level.description || 'No description added.'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${statusClass(level.status)}`}
                    >
                      {level.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <MiniStat
                      icon={Activity}
                      label="Workouts"
                      value={level.linked_workouts}
                    />
                    <MiniStat
                      icon={Dumbbell}
                      label="Exercises"
                      value={level.linked_exercises}
                    />
                    <MiniStat
                      icon={Clock}
                      label="Duration"
                      value={level.recommended_duration || 'Not set'}
                    />
                    <MiniStat
                      icon={Flame}
                      label="Intensity"
                      value={level.intensity}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-6 pt-5 border-t border-white/10">
                    <div className="text-sm text-gray-500">
                      Rank {level.difficulty_rank} for app workout filtering
                    </div>

                    <div className="flex gap-2">
                      <ActionButton
                        icon={Eye}
                        label="View level"
                        onClick={() => handleViewLevel(level)}
                      />
                      <ActionButton
                        icon={Edit}
                        label="Edit level"
                        onClick={() => onNavigate('edit-level', level.id)}
                      />
                      <ActionButton
                        icon={Trash2}
                        label="Delete level"
                        danger
                        onClick={() => handleDeleteLevel(level)}
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

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#050505] border border-white/10 rounded-2xl p-4">
      <Icon size={18} className="text-[#C8A13A] mb-3" />
      <p className="text-xs text-gray-500">{label}</p>
      <h4 className="font-bold mt-1 break-words">{value}</h4>
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

function statusTone(status) {
  if (status === 'Active') return '#4ade80'
  if (status === 'Draft') return '#93c5fd'
  return '#fdba74'
}

function metricCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;min-width:0">
      <div style="color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase">${escapeHtml(label)}</div>
      <div style="color:#ffffff;font-size:17px;font-weight:900;margin-top:8px;overflow-wrap:anywhere">${escapeHtml(String(value))}</div>
    </div>
  `
}

function detailCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;min-width:0">
      <div style="color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase">${escapeHtml(label)}</div>
      <div style="color:#d1d5db;font-size:14px;font-weight:700;margin-top:7px;overflow-wrap:anywhere">${escapeHtml(String(value))}</div>
    </div>
  `
}

function noteCard(label, value, compact = false) {
  return `
    <div style="margin-top:${compact ? '0' : '18px'};background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
      <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">${escapeHtml(label)}</div>
      <div style="color:#d1d5db;font-size:14px;line-height:1.65">${escapeHtml(value)}</div>
    </div>
  `
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
