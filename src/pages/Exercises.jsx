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
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
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
  { id: 'users', name: 'Users & Roles', icon: ShieldCheck },
  { id: 'mobile', name: 'Mobile App', icon: Smartphone },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
]

const categories = [
  'All Categories',
  'Equipment Based',
  'Body Part Exercise',
  'Workout',
]

export default function Exercises({ onNavigate, onLogout }) {
  const [exercises, setExercises] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [statusFilter, setStatusFilter] = useState('All Status')

  useEffect(() => {
    let shouldUpdate = true

    const loadExercises = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/exercises`, {
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

          throw new Error(payload.message || 'Unable to load exercises.')
        }

        if (shouldUpdate) setExercises(payload.exercises || [])
      } catch (caughtError) {
        if (shouldUpdate) {
          setError(caughtError.message || 'Unable to load exercises.')
        }
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadExercises()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const filteredExercises = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return exercises.filter((item) => {
      const matchesSearch =
        !search ||
        item.name?.toLowerCase().includes(search) ||
        item.category?.toLowerCase().includes(search) ||
        item.body_part?.toLowerCase().includes(search) ||
        item.equipment?.toLowerCase().includes(search) ||
        item.workout_level?.toLowerCase().includes(search)
      const matchesCategory =
        categoryFilter === 'All Categories' || item.category === categoryFilter
      const matchesStatus =
        statusFilter === 'All Status' || item.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [categoryFilter, exercises, searchTerm, statusFilter])

  const stats = useMemo(
    () => ({
      total: exercises.length,
      bodyParts: new Set(exercises.map((item) => item.body_part).filter(Boolean))
        .size,
      levels: new Set(exercises.map((item) => item.workout_level).filter(Boolean))
        .size,
      active: exercises.filter((item) => item.status === 'Active').length,
    }),
    [exercises],
  )

  const handleViewExercise = (item) => {
    const statusColor = statusTone(item.status)
    const instructions = Array.isArray(item.instructions)
      ? item.instructions.filter(Boolean)
      : []
    const tags = Array.isArray(item.muscle_tags) ? item.muscle_tags : []

    Swal.fire({
      title: '',
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:4px 2px 22px;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div style="display:flex;align-items:center;gap:16px;min-width:0">
              <div style="width:74px;height:74px;border-radius:22px;background:rgba(200,161,58,0.16);border:1px solid rgba(200,161,58,0.35);display:flex;align-items:center;justify-content:center;color:#C8A13A;font-size:32px;font-weight:900">EX</div>
              <div style="min-width:0">
                <div style="font-size:28px;font-weight:900;line-height:1.15;overflow-wrap:anywhere">${escapeHtml(item.name)}</div>
                <div style="color:#9ca3af;font-size:14px;margin-top:7px">${escapeHtml(item.category)} | ${escapeHtml(item.body_part)} | ${escapeHtml(item.workout_level)}</div>
              </div>
            </div>
            <span style="white-space:nowrap;border-radius:999px;background:${statusColor}22;color:${statusColor};font-size:12px;font-weight:900;padding:8px 11px">${escapeHtml(item.status)}</span>
          </div>

          ${
            item.image_url || item.video_url
              ? `<div class="exercise-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
                  ${
                    item.image_url
                      ? `<div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;overflow:hidden">
                          <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" style="display:block;width:100%;height:210px;object-fit:cover" />
                        </div>`
                      : ''
                  }
                  ${
                    item.video_url
                      ? `<div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;overflow:hidden">
                          <video src="${escapeHtml(item.video_url)}" controls style="display:block;width:100%;height:210px;object-fit:cover"></video>
                        </div>`
                      : ''
                  }
                </div>`
              : ''
          }

          <div class="exercise-modal-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px">
            ${metricCard('Duration', item.duration || 'Not set')}
            ${metricCard('Sets', item.sets || 'Not set')}
            ${metricCard('Reps', item.reps || 'Not set')}
            ${metricCard('Rest', item.rest_time || 'Not set')}
          </div>

          <div class="exercise-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
            ${detailCard('Equipment', item.equipment || 'Not set')}
            ${detailCard('Access Type', item.access_type || 'Not set')}
            ${detailCard('Mobile App', item.show_in_mobile_app ? 'Visible' : 'Hidden')}
            ${detailCard('Publish Status', item.publish_status || 'Not set')}
          </div>

          ${
            item.description
              ? `<div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
                  <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Description</div>
                  <div style="color:#d1d5db;font-size:14px;line-height:1.65">${escapeHtml(item.description)}</div>
                </div>`
              : ''
          }

          ${
            instructions.length
              ? `<div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
                  <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">How To Perform</div>
                  <div style="display:grid;gap:10px">
                    ${instructions
                      .map(
                        (step, index) => `
                          <div style="display:flex;gap:10px;align-items:flex-start;color:#d1d5db;font-size:14px;line-height:1.55">
                            <span style="width:26px;height:26px;border-radius:999px;background:rgba(200,161,58,0.16);color:#C8A13A;display:inline-flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0">${index + 1}</span>
                            <span>${escapeHtml(step)}</span>
                          </div>
                        `,
                      )
                      .join('')}
                  </div>
                </div>`
              : ''
          }

          ${
            tags.length
              ? `<div style="margin-top:18px;display:flex;flex-wrap:wrap;gap:8px">
                  ${tags
                    .map(
                      (tag) =>
                        `<span style="border-radius:12px;background:rgba(200,161,58,0.14);color:#C8A13A;font-size:12px;font-weight:800;padding:8px 10px">${escapeHtml(tag)}</span>`,
                    )
                    .join('')}
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
      customClass: {
        popup: 'aurex-exercise-modal',
      },
    })
  }

  const handleDeleteExercise = async (item) => {
    const confirmation = await Swal.fire({
      title: 'Delete exercise?',
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
      const response = await fetch(`${apiBaseUrl}/exercises/${item.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to delete exercise.')
      }

      setExercises((current) => current.filter((entry) => entry.id !== item.id))

      await Swal.fire({
        title: 'Exercise deleted',
        text: payload.message || 'Exercise deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete exercise.',
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
            const active = item.id === 'exercises'

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
          <p className="text-xs text-gray-500">Total Exercises</p>
          <h3 className="text-xl font-bold mt-1">{stats.total}</h3>
          <p className="text-xs text-[#C8A13A] mt-1">{stats.active} active</p>
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
              const active = item.id === 'exercises'

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
            <h1 className="text-4xl font-black">Exercises</h1>
            <p className="text-gray-400 mt-1">
              Manage body part exercises, equipment exercises and workout levels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('add-exercise')}
            className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Exercise
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Dumbbell} title="Total Exercises" value={stats.total} />
          <StatCard icon={Target} title="Body Parts" value={stats.bodyParts} />
          <StatCard icon={Trophy} title="Workout Levels" value={stats.levels} />
          <StatCard icon={Clock} title="Active Exercises" value={stats.active} />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input
                placeholder="Search exercise..."
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
              {['All Status', 'Active', 'Draft', 'Hidden', 'Archived'].map(
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

        {isLoading && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            Loading exercises...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredExercises.length === 0 && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            No exercises found.
          </div>
        )}

        {!isLoading && !error && filteredExercises.length > 0 && (
          <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-[#0A0A0A] text-gray-400 text-sm">
                  <tr>
                    <th className="p-5">Exercise</th>
                    <th className="p-5">Category</th>
                    <th className="p-5">Body Part</th>
                    <th className="p-5">Equipment</th>
                    <th className="p-5">Level</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExercises.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-white/10 hover:bg-white/[0.03]"
                    >
                      <td className="p-5">
                        <div>
                          <h3 className="font-bold">{item.name}</h3>
                          <p className="text-gray-500 text-sm">
                            {item.duration || 'Duration not set'}
                          </p>
                        </div>
                      </td>

                      <td className="p-5 text-gray-300">{item.category}</td>
                      <td className="p-5 text-gray-300">{item.body_part}</td>
                      <td className="p-5 text-gray-300">{item.equipment}</td>

                      <td className="p-5">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#C8A13A]/15 text-[#C8A13A]">
                          {item.workout_level}
                        </span>
                      </td>

                      <td className="p-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="p-5">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            icon={Eye}
                            label="View exercise"
                            onClick={() => handleViewExercise(item)}
                          />
                          <ActionButton
                            icon={Edit}
                            label="Edit exercise"
                            onClick={() => onNavigate('edit-exercise', item.id)}
                          />
                          <ActionButton
                            icon={Trash2}
                            label="Delete exercise"
                            danger
                            onClick={() => handleDeleteExercise(item)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
  if (status === 'Hidden') return 'bg-orange-500/15 text-orange-300'
  return 'bg-gray-500/15 text-gray-300'
}

function statusTone(status) {
  if (status === 'Active') return '#4ade80'
  if (status === 'Draft') return '#93c5fd'
  if (status === 'Hidden') return '#fdba74'
  return '#d1d5db'
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

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
