import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Dumbbell,
  Save,
  ShieldCheck,
  UserCog,
  Users,
  Utensils,
} from 'lucide-react'

const roles = [
  {
    name: 'Super Admin',
    users: '2 users',
    desc: 'Full access to every dashboard module.',
  },
  {
    name: 'Receptionist',
    users: '5 users',
    desc: 'Front desk access for members, attendance and payments.',
  },
  {
    name: 'Trainer',
    users: '8 users',
    desc: 'Training access for classes, workouts and assigned members.',
  },
  {
    name: 'Accountant',
    users: '2 users',
    desc: 'Payment, invoice and revenue reporting access.',
  },
]

const modules = [
  { name: 'Dashboard', icon: ShieldCheck },
  { name: 'Members', icon: Users },
  { name: 'Trainers', icon: UserCog },
  { name: 'Exercises', icon: Dumbbell },
  { name: 'Workouts', icon: Dumbbell },
  { name: 'Equipment', icon: Dumbbell },
  { name: 'Membership Plans', icon: CreditCard },
  { name: 'Attendance', icon: CheckCircle },
  { name: 'Payments', icon: CreditCard },
  { name: 'Classes', icon: UserCog },
  { name: 'Diet & Nutrition', icon: Utensils },
  { name: 'Reports', icon: ShieldCheck },
  { name: 'Settings', icon: ShieldCheck },
  { name: 'Users & Roles', icon: ShieldCheck },
]

export default function Permissions({ onBack }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-5 sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-[#C8A13A] mb-4"
          >
            <ArrowLeft size={18} />
            Back to Users & Roles
          </button>

          <h1 className="text-4xl font-black">Role Permissions</h1>
          <p className="text-gray-400 mt-1">
            Manage module access and actions for each admin role.
          </p>
        </div>

        <button
          type="button"
          className="bg-[#C8A13A] text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={18} />
          Save Permissions
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="space-y-3">
          {roles.map((role, index) => (
            <button
              key={role.name}
              type="button"
              className={`w-full text-left rounded-3xl border p-5 transition ${
                index === 0
                  ? 'bg-[#C8A13A] text-black border-[#C8A13A]'
                  : 'bg-[#111] border-white/10 text-white hover:border-[#C8A13A]/60'
              }`}
            >
              <h3 className="font-black">{role.name}</h3>
              <p
                className={`text-sm mt-2 ${
                  index === 0 ? 'text-black/70' : 'text-gray-400'
                }`}
              >
                {role.desc}
              </p>
              <p
                className={`text-sm font-bold mt-4 ${
                  index === 0 ? 'text-black' : 'text-[#C8A13A]'
                }`}
              >
                {role.users}
              </p>
            </button>
          ))}
        </div>

        <div className="xl:col-span-3 bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h2 className="text-xl font-bold">Super Admin Permissions</h2>
            <p className="text-gray-500 text-sm mt-1">
              Select which module actions this role can perform.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-[#050505] text-gray-400 text-sm">
                <tr>
                  <th className="p-5">Module</th>
                  <th className="p-5 text-center">View</th>
                  <th className="p-5 text-center">Add</th>
                  <th className="p-5 text-center">Edit</th>
                  <th className="p-5 text-center">Delete</th>
                  <th className="p-5 text-center">Full Access</th>
                </tr>
              </thead>

              <tbody>
                {modules.map((module) => {
                  const Icon = module.icon

                  return (
                    <tr
                      key={module.name}
                      className="border-t border-white/10 hover:bg-white/[0.03]"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#C8A13A]/15 flex items-center justify-center">
                            <Icon size={18} className="text-[#C8A13A]" />
                          </div>
                          <span className="font-bold">{module.name}</span>
                        </div>
                      </td>
                      {['view', 'add', 'edit', 'delete', 'full'].map((action) => (
                        <td key={action} className="p-5 text-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="accent-[#C8A13A]"
                          />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
