import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Flame,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Smartphone,
  Target,
  Trophy,
  TrendingUp,
  UserCog,
  Users,
  Utensils,
  Wallet,
  Clock,
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
  { id: 'users', name: 'Users & Roles', icon: Users },
  { id: 'mobile', name: 'Mobile App', icon: Smartphone },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
]

export default function Dashboard({ onNavigate, onLogout }) {
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let shouldUpdate = true

    const loadDashboard = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/dashboard`, {
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

          throw new Error(payload.message || 'Unable to load dashboard.')
        }

        if (shouldUpdate) setDashboard(payload)
      } catch (caughtError) {
        if (shouldUpdate) {
          setError(caughtError.message || 'Unable to load dashboard.')
        }
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadDashboard()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const stats = dashboard?.stats || {}
  const todaySummary = dashboard?.today_summary || {}
  const performance = useMemo(() => dashboard?.performance || [], [dashboard])
  const maxPerformance = useMemo(
    () => Math.max(...performance.map((item) => Number(item.check_ins || 0)), 1),
    [performance],
  )

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
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const active = index === 0

            return (
              <button
                key={item.name}
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
          <p className="text-xs text-gray-500">Monthly Revenue</p>
          <h3 className="text-xl font-bold mt-1">
            {isLoading ? 'Loading...' : formatCurrency(stats.monthly_revenue?.value)}
          </h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {stats.monthly_revenue?.change || '0% this month'}
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

      <main className="flex-1 min-w-0 p-5 sm:p-8 bg-gradient-to-br from-[#050505] via-[#080808] to-[#111] overflow-y-auto">
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-5 mb-8">
          <div>
            <h2 className="text-4xl font-black">Dashboard</h2>
            <p className="text-gray-400 mt-1">
              Manage gym operations, members, workouts and app content.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 bg-[#111] border border-white/10 rounded-2xl px-4 py-3 w-full sm:w-80">
              <Search size={18} className="text-gray-500 shrink-0" />
              <input
                placeholder="Search members, workouts..."
                className="bg-transparent outline-none text-sm w-full placeholder:text-gray-600"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                className="w-12 h-12 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center shrink-0"
              >
                <Bell size={20} className="text-[#C8A13A]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('add-member')}
                className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl whitespace-nowrap"
              >
                + Add Member
              </button>
            </div>
          </div>
        </div>

        <div className="lg:hidden bg-[#090909] border border-white/10 rounded-3xl p-3 mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const active = index === 0

              return (
                <button
                  key={item.name}
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

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl p-4 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard
            icon={Users}
            title="Active Members"
            value={formatNumber(stats.active_members?.value)}
            change={stats.active_members?.change || '0%'}
            loading={isLoading}
          />
          <StatCard
            icon={Wallet}
            title="Revenue"
            value={formatCurrency(stats.monthly_revenue?.value)}
            change={stats.monthly_revenue?.change || '0% this month'}
            loading={isLoading}
          />
          <StatCard
            icon={Dumbbell}
            title="Workout Programs"
            value={formatNumber(stats.workout_programs?.value)}
            change={stats.workout_programs?.change || '+0 new'}
            loading={isLoading}
          />
          <StatCard
            icon={Utensils}
            title="Diet Plans"
            value={formatNumber(stats.diet_plans?.value)}
            change={stats.diet_plans?.change || '+0 new'}
            loading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-6">
            <div className="flex justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold">Gym Performance</h3>
                <p className="text-gray-500 text-sm">
                  Member visits and revenue overview
                </p>
              </div>
              <span className="text-[#C8A13A] text-sm whitespace-nowrap">
                This Week
              </span>
            </div>

            <div className="grid grid-cols-7 gap-3 items-end h-56">
              {(performance.length > 0 ? performance : emptyWeek()).map((item) => {
                const height = Math.max(
                  (Number(item.check_ins || 0) / maxPerformance) * 180,
                  8,
                )

                return (
                <div key={item.date || item.label} className="flex flex-col items-center gap-3">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-[#C8A13A] to-[#F3D36B]"
                    style={{ height }}
                  />
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-[10px] text-gray-600">
                    {formatCompactCurrency(item.revenue)}
                  </span>
                </div>
                )
              })}
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-5">Today Summary</h3>
            <SummaryItem
              icon={Clock}
              label="Check-ins Today"
              value={isLoading ? 'Loading...' : formatNumber(todaySummary.check_ins_today)}
            />
            <SummaryItem
              icon={Flame}
              label="Calories Logged"
              value={isLoading ? 'Loading...' : formatNumber(todaySummary.calories_logged)}
            />
            <SummaryItem
              icon={Activity}
              label="Active Workouts"
              value={isLoading ? 'Loading...' : formatNumber(todaySummary.active_workouts)}
            />
            <SummaryItem
              icon={CalendarDays}
              label="Classes Today"
              value={isLoading ? 'Loading...' : formatNumber(todaySummary.classes_today)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <ModuleCard
            title="Body Parts"
            desc="Manage body-part categories and images for exercises."
            icon={Target}
            onClick={() => onNavigate('body-parts')}
          />
          <ModuleCard
            title="Workout Builder"
            desc="Create programs by goal, level, duration and body part."
            icon={Activity}
          />
          <ModuleCard
            title="Diet & Food Database"
            desc="Manage foods, calories, macros and diet plans."
            icon={Utensils}
          />
          <ModuleCard
            title="Member Management"
            desc="Register members, subscriptions and attendance."
            icon={Users}
          />
          <ModuleCard
            title="Trainers & Classes"
            desc="Assign trainers and manage gym class schedules."
            icon={UserCog}
          />
          <ModuleCard
            title="Payments & Reports"
            desc="Track invoices, payments and monthly revenue."
            icon={BarChart3}
          />
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, change, loading }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
      <div className="flex justify-between items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center">
          <Icon className="text-[#C8A13A]" size={22} />
        </div>

        <div className="flex items-center gap-1 text-[#C8A13A] text-sm">
          <TrendingUp size={15} />
          {change}
        </div>
      </div>

      <p className="text-gray-400 text-sm mt-5">{title}</p>
      <h3 className="text-3xl font-black mt-1">
        {loading ? 'Loading...' : value}
      </h3>
    </div>
  )
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-white/10 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#C8A13A]/15 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-[#C8A13A]" />
        </div>
        <p className="text-gray-400 text-sm truncate">{label}</p>
      </div>
      <h4 className="font-bold">{value}</h4>
    </div>
  )
}

function ModuleCard({ title, desc, icon: Icon, onClick }) {
  const className =
    'text-left bg-[#111] border border-white/10 rounded-3xl p-6 hover:border-[#C8A13A]/70 transition group'

  const content = (
    <>
      <div className="w-12 h-12 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center mb-5 group-hover:bg-[#C8A13A]">
        <Icon className="text-[#C8A13A] group-hover:text-black" size={22} />
      </div>

      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-6">{desc}</p>
    </>
  )

  if (!onClick) {
    return <div className={className}>{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
    >
      {content}
    </button>
  )
}

function formatCurrency(value) {
  return `TZS ${Number(value || 0).toLocaleString()}`
}

function formatCompactCurrency(value) {
  const amount = Number(value || 0)

  if (amount >= 1000000) {
    return `TZS ${(amount / 1000000).toFixed(1)}M`
  }

  if (amount >= 1000) {
    return `TZS ${(amount / 1000).toFixed(0)}K`
  }

  return `TZS ${amount.toLocaleString()}`
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

function emptyWeek() {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => ({
    label,
    check_ins: 0,
    revenue: 0,
  }))
}
