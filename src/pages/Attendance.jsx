import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Clock,
  CreditCard,
  Dumbbell,
  Filter,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Trophy,
  UserCheck,
  UserCog,
  Users,
  UserX,
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

const periodMap = {
  Today: 'today',
  'This Week': 'week',
  'This Month': 'month',
}

export default function Attendance({ onNavigate, onLogout }) {
  const [attendances, setAttendances] = useState([])
  const [stats, setStats] = useState({
    today_check_ins: 0,
    inside_gym: 0,
    avg_session: '0m',
    missed_today: 0,
    peak_hour: { label: 'Not set', count: 0 },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState('Today')

  const loadAttendance = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${apiBaseUrl}/attendance?period=${periodMap[periodFilter]}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          onLogout()
          return
        }

        throw new Error(payload.message || 'Unable to load attendance.')
      }

      setAttendances(payload.attendances || [])
      setStats(payload.stats || stats)
    } catch (caughtError) {
      setError(caughtError.message || 'Unable to load attendance.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAttendance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodFilter])

  const filteredAttendances = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    if (!search) return attendances

    return attendances.filter(
      (row) =>
        row.member_name?.toLowerCase().includes(search) ||
        row.member_phone?.toLowerCase().includes(search) ||
        row.plan_name?.toLowerCase().includes(search),
    )
  }, [attendances, searchTerm])

  const handleCheckout = async (attendance) => {
    const confirmation = await Swal.fire({
      title: 'Check out member?',
      text: `${attendance.member_name} will be checked out now.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, check out',
      cancelButtonText: 'Cancel',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      cancelButtonColor: '#2a2a2a',
    })

    if (!confirmation.isConfirmed) return

    try {
      const response = await fetch(
        `${apiBaseUrl}/attendance/${attendance.id}/checkout`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to check out member.')
      }

      await Swal.fire({
        title: 'Checked out',
        text: payload.message || 'Member checked out successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      loadAttendance()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Check-out failed',
        text: caughtError.message || 'Unable to check out member.',
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
            const active = item.id === 'attendance'

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
          <p className="text-xs text-gray-500">Today Check-ins</p>
          <h3 className="text-xl font-bold mt-1">{stats.today_check_ins}</h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {stats.inside_gym} currently inside
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
              const active = item.id === 'attendance'

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
            <h1 className="text-4xl font-black">Attendance</h1>
            <p className="text-gray-400 mt-1">
              Track member check-ins, check-outs and gym occupancy.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('manual-check-in')}
            className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <UserCheck size={18} />
            Manual Check-in
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard icon={ClipboardList} title="Today Check-ins" value={stats.today_check_ins} />
          <StatCard icon={Users} title="Inside Gym" value={stats.inside_gym} />
          <StatCard icon={Clock} title="Avg Session" value={stats.avg_session} />
          <StatCard icon={UserX} title="Missed Today" value={stats.missed_today} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
                <Search size={20} className="text-gray-500 shrink-0" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search member, phone or plan..."
                  className="bg-transparent outline-none w-full text-sm placeholder:text-gray-600"
                />
              </div>

              <select
                value={periodFilter}
                onChange={(event) => setPeriodFilter(event.target.value)}
                className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-gray-300 outline-none [color-scheme:dark]"
              >
                {['Today', 'This Week', 'This Month'].map((item) => (
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

          <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
            <p className="text-gray-400 text-sm">Peak Hour</p>
            <div className="flex items-end justify-between gap-4 mt-3">
              <div>
                <h3 className="text-3xl font-black">{stats.peak_hour?.label || 'Not set'}</h3>
                <p className="text-[#C8A13A] text-sm mt-1">
                  {stats.peak_hour?.count || 0} check-ins
                </p>
              </div>
              <div className="flex items-end gap-1 h-16">
                {[36, 48, 62, 44, 58, 64, 50].map((height) => (
                  <span
                    key={height}
                    className="w-3 rounded-full bg-[#C8A13A]/80"
                    style={{ height }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-5 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold">Attendance Records</h2>
              <p className="text-gray-500 text-sm mt-1">
                Live check-in records for selected period.
              </p>
            </div>
            <span className="text-[#C8A13A] text-sm font-bold">
              {filteredAttendances.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px]">
              <thead className="bg-[#050505] text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Member</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Check In</th>
                  <th className="px-5 py-4">Check Out</th>
                  <th className="px-5 py-4">Duration</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading && (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-400" colSpan="7">
                      Loading attendance...
                    </td>
                  </tr>
                )}
                {!isLoading && error && (
                  <tr>
                    <td className="px-5 py-8 text-center text-red-300" colSpan="7">
                      {error}
                    </td>
                  </tr>
                )}
                {!isLoading && !error && filteredAttendances.map((row) => (
                  <tr key={row.id} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#C8A13A]/15 text-[#C8A13A] flex items-center justify-center font-black">
                          {row.member_name?.charAt(0) || 'M'}
                        </div>
                        <div>
                          <p className="font-bold">{row.member_name}</p>
                          <p className="text-gray-500 text-sm">{row.member_phone || 'Member'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 text-gray-300">{row.plan_name || 'Not set'}</td>
                    <td className="px-5 py-5 text-gray-300">{formatDateTime(row.check_in_at)}</td>
                    <td className="px-5 py-5 text-gray-300">{formatDateTime(row.check_out_at)}</td>
                    <td className="px-5 py-5 text-gray-300">{durationText(row)}</td>
                    <td className="px-5 py-5">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-5 text-right">
                      {row.status === 'Inside Gym' ? (
                        <button
                          type="button"
                          onClick={() => handleCheckout(row)}
                          className="px-4 py-2 rounded-xl bg-[#C8A13A] text-black text-sm font-bold"
                        >
                          Check out
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">Done</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!isLoading && !error && filteredAttendances.length === 0 && (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-400" colSpan="7">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

function StatusBadge({ status }) {
  const active = status === 'Inside Gym'

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
        active ? 'bg-green-500/15 text-green-400' : 'bg-[#C8A13A]/15 text-[#C8A13A]'
      }`}
    >
      <CheckCircle size={14} />
      {status}
    </span>
  )
}

function formatDateTime(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

function durationText(row) {
  if (!row.check_in_at) return '-'

  const start = new Date(row.check_in_at)
  const end = row.check_out_at ? new Date(row.check_out_at) : new Date()
  const minutes = Math.max(Math.round((end.getTime() - start.getTime()) / 60000), 0)

  if (minutes < 60) return `${minutes}m`

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}
