import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  Apple,
  BarChart3,
  Beef,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Download,
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

const goals = [
  'All Goals',
  'Weight Loss',
  'Muscle Gain',
  'General Fitness',
  'High Protein',
  'Balanced Diet',
]

export default function Diet({ onNavigate, onLogout }) {
  const [diets, setDiets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [goalFilter, setGoalFilter] = useState('All Goals')
  const [statusFilter, setStatusFilter] = useState('All Status')

  useEffect(() => {
    let shouldUpdate = true

    const loadDiets = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/diet-plans`, {
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

          throw new Error(payload.message || 'Unable to load diet plans.')
        }

        if (shouldUpdate) setDiets(payload.diet_plans || [])
      } catch (caughtError) {
        if (shouldUpdate) setError(caughtError.message || 'Unable to load diet plans.')
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadDiets()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const filteredDiets = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return diets.filter((diet) => {
      const matchesSearch =
        !search ||
        diet.name?.toLowerCase().includes(search) ||
        diet.goal?.toLowerCase().includes(search) ||
        diet.diet_type?.toLowerCase().includes(search)
      const matchesGoal = goalFilter === 'All Goals' || diet.goal === goalFilter
      const matchesStatus =
        statusFilter === 'All Status' || diet.publish_status === statusFilter

      return matchesSearch && matchesGoal && matchesStatus
    })
  }, [diets, goalFilter, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const calories = diets
      .map((diet) => Number.parseInt(String(diet.daily_calories || '').replaceAll(',', ''), 10))
      .filter((value) => Number.isFinite(value))

    return {
      total: diets.length,
      foodItems: diets.reduce(
        (sum, diet) => sum + (Array.isArray(diet.meals) ? diet.meals.length : 0),
        0,
      ),
      avgCalories: calories.length
        ? Math.round(calories.reduce((sum, value) => sum + value, 0) / calories.length)
        : 0,
      highProtein: diets.filter((diet) => diet.goal === 'High Protein').length,
    }
  }, [diets])

  const handleViewDiet = (diet) => {
    const meals = Array.isArray(diet.meals) ? diet.meals : []

    Swal.fire({
      title: '',
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          ${
            diet.cover_image_url
              ? `<div style="height:220px;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);margin-bottom:18px">
                  <img src="${escapeHtml(diet.cover_image_url)}" alt="${escapeHtml(diet.name)}" style="display:block;width:100%;height:100%;object-fit:cover" />
                </div>`
              : ''
          }
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:4px 2px 22px;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div style="display:flex;align-items:center;gap:16px;min-width:0">
              <div style="width:72px;height:72px;border-radius:22px;background:rgba(200,161,58,0.16);border:1px solid rgba(200,161,58,0.35);display:flex;align-items:center;justify-content:center;color:#C8A13A;font-size:30px;font-weight:900">DP</div>
              <div style="min-width:0">
                <div style="font-size:29px;font-weight:900;line-height:1.15;overflow-wrap:anywhere">${escapeHtml(diet.name)}</div>
                <div style="color:#9ca3af;font-size:14px;margin-top:7px">${escapeHtml(diet.goal)} | ${escapeHtml(diet.diet_type)} | ${escapeHtml(diet.workout_level)}</div>
              </div>
            </div>
            <span style="white-space:nowrap;border-radius:999px;background:${statusTone(diet.publish_status)}22;color:${statusTone(diet.publish_status)};font-size:12px;font-weight:900;padding:8px 11px">${escapeHtml(diet.publish_status)}</span>
          </div>

          <div class="diet-modal-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px">
            ${metricCard('Calories', diet.daily_calories || 'Not set')}
            ${metricCard('Protein', diet.protein || 'Not set')}
            ${metricCard('Carbs', diet.carbs || 'Not set')}
            ${metricCard('Fat', diet.fat || 'Not set')}
          </div>

          <div class="diet-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
            ${detailCard('Duration', diet.duration || 'Not set')}
            ${detailCard('Fiber', diet.fiber || 'Not set')}
            ${detailCard('Access Type', diet.access_type || 'Not set')}
            ${detailCard('Mobile App', diet.show_in_mobile_app ? 'Visible' : 'Hidden')}
          </div>

          ${diet.description ? noteCard('Description', diet.description) : ''}

          ${
            meals.length
              ? `<div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
                  <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Meal Plan</div>
                  <div style="display:grid;gap:10px">
                    ${meals
                      .map(
                        (meal) => `
                          <div style="display:grid;grid-template-columns:120px 1fr auto;gap:10px;align-items:center;color:#d1d5db;font-size:14px">
                            <span style="color:#C8A13A;font-weight:900">${escapeHtml(meal.name)}</span>
                            <span>${escapeHtml(meal.food)}</span>
                            <span style="color:#9ca3af">${escapeHtml(meal.calories || 'Not set')}</span>
                          </div>
                        `,
                      )
                      .join('')}
                  </div>
                </div>`
              : ''
          }

          <div class="diet-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
            ${noteCard('Meal Instructions', diet.meal_instructions || 'Not set', true)}
            ${noteCard('Nutritionist Notes', diet.nutritionist_notes || 'Not set', true)}
          </div>
        </div>
      `,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      confirmButtonText: 'Close',
      width: 900,
    })
  }

  const handleDeleteDiet = async (diet) => {
    const confirmation = await Swal.fire({
      title: 'Delete diet plan?',
      text: `${diet.name} will be removed permanently.`,
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
      const response = await fetch(`${apiBaseUrl}/diet-plans/${diet.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to delete diet plan.')
      }

      setDiets((current) => current.filter((item) => item.id !== diet.id))

      await Swal.fire({
        title: 'Diet plan deleted',
        text: payload.message || 'Diet plan deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete diet plan.',
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
            const active = item.id === 'diet'

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
          <p className="text-xs text-gray-500">Diet Plans</p>
          <h3 className="text-xl font-bold mt-1">{stats.total}</h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {stats.highProtein} high protein
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
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = item.id === 'diet'

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
            <h1 className="text-4xl font-black">Diet & Nutrition</h1>
            <p className="text-gray-400 mt-1">
              Manage diet plans, meals, calories and nutrition guidance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="border border-white/10 text-gray-300 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 hover:border-[#C8A13A]"
            >
              <Download size={18} />
              Export
            </button>

            <button
              type="button"
              onClick={() => onNavigate('add-diet')}
              className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Diet Plan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Utensils} title="Diet Plans" value={stats.total} />
          <StatCard icon={Apple} title="Food Items" value={stats.foodItems} />
          <StatCard icon={Flame} title="Avg Calories" value={stats.avgCalories} />
          <StatCard icon={Beef} title="High Protein Plans" value={stats.highProtein} />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input
                placeholder="Search diet plan..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder:text-gray-600"
              />
            </div>

            <select
              value={goalFilter}
              onChange={(event) => setGoalFilter(event.target.value)}
              className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-gray-300 outline-none [color-scheme:dark]"
            >
              {goals.map((item) => (
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
              {['All Status', 'Published', 'Draft', 'Hidden'].map((item) => (
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
            Loading diet plans...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredDiets.length === 0 && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            No diet plans found.
          </div>
        )}

        {!isLoading && !error && filteredDiets.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            {filteredDiets.map((diet) => (
              <div
                key={diet.id}
                className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden hover:border-[#C8A13A]/60 transition"
              >
                {diet.cover_image_url && (
                  <img
                    src={diet.cover_image_url}
                    alt={diet.name}
                    className="h-44 w-full object-cover"
                  />
                )}

                <div className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center shrink-0">
                      <Utensils size={25} className="text-[#C8A13A]" />
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(diet.publish_status)}`}
                    >
                      {diet.publish_status}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black mt-5">{diet.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{diet.goal}</p>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <MiniBox label="Calories" value={diet.daily_calories || 'Not set'} />
                    <MiniBox
                      label="Meals / Day"
                      value={Array.isArray(diet.meals) ? diet.meals.length : 0}
                    />
                    <MiniBox label="Protein" value={diet.protein || 'Not set'} />
                    <MiniBox label="Schedule" value={diet.duration || 'Daily'} />
                  </div>

                  <div className="flex gap-2 mt-6 pt-5 border-t border-white/10">
                    <ActionButton
                      icon={Eye}
                      label="View diet plan"
                      onClick={() => handleViewDiet(diet)}
                    />
                    <ActionButton
                      icon={Edit}
                      label="Edit diet plan"
                      onClick={() => onNavigate('edit-diet', diet.id)}
                    />
                    <ActionButton
                      icon={Trash2}
                      label="Delete diet plan"
                      danger
                      onClick={() => handleDeleteDiet(diet)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
          <div className="flex justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold">Meal Planner Overview</h2>
              <p className="text-gray-500 text-sm">
                Common meal slots used in diet plans.
              </p>
            </div>
            <CalendarDays className="text-[#C8A13A] shrink-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['Breakfast', 'Snack 1', 'Lunch', 'Snack 2', 'Dinner'].map(
              (meal) => (
                <div
                  key={meal}
                  className="bg-[#050505] border border-white/10 rounded-2xl p-5"
                >
                  <p className="text-[#C8A13A] font-bold">{meal}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Food items, calories and macros
                  </p>
                </div>
              ),
            )}
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

function MiniBox({ label, value }) {
  return (
    <div className="bg-[#050505] border border-white/10 rounded-2xl p-3">
      <p className="text-gray-500 text-xs">{label}</p>
      <h4 className="font-bold text-sm mt-1 break-words">{value}</h4>
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
  if (status === 'Published') return 'bg-green-500/15 text-green-400'
  if (status === 'Draft') return 'bg-blue-500/15 text-blue-300'
  return 'bg-orange-500/15 text-orange-300'
}

function statusTone(status) {
  if (status === 'Published') return '#4ade80'
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
