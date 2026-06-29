import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  CreditCard,
  DollarSign,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  PieChart,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
  Trophy,
  UserCog,
  Users,
  Utensils,
  Wallet,
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

const periodOptions = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
]

export default function Reports({ onNavigate, onLogout }) {
  const [period, setPeriod] = useState('month')
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/reports?period=${period}`, {
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

        throw new Error(payload.message || 'Unable to load reports.')
      }

      setReport(payload)
    } catch (caughtError) {
      setError(caughtError.message || 'Unable to load reports.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const stats = report?.stats || {}
  const revenueSeries = report?.revenue_series || []
  const attendanceSeries = report?.attendance_series || []
  const recentPayments = report?.recent_payments || []

  const reportRange = useMemo(() => {
    if (!report?.period) return ''

    return `${formatDate(report.period.start_date)} - ${formatDate(report.period.end_date)}`
  }, [report])

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
          <p className="text-xs text-gray-500">Report Revenue</p>
          <h3 className="text-xl font-bold mt-1">
            {formatCurrency(stats.revenue)}
          </h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {stats.transactions || 0} transactions
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
            <h1 className="text-4xl font-black">Reports</h1>
            <p className="text-gray-400 mt-1">
              Review revenue, member growth, attendance and class performance.
            </p>
            {reportRange && (
              <p className="text-[#C8A13A] text-sm mt-2">{reportRange}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-1 flex">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                    period === option.value
                      ? 'bg-[#C8A13A] text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={loadReport}
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard
            icon={Wallet}
            title="Revenue"
            value={formatCurrency(stats.revenue)}
            loading={isLoading}
          />
          <StatCard
            icon={DollarSign}
            title="Pending Payments"
            value={formatCurrency(stats.pending_payments)}
            loading={isLoading}
          />
          <StatCard
            icon={Users}
            title="Active Members"
            value={stats.active_members || 0}
            loading={isLoading}
          />
          <StatCard
            icon={ClipboardList}
            title="Check-ins"
            value={stats.check_ins || 0}
            loading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-5">
            <SectionHeader
              icon={BarChart3}
              title="Revenue Trend"
              subtitle="Paid payment totals for the selected period."
            />
            <BarSeries data={revenueSeries} formatter={formatCompactCurrency} />
          </div>

          <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
            <SectionHeader
              icon={PieChart}
              title="Revenue Category"
              subtitle="Income split by payment type."
            />
            <BreakdownList
              data={report?.revenue_by_category || []}
              formatter={formatCurrency}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-5">
            <SectionHeader
              icon={Activity}
              title="Attendance Trend"
              subtitle="Member check-ins for the selected period."
            />
            <BarSeries data={attendanceSeries} formatter={(value) => value} />
          </div>

          <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
            <SectionHeader
              icon={Users}
              title="Member Status"
              subtitle="Current member distribution."
            />
            <BreakdownList
              data={report?.member_status || []}
              formatter={(value) => value}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
            <SectionHeader
              icon={CreditCard}
              title="Payment Methods"
              subtitle="Paid revenue by collection method."
            />
            <BreakdownList
              data={report?.payment_methods || []}
              formatter={formatCurrency}
            />
          </div>

          <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
            <SectionHeader
              icon={Trophy}
              title="Top Services"
              subtitle="Highest earning plans and services."
            />
            <BreakdownList
              data={report?.top_services || []}
              formatter={formatCurrency}
            />
          </div>

          <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
            <SectionHeader
              icon={CalendarDays}
              title="Operations"
              subtitle="Selected period activity summary."
            />
            <MetricRow label="New members" value={stats.new_members || 0} />
            <MetricRow
              label="Average daily attendance"
              value={stats.avg_daily_attendance || 0}
            />
            <MetricRow label="Class bookings" value={stats.class_bookings || 0} />
            <MetricRow label="Transactions" value={stats.transactions || 0} />
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden mt-8">
          <div className="px-5 py-5 border-b border-white/10">
            <h2 className="text-xl font-bold">Recent Payments</h2>
            <p className="text-gray-500 text-sm mt-1">
              Latest transactions included in this report period.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-[#050505] text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Payer</th>
                  <th className="px-5 py-4">Item</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading && (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-400" colSpan="5">
                      Loading reports...
                    </td>
                  </tr>
                )}

                {!isLoading && recentPayments.length === 0 && (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-400" colSpan="5">
                      No payments found for this period.
                    </td>
                  </tr>
                )}

                {!isLoading && recentPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-5">
                      <p className="font-bold">{getPayerName(payment)}</p>
                      <p className="text-gray-500 text-sm">
                        {payment.reference_number}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-gray-300">
                      <p>{payment.item_name}</p>
                      <p className="text-gray-500 text-sm">{payment.payment_for}</p>
                    </td>
                    <td className="px-5 py-5 text-gray-300">
                      {payment.payment_method}
                    </td>
                    <td className="px-5 py-5 text-gray-300">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-5 py-5 font-bold text-[#C8A13A]">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, loading }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
      <div className="w-12 h-12 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center mb-4">
        <Icon className="text-[#C8A13A]" size={22} />
      </div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-2xl font-black mt-1">
        {loading ? 'Loading...' : value}
      </h3>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-11 h-11 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center shrink-0">
        <Icon className="text-[#C8A13A]" size={20} />
      </div>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

function BarSeries({ data, formatter }) {
  const maxValue = Math.max(...data.map((item) => Number(item.value || 0)), 1)

  if (data.length === 0) {
    return <div className="text-gray-400 py-12 text-center">No data available.</div>
  }

  return (
    <div className="h-72 flex items-end gap-2 sm:gap-3 overflow-x-auto pb-2">
      {data.map((item) => {
        const height = Math.max((Number(item.value || 0) / maxValue) * 210, 8)

        return (
          <div key={item.key} className="min-w-12 flex-1 flex flex-col items-center gap-3">
            <div className="text-[11px] text-gray-400 h-4">
              {formatter(item.value)}
            </div>
            <div className="h-56 flex items-end w-full">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-[#C8A13A] to-[#F3D36B]"
                style={{ height }}
              />
            </div>
            <div className="text-[11px] text-gray-500 whitespace-nowrap">
              {item.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BreakdownList({ data, formatter }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0)

  if (data.length === 0) {
    return <div className="text-gray-400 py-10 text-center">No data available.</div>
  }

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const width = total > 0 ? Math.max((Number(item.value || 0) / total) * 100, 4) : 4

        return (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-4 text-sm mb-2">
              <span className="text-gray-300 truncate">{item.label}</span>
              <span className="font-bold text-white whitespace-nowrap">
                {formatter(item.value)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#C8A13A]"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-white/10 last:border-b-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-black text-lg">{value}</span>
    </div>
  )
}

function getPayerName(payment) {
  if (payment.payer_type === 'Member') {
    return payment.member?.full_name || 'Member'
  }

  return payment.walk_in_name || 'Walk-in'
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

function formatDate(value) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
