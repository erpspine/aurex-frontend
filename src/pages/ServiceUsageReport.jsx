import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
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

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'available', label: 'Available' },
  { value: 'exhausted', label: 'Exhausted' },
]

export default function ServiceUsageReport({ onNavigate, onLogout }) {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadUsageReport = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/member-service-usages`, {
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

        throw new Error(payload.message || 'Unable to load service usage report.')
      }

      setRows(payload.service_usages || [])
    } catch (caughtError) {
      setError(caughtError.message || 'Unable to load service usage report.')
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsageReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const allowed = Number(row.allowed_sessions || 0)
      const used = Number(row.used_sessions || 0)
      const remaining = Math.max(allowed - used, 0)

      if (statusFilter === 'available' && remaining <= 0) {
        return false
      }

      if (statusFilter === 'exhausted' && remaining > 0) {
        return false
      }

      if (!query) {
        return true
      }

      const memberName = String(row.member?.full_name || '').toLowerCase()
      const memberPhone = String(row.member?.phone || '').toLowerCase()
      const serviceName = String(row.service_name || '').toLowerCase()

      return memberName.includes(query) || memberPhone.includes(query) || serviceName.includes(query)
    })
  }, [rows, searchTerm, statusFilter])

  const summary = useMemo(() => {
    const totals = rows.reduce(
      (acc, row) => {
        const allowed = Number(row.allowed_sessions || 0)
        const used = Number(row.used_sessions || 0)
        const remaining = Math.max(allowed - used, 0)

        acc.allowed += allowed
        acc.used += used
        acc.remaining += remaining

        if (remaining <= 0) {
          acc.exhausted += 1
        } else {
          acc.available += 1
        }

        return acc
      },
      {
        allowed: 0,
        used: 0,
        remaining: 0,
        exhausted: 0,
        available: 0,
      },
    )

    return {
      ...totals,
      rows: rows.length,
    }
  }, [rows])

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
            const active = item.id === 'reports'

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
          <p className="text-xs text-gray-500">Monitored Services</p>
          <h3 className="text-xl font-bold mt-1">{summary.rows}</h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {summary.exhausted} exhausted
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
              const active = item.id === 'reports'

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

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-4xl font-black">Service Usage Report</h1>
            <p className="text-gray-400 mt-1">
              Monitor allocated sessions, consumed sessions and exhausted services.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="border border-white/10 px-5 py-3 rounded-2xl text-gray-300 hover:border-[#C8A13A]"
            >
              Back to Reports
            </button>
            <button
              type="button"
              onClick={loadUsageReport}
              className="border border-white/10 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-gray-300 hover:border-[#C8A13A]"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl p-4 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          <SummaryCard label="Services" value={summary.rows} />
          <SummaryCard label="Total Allowed" value={summary.allowed} />
          <SummaryCard label="Total Used" value={summary.used} />
          <SummaryCard label="Remaining" value={summary.remaining} />
          <SummaryCard label="Exhausted" value={summary.exhausted} />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-1">
              <Search size={20} className="text-[#C8A13A] shrink-0" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by member name, phone, or service"
                className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none [color-scheme:dark]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#050505] text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-[#050505] text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Member</th>
                  <th className="px-5 py-4">Service</th>
                  <th className="px-5 py-4">Allowed</th>
                  <th className="px-5 py-4">Used</th>
                  <th className="px-5 py-4">Remaining</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading && (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-400" colSpan="7">
                      Loading service usage report...
                    </td>
                  </tr>
                )}

                {!isLoading && filteredRows.length === 0 && (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-400" colSpan="7">
                      No service usage entries found.
                    </td>
                  </tr>
                )}

                {!isLoading && filteredRows.map((row) => {
                  const allowed = Number(row.allowed_sessions || 0)
                  const used = Number(row.used_sessions || 0)
                  const remaining = Math.max(allowed - used, 0)
                  const exhausted = remaining <= 0

                  return (
                    <tr key={row.id} className="hover:bg-white/[0.03]">
                      <td className="px-5 py-5">
                        <p className="font-bold">{row.member?.full_name || 'Unknown member'}</p>
                        <p className="text-gray-500 text-sm">{row.member?.phone || 'No phone'}</p>
                      </td>
                      <td className="px-5 py-5 text-gray-200">{row.service_name}</td>
                      <td className="px-5 py-5 text-gray-300">{allowed}</td>
                      <td className="px-5 py-5 text-gray-300">{used}</td>
                      <td className="px-5 py-5 font-semibold text-[#C8A13A]">{remaining}</td>
                      <td className="px-5 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          exhausted ? 'bg-red-500/15 text-red-300' : 'bg-green-500/15 text-green-300'
                        }`}>
                          {exhausted ? 'Exhausted' : 'Available'}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-gray-400">{formatDateTime(row.updated_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-black mt-2">{value}</p>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) {
    return 'Not set'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
