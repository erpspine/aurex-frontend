import { useState } from 'react'
import Swal from 'sweetalert2'

import {
  ArrowLeft,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  User,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export default function AddUser({ onBack, onPermissions }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    user_type: 'Admin Staff',
    role: 'Receptionist',
    status: 'Active',
    password: '',
    password_confirmation: '',
    two_factor_enabled: true,
    force_password_change: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const confirmation = await Swal.fire({
      title: 'Create this user?',
      text: 'The user will be saved and their login credentials will be emailed.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, save user',
      cancelButtonText: 'Cancel',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      cancelButtonColor: '#2a2a2a',
    })

    if (!confirmation.isConfirmed) {
      return
    }

    setIsSubmitting(true)

    Swal.fire({
      title: 'Saving user...',
      text: 'Please wait while we create the account and send credentials.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      background: '#101010',
      color: '#ffffff',
      didOpen: () => {
        Swal.showLoading()
      },
    })

    try {
      const response = await fetch(`${apiBaseUrl}/users`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const payload = await response.json()

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message

        throw new Error(validationMessage || 'Unable to create user.')
      }

      setFormData((current) => ({
        ...current,
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
      }))

      await Swal.fire({
        title: 'User saved',
        text:
          payload.message ||
          'User created successfully and credentials email sent.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonText: 'Done',
        confirmButtonColor: '#C8A13A',
      })
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to create user.',
        icon: 'error',
        background: '#101010',
        color: '#ffffff',
        confirmButtonText: 'Try again',
        confirmButtonColor: '#C8A13A',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="min-h-screen bg-[#050505] text-white p-5 sm:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-[#C8A13A] mb-4"
          >
            <ArrowLeft size={18} />
            Back to Users
          </button>

          <h1 className="text-4xl font-black">Add User</h1>
          <p className="text-gray-400 mt-1">
            Create staff/admin login and assign permissions.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#C8A13A] text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : 'Save User'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Section title="User Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                icon={User}
                label="Full Name"
                placeholder="Reception Staff"
                value={formData.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
              <Input
                icon={Mail}
                label="Email Address"
                placeholder="user@aurex.com"
                type="email"
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
              <Input
                icon={Phone}
                label="Phone Number"
                placeholder="+255 712 345 678"
                value={formData.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />

              <Select
                label="User Type"
                value={formData.user_type}
                onChange={(event) =>
                  updateField('user_type', event.target.value)
                }
                options={[
                  'Admin Staff',
                  'Trainer',
                  'Receptionist',
                  'Accountant',
                  'Manager',
                ]}
              />

              <Select
                label="Role"
                value={formData.role}
                onChange={(event) => updateField('role', event.target.value)}
                options={[
                  'Super Admin',
                  'Manager',
                  'Receptionist',
                  'Trainer',
                  'Accountant',
                ]}
              />

              <Select
                label="Status"
                value={formData.status}
                onChange={(event) => updateField('status', event.target.value)}
                options={['Active', 'Inactive', 'Suspended']}
              />
            </div>
          </Section>

          <Section title="Login Security">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                icon={Lock}
                label="Password"
                placeholder="Enter password"
                type="password"
                value={formData.password}
                onChange={(event) =>
                  updateField('password', event.target.value)
                }
              />
              <Input
                icon={Lock}
                label="Confirm Password"
                placeholder="Confirm password"
                type="password"
                value={formData.password_confirmation}
                onChange={(event) =>
                  updateField('password_confirmation', event.target.value)
                }
              />

              <Select
                label="Two Factor Authentication"
                value={formData.two_factor_enabled ? 'Enabled' : 'Disabled'}
                onChange={(event) =>
                  updateField(
                    'two_factor_enabled',
                    event.target.value === 'Enabled',
                  )
                }
                options={['Enabled', 'Disabled']}
              />
              <Select
                label="Force Password Change"
                value={formData.force_password_change ? 'Yes' : 'No'}
                onChange={(event) =>
                  updateField(
                    'force_password_change',
                    event.target.value === 'Yes',
                  )
                }
                options={['Yes', 'No']}
              />
            </div>
          </Section>

          <Section title="Role Permissions">
            <div className="bg-[#050505] border border-white/10 rounded-3xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold">Manage permissions by role</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Select this user's role here, then configure module access on
                  the dedicated permissions page.
                </p>
              </div>

              <button
                type="button"
                onClick={onPermissions}
                className="bg-[#C8A13A] text-black font-bold px-5 py-3 rounded-2xl whitespace-nowrap"
              >
                Open Permissions
              </button>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Profile Photo">
            <div className="h-56 rounded-3xl bg-[#050505] border border-dashed border-[#C8A13A]/40 flex flex-col items-center justify-center text-center">
              <Upload size={34} className="text-[#C8A13A]" />
              <h4 className="font-bold mt-3">Upload User Photo</h4>
              <p className="text-gray-500 text-sm mt-1">PNG / JPG / WEBP</p>
            </div>
          </Section>

          <Section title="Access Summary">
            <SummaryItem label="Role" value={formData.role} />
            <SummaryItem label="Status" value={formData.status} />
            <SummaryItem
              label="2FA"
              value={formData.two_factor_enabled ? 'Enabled' : 'Disabled'}
            />
            <SummaryItem label="Login Access" value="Allowed" />
          </Section>

          <div className="bg-[#C8A13A]/10 border border-[#C8A13A]/30 rounded-3xl p-5">
            <div className="flex gap-3">
              <ShieldCheck className="text-[#C8A13A] shrink-0" />
              <div>
                <h4 className="font-bold text-[#C8A13A]">Security Note</h4>
                <p className="text-gray-400 text-sm mt-1">
                  Give each user only the permissions they need for their daily
                  work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
      <h2 className="text-xl font-bold mb-5">{title}</h2>
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
          placeholder={placeholder}
          value={value}
          onChange={onChange}
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
        onChange={onChange}
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

function SummaryItem({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-4 border-b border-white/10 last:border-b-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-bold text-right">{value}</span>
    </div>
  )
}
