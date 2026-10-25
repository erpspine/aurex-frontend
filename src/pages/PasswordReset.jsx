import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

import { KeyRound, Lock, Mail } from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

const alertTheme = {
  background: '#101010',
  color: '#ffffff',
  confirmButtonColor: '#C8A13A',
}

async function post(path, body) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = payload.errors
      ? Object.values(payload.errors).flat().join(' ')
      : payload.message
    throw new Error(message || 'Unable to reach the AUREX server.')
  }

  return payload
}

/**
 * Three-step reset: request a code (sent by email and, when a phone number is
 * on file, WhatsApp), verify it, then choose a new password.
 */
export default function PasswordReset({ initialEmail, onDone }) {
  const [step, setStep] = useState('request')
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [resendAfter, setResendAfter] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (resendAfter <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendAfter((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendAfter])

  const run = async (action, failureTitle) => {
    setIsSubmitting(true)
    try {
      await action()
    } catch (caughtError) {
      await Swal.fire({
        title: failureTitle,
        text: caughtError.message,
        icon: 'error',
        ...alertTheme,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestCode = () =>
    run(async () => {
      const payload = await post('/password/forgot', { email: email.trim() })
      setMessage(payload.message)
      setResendAfter(Number(payload.retry_after || 60))
      setCode('')
      setStep('code')
    }, 'Could not send code')

  const verifyCode = () =>
    run(async () => {
      const payload = await post('/password/verify', { email: email.trim(), code })
      setResetToken(payload.reset_token)
      setStep('password')
    }, 'Invalid code')

  const resetPassword = () =>
    run(async () => {
      if (password !== confirmation) {
        throw new Error('The passwords do not match.')
      }
      const payload = await post('/password/reset', {
        email: email.trim(),
        reset_token: resetToken,
        password,
        password_confirmation: confirmation,
      })
      await Swal.fire({
        title: 'Password changed',
        text: payload.message,
        icon: 'success',
        ...alertTheme,
      })
      onDone(email.trim())
    }, 'Could not change password')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (step === 'request') requestCode()
    if (step === 'code') verifyCode()
    if (step === 'password') resetPassword()
  }

  const headings = {
    request: ['Reset Password', 'Enter your account email and we will send you a 6-digit reset code.'],
    code: ['Enter Reset Code', message || 'Check your email and WhatsApp for the 6-digit code.'],
    password: ['Choose New Password', 'Your code is verified. Use at least 8 characters.'],
  }
  const buttonLabels = {
    request: ['Send Reset Code', 'Sending...'],
    code: ['Verify Code', 'Verifying...'],
    password: ['Change Password', 'Saving...'],
  }

  return (
    <>
      <h2 className="text-4xl font-bold mb-2">{headings[step][0]}</h2>
      <p className="text-gray-400 mb-10">{headings[step][1]}</p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {step === 'request' && (
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Email Address</label>
            <div className="flex items-center bg-[#121212] border border-white/10 rounded-2xl px-4">
              <Mail className="text-[#C8A13A]" size={20} />
              <input
                type="email"
                required
                autoFocus
                placeholder="admin@aurex.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent outline-none px-4 py-4 text-white placeholder-gray-600"
              />
            </div>
          </div>
        )}

        {step === 'code' && (
          <div>
            <div className="mb-4 rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-gray-400">
              Account: <span className="text-white">{email}</span>
            </div>
            <label className="text-sm text-gray-300 mb-2 block">Reset Code</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              pattern="[0-9]{6}"
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-4 text-white tracking-[0.5em] text-center text-2xl outline-none"
              placeholder="000000"
            />
          </div>
        )}

        {step === 'password' &&
          [
            ['New Password', password, setPassword, Lock],
            ['Confirm New Password', confirmation, setConfirmation, KeyRound],
          ].map(([label, value, setValue, Icon]) => (
            <div key={label}>
              <label className="text-sm text-gray-300 mb-2 block">{label}</label>
              <div className="flex items-center bg-[#121212] border border-white/10 rounded-2xl px-4">
                <Icon className="text-[#C8A13A]" size={20} />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className="w-full bg-transparent outline-none px-4 py-4 text-white placeholder-gray-600"
                />
              </div>
            </div>
          ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#C8A13A] text-black font-bold py-4 rounded-2xl hover:bg-[#d8b44a] transition disabled:opacity-60"
        >
          {buttonLabels[step][isSubmitting ? 1 : 0]}
        </button>
      </form>

      <div className="mt-5 flex justify-between text-sm">
        <button type="button" onClick={() => onDone(email.trim())} className="text-gray-400 hover:text-white">
          Back to login
        </button>
        {step === 'code' && (
          <button
            type="button"
            onClick={requestCode}
            disabled={resendAfter > 0 || isSubmitting}
            className="text-[#C8A13A] disabled:text-gray-600"
          >
            {resendAfter > 0 ? `Resend in ${resendAfter}s` : 'Resend code'}
          </button>
        )}
      </div>
    </>
  )
}
