import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle,
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
  Smartphone,
  Trash2,
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
  { id: 'mobile', name: 'Mobile App', icon: Smartphone },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
]

export default function MembershipPlans({ onNavigate, onLogout }) {
  const [plans, setPlans] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')

  useEffect(() => {
    let shouldUpdate = true

    const loadPlans = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/membership-plans`, {
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

          throw new Error(payload.message || 'Unable to load plans.')
        }

        if (shouldUpdate) {
          setPlans(payload.plans || [])
        }
      } catch (caughtError) {
        if (shouldUpdate) {
          setError(caughtError.message || 'Unable to load plans.')
        }
      } finally {
        if (shouldUpdate) {
          setIsLoading(false)
        }
      }
    }

    loadPlans()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const filteredPlans = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return plans.filter((plan) => {
      const matchesSearch =
        !normalizedSearch || plan.name?.toLowerCase().includes(normalizedSearch)
      const matchesStatus =
        statusFilter === 'All Status' || plan.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [plans, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const totalRevenue = plans.reduce(
      (sum, plan) => sum + Number(plan.price_amount || 0),
      0,
    )
    const monthlyPlans = plans.filter(
      (plan) => plan.billing_cycle === 'Monthly',
    ).length

    return {
      totalPlans: plans.length,
      activePlans: plans.filter((plan) => plan.status === 'Active').length,
      revenue: totalRevenue,
      monthlyPlans,
    }
  }, [plans])

  const handleViewPlan = (plan) => {
    const benefits = plan.benefits?.length ? plan.benefits : ['No benefits added']

    Swal.fire({
      title: '',
      width: 720,
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          <div style="margin:-8px -4px 22px;padding:26px;border-radius:24px;background:linear-gradient(135deg,#050505 0%,#141414 58%,#2b2108 100%);border:1px solid rgba(200,161,58,0.32)">
            <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start">
              <div>
                <div style="font-size:13px;letter-spacing:3px;color:#C8A13A;font-weight:800;margin-bottom:10px">AUREX PLAN</div>
                <div style="font-size:30px;line-height:1.1;font-weight:900;color:#ffffff">${plan.name}</div>
                <div style="font-size:14px;color:#a8a8a8;margin-top:10px">${plan.billing_cycle} membership package</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
                <span style="display:inline-flex;padding:7px 12px;border-radius:999px;background:${plan.status === 'Active' ? 'rgba(34,197,94,0.16)' : 'rgba(251,146,60,0.16)'};color:${plan.status === 'Active' ? '#4ade80' : '#fb923c'};font-size:12px;font-weight:900">${plan.status}</span>
                ${plan.featured ? '<span style="display:inline-flex;padding:7px 12px;border-radius:999px;background:#C8A13A;color:#050505;font-size:12px;font-weight:900">FEATURED</span>' : ''}
              </div>
            </div>

            <div style="margin-top:26px">
              <div style="font-size:13px;color:#8f8f8f;margin-bottom:6px">Plan Price</div>
              <div style="font-size:34px;font-weight:900;color:#C8A13A">${formatCurrency(plan.price_amount, plan.currency)}</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px">
            ${metricCard('Duration', formatDuration(plan.duration_days))}
            ${metricCard('Access', plan.access_type)}
            ${metricCard('Mobile App', plan.show_in_mobile_app ? 'Visible' : 'Hidden')}
          </div>

          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:22px">
            ${metricCard('Trial Days', `${plan.trial_days || 0}`)}
            ${metricCard('Grace Period', `${plan.grace_period_days || 0} days`)}
            ${metricCard('Reminder', `${plan.renewal_reminder_days || 0} days`)}
          </div>

          <div style="background:#050505;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:18px;margin-bottom:18px">
            <div style="font-size:15px;font-weight:900;color:#ffffff;margin-bottom:14px">Benefits Included</div>
            <div style="display:flex;flex-wrap:wrap;gap:10px">
              ${benefits.map((benefit) => `<span style="display:inline-flex;align-items:center;gap:8px;padding:10px 12px;border-radius:14px;background:rgba(200,161,58,0.1);border:1px solid rgba(200,161,58,0.28);color:#e5e7eb;font-size:13px"><span style="width:7px;height:7px;border-radius:999px;background:#C8A13A;display:inline-block"></span>${benefit}</span>`).join('')}
            </div>
          </div>

          <div style="background:#151515;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:18px">
            <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:10px">
              <div>
                <div style="font-size:13px;color:#8f8f8f">Publish Status</div>
                <div style="font-size:16px;color:#ffffff;font-weight:800;margin-top:4px">${plan.publish_status}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:13px;color:#8f8f8f">Member Limit</div>
                <div style="font-size:16px;color:#ffffff;font-weight:800;margin-top:4px">${plan.member_limit || 'Unlimited'}</div>
              </div>
            </div>
            <div style="height:1px;background:rgba(255,255,255,0.1);margin:14px 0"></div>
            <div style="font-size:13px;color:#8f8f8f;margin-bottom:6px">Cancellation Policy</div>
            <div style="font-size:14px;color:#d1d5db;line-height:1.6">${plan.cancellation_policy || 'No cancellation policy added.'}</div>
          </div>
        </div>
      `,
      showCloseButton: true,
      confirmButtonText: 'Close',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
    })
  }

  const handleDeletePlan = async (plan) => {
    const confirmation = await Swal.fire({
      title: 'Delete this plan?',
      text: `${plan.name} will be removed permanently.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      cancelButtonColor: '#2a2a2a',
    })

    if (!confirmation.isConfirmed) {
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/membership-plans/${plan.id}`, {
        method: 'DELETE',
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

        throw new Error(payload.message || 'Unable to delete plan.')
      }

      setPlans((current) => current.filter((item) => item.id !== plan.id))

      await Swal.fire({
        title: 'Plan deleted',
        text: payload.message || 'Membership plan deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete plan.',
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
            const active = item.id === 'plans'

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
          <p className="text-xs text-gray-500">Plan Revenue</p>
          <h3 className="text-xl font-bold mt-1">
            {formatCurrency(stats.revenue)}
          </h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {stats.activePlans} active plans
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
              const active = item.id === 'plans'

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
            <h1 className="text-4xl font-black">Membership Plans</h1>
            <p className="text-gray-400 mt-1">
              Manage gym packages, pricing, duration and member access.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('add-plan')}
            className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Plan
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard
            icon={CreditCard}
            title="Total Plans"
            value={stats.totalPlans}
          />
          <StatCard icon={Users} title="Active Plans" value={stats.activePlans} />
          <StatCard
            icon={Wallet}
            title="Plan Revenue"
            value={formatCurrency(stats.revenue)}
          />
          <StatCard
            icon={CalendarDays}
            title="Monthly Plans"
            value={stats.monthlyPlans}
          />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input
                placeholder="Search membership plan..."
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {isLoading && (
            <div className="md:col-span-2 xl:col-span-4 bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
              Loading membership plans...
            </div>
          )}

          {!isLoading && error && (
            <div className="md:col-span-2 xl:col-span-4 bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center text-red-300">
              {error}
            </div>
          )}

          {!isLoading && !error && filteredPlans.length === 0 && (
            <div className="md:col-span-2 xl:col-span-4 bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
              No membership plans found.
            </div>
          )}

          {!isLoading && !error && filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-[#111] border rounded-3xl p-6 hover:border-[#C8A13A]/70 transition ${
                plan.featured
                  ? 'border-[#C8A13A]/70'
                  : 'border-white/10'
              }`}
            >
              {plan.featured && (
                <div className="mb-4 inline-flex bg-[#C8A13A] text-black text-xs font-black px-3 py-1 rounded-full">
                  POPULAR
                </div>
              )}

              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="text-2xl font-black">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {formatDuration(plan.duration_days)}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    plan.status === 'Active'
                      ? 'bg-green-500/15 text-green-400'
                      : 'bg-orange-500/15 text-orange-400'
                  }`}
                >
                  {plan.status}
                </span>
              </div>

              <div className="mt-6">
                <h2 className="text-3xl font-black text-[#C8A13A]">
                  {formatCurrency(plan.price_amount, plan.currency)}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {plan.member_limit ? `${plan.member_limit} member limit` : 'Unlimited members'}
                </p>
              </div>

              <div className="space-y-3 mt-6">
                {(plan.benefits || []).map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle
                      size={17}
                      className="text-[#C8A13A] shrink-0"
                    />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-6 pt-5 border-t border-white/10">
                <ActionButton icon={Eye} onClick={() => handleViewPlan(plan)} />
                <ActionButton
                  icon={Edit}
                  onClick={() => onNavigate('edit-plan', plan.id)}
                />
                <ActionButton
                  icon={Trash2}
                  danger
                  onClick={() => handleDeletePlan(plan)}
                />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function metricCard(label, value) {
  return `
    <div style="background:#050505;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:15px">
      <div style="font-size:12px;color:#8f8f8f;margin-bottom:7px">${label}</div>
      <div style="font-size:15px;color:#ffffff;font-weight:900;line-height:1.35">${value}</div>
    </div>
  `
}

function formatCurrency(value, currency = 'TZS') {
  return `${currency} ${Number(value || 0).toLocaleString()}`
}

function formatDuration(days) {
  const value = Number(days || 0)

  return `${value} ${value === 1 ? 'Day' : 'Days'}`
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
