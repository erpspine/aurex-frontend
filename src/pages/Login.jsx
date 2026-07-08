import { useState } from 'react'
import Swal from 'sweetalert2'

import { Dumbbell, Eye, Lock, Mail } from 'lucide-react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState(
    import.meta.env.DEV ? 'admin@aurex.local' : '',
  )
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const responseText = await response.text()
      let payload = {}

      if (responseText.trim()) {
        try {
          payload = JSON.parse(responseText)
        } catch {
          throw new Error(
            'The local API returned an invalid response. Confirm Laravel is running on port 8000.',
          )
        }
      }

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(' ')
          : payload.message

        throw new Error(
          validationMessage ||
            'Unable to reach the local API. Start Aurex using run-local.bat.',
        )
      }

      if (!payload.token) {
        throw new Error('The local API returned an incomplete login response.')
      }

      onLogin(payload)
    } catch (caughtError) {
      await Swal.fire({
        title: 'Login failed',
        text: caughtError.message || 'Unable to login.',
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
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl">
        <div className="hidden lg:flex relative bg-gradient-to-br from-black via-[#111] to-black p-12 flex-col justify-between">
          <div>
            <div className="text-4xl font-black tracking-wide">
              <span className="text-white">AUR</span>
              <span className="text-[#C8A13A]">EX</span>
            </div>
            <p className="text-[#C8A13A] text-sm tracking-widest mt-1">
              PERFORMANCE ARENA
            </p>
          </div>

          <div>
            <div className="w-20 h-20 rounded-2xl bg-[#C8A13A]/15 flex items-center justify-center mb-6">
              <Dumbbell size={42} className="text-[#C8A13A]" />
            </div>

            <h1 className="text-5xl font-black leading-tight">
              Manage Your <br />
              Gym Smarter
            </h1>

            <p className="text-gray-400 mt-5 text-lg max-w-md">
              Control members, workouts, diet plans, trainers, payments and app
              content from one powerful dashboard.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            © 2026 AUREX Performance Arena
          </div>
        </div>

        <div className="p-8 md:p-14 bg-[#080808]">
          <div className="mb-10 lg:hidden">
            <h1 className="text-3xl font-black">
              AUR<span className="text-[#C8A13A]">EX</span>
            </h1>
            <p className="text-[#C8A13A] text-xs tracking-widest">
              PERFORMANCE ARENA
            </p>
          </div>

          <h2 className="text-4xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-400 mb-10">
            Login to manage your gym and mobile app.
          </p>

          <form
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Email Address
              </label>
              <div className="flex items-center bg-[#121212] border border-white/10 rounded-2xl px-4">
                <Mail className="text-[#C8A13A]" size={20} />
                <input
                  type="email"
                  placeholder="admin@aurex.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent outline-none px-4 py-4 text-white placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Password
              </label>
              <div className="flex items-center bg-[#121212] border border-white/10 rounded-2xl px-4">
                <Lock className="text-[#C8A13A]" size={20} />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent outline-none px-4 py-4 text-white placeholder-gray-600"
                />
                <Eye className="text-gray-500" size={20} />
              </div>
            </div>

            <div className="flex justify-between items-center gap-4 text-sm">
              <label className="flex items-center gap-2 text-gray-400">
                <input type="checkbox" className="accent-[#C8A13A]" />
                Remember me
              </label>

              <button type="button" className="text-[#C8A13A] hover:underline">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#C8A13A] text-black font-bold py-4 rounded-2xl hover:bg-[#d8b44a] transition"
            >
              {isSubmitting ? 'Logging in...' : 'Login to Dashboard'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-10">
            Secure admin access only
          </p>
          {import.meta.env.DEV && (
            <div className="mt-5 rounded-2xl border border-[#C8A13A]/30 bg-[#C8A13A]/10 p-4 text-sm text-gray-300">
              <div className="font-bold text-[#C8A13A]">Local development</div>
              <div className="mt-2">Email: admin@aurex.local</div>
              <div>Password: AurexLocal2026!</div>
              <div className="mt-2 text-xs text-gray-500">
                This account exists only in the local database.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
