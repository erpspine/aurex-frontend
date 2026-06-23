import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle,
  CreditCard,
  Receipt,
  Save,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const emptyPayment = {
  payer_type: 'Member',
  member_id: '',
  walk_in_name: '',
  walk_in_mobile: '',
  payment_for: 'Membership Renewal',
  membership_plan_id: '',
  class_name: '',
  other_service_name: '',
  amount: '',
  currency: 'TZS',
  payment_method: 'Cash',
  reference_number: '',
  payment_date: new Date().toISOString().slice(0, 10),
  payment_status: 'Paid',
  notes: '',
}

export default function AddPayment({ onBack }) {
  const [members, setMembers] = useState([])
  const [plans, setPlans] = useState([])
  const [classes, setClasses] = useState([])
  const [formData, setFormData] = useState({ ...emptyPayment })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const headers = {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
        }

        const [membersResponse, plansResponse, classesResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/members`, { headers }),
          fetch(`${apiBaseUrl}/membership-plans`, { headers }),
          fetch(`${apiBaseUrl}/classes`, { headers }),
        ])

        const membersPayload = await membersResponse.json()
        const plansPayload = await plansResponse.json()
        const classesPayload = await classesResponse.json()

        if (membersResponse.ok) setMembers(membersPayload.members || [])
        if (plansResponse.ok) setPlans(plansPayload.plans || [])
        if (classesResponse.ok) setClasses(classesPayload.classes || [])
      } catch {
        setMembers([])
        setPlans([])
      }
    }

    loadOptions()
  }, [])

  const selectedMember = useMemo(
    () => members.find((member) => member.id === formData.member_id),
    [formData.member_id, members],
  )

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === formData.membership_plan_id),
    [formData.membership_plan_id, plans],
  )

  const dailyPassPlan = useMemo(
    () =>
      plans.find(
        (plan) =>
          plan.name?.toLowerCase().includes('daily') ||
          plan.billing_cycle === 'Daily',
      ),
    [plans],
  )

  const selectedClass = useMemo(
    () => classes.find((item) => item.name === formData.class_name),
    [classes, formData.class_name],
  )

  const payerName =
    formData.payer_type === 'Member'
      ? selectedMember?.full_name || 'Select member'
      : formData.walk_in_name || 'Walk-in customer'

  const itemName = resolveItemName(formData, selectedPlan, dailyPassPlan)

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const setPaymentFor = (value) => {
    setFormData((current) => {
      const next = {
        ...current,
        payment_for: value,
        membership_plan_id: '',
        class_name: '',
        other_service_name: '',
        amount: '',
      }

      if (value === 'Daily Pass' && dailyPassPlan) {
        next.membership_plan_id = dailyPassPlan.id
        next.amount = String(dailyPassPlan.price_amount ?? 0)
      }

      return next
    })
  }

  const setPlan = (planId) => {
    const plan = plans.find((item) => item.id === planId)

    setFormData((current) => ({
      ...current,
      membership_plan_id: planId,
      amount: plan ? String(plan.price_amount ?? 0) : '',
    }))
  }

  const setClass = (className) => {
    const gymClass = classes.find((item) => item.name === className)

    setFormData((current) => ({
      ...current,
      class_name: className,
      amount: gymClass ? String(gymClass.price_amount ?? 0) : '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (formData.payer_type === 'Member' && !formData.member_id) {
      await showError('Select the member making this payment.')
      return
    }

    if (formData.payer_type === 'Walk-in' && (!formData.walk_in_name || !formData.walk_in_mobile)) {
      await showError('Enter the walk-in customer name and mobile number.')
      return
    }

    if (!itemName || !Number(formData.amount)) {
      await showError('Select the service and confirm the payment amount.')
      return
    }

    const confirmation = await Swal.fire({
      title: 'Save payment?',
      text: `${payerName} will be charged ${formatCurrency(formData.amount)} for ${itemName}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, save payment',
      cancelButtonText: 'Cancel',
      background: '#101010',
      color: '#ffffff',
      confirmButtonColor: '#C8A13A',
      cancelButtonColor: '#2a2a2a',
    })

    if (!confirmation.isConfirmed) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiBaseUrl}/payments`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('aurex_admin_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payer_type: formData.payer_type,
          member_id: formData.payer_type === 'Member' ? formData.member_id : null,
          walk_in_name:
            formData.payer_type === 'Walk-in' ? formData.walk_in_name : null,
          walk_in_mobile:
            formData.payer_type === 'Walk-in' ? formData.walk_in_mobile : null,
          payment_for: formData.payment_for,
          item_name: itemName,
          membership_plan_id:
            ['Membership Renewal', 'New Membership', 'Daily Pass'].includes(
              formData.payment_for,
            )
              ? formData.membership_plan_id || null
              : null,
          class_name: formData.payment_for === 'Class' ? formData.class_name : null,
          amount: Number(formData.amount || 0),
          currency: formData.currency,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || null,
          payment_date: formData.payment_date,
          payment_status: formData.payment_status,
          notes: formData.notes || null,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message

        throw new Error(validationMessage || 'Unable to save payment.')
      }

      await Swal.fire({
        title: 'Payment saved',
        text: payload.message || 'Payment recorded successfully.',
        icon: 'success',
        background: '#101010',
        color: '#ffffff',
        confirmButtonColor: '#C8A13A',
      })

      onBack()
    } catch (caughtError) {
      await showError(caughtError.message || 'Unable to save payment.')
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
            Back to Payments
          </button>

          <h1 className="text-4xl font-black">Add Payment</h1>
          <p className="text-gray-400 mt-1">
            Record member, walk-in, daily pass, class and other service payments.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#C8A13A] text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSubmitting ? 'Saving...' : 'Save Payment'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Section title="Payer">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select
                label="Payer Type"
                value={formData.payer_type}
                onChange={(event) => updateField('payer_type', event.target.value)}
                options={['Member', 'Walk-in']}
              />

              {formData.payer_type === 'Member' ? (
                <Select
                  label="Member"
                  value={formData.member_id}
                  onChange={(event) => updateField('member_id', event.target.value)}
                  options={[
                    { label: 'Select member', value: '' },
                    ...members.map((member) => ({
                      label: `${member.full_name} - ${member.phone}`,
                      value: member.id,
                    })),
                  ]}
                />
              ) : (
                <>
                  <Input
                    icon={User}
                    label="Walk-in Name"
                    value={formData.walk_in_name}
                    onChange={(event) =>
                      updateField('walk_in_name', event.target.value)
                    }
                    placeholder="Customer name"
                  />
                  <Input
                    icon={User}
                    label="Walk-in Mobile"
                    value={formData.walk_in_mobile}
                    onChange={(event) =>
                      updateField('walk_in_mobile', event.target.value)
                    }
                    placeholder="+255 700 000 000"
                  />
                </>
              )}
            </div>
          </Section>

          <Section title="Payment Item">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select
                label="Payment For"
                value={formData.payment_for}
                onChange={(event) => setPaymentFor(event.target.value)}
                options={[
                  'Membership Renewal',
                  'New Membership',
                  'Daily Pass',
                  'Class',
                  'Other Service',
                ]}
              />

              {['Membership Renewal', 'New Membership'].includes(
                formData.payment_for,
              ) && (
                <Select
                  label="Membership Plan"
                  value={formData.membership_plan_id}
                  onChange={(event) => setPlan(event.target.value)}
                  options={[
                    { label: 'Select plan', value: '' },
                    ...plans.map((plan) => ({
                      label: `${plan.name} - ${formatCurrency(plan.price_amount)}`,
                      value: plan.id,
                    })),
                  ]}
                />
              )}

              {formData.payment_for === 'Daily Pass' && (
                <Input
                  icon={CreditCard}
                  label="Daily Pass"
                  value={dailyPassPlan?.name || 'Daily Pass'}
                  readOnly
                />
              )}

              {formData.payment_for === 'Class' && (
                <Select
                  label="Class"
                  value={formData.class_name}
                  onChange={(event) => setClass(event.target.value)}
                  options={[
                    { label: 'Select class', value: '' },
                    ...classes.map((item) => ({
                      label: `${item.name} - ${formatCurrency(item.price_amount)}`,
                      value: item.name,
                    })),
                  ]}
                />
              )}

              {formData.payment_for === 'Other Service' && (
                <Input
                  icon={Receipt}
                  label="Service Name"
                  value={formData.other_service_name}
                  onChange={(event) =>
                    updateField('other_service_name', event.target.value)
                  }
                  placeholder="Example: Towel rental, locker, supplements"
                />
              )}

              <Input
                icon={Wallet}
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(event) => updateField('amount', event.target.value)}
                placeholder="0"
                readOnly={formData.payment_for !== 'Other Service'}
              />
            </div>
          </Section>

          <Section title="Payment Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select
                label="Payment Method"
                value={formData.payment_method}
                onChange={(event) =>
                  updateField('payment_method', event.target.value)
                }
                options={['Cash', 'M-Pesa', 'Airtel Money', 'Bank Transfer', 'Card']}
              />
              <Select
                label="Payment Status"
                value={formData.payment_status}
                onChange={(event) =>
                  updateField('payment_status', event.target.value)
                }
                options={['Paid', 'Pending', 'Failed', 'Refunded']}
              />
              <Input
                icon={Receipt}
                label="Reference Number"
                value={formData.reference_number}
                onChange={(event) =>
                  updateField('reference_number', event.target.value)
                }
                placeholder="Auto generated if blank"
              />
              <Input
                icon={CalendarDays}
                label="Payment Date"
                type="date"
                value={formData.payment_date}
                onChange={(event) => updateField('payment_date', event.target.value)}
              />
            </div>
          </Section>

          <Section title="Notes">
            <textarea
              rows="5"
              value={formData.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="Optional payment notes..."
              className="w-full bg-[#050505] border border-white/10 rounded-2xl px-4 py-4 text-white outline-none placeholder:text-gray-600 resize-none"
            />
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Receipt Preview">
            <div className="bg-[#050505] border border-[#C8A13A]/40 rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Receipt</p>
                  <h3 className="text-xl font-black">
                    {formData.reference_number || 'Auto generated'}
                  </h3>
                </div>
                <Receipt className="text-[#C8A13A]" size={30} />
              </div>

              <div className="space-y-4 mt-6">
                <SummaryItem icon={User} label="Payer" value={payerName} />
                <SummaryItem icon={CreditCard} label="Item" value={itemName || 'Select item'} />
                <SummaryItem icon={Wallet} label="Amount" value={formatCurrency(formData.amount)} />
                <SummaryItem icon={CheckCircle} label="Status" value={formData.payment_status} />
              </div>
            </div>
          </Section>

          <Section title="Payment Validation">
            <div className="flex gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
              <ShieldCheck className="text-green-400 shrink-0" />
              <div>
                <h4 className="font-bold text-green-400">Ready to Save</h4>
                <p className="text-gray-400 text-sm mt-1">
                  Prices are pulled from plans, daily pass or class selection.
                  Other services use the amount entered by staff.
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </form>
  )
}

function resolveItemName(formData, selectedPlan, dailyPassPlan) {
  if (['Membership Renewal', 'New Membership'].includes(formData.payment_for)) {
    return selectedPlan?.name || ''
  }

  if (formData.payment_for === 'Daily Pass') {
    return dailyPassPlan?.name || 'Daily Pass'
  }

  if (formData.payment_for === 'Class') {
    return formData.class_name
  }

  return formData.other_service_name
}

function formatCurrency(value) {
  return `TZS ${Number(value || 0).toLocaleString()}`
}

async function showError(message) {
  await Swal.fire({
    title: 'Payment failed',
    text: message,
    icon: 'error',
    background: '#101010',
    color: '#ffffff',
    confirmButtonColor: '#C8A13A',
  })
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
  readOnly = false,
}) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="flex items-center bg-[#050505] border border-white/10 rounded-2xl px-4">
        {Icon && <Icon size={18} className="text-[#C8A13A] mr-3 shrink-0" />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none py-4 text-white placeholder:text-gray-600 [color-scheme:dark] read-only:text-gray-300"
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
        {options.map((item) => {
          const option = typeof item === 'string' ? { label: item, value: item } : item

          return (
            <option key={option.value} value={option.value} className="bg-[#050505] text-white">
              {option.label}
            </option>
          )
        })}
      </select>
    </div>
  )
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="flex justify-between items-center gap-4 py-4 border-b border-white/10 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <Icon size={18} className="text-[#C8A13A] shrink-0" />
        <span className="text-gray-400 text-sm truncate">{label}</span>
      </div>
      <span className="font-bold text-right">{value}</span>
    </div>
  )
}
