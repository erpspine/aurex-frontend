import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  KeyRound,
  Lock,
  Smartphone,
  Trophy,
  Upload,
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
  { id: 'settings', name: 'Settings', icon: SettingsIcon },
]

const settingTabs = [
  'Gym Profile',
  'Mobile App',
  'Membership',
  'Payments',
  'Notifications',
  'Users & Roles',
  'Security',
]

const defaultSettings = {
  gym_profile: {
    gym_name: 'AUREX Performance Arena',
    email: 'info@aurexgym.com',
    phone: '+255 712 345 678',
    location: 'Arusha, Tanzania',
    description:
      'Premium fitness facility offering gym access, classes, personal training, diet plans and mobile app workouts.',
  },
  mobile_app: {
    allow_registration: true,
    require_membership: true,
    show_diet_plans: true,
    show_workout_levels: true,
    enable_class_booking: true,
    enable_progress_tracking: true,
  },
  membership: {
    grace_period: '3 days',
    auto_expire: true,
    allow_walkins: true,
    expiry_reminder: true,
  },
  payments: {
    default_currency: 'TZS',
    payment_methods: 'Cash, M-Pesa, Card',
    receipt_prefix: 'AUX-REC',
    allow_partial_payment: false,
  },
  notifications: {
    membership_expiry_alerts: true,
    payment_confirmation_sms: true,
    class_booking_notifications: true,
    workout_reminders: true,
  },
  users_roles: {
    default_staff_role: 'Manager',
    allow_staff_account_creation: true,
    trainer_content_access: 'Create & Edit',
    payment_permission: 'Admin & Manager',
  },
  security: {
    two_factor_authentication: 'Disabled',
    session_timeout: '30 Minutes',
    password_policy: 'Strong',
    login_access: 'Admin & Staff',
  },
}

const yesNoOptions = ['Yes', 'No']

