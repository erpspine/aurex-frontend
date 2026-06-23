import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
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
  { id: 'settings', name: 'Settings' },
]

export default function Classes({ onNavigate, onLogout }) {
  const [classes, setClasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')

  useEffect(() => {
    let shouldUpdate = true

    const loadClasses = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${apiBaseUrl}/classes`, {
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

          throw new Error(payload.message || 'Unable to load classes.')
        }

        if (shouldUpdate) setClasses(payload.classes || [])
      } catch (caughtError) {
        if (shouldUpdate) setError(caughtError.message || 'Unable to load classes.')
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadClasses()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const filteredClasses = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return classes.filter((item) => {
      const matchesSearch =
        !search ||
        item.name?.toLowerCase().includes(search) ||
        item.trainer_name?.toLowerCase().includes(search) ||
        item.location?.toLowerCase().includes(search)
      const matchesType =
        typeFilter === 'All Types' || item.class_type === typeFilter
      const matchesStatus =
        statusFilter === 'All Status' || item.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [classes, searchTerm, statusFilter, typeFilter])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayClasses = classes.filter((item) =>
      String(item.class_date || '').startsWith(today),
    )

    return {
      total: classes.length,
      bookingsToday: todayClasses.reduce(
        (sum, item) => sum + Number(item.booked_slots || 0),
        0,
      ),
      trainers: new Set(classes.map((item) => item.trainer_name).filter(Boolean))
        .size,
      today: todayClasses.length,
      capacity: todayClasses.reduce(
        (sum, item) => sum + Number(item.capacity || 0),
        0,
      ),
    }
  }, [classes])

  const handleViewClass = (item) => {
    const statusColor = statusTone(item.status)
    const capacity = Number(item.capacity || 0)
    const bookedSlots = Number(item.booked_slots || 0)
    const availableSlots = Math.max(capacity - bookedSlots, 0)
    const bookingPercent = capacity > 0 ? Math.min((bookedSlots / capacity) * 100, 100) : 0

    Swal.fire({
      title: '',
      html: `
        <div style="text-align:left;color:#ffffff;font-family:Inter,Arial,sans-serif">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:4px 2px 22px;border-bottom:1px solid rgba(255,255,255,0.1)">
            <div style="display:flex;align-items:center;gap:16px;min-width:0">
              <div style="width:74px;height:74px;border-radius:22px;background:rgba(200,161,58,0.16);border:1px solid rgba(200,161,58,0.35);display:flex;align-items:center;justify-content:center;color:#C8A13A;font-size:30px;font-weight:900">CL</div>
              <div style="min-width:0">
                <div style="font-size:29px;font-weight:900;line-height:1.15;overflow-wrap:anywhere">${escapeHtml(item.name)}</div>
                <div style="color:#9ca3af;font-size:14px;margin-top:7px">${escapeHtml(item.class_type)} | ${escapeHtml(item.workout_level)} | ${escapeHtml(item.trainer_name || 'No trainer')}</div>
              </div>
            </div>
            <span style="white-space:nowrap;border-radius:999px;background:${statusColor}22;color:${statusColor};font-size:12px;font-weight:900;padding:8px 11px">${escapeHtml(item.status)}</span>
          </div>

          <div class="class-modal-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:18px">
            ${metricCard('Date', formatDate(item.class_date))}
            ${metricCard('Start', timeText(item.start_time))}
            ${metricCard('End', timeText(item.end_time))}
            ${metricCard('Price', formatCurrency(item.price_amount))}
          </div>

          <div style="margin-top:18px;background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:12px">
              <div>
                <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px">Booking Capacity</div>
                <div style="color:#9ca3af;font-size:13px;margin-top:4px">${bookedSlots} booked, ${availableSlots} available</div>
              </div>
              <div style="color:#ffffff;font-size:24px;font-weight:900">${bookedSlots} / ${capacity}</div>
            </div>
            <div style="height:10px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden">
              <div style="height:100%;width:${bookingPercent}%;background:#C8A13A;border-radius:999px"></div>
            </div>
          </div>

          <div class="class-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
            ${detailCard('Trainer', item.trainer_name || 'Not set')}
            ${detailCard('Location', item.location || 'Not set')}
            ${detailCard('Repeat Schedule', item.repeat_schedule || 'Does Not Repeat')}
            ${detailCard('Access Type', item.access_type || 'Not set')}
            ${detailCard('Booking Required', item.booking_required ? 'Yes' : 'No')}
            ${detailCard('App Booking', item.allow_booking_from_app ? 'Enabled' : 'Disabled')}
            ${detailCard('Booking Deadline', item.booking_deadline || 'Not set')}
            ${detailCard('Cancellation Deadline', item.cancellation_deadline || 'Not set')}
            ${detailCard('Late Entry Limit', item.late_entry_limit || 'Not set')}
            ${detailCard('Waitlist Limit', item.waitlist_limit ?? 'Not set')}
          </div>

          ${
            item.description || item.notes
              ? `<div class="class-modal-grid two" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px">
                  ${noteCard('Description', item.description || 'Not set')}
                  ${noteCard('Notes', item.notes || 'Not set')}
                </div>`
              : ''
          }
        </div>
      `,
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      confirmButtonText: 'Close',
      width: 900,
      customClass: {
        popup: 'aurex-class-modal',
      },
    })
  }

  const handleDeleteClass = async (item) => {
    const confirmation = await Swal.fire({
      title: 'Delete class?',
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
      const response = await fetch(`${apiBaseUrl}/classes/${item.id}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        },
      })
      const payload = await response.json()

      if (!response.ok) throw new Error(payload.message || 'Unable to delete class.')

      setClasses((current) => current.filter((entry) => entry.id !== item.id))

      await Swal.fire({
        title: 'Class deleted',
        text: payload.message || 'Class deleted successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Delete failed',
        text: caughtError.message || 'Unable to delete class.',
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
            const Icon = item.icon || Settings
            const active = item.id === 'classes'
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
          <p className="text-xs text-gray-500">Classes Today</p>
          <h3 className="text-xl font-bold mt-1">{stats.today}</h3>
          <p className="text-xs text-[#C8A13A] mt-1">
            {stats.bookingsToday} bookings
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
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black">Classes</h1>
            <p className="text-gray-400 mt-1">
              Manage gym classes, trainers, schedules and bookings.
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
              onClick={() => onNavigate('add-class')}
              className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Class
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <StatCard icon={CalendarDays} title="Total Classes" value={stats.total} />
          <StatCard icon={Users} title="Bookings Today" value={stats.bookingsToday} />
          <StatCard icon={UserCog} title="Active Trainers" value={stats.trainers} />
          <StatCard icon={Clock} title="Classes Today" value={stats.today} />
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 flex items-center gap-3 bg-[#050505] border border-white/10 rounded-2xl px-4 py-3">
              <Search size={20} className="text-gray-500 shrink-0" />
              <input
                placeholder="Search class or trainer..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="bg-transparent outline-none w-full text-sm placeholder:text-gray-600"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-gray-300 outline-none [color-scheme:dark]"
            >
              {['All Types', 'HIIT', 'Strength', 'Cardio', 'Yoga', 'Beginner Fitness', 'Bodybuilding'].map((item) => (
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
              {['All Status', 'Active', 'Draft', 'Cancelled', 'Hidden'].map((item) => (
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-5">Class Schedule</h3>
            <div className="mt-2 space-y-4">
              {filteredClasses.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="bg-[#050505] border border-white/10 rounded-3xl p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center shrink-0">
                      <Dumbbell size={22} className="text-[#C8A13A]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold truncate">{item.name}</h4>
                      <p className="text-gray-500 text-sm">
                        {item.trainer_name || 'No trainer'} - {timeText(item.start_time)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[#C8A13A] font-bold">
                    {item.booked_slots || 0} / {item.capacity || 0}
                  </span>
                </div>
              ))}
              {!isLoading && filteredClasses.length === 0 && (
                <p className="text-gray-400 text-center py-8">No classes found.</p>
              )}
            </div>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-5">Today Overview</h3>
            <SummaryItem label="Classes Today" value={stats.today} />
            <SummaryItem label="Bookings Today" value={stats.bookingsToday} />
            <SummaryItem label="Total Capacity" value={stats.capacity} />
            <SummaryItem
              label="Available Slots"
              value={Math.max(stats.capacity - stats.bookingsToday, 0)}
            />
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-[#0A0A0A] text-gray-400 text-sm">
                <tr>
                  <th className="p-5">Class</th>
                  <th className="p-5">Trainer</th>
                  <th className="p-5">Type</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Time</th>
                  <th className="p-5">Capacity</th>
                  <th className="p-5">Price</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="p-8 text-center text-gray-400" colSpan="9">
                      Loading classes...
                    </td>
                  </tr>
                )}
                {!isLoading && error && (
                  <tr>
                    <td className="p-8 text-center text-red-300" colSpan="9">
                      {error}
                    </td>
                  </tr>
                )}
                {!isLoading && !error && filteredClasses.map((item) => (
                  <tr key={item.id} className="border-t border-white/10 hover:bg-white/[0.03]">
                    <td className="p-5 font-bold">{item.name}</td>
                    <td className="p-5 text-gray-300">{item.trainer_name || 'Not set'}</td>
                    <td className="p-5 text-gray-300">{item.class_type}</td>
                    <td className="p-5 text-gray-300">{formatDate(item.class_date)}</td>
                    <td className="p-5 text-gray-300">{timeText(item.start_time)} - {timeText(item.end_time)}</td>
                    <td className="p-5 text-[#C8A13A] font-bold">
                      {item.booked_slots || 0} / {item.capacity || 0}
                    </td>
                    <td className="p-5 text-gray-300">{formatCurrency(item.price_amount)}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === 'Active'
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-orange-500/15 text-orange-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-end gap-2">
                        <ActionButton icon={Eye} onClick={() => handleViewClass(item)} />
                        <ActionButton icon={Edit} onClick={() => onNavigate('edit-class', item.id)} />
                        <ActionButton icon={Trash2} danger onClick={() => handleDeleteClass(item)} />
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && !error && filteredClasses.length === 0 && (
                  <tr>
                    <td className="p-8 text-center text-gray-400" colSpan="9">
                      No classes found.
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

function metricCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;min-width:0">
      <div style="color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase">${escapeHtml(label)}</div>
      <div style="color:#ffffff;font-size:17px;font-weight:900;margin-top:8px;overflow-wrap:anywhere">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
}

function detailCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;min-width:0">
      <div style="color:#9ca3af;font-size:12px;font-weight:700;text-transform:uppercase">${escapeHtml(label)}</div>
      <div style="color:#d1d5db;font-size:14px;font-weight:700;margin-top:7px;overflow-wrap:anywhere">${escapeHtml(String(value || 'Not set'))}</div>
    </div>
  `
}

function noteCard(label, value) {
  return `
    <div style="background:#080808;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:16px;min-width:0">
      <div style="color:#C8A13A;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">${escapeHtml(label)}</div>
      <div style="color:#d1d5db;font-size:14px;line-height:1.65">${escapeHtml(value || 'Not set')}</div>
    </div>
  `
}

function statusTone(status) {
  if (status === 'Active') return '#4ade80'
  if (status === 'Draft') return '#93c5fd'
  if (status === 'Cancelled') return '#f87171'
  return '#fdba74'
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatCurrency(value) {
  return `TZS ${Number(value || 0).toLocaleString()}`
}

function formatDate(value) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function timeText(value) {
  if (!value) return 'Not set'
  return String(value).slice(0, 5)
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

function SummaryItem({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-4 border-b border-white/10 last:border-b-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-bold text-right">{value}</span>
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
