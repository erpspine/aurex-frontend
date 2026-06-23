import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  CreditCard,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react'

const defaultBenefits = [
  'Gym Access',
  'Trainer Support',
  'Diet Plan',
  'Mobile App Access',
]

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const emptyPlan = {
  name: '',
  price_amount: '',
  currency: 'TZS',
  duration_days: '',
  billing_cycle: 'Monthly',
  member_limit: '',
  status: 'Active',
  benefits: defaultBenefits,
  access_type: 'Members Only',
  show_in_mobile_app: true,
  trial_days: '0',
  grace_period_days: '3',
  renewal_reminder_days: '5',
  cancellation_policy:
    'Members can cancel or upgrade this plan from the admin desk before renewal.',
  publish_status: 'Published',
  featured: false,
}

export default function AddPlan({ onBack, planId = null }) {
  const [formData, setFormData] = useState({
    ...emptyPlan,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(planId))

  useEffect(() => {
    if (!planId) {
      return
    }

    let shouldUpdate = true

    const loadPlan = async () => {
      setIsLoading(true)

      try {
        const response = await fetch(`${apiBaseUrl}/membership-plans/${planId}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          },
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load plan.')
        }

        if (!shouldUpdate) {
          return
        }

        const plan = payload.plan

        setFormData({
          name: plan.name || '',
          price_amount: String(plan.price_amount ?? ''),
          currency: plan.currency || 'TZS',
          duration_days: String(plan.duration_days ?? ''),
          billing_cycle: plan.billing_cycle || 'Monthly',
          member_limit: plan.member_limit ? String(plan.member_limit) : '',
          status: plan.status || 'Active',
          benefits: plan.benefits?.length ? plan.benefits : defaultBenefits,
          access_type: plan.access_type || 'Members Only',
          show_in_mobile_app: Boolean(plan.show_in_mobile_app),
          trial_days: String(plan.trial_days ?? 0),
          grace_period_days: String(plan.grace_period_days ?? 0),
          renewal_reminder_days: String(plan.renewal_reminder_days ?? 0),
          cancellation_policy: plan.cancellation_policy || '',
          publish_status: plan.publish_status || 'Published',
          featured: Boolean(plan.featured),
        })
      } catch (caughtError) {
        await Swal.fire({
          title: 'Load failed',
          text: caughtError.message || 'Unable to load plan.',
          icon: 'error',
          background: '#101010',
          color: '#ffffff',
          confirmButtonColor: '#C8A13A',
        })
        onBack()
      } finally {
        if (shouldUpdate) {
          setIsLoading(false)
        }
      }
    }

    loadPlan()

    return () => {
      shouldUpdate = false
    }
  }, [onBack, planId])

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const removeBenefit = (benefit) => {
    setFormData((current) => ({
      ...current,
      benefits: current.benefits.filter((item) => item !== benefit),
    }))
  }

  const addBenefit = async () => {
    const result = await Swal.fire({
      title: 'Add benefit',
      input: 'text',
      inputPlaceholder: 'Example: Locker Access',
      showCancelButton: true,
      confirmButtonText: 'Add',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      cancelButtonColor: '#2a2a2a',
      inputValidator: (value) => {
        if (!value.trim()) {
          return 'Enter a benefit name.'
        }

        return undefined
      },
    })

    if (!result.isConfirmed) {
      return
    }

    setFormData((current) => ({
      ...current,
      benefits: [...current.benefits, result.value.trim()],
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const confirmation = await Swal.fire({
      title: planId ? 'Update membership plan?' : 'Save membership plan?',
      text: 'This plan will be available in the admin dashboard.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: planId ? 'Yes, update plan' : 'Yes, save plan',
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
      title: 'Saving plan...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      background: '#101010',
      color: '#ffffff',
      didOpen: () => Swal.showLoading(),
    })

    try {
      const response = await fetch(
        `${apiBaseUrl}/membership-plans${planId ? `/${planId}` : ''}`,
        {
          method: planId ? 'PUT' : 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            price_amount: Number(formData.price_amount),
            duration_days: Number(formData.duration_days),
            member_limit: formData.member_limit
              ? Number(formData.member_limit)
              : null,
            trial_days: Number(formData.trial_days || 0),
            grace_period_days: Number(formData.grace_period_days || 0),
            renewal_reminder_days: Number(formData.renewal_reminder_days || 0),
          }),
        },
      )

      const payload = await response.json()

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message

        throw new Error(validationMessage || 'Unable to save plan.')
      }

      await Swal.fire({
        title: 'Plan saved',
        text:
          payload.message ||
          `Membership plan ${planId ? 'updated' : 'created'} successfully.`,
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await Swal.fire({
        title: 'Save failed',
        text: caughtError.message || 'Unable to save plan.',
        icon: 'error',
        background: '#101010',
        color: '#ffffff',
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
            Back to Membership Plans
          </button>

          <h1 className="text-4xl font-black">
            {planId ? 'Edit Plan' : 'Add Plan'}
          </h1>
          <p className="text-gray-400 mt-1">
            Create a membership package with pricing, benefits and access rules.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#C8A13A] text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : planId ? 'Update Plan' : 'Save Plan'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 text-center text-gray-400">
          Loading plan...
        </div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Section title="Plan Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                icon={CreditCard}
                label="Plan Name"
                placeholder="Gold Monthly"
                value={formData.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
              <Input
                icon={Wallet}
                label="Price"
                placeholder="150000"
                type="number"
                value={formData.price_amount}
                onChange={(event) =>
                  updateField('price_amount', event.target.value)
                }
              />
              <Input
                icon={CalendarDays}
                label="Duration"
                placeholder="30"
                type="number"
                value={formData.duration_days}
                onChange={(event) =>
                  updateField('duration_days', event.target.value)
                }
              />
              <Select
                label="Billing Cycle"
                value={formData.billing_cycle}
                onChange={(event) =>
                  updateField('billing_cycle', event.target.value)
                }
                options={['Monthly', 'Weekly', 'Daily', 'Yearly', 'One Time']}
              />
              <Input
                icon={Users}
                label="Member Limit"
                placeholder="Leave empty for unlimited"
                type="number"
                value={formData.member_limit}
                onChange={(event) =>
                  updateField('member_limit', event.target.value)
                }
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(event) => updateField('status', event.target.value)}
                options={['Active', 'Draft', 'Hidden']}
              />
            </div>
          </Section>

          <Section title="Benefits & Access">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.benefits.map((item) => (
                <BenefitRow
                  key={item}
                  label={item}
                  onRemove={() => removeBenefit(item)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addBenefit}
              className="mt-5 border border-[#C8A13A]/40 text-[#C8A13A] px-4 py-3 rounded-2xl flex items-center gap-2 hover:bg-[#C8A13A]/10"
            >
              <Plus size={18} />
              Add Benefit
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 pt-6 border-t border-white/10">
              <Select
                label="Access Type"
                value={formData.access_type}
                onChange={(event) =>
                  updateField('access_type', event.target.value)
                }
                options={['Members Only', 'Premium', 'Public']}
              />
              <Select
                label="Show In Mobile App"
                value={formData.show_in_mobile_app ? 'Yes' : 'No'}
                onChange={(event) =>
                  updateField(
                    'show_in_mobile_app',
                    event.target.value === 'Yes',
                  )
                }
                options={['Yes', 'No']}
              />
            </div>
          </Section>

          <Section title="Plan Rules">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input
                icon={CalendarDays}
                label="Trial Days"
                placeholder="0"
                type="number"
                value={formData.trial_days}
                onChange={(event) =>
                  updateField('trial_days', event.target.value)
                }
              />
              <Input
                icon={CalendarDays}
                label="Grace Period"
                placeholder="3"
                type="number"
                value={formData.grace_period_days}
                onChange={(event) =>
                  updateField('grace_period_days', event.target.value)
                }
              />
              <Input
                icon={CalendarDays}
                label="Renewal Reminder"
                placeholder="5"
                type="number"
                value={formData.renewal_reminder_days}
                onChange={(event) =>
                  updateField('renewal_reminder_days', event.target.value)
                }
              />
            </div>
            <div className="mt-5">
              <TextArea
                label="Cancellation Policy"
                placeholder="Members can cancel or upgrade this plan from the admin desk before renewal."
                value={formData.cancellation_policy}
                onChange={(event) =>
                  updateField('cancellation_policy', event.target.value)
                }
              />
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Plan Preview">
            <div className="bg-[#050505] border border-[#C8A13A]/50 rounded-3xl p-6">
              <div className="inline-flex bg-[#C8A13A] text-black text-xs font-black px-3 py-1 rounded-full">
                POPULAR
              </div>
              <h3 className="text-2xl font-black mt-5">
                {formData.name || 'Gold Monthly'}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {formData.duration_days || '30'} Days
              </p>
              <h2 className="text-3xl font-black text-[#C8A13A] mt-5">
                TZS {Number(formData.price_amount || 0).toLocaleString()}
              </h2>

              <div className="space-y-3 mt-6">
                {formData.benefits.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle
                      size={17}
                      className="text-[#C8A13A] shrink-0"
                    />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Revenue Summary">
            <SummaryItem icon={Wallet} label="Monthly Estimate" value="TZS 4.5M" />
            <SummaryItem
              icon={Users}
              label="Member Limit"
              value={formData.member_limit || 'Unlimited'}
            />
            <SummaryItem
              icon={CalendarDays}
              label="Duration"
              value={`${formData.duration_days || 0} Days`}
            />
          </Section>

          <Section title="Mobile App Settings">
            <Select
              label="Publish Status"
              value={formData.publish_status}
              onChange={(event) =>
                updateField('publish_status', event.target.value)
              }
              options={['Published', 'Draft', 'Hidden']}
            />
            <div className="mt-5">
              <Select
                label="Featured Plan"
                value={formData.featured ? 'Yes' : 'No'}
                onChange={(event) =>
                  updateField('featured', event.target.value === 'Yes')
                }
                options={['Yes', 'No']}
              />
            </div>
          </Section>

          <div className="bg-[#C8A13A]/10 border border-[#C8A13A]/30 rounded-3xl p-5">
            <div className="flex gap-3">
              <ShieldCheck className="text-[#C8A13A] shrink-0" />
              <div>
                <h4 className="font-bold text-[#C8A13A]">Plan Access</h4>
                <p className="text-gray-400 text-sm mt-1">
                  This package will control member subscription access in the
                  admin dashboard and mobile app.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
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

function TextArea({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <textarea
        rows="5"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none placeholder:text-gray-600 resize-none"
      />
    </div>
  )
}

function BenefitRow({ label, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#050505] border border-white/10 rounded-2xl px-4 py-4">
      <div className="flex items-center gap-3 min-w-0">
        <CheckCircle size={18} className="text-[#C8A13A] shrink-0" />
        <span className="font-medium truncate">{label}</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500/10 shrink-0"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="flex justify-between items-center gap-4 py-4 border-b border-white/10 last:border-b-0">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-[#C8A13A]" />
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <span className="font-bold text-right">{value}</span>
    </div>
  )
}
