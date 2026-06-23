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
  Filter,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Smartphone,
  Trash2,
  Trophy,
  UserCheck,
  UserCog,
  Users,
  UserX,
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

export default function Members({ onNavigate, onLogout }) {
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let shouldUpdate = true

    const loadMembers = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/members`, {
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

          throw new Error(payload.message || 'Unable to load members.')
        }

        if (shouldUpdate) {
          setMembers(payload.members || [])
        }
      } catch (caughtError) {
        if (shouldUpdate) {
          setError(caughtError.message || 'Unable to load members.')
        }
      } finally {
        if (shouldUpdate) {
          setIsLoading(false)
        }
      }
    }

    loadMembers()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const filteredMembers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return members.filter((member) => {
      if (!search) return true

      return (
        member.full_name?.toLowerCase().includes(search) ||
        member.phone?.toLowerCase().includes(search) ||
        member.membership_plan?.name?.toLowerCase().includes(search)
      )
    })
  }, [members, searchTerm])

  const stats = useMemo(() => {
    const today = new Date()
    const soon = new Date()
    soon.setDate(today.getDate() + 7)

    return {
      active: members.filter((member) => member.membership_status === 'Active')
        .length,
      expired: members.filter((member) => member.membership_status === 'Expired')
        .length,
      payments: members.reduce(
        (sum, member) => sum + Number(member.amount_paid || 0),
        0,
      ),
      expiringSoon: members.filter((member) => {
        if (!member.expiry_date) return false
        const expiry = new Date(member.expiry_date)
        return expiry >= today && expiry <= soon
      }).length,
    }
  }, [members])

  const handleViewMember = (member) => {
    const initials = member.full_name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase()

    Swal.fire({
      title: '',
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          <div style="display:flex;align-items:center;gap:16px;padding:4px 2px 22px;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div style="width:64px;height:64px;border-radius:18px;background:#C8A13A;color:#050505;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900">
              ${escapeHtml(initials || 'M')}
            </div>
            <div style="min-width:0">
              <div style="font-size:26px;font-weight:900;line-height:1.15">${escapeHtml(member.full_name)}</div>
              <div style="margin-top:7px;display:flex;gap:8px;flex-wrap:wrap">
                ${statusPill(member.membership_status)}
                ${statusPill(member.payment_status, 'payment')}
              </div>
            </div>
          </div>

          <div class="member-detail-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
            ${detailCard('Phone', member.phone)}
            ${detailCard('Email', member.email || 'Not set')}
            ${detailCard('Membership Plan', member.membership_plan?.name || 'No plan')}
            ${detailCard('Expiry Date', formatDate(member.expiry_date))}
            ${detailCard('Start Date', formatDate(member.start_date))}
            ${detailCard('Amount Paid', formatCurrency(member.amount_paid))}
          </div>

          <div class="member-metric-grid" style="margin-top:18px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
            ${metricCard('Height', member.height_cm ? `${member.height_cm} cm` : 'Not set')}
            ${metricCard('Weight', member.weight_kg ? `${member.weight_kg} kg` : 'Not set')}
            ${metricCard('Level', member.workout_level || 'Not set')}
          </div>

          <div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
            <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Fitness & Emergency</div>
            <div class="member-detail-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
              ${compactRow('Goal', member.fitness_goal || 'Not set')}
              ${compactRow('Address', member.address || 'Not set')}
              ${compactRow('Emergency Contact', member.emergency_contact_name || 'Not set')}
              ${compactRow('Emergency Phone', member.emergency_contact_phone || 'Not set')}
            </div>
          </div>

          <div style="margin-top:18px;background:rgba(200,161,58,0.10);border:1px solid rgba(200,161,58,0.28);border-radius:18px;padding:16px">
            <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Mobile App Access</div>
            <div style="color:#d1d5db;font-size:14px;line-height:1.6">
              Login email: <strong style="color:#ffffff">${escapeHtml(member.user?.email || member.email || 'Not set')}</strong><br>
              Account status: <strong style="color:#ffffff">${escapeHtml(member.user?.status || 'Not linked')}</strong>
            </div>
          </div>
        </div>
      `,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      confirmButtonText: 'Close',
      width: 760,
      customClass: {
        popup: 'aurex-member-modal',
      },
    })
  }

  const handleDeleteMember = async (member) => {
    const confirmation = await Swal.fire({
      title: 'Delete member?',
      text: `${member.full_name} will be removed permanently.`,
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
      const response = await fetch(`${apiBaseUrl}/members/${member.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to delete member.')
      }

      setMembers((current) => current.filter((item) => item.id !== member.id))

      await Swal.fire({
        title: 'Member deleted',
        text: payload.message || 'Member deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete member.',
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
            const active = item.id === 'members'

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
          <p className="text-xs text-gray-500">Active Members</p>
          <h3 className="text-xl font-bold mt-1">{stats.active}</h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {members.length} total members
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
            {menuItems.slice(0, 7).map((item) => {
              const Icon = item.icon
              const active = item.id === 'members'

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
            <h1 className="text-4xl font-black">Members</h1>
            <p className="text-gray-400 mt-1">
              Manage gym members, subscriptions and payments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('add-member')}
            className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Member
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard icon={UserCheck} title="Active Members" value={stats.active} />
          <StatCard icon={UserX} title="Expired Members" value={stats.expired} />
          <StatCard
            icon={Wallet}
            title="Payments This Month"
            value={`TZS ${stats.payments.toLocaleString()}`}
          />
          <StatCard
            icon={CalendarDays}
            title="Expiring Soon"
            value={stats.expiringSoon}
          />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 flex-1">
              <Search className="text-gray-500 shrink-0" size={20} />
              <input
                placeholder="Search member by name, phone or membership..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder:text-gray-600"
              />
            </div>

            <button
              type="button"
              className="border border-white/10 px-5 py-3 rounded-2xl flex items-center justify-center gap-2 text-gray-300 hover:border-[#C8A13A]"
            >
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#0A0A0A] text-gray-400 text-sm">
                <tr>
                  <th className="p-5">Member</th>
                  <th className="p-5">Plan</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Expiry Date</th>
                  <th className="p-5">Payment</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {isLoading && (
                  <tr>
                    <td className="p-8 text-center text-gray-400" colSpan="6">
                      Loading members...
                    </td>
                  </tr>
                )}

                {!isLoading && error && (
                  <tr>
                    <td className="p-8 text-center text-red-300" colSpan="6">
                      {error}
                    </td>
                  </tr>
                )}

                {!isLoading && !error && filteredMembers.length === 0 && (
                  <tr>
                    <td className="p-8 text-center text-gray-400" colSpan="6">
                      No members found.
                    </td>
                  </tr>
                )}

                {!isLoading && !error && filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-t border-white/10 hover:bg-white/[0.03]"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#C8A13A] text-black font-bold flex items-center justify-center">
                          {member.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold">{member.full_name}</h3>
                          <p className="text-gray-500 text-sm">{member.phone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 text-gray-300">
                      {member.membership_plan?.name || 'No plan'}
                    </td>

                    <td className="p-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          member.membership_status === 'Active'
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {member.membership_status}
                      </span>
                    </td>

                    <td className="p-5 text-gray-300">
                      {formatDate(member.expiry_date)}
                    </td>

                    <td className="p-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          member.payment_status === 'Paid'
                            ? 'bg-[#C8A13A]/15 text-[#C8A13A]'
                            : 'bg-orange-500/15 text-orange-400'
                        }`}
                      >
                        {member.payment_status}
                      </span>
                    </td>

                    <td className="p-5">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          icon={Eye}
                          onClick={() => handleViewMember(member)}
                        />
                        <ActionButton
                          icon={Edit}
                          onClick={() => onNavigate('edit-member', member.id)}
                        />
                        <ActionButton
                          icon={Trash2}
                          danger
                          onClick={() => handleDeleteMember(member)}
                        />
                      </div>
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

function formatDate(value) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatCurrency(value) {
  return `TZS ${Number(value || 0).toLocaleString()}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function statusPill(value, type = 'membership') {
  const active = type === 'payment' ? value === 'Paid' : value === 'Active'
  const color = active ? '#22c55e' : '#f97316'

  return `
    <span style="display:inline-flex;align-items:center;border-radius:999px;background:${color}22;color:${color};font-size:12px;font-weight:900;padding:7px 10px">
      ${escapeHtml(value || 'Not set')}
    </span>
  `
}

function detailCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;min-width:0">
      <div style="color:#8f8f8f;font-size:12px;font-weight:700;margin-bottom:7px">${escapeHtml(label)}</div>
      <div style="color:#ffffff;font-size:15px;font-weight:800;overflow-wrap:anywhere">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
}

function metricCard(label, value) {
  return `
    <div style="background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px">
      <div style="color:#8f8f8f;font-size:12px;font-weight:700">${escapeHtml(label)}</div>
      <div style="color:#C8A13A;font-size:17px;font-weight:900;margin-top:6px">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
}

function compactRow(label, value) {
  return `
    <div>
      <div style="color:#8f8f8f;font-size:12px;font-weight:700;margin-bottom:4px">${escapeHtml(label)}</div>
      <div style="color:#ffffff;font-size:14px;font-weight:700;overflow-wrap:anywhere">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
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
