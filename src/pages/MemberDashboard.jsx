import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  CalendarDays,
  CreditCard,
  Dumbbell,
  LogOut,
  User,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const menuItems = [
  { id: 'dashboard', name: 'My Information', icon: User },
  { id: 'workouts', name: 'My Workouts', icon: Dumbbell },
]

export default function MemberDashboard({ onNavigate, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [workouts, setWorkouts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let shouldUpdate = true

    const loadMemberDashboard = async () => {
      setIsLoading(true)
      setError('')

      try {
        const headers = {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        }

        const [profileResponse, workoutsResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/me`, { headers }),
          fetch(`${apiBaseUrl}/workouts`, { headers }),
        ])

        const profilePayload = await profileResponse.json()
        const workoutsPayload = await workoutsResponse.json()

        if (!profileResponse.ok) {
          if (profileResponse.status === 401) {
            onLogout()
            return
          }

          throw new Error(profilePayload.message || 'Unable to load profile.')
        }

        if (!workoutsResponse.ok) {
          throw new Error(workoutsPayload.message || 'Unable to load workouts.')
        }

        if (shouldUpdate) {
          setProfile(profilePayload)
          setWorkouts(workoutsPayload.workouts || [])
        }
      } catch (caughtError) {
        if (shouldUpdate) {
          setError(caughtError.message || 'Unable to load member dashboard.')
        }
      } finally {
        if (shouldUpdate) setIsLoading(false)
      }
    }

    loadMemberDashboard()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const member = profile?.member || {}
  const plan = member.membership_plan || {}
  const card = member.card_details || {}
  const latestPayment = member.latest_payment || {}

  const stats = useMemo(
    () => [
      {
        icon: CreditCard,
        title: 'Membership',
        value: member.membership_status || 'Not set',
      },
      {
        icon: CalendarDays,
        title: 'Renewal Date',
        value: formatDate(member.renewal_date || member.expiry_date),
      },
      {
        icon: CreditCard,
        title: 'Card',
        value: card.card_number || member.access_code || 'Not linked',
      },
      {
        icon: Activity,
        title: 'My Workouts',
        value: workouts.length,
      },
    ],
    [card.card_number, member, workouts.length],
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <aside className="hidden lg:flex w-72 bg-[#090909] border-r border-white/10 p-5 flex-col">
        <Brand />

        <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
          {menuItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={item.id === 'dashboard'}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>

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
            {menuItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={item.id === 'dashboard'}
                onClick={() => onNavigate(item.id)}
                compact
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black">My Information</h1>
            <p className="text-gray-400 mt-1">
              View your membership, payment, card and assigned workout details.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            Loading your information...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 text-center text-red-200">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
              {stats.map((item) => (
                <StatCard key={item.title} {...item} />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <section className="xl:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-6">
                <h2 className="text-2xl font-black mb-5">Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard label="Full Name" value={member.full_name} />
                  <InfoCard label="Phone" value={member.phone} />
                  <InfoCard label="Email" value={member.email || profile?.user?.email} />
                  <InfoCard label="Gender" value={member.gender} />
                  <InfoCard label="Membership Plan" value={plan.name} />
                  <InfoCard label="Membership Status" value={member.membership_status} />
                  <InfoCard label="Start Date" value={formatDate(member.start_date)} />
                  <InfoCard label="Renewal Date" value={formatDate(member.renewal_date || member.expiry_date)} />
                  <InfoCard label="Days Before Expiry" value={formatDays(member.days_before_expiry)} />
                  <InfoCard label="Fitness Goal" value={member.fitness_goal} />
                  <InfoCard label="Workout Level" value={member.workout_level} />
                </div>
              </section>

              <section className="bg-[#111] border border-white/10 rounded-3xl p-6">
                <h2 className="text-2xl font-black mb-5">Payment & Card</h2>
                <div className="space-y-4">
                  <InfoCard label="Card Number" value={card.card_number || member.access_code || 'Not linked'} />
                  <InfoCard label="Card Status" value={card.status || (member.access_code ? 'Linked' : 'Not linked')} />
                  <InfoCard label="Amount Paid" value={formatCurrency(member.amount_paid)} />
                  <InfoCard label="Payment Method" value={member.payment_method} />
                  <InfoCard label="Payment Status" value={member.payment_status} />
                  <InfoCard label="Latest Payment" value={latestPayment.amount ? `${formatCurrency(latestPayment.amount)} • ${formatDate(latestPayment.payment_date)}` : 'Not set'} />
                </div>
              </section>
            </div>

            <section className="bg-[#111] border border-white/10 rounded-3xl p-6 mt-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-2xl font-black">My Workouts</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Workouts assigned to your goal and level.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('workouts')}
                  className="px-4 py-2 rounded-xl border border-[#C8A13A]/60 text-[#C8A13A] hover:bg-[#C8A13A]/10"
                >
                  View all
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {workouts.slice(0, 6).map((workout) => (
                  <div key={workout.id} className="bg-[#050505] border border-white/10 rounded-2xl p-4">
                    <h3 className="font-black text-lg">{workout.name}</h3>
                    <p className="text-gray-400 text-sm mt-2">
                      {workout.goal} • {workout.workout_level}
                    </p>
                    <p className="text-[#C8A13A] text-sm mt-3">
                      {workout.days_count || 1} day plan
                    </p>
                  </div>
                ))}
                {workouts.length === 0 && (
                  <div className="text-gray-400 text-sm">
                    No workouts assigned yet.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function Brand() {
  return (
    <div className="mb-8 px-2">
      <h1 className="text-3xl font-black tracking-wide">
        AUR<span className="text-[#C8A13A]">EX</span>
      </h1>
      <p className="text-[#C8A13A] text-xs tracking-[0.25em]">
        PERFORMANCE ARENA
      </p>
    </div>
  )
}

function NavButton({ item, active, onClick, compact = false }) {
  const Icon = item.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${compact ? 'flex' : 'w-full flex'} items-center gap-3 px-4 py-3 rounded-2xl transition text-sm ${
        active
          ? 'bg-[#C8A13A] text-black font-bold shadow-lg shadow-[#C8A13A]/20'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={19} />
      <span>{item.name}</span>
    </button>
  )
}

function StatCard({ icon: Icon, title, value }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-5">
      <div className="w-12 h-12 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center mb-4">
        <Icon className="text-[#C8A13A]" size={22} />
      </div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-2xl font-black mt-1">{value || 'Not set'}</h3>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-[#050505] border border-white/10 rounded-2xl p-4">
      <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
      <div className="text-white font-bold mt-2 break-words">{value || 'Not set'}</div>
    </div>
  )
}

function formatDate(value) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatCurrency(value) {
  return `TZS ${Number(value || 0).toLocaleString()}`
}

function formatDays(value) {
  if (value === null || value === undefined || value === '') return 'Not set'
  const days = Number(value)
  if (!Number.isFinite(days)) return 'Not set'
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`
  if (days === 0) return 'Expires today'
  return `${days} day${days === 1 ? '' : 's'} left`
}