export default function Settings({ onNavigate, onLogout }) {
  const [activeTab, setActiveTab] = useState('Gym Profile')
  const [settings, setSettings] = useState(defaultSettings)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    let shouldUpdate = true

    const loadSettings = async () => {
      setIsLoadingSettings(true)

      try {
        const response = await fetch(`${apiBaseUrl}/settings`, {
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

          throw new Error(payload.message || 'Unable to load settings.')
        }

        if (shouldUpdate) {
          setSettings(mergeSettings(defaultSettings, payload.settings || {}))
        }
      } catch (caughtError) {
        if (shouldUpdate) {
          Swal.fire({
            title: 'Load failed',
            text: caughtError.message || 'Unable to load settings.',
            icon: 'error',
            background: '#101010',
            color: '#ffffff',
            confirmButtonColor: '#C8A13A',
          })
        }
      } finally {
        if (shouldUpdate) setIsLoadingSettings(false)
      }
    }

    loadSettings()

    return () => {
      shouldUpdate = false
    }
  }, [onLogout])

  const updateSetting = (section, field, value) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }))
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)

    try {
      const response = await fetch(`${apiBaseUrl}/settings`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })
      const payload = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          onLogout()
          return
        }

        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message

        throw new Error(validationMessage || 'Unable to save settings.')
      }

      setSettings(mergeSettings(defaultSettings, payload.settings || {}))

      await Swal.fire({
        title: 'Settings saved',
        text: payload.message || 'Settings saved successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to save settings.',
        icon: 'error',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  const updatePasswordField = (field, value) => {
    setPasswordData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()

    setIsChangingPassword(true)

    try {
      const response = await fetch(`${apiBaseUrl}/change-password`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      })
      const payload = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          onLogout()
          return
        }

        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message

        throw new Error(validationMessage || 'Unable to change password.')
      }

      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      })

      await Swal.fire({
        title: 'Password changed',
        text: payload.message || 'Your password was changed successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Password change failed',
        text: caughtError.message || 'Unable to change password.',
        icon: 'error',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })
    } finally {
      setIsChangingPassword(false)
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
            const active = item.id === 'settings'

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
          <p className="text-xs text-gray-500">System Status</p>
          <h3 className="text-xl font-bold mt-1">Online</h3>
          <p className="text-xs text-[#C8A13A] mt-1">All services active</p>
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
              const active = item.id === 'settings'

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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-4xl font-black">Settings</h1>
            <p className="text-gray-400 mt-1">
              Manage gym profile, app settings, payments and notifications.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSavingSettings || isLoadingSettings}
            className="bg-[#C8A13A] disabled:opacity-60 text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {isSavingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {isLoadingSettings && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-5 mb-6 text-gray-400">
            Loading settings...
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="space-y-3">
            {settingTabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveTab(item)}
                className={`w-full text-left px-5 py-4 rounded-2xl font-bold ${
                  activeTab === item
                    ? 'bg-[#C8A13A] text-black'
                    : 'bg-[#111] border border-white/10 text-gray-400 hover:text-white hover:border-[#C8A13A]/40'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="xl:col-span-3 space-y-6">
            {activeTab === 'Gym Profile' && (
              <>
                <Section title="Gym Profile" icon={Building2}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                      icon={Building2}
                      label="Gym Name"
                      value={settings.gym_profile.gym_name}
                      onChange={(value) =>
                        updateSetting('gym_profile', 'gym_name', value)
                      }
                    />
                    <Input
                      icon={Mail}
                      label="Email Address"
                      type="email"
                      value={settings.gym_profile.email}
                      onChange={(value) =>
                        updateSetting('gym_profile', 'email', value)
                      }
                    />
                    <Input
                      icon={Phone}
                      label="Phone Number"
                      value={settings.gym_profile.phone}
                      onChange={(value) =>
                        updateSetting('gym_profile', 'phone', value)
                      }
                    />
                    <Input
                      icon={MapPin}
                      label="Location"
                      value={settings.gym_profile.location}
                      onChange={(value) =>
                        updateSetting('gym_profile', 'location', value)
                      }
                    />
                  </div>

                  <div className="mt-5">
                    <TextArea
                      label="Gym Description"
                      value={settings.gym_profile.description}
                      onChange={(value) =>
                        updateSetting('gym_profile', 'description', value)
                      }
                    />
                  </div>
                </Section>

                <Section title="Branding" icon={Upload}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <UploadBox title="Upload Gym Logo" desc="PNG / JPG / SVG" />
                    <UploadBox
                      title="Upload Login Background"
                      desc="PNG / JPG / WEBP"
                    />
                  </div>
                </Section>
              </>
            )}

            {activeTab === 'Mobile App' && (
              <Section title="Mobile App Settings" icon={Smartphone}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select
                    label="Allow New User Registration"
                    value={booleanToYesNo(settings.mobile_app.allow_registration)}
                    onChange={(value) =>
                      updateSetting('mobile_app', 'allow_registration', yesNoToBoolean(value))
                    }
                    options={yesNoOptions}
                  />
                  <Select
                    label="Require Membership Before App Access"
                    value={booleanToYesNo(settings.mobile_app.require_membership)}
                    onChange={(value) =>
                      updateSetting('mobile_app', 'require_membership', yesNoToBoolean(value))
                    }
                    options={yesNoOptions}
                  />
                  <Select
                    label="Show Diet Plans"
                    value={booleanToYesNo(settings.mobile_app.show_diet_plans)}
                    onChange={(value) =>
                      updateSetting('mobile_app', 'show_diet_plans', yesNoToBoolean(value))
                    }
                    options={yesNoOptions}
                  />
                  <Select
                    label="Show Workout Levels"
                    value={booleanToYesNo(settings.mobile_app.show_workout_levels)}
                    onChange={(value) =>
                      updateSetting('mobile_app', 'show_workout_levels', yesNoToBoolean(value))
                    }
                    options={yesNoOptions}
                  />
                  <Select
                    label="Enable Class Booking"
                    value={booleanToYesNo(settings.mobile_app.enable_class_booking)}
                    onChange={(value) =>
                      updateSetting('mobile_app', 'enable_class_booking', yesNoToBoolean(value))
                    }
                    options={yesNoOptions}
                  />
                  <Select
                    label="Enable Progress Tracking"
                    value={booleanToYesNo(settings.mobile_app.enable_progress_tracking)}
                    onChange={(value) =>
                      updateSetting('mobile_app', 'enable_progress_tracking', yesNoToBoolean(value))
                    }
                    options={yesNoOptions}
                  />
                </div>
              </Section>
            )}

            {activeTab === 'Membership' && (
              <Section title="Membership Settings" icon={Users}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Grace Period"
                    value={settings.membership.grace_period}
                    onChange={(value) =>
                      updateSetting('membership', 'grace_period', value)
                    }
                  />
                  <Select
                    label="Auto Expire Membership"
                    value={booleanToYesNo(settings.membership.auto_expire)}
                    onChange={(value) =>
                      updateSetting('membership', 'auto_expire', yesNoToBoolean(value))
                    }
                    options={yesNoOptions}
                  />
                  <Select
                    label="Allow Walk-In Clients"
                    value={booleanToYesNo(settings.membership.allow_walkins)}
                    onChange={(value) =>
                      updateSetting('membership', 'allow_walkins', yesNoToBoolean(value))
                    }
                    options={yesNoOptions}
                  />
                  <Select
                    label="Send Expiry Reminder"
                    value={booleanToYesNo(settings.membership.expiry_reminder)}
                    onChange={(value) =>
                      updateSetting('membership', 'expiry_reminder', yesNoToBoolean(value))
                    }
                    options={yesNoOptions}
                  />
                </div>
              </Section>
            )}

            {activeTab === 'Payments' && (
              <Section title="Payment Settings" icon={CreditCard}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select
                    label="Default Currency"
                    value={settings.payments.default_currency}
                    onChange={(value) =>
                      updateSetting('payments', 'default_currency', value)
                    }
                    options={['TZS', 'USD', 'KES']}
                  />
                  <Select
                    label="Payment Methods"
                    value={settings.payments.payment_methods}
                    onChange={(value) =>
                      updateSetting('payments', 'payment_methods', value)
                    }
                    options={[
                      'Cash, M-Pesa, Card',
                      'Cash Only',
                      'Online Only',
                    ]}
                  />
                  <Input
                    label="Receipt Prefix"
                    value={settings.payments.receipt_prefix}
                    onChange={(value) =>
                      updateSetting('payments', 'receipt_prefix', value)
                    }
                  />
                  <Select
                    label="Allow Partial Payment"
                    value={booleanToYesNo(settings.payments.allow_partial_payment)}
                    onChange={(value) =>
                      updateSetting('payments', 'allow_partial_payment', yesNoToBoolean(value))
                    }
                    options={yesNoOptions}
                  />
                </div>
              </Section>
            )}

            {activeTab === 'Notifications' && (
              <Section title="Notification Settings" icon={Bell}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Toggle
                    label="Membership Expiry Alerts"
                    checked={settings.notifications.membership_expiry_alerts}
                    onChange={(value) =>
                      updateSetting('notifications', 'membership_expiry_alerts', value)
                    }
                  />
                  <Toggle
                    label="Payment Confirmation SMS"
                    checked={settings.notifications.payment_confirmation_sms}
                    onChange={(value) =>
                      updateSetting('notifications', 'payment_confirmation_sms', value)
                    }
                  />
                  <Toggle
                    label="Class Booking Notifications"
                    checked={settings.notifications.class_booking_notifications}
                    onChange={(value) =>
                      updateSetting('notifications', 'class_booking_notifications', value)
                    }
                  />
                  <Toggle
                    label="Workout Reminders"
                    checked={settings.notifications.workout_reminders}
                    onChange={(value) =>
                      updateSetting('notifications', 'workout_reminders', value)
                    }
                  />
                </div>
              </Section>
            )}

            {activeTab === 'Users & Roles' && (
              <Section title="Users & Roles" icon={UserCog}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Select
                    label="Default Staff Role"
                    value={settings.users_roles.default_staff_role}
                    onChange={(value) =>
                      updateSetting('users_roles', 'default_staff_role', value)
                    }
                    options={['Admin', 'Manager', 'Trainer', 'Receptionist']}
                  />
                  <Select
                    label="Allow Staff Account Creation"
                    value={booleanToYesNo(settings.users_roles.allow_staff_account_creation)}
                    onChange={(value) =>
                      updateSetting('users_roles', 'allow_staff_account_creation', yesNoToBoolean(value))
                    }
                    options={yesNoOptions}
                  />
                  <Select
                    label="Trainer Content Access"
                    value={settings.users_roles.trainer_content_access}
                    onChange={(value) =>
                      updateSetting('users_roles', 'trainer_content_access', value)
                    }
                    options={['Read Only', 'Create & Edit', 'Full Access']}
                  />
                  <Select
                    label="Payment Permission"
                    value={settings.users_roles.payment_permission}
                    onChange={(value) =>
                      updateSetting('users_roles', 'payment_permission', value)
                    }
                    options={['Admin Only', 'Admin & Manager', 'All Staff']}
                  />
                </div>
              </Section>
            )}

            {activeTab === 'Security' && (
              <>
                <Section title="Change Password" icon={KeyRound}>
                  <form onSubmit={handleChangePassword}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <PasswordInput
                        icon={Lock}
                        label="Current Password"
                        value={passwordData.current_password}
                        onChange={(value) =>
                          updatePasswordField('current_password', value)
                        }
                        placeholder="Enter current password"
                      />
                      <PasswordInput
                        icon={KeyRound}
                        label="New Password"
                        value={passwordData.password}
                        onChange={(value) => updatePasswordField('password', value)}
                        placeholder="Enter new password"
                      />
                      <PasswordInput
                        icon={KeyRound}
                        label="Confirm New Password"
                        value={passwordData.password_confirmation}
                        onChange={(value) =>
                          updatePasswordField('password_confirmation', value)
                        }
                        placeholder="Repeat new password"
                      />
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <p className="text-gray-500 text-sm">
                        Password must be at least 8 characters and include uppercase,
                        lowercase and a number.
                      </p>
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="bg-[#C8A13A] disabled:opacity-60 text-black font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2"
                      >
                        <Save size={18} />
                        {isChangingPassword ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </form>
                </Section>

                <Section title="Security Settings" icon={Shield}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Select
                      label="Two Factor Authentication"
                      value={settings.security.two_factor_authentication}
                      onChange={(value) =>
                        updateSetting('security', 'two_factor_authentication', value)
                      }
                      options={['Enabled', 'Disabled']}
                    />
                    <Select
                      label="Session Timeout"
                      value={settings.security.session_timeout}
                      onChange={(value) =>
                        updateSetting('security', 'session_timeout', value)
                      }
                      options={['15 Minutes', '30 Minutes', '1 Hour']}
                    />
                    <Select
                      label="Password Policy"
                      value={settings.security.password_policy}
                      onChange={(value) =>
                        updateSetting('security', 'password_policy', value)
                      }
                      options={['Strong', 'Medium', 'Basic']}
                    />
                    <Select
                      label="Login Access"
                      value={settings.security.login_access}
                      onChange={(value) =>
                        updateSetting('security', 'login_access', value)
                      }
                      options={['Admin Only', 'Admin & Staff']}
                    />
                  </div>
                </Section>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <Icon size={22} className="text-[#C8A13A] shrink-0" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Input({
  label,
  placeholder,
  icon: Icon,
  type = 'text',
  value,
  onChange,
}) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="flex items-center bg-[#050505] border border-white/10 rounded-2xl px-4">
        {Icon && <Icon size={18} className="text-[#C8A13A] mr-3 shrink-0" />}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600"
        />
      </div>
    </div>
  )
}

function PasswordInput({ label, placeholder, icon: Icon, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="flex items-center bg-[#050505] border border-white/10 rounded-2xl px-4">
        {Icon && <Icon size={18} className="text-[#C8A13A] mr-3 shrink-0" />}
        <input
          type="password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600"
        />
      </div>
    </div>
  )
}

function Select({ label, options, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none [color-scheme:dark]"
      >
        {options.map((item) => (
          <option key={item} className="bg-[#050505] text-white">
            {item}
          </option>
        ))}
      </select>
    </div>
  )
}

function TextArea({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <textarea
        rows="5"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none placeholder:text-gray-600 resize-none"
      />
    </div>
  )
}

function UploadBox({ title, desc }) {
  return (
    <div className="h-44 rounded-3xl bg-[#050505] border border-dashed border-[#C8A13A]/40 flex flex-col items-center justify-center text-center">
      <Upload size={34} className="text-[#C8A13A]" />
      <h4 className="font-bold mt-3">{title}</h4>
      <p className="text-gray-500 text-sm mt-1">{desc}</p>
    </div>
  )
}

function booleanToYesNo(value) {
  return value ? 'Yes' : 'No'
}

function yesNoToBoolean(value) {
  return value === 'Yes'
}

function mergeSettings(defaults, incoming) {
  return Object.fromEntries(
    Object.entries(defaults).map(([section, values]) => [
      section,
      {
        ...values,
        ...(incoming[section] || {}),
      },
    ]),
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 flex items-center justify-between gap-4">
      <span className="text-gray-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full relative shrink-0 transition ${
          checked ? 'bg-[#C8A13A]' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full transition ${
            checked ? 'right-1 bg-black' : 'left-1 bg-gray-400'
          }`}
        />
      </button>
    </div>
  )
}
