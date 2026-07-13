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

const memberMenuItems = [
  { id: 'dashboard', name: 'My Information', icon: LayoutDashboard },
  { id: 'workouts', name: 'My Workouts', icon: Activity },
]

const goals = [
  'All Goals',
  'Weight Loss',
  'Muscle Gain',
  'Strength',
  'Endurance',
  'General Fitness',
]

export default function Workouts({ onNavigate, onLogout, memberMode = false }) {
  const [workouts, setWorkouts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [goalFilter, setGoalFilter] = useState('All Goals')
  const visibleMenuItems = memberMode ? memberMenuItems : menuItems

  useEffect(() => {
    let shouldUpdate = true

    const loadWorkouts = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/workouts`, {
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

          throw new Error(payload.message || 'Unable to load workouts.')
        }

        if (shouldUpdate) setWorkouts(payload.workouts || [])
      } catch (caughtError) {
        if (shouldUpdate) setError(caughtError.message || 'Unable to load workouts.')
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadWorkouts()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const filteredWorkouts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return workouts.filter((item) => {
      const matchesSearch =
        !search ||
        item.name?.toLowerCase().includes(search) ||
        item.goal?.toLowerCase().includes(search) ||
        item.workout_level?.toLowerCase().includes(search) ||
        item.workout_type?.toLowerCase().includes(search)
      const matchesGoal = goalFilter === 'All Goals' || item.goal === goalFilter

      return matchesSearch && matchesGoal
    })
  }, [goalFilter, searchTerm, workouts])

  const stats = useMemo(() => {
    const durations = workouts
      .map((item) => Number.parseInt(item.duration, 10))
      .filter((item) => Number.isFinite(item))
    const calories = workouts
      .map((item) => Number.parseInt(item.calories_burn, 10))
      .filter((item) => Number.isFinite(item))

    return {
      total: workouts.length,
      levels: new Set(workouts.map((item) => item.workout_level).filter(Boolean))
        .size,
      avgDuration: durations.length
        ? `${Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length)} min`
        : '0 min',
      avgCalories: calories.length
        ? `${Math.round(calories.reduce((sum, item) => sum + item, 0) / calories.length)} kcal`
        : '0 kcal',
    }
  }, [workouts])

  const handleViewWorkout = (workout) => {
    const workoutDays = normalizeWorkoutDays(workout)
    const exercisesCount = workoutExerciseCount(workout)

    Swal.fire({
      title: '',
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          ${
            workout.cover_image_url
              ? `<div style="height:220px;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);margin-bottom:18px">
                  <img src="${escapeHtml(workout.cover_image_url)}" alt="${escapeHtml(workout.name)}" style="display:block;width:100%;height:100%;object-fit:cover" />
                </div>`
              : ''
          }
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:4px 2px 22px;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div style="display:flex;align-items:center;gap:16px;min-width:0">
              <div style="width:72px;height:72px;border-radius:22px;background:rgba(200,161,58,0.16);border:1px solid rgba(200,161,58,0.35);display:flex;align-items:center;justify-content:center;color:#C8A13A;font-size:30px;font-weight:900">WO</div>
              <div style="min-width:0">
                <div style="font-size:29px;font-weight:900;line-height:1.15;overflow-wrap:anywhere">${escapeHtml(workout.name)}</div>
                <div style="color:#9ca3af;font-size:14px;margin-top:7px">${escapeHtml(workout.goal)} | ${escapeHtml(workout.workout_level)} | ${escapeHtml(workout.workout_type)}</div>
              </div>
            </div>
            <span style="white-space:nowrap;border-radius:999px;background:${statusTone(workout.publish_status)}22;color:${statusTone(workout.publish_status)};font-size:12px;font-weight:900;padding:8px 11px">${escapeHtml(workout.publish_status)}</span>
          </div>

          <div class="workout-modal-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px">
            ${metricCard('Duration', workout.duration || 'Not set')}
            ${metricCard('Calories', workout.calories_burn || 'Not set')}
            ${metricCard('Days', workoutDays.length || 1)}
            ${metricCard('Exercises', exercisesCount)}
          </div>

          ${
            workout.description
              ? noteCard('Description', workout.description)
              : ''
          }

          ${
            workoutDays.length
              ? `<div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
                  <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Workout Days</div>
                  <div style="display:grid;gap:10px">
                    ${workoutDays
                      .map(
                        (day) => `
                          <div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                              <span style="width:28px;height:28px;border-radius:999px;background:rgba(200,161,58,0.16);color:#C8A13A;display:inline-flex;align-items:center;justify-content:center;font-weight:900">${day.day_number}</span>
                              <span style="color:white;font-weight:900">${escapeHtml(day.title)}</span>
                              <span style="color:#6b7280;font-size:12px">${day.exercises.length} exercises</span>
                            </div>
                            ${day.notes ? `<div style="color:#9ca3af;font-size:13px;margin-bottom:10px">${escapeHtml(day.notes)}</div>` : ''}
                            <div style="display:grid;gap:8px">
                              ${day.exercises
                                .map(
                                  (exercise, index) => `
                                    <div style="display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;color:#d1d5db;font-size:14px">
                                      <span style="color:#C8A13A;font-weight:900">${index + 1}.</span>
                                      <span>${escapeHtml(exercise.name)} <span style="color:#6b7280">(${escapeHtml(exercise.body_part || 'Body part not set')})</span></span>
                                      <span style="color:#9ca3af">${escapeHtml(exercise.sets || '-')} sets | ${escapeHtml(exercise.reps || '-')} reps | ${escapeHtml(exercise.rest || '-')}</span>
                                    </div>
                                  `,
                                )
                                .join('') || '<div style="color:#6b7280;font-size:13px">No exercises added.</div>'}
                            </div>
                          </div>
                        `,
                      )
                      .join('')}
                  </div>
                </div>`
              : ''
          }

          <div class="workout-modal-grid three" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px">
            ${noteCard('Warm Up', workout.warm_up || 'Not set', true)}
            ${noteCard('Trainer Notes', workout.trainer_notes || 'Not set', true)}
            ${noteCard('Cool Down', workout.cool_down || 'Not set', true)}
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

  const handleDeleteWorkout = async (workout) => {
    const confirmation = await Swal.fire({
      title: 'Delete workout?',
      text: `${workout.name} will be removed permanently.`,
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
      const response = await fetch(`${apiBaseUrl}/workouts/${workout.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to delete workout.')
      }

      setWorkouts((current) => current.filter((item) => item.id !== workout.id))

      await Swal.fire({
        title: 'Workout deleted',
        text: payload.message || 'Workout deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete workout.',
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
          {visibleMenuItems.map((item) => {
            const Icon = item.icon
            const active = item.id === 'workouts'

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
          <p className="text-xs text-gray-500">Workout Programs</p>
          <h3 className="text-xl font-bold mt-1">{stats.total}</h3>
          <p className="text-xs text-[#C8A13A] mt-1">Mobile app programs</p>
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
            {visibleMenuItems.map((item) => {
              const Icon = item.icon
              const active = item.id === 'workouts'

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
            <h1 className="text-4xl font-black">Workouts</h1>
            <p className="text-gray-400 mt-1">
              {memberMode
                ? 'View workouts assigned to your membership profile.'
                : 'Create and manage workout programs for the mobile app.'}
            </p>
          </div>

          {!memberMode && (
            <button
              type="button"
              onClick={() => onNavigate('add-workout')}
              className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Workout
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard icon={Activity} title="Total Workouts" value={stats.total} />
          <StatCard icon={Trophy} title="Workout Levels" value={stats.levels} />
          <StatCard icon={Clock} title="Avg Duration" value={stats.avgDuration} />
          <StatCard icon={Flame} title="Avg Calories" value={stats.avgCalories} />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input
                placeholder="Search workouts..."
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
              {goals.map((goal) => (
                <option key={goal} className="bg-[#050505] text-white">
                  {goal}
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
            Loading workouts...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredWorkouts.length === 0 && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            No workouts found.
          </div>
        )}

        {!isLoading && !error && filteredWorkouts.length > 0 && (
          <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left">
                <thead className="bg-[#0A0A0A] text-gray-400 text-sm">
                  <tr>
                    <th className="p-5">Workout</th>
                    <th className="p-5">Goal</th>
                    <th className="p-5">Level</th>
                    <th className="p-5">Duration</th>
                    <th className="p-5">Days / Exercises</th>
                    <th className="p-5">Calories</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredWorkouts.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-white/10 hover:bg-white/[0.03]"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          {item.cover_image_url ? (
                            <img
                              src={item.cover_image_url}
                              alt={item.name}
                              className="w-12 h-12 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center">
                              <Dumbbell className="text-[#C8A13A]" size={22} />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold">{item.name}</h3>
                            <p className="text-gray-500 text-sm">
                              {item.workout_type}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-5 text-gray-300">{item.goal}</td>

                      <td className="p-5">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#C8A13A]/15 text-[#C8A13A]">
                          {item.workout_level}
                        </span>
                      </td>

                      <td className="p-5 text-gray-300">
                        {item.duration || 'Not set'}
                      </td>
                      <td className="p-5 text-gray-300">
                        {normalizeWorkoutDays(item).length || 1} days /{' '}
                        {workoutExerciseCount(item)} exercises
                      </td>
                      <td className="p-5 text-gray-300">
                        {item.calories_burn || 'Not set'}
                      </td>

                      <td className="p-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(item.publish_status)}`}
                        >
                          {item.publish_status}
                        </span>
                      </td>

                      <td className="p-5">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            icon={Eye}
                            label="View workout"
                            onClick={() => handleViewWorkout(item)}
                          />
                          {!memberMode && (
                            <>
                              <ActionButton
                                icon={Edit}
                                label="Edit workout"
                                onClick={() => onNavigate('edit-workout', item.id)}
                              />
                              <ActionButton
                                icon={Trash2}
                                label="Delete workout"
                                danger
                                onClick={() => handleDeleteWorkout(item)}
                              />
                            </>
                          )}
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
  if (status === 'Published') return 'bg-green-500/15 text-green-400'
  if (status === 'Draft') return 'bg-blue-500/15 text-blue-300'
  return 'bg-orange-500/15 text-orange-300'
}

function statusTone(status) {
  if (status === 'Published') return '#4ade80'
  if (status === 'Draft') return '#93c5fd'
  return '#fdba74'
}

function normalizeWorkoutDays(workout) {
  if (Array.isArray(workout.workout_days) && workout.workout_days.length > 0) {
    return workout.workout_days.map((day, index) => ({
      day_number: Number(day.day_number) || index + 1,
      title: day.title || `Day ${index + 1}`,
      notes: day.notes || '',
      exercises: Array.isArray(day.exercises) ? day.exercises : [],
    }))
  }

  const legacyExercises = Array.isArray(workout.exercises) ? workout.exercises : []

  return [
    {
      day_number: 1,
      title: 'Day 1',
      notes: '',
      exercises: legacyExercises,
    },
  ]
}

function workoutExerciseCount(workout) {
  return normalizeWorkoutDays(workout).reduce(
    (total, day) => total + day.exercises.length,
    0,
  )
}

function metricCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;min-width:0">
      <div style="color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase">${escapeHtml(label)}</div>
      <div style="color:#ffffff;font-size:17px;font-weight:900;margin-top:8px;overflow-wrap:anywhere">${escapeHtml(String(value))}</div>
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
