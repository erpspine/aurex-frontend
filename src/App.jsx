import { useCallback, useEffect, useState } from 'react'

import AddBanner from './pages/AddBanner'
import AddBodyPart from './pages/AddBodyPart'
import AddExercise from './pages/AddExercise'
import AddEquipment from './pages/AddEquipment'
import AddMember from './pages/AddMember'
import AddPayment from './pages/AddPayment'
import AddPlan from './pages/AddPlan'
import AddTrainer from './pages/AddTrainer'
import AddUser from './pages/AddUser'
import EditUser from './pages/EditUser'
import AddWorkout from './pages/AddWorkout'
import AddWorkoutLevel from './pages/AddWorkoutLevel'
import Attendance from './pages/Attendance'
import BodyParts from './pages/BodyParts'
import Classes from './pages/Classes'
import AddClass from './pages/AddClass'
import AddDiet from './pages/AddDiet'
import Dashboard from './pages/Dashboard'
import Diet from './pages/Diet'
import Equipment from './pages/Equipment'
import Exercises from './pages/Exercises'
import Login from './pages/Login'
import ManualCheckIn from './pages/ManualCheckIn'
import MemberDashboard from './pages/MemberDashboard'
import Members from './pages/Members'
import MembershipPlans from './pages/MembershipPlans'
import MobileApp from './pages/MobileApp'
import Payments from './pages/Payments'
import Permissions from './pages/Permissions'
import Reports from './pages/Reports'
import ServiceUsageReport from './pages/ServiceUsageReport'
import Settings from './pages/Settings'
import Trainers from './pages/Trainers'
import UsersPage from './pages/Users'
import WorkoutLevels from './pages/WorkoutLevels'
import Workouts from './pages/Workouts'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
const authTokenKey = 'aurex_admin_token'
const authUserKey = 'aurex_admin_user'

const defaultPagePermissions = {
  dashboard: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'Full Access', Receptionist: 'Full Access' },
  members: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'Read Only', Receptionist: 'Full Access' },
  plans: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'No Access', Receptionist: 'No Access' },
  trainers: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'Full Access', Receptionist: 'No Access' },
  exercises: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'Read Only', Receptionist: 'No Access' },
  equipment: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'No Access', Receptionist: 'No Access' },
  workouts: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'Full Access', Receptionist: 'No Access' },
  levels: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'No Access', Receptionist: 'No Access' },
  diet: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'Read Only', Receptionist: 'No Access' },
  classes: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'Read Only', Receptionist: 'Full Access' },
  attendance: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'Read Only', Receptionist: 'Full Access' },
  payments: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'No Access', Receptionist: 'Full Access' },
  reports: { Admin: 'Full Access', Manager: 'Full Access', Trainer: 'No Access', Receptionist: 'No Access' },
  users: { Admin: 'Full Access', Manager: 'No Access', Trainer: 'No Access', Receptionist: 'No Access' },
  settings: { Admin: 'Full Access', Manager: 'No Access', Trainer: 'No Access', Receptionist: 'No Access' },
  mobile: { Admin: 'Full Access', Manager: 'No Access', Trainer: 'No Access', Receptionist: 'No Access' },
}

const pageAccessMap = {
  dashboard: 'dashboard',
  members: 'members',
  plans: 'plans',
  trainers: 'trainers',
  exercises: 'exercises',
  equipment: 'equipment',
  workouts: 'workouts',
  levels: 'levels',
  diet: 'diet',
  classes: 'classes',
  attendance: 'attendance',
  payments: 'payments',
  reports: 'reports',
  'service-report': 'reports',
  users: 'users',
  mobile: 'mobile',
  settings: 'settings',
  'manual-check-in': 'attendance',
  'add-member': 'members',
  'edit-member': 'members',
  'add-plan': 'plans',
  'edit-plan': 'plans',
  'add-payment': 'payments',
  'add-class': 'classes',
  'edit-class': 'classes',
  'add-trainer': 'trainers',
  'edit-trainer': 'trainers',
  'add-diet': 'diet',
  'edit-diet': 'diet',
  'add-user': 'users',
  'edit-user': 'users',
  'add-exercise': 'exercises',
  'add-body-part': 'exercises',
  'edit-body-part': 'exercises',
  'edit-exercise': 'exercises',
  'add-banner': 'mobile',
  'permissions': 'users',
}

const roleDisplayMap = {
  admin: 'Admin',
  manager: 'Manager',
  trainer: 'Trainer',
  receptionist: 'Receptionist',
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem(authTokenKey)),
  )
  const [authUser, setAuthUser] = useState(() => readStoredUser())
  const [page, setPage] = useState('dashboard')
  const [pagePermissions, setPagePermissions] = useState(defaultPagePermissions)
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [selectedTrainerId, setSelectedTrainerId] = useState(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState(null)
  const [selectedBodyPartId, setSelectedBodyPartId] = useState(null)
  const [selectedLevelId, setSelectedLevelId] = useState(null)
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null)
  const [selectedDietId, setSelectedDietId] = useState(null)

  const handleLogin = (payload) => {
    localStorage.setItem(authTokenKey, payload.token)
    localStorage.setItem(authUserKey, JSON.stringify(payload.user))
    setAuthUser(payload.user)
    setIsLoggedIn(true)
    setPage('dashboard')
  }

  useEffect(() => {
    if (!isLoggedIn) {
      setPagePermissions(defaultPagePermissions)
      setPermissionsLoaded(true)
      return
    }

    let shouldUpdate = true

    const loadPermissions = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/settings`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem(authTokenKey)}`,
          },
        })

        if (!response.ok) {
          throw new Error('Unable to load permissions.')
        }

        const payload = await response.json()

        if (shouldUpdate) {
          setPagePermissions(mergePagePermissions(defaultPagePermissions, payload.settings?.users_roles?.page_access))
          setPermissionsLoaded(true)
        }
      } catch {
        if (shouldUpdate) {
          setPagePermissions(defaultPagePermissions)
          setPermissionsLoaded(true)
        }
      }
    }

    loadPermissions()

    return () => {
      shouldUpdate = false
    }
  }, [isLoggedIn])

  const handleLogout = useCallback(async () => {
    const token = localStorage.getItem(authTokenKey)

    if (token) {
      try {
        await fetch(`${apiBaseUrl}/logout`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
      } catch {
        // Local logout should still complete even if the server is unreachable.
      }
    }

    localStorage.removeItem(authTokenKey)
    localStorage.removeItem(authUserKey)
    setAuthUser(null)
    setIsLoggedIn(false)
    setPage('dashboard')
  }, [])

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  const memberMode = isMemberUser(authUser)
  const currentRole = getUserRole(authUser)
  const navigate = (nextPage) => {
    if (memberMode && !['dashboard', 'workouts'].includes(nextPage)) {
      setPage('dashboard')
      return
    }

    if (permissionsLoaded && !hasPageAccess(nextPage, currentRole, pagePermissions)) {
      setPage('dashboard')
      return
    }

    setPage(nextPage)
  }

  if (memberMode && !['dashboard', 'workouts'].includes(page)) {
    setPage('dashboard')
    return null
  }

  if (memberMode && page === 'dashboard') {
    return (
      <MemberDashboard
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    )
  }

  if (permissionsLoaded && page !== 'dashboard' && !hasPageAccess(page, currentRole, pagePermissions)) {
    return <Dashboard onNavigate={navigate} onLogout={handleLogout} />
  }

  if (page === 'members') {
    return (
      <Members
        onNavigate={(nextPage, memberId = null) => {
          setSelectedMemberId(memberId)
          navigate(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'plans') {
    return (
      <MembershipPlans
        onNavigate={(nextPage, planId = null) => {
          setSelectedPlanId(planId)
          navigate(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'add-member') {
    return <AddMember onBack={() => setPage('members')} />
  }

  if (page === 'edit-member') {
    return (
      <AddMember
        memberId={selectedMemberId}
        onBack={() => {
          setSelectedMemberId(null)
          setPage('members')
        }}
      />
    )
  }

  if (page === 'add-plan') {
    return <AddPlan onBack={() => setPage('plans')} />
  }

  if (page === 'edit-plan') {
    return (
      <AddPlan
        planId={selectedPlanId}
        onBack={() => {
          setSelectedPlanId(null)
          setPage('plans')
        }}
      />
    )
  }

  if (page === 'add-payment') {
    return <AddPayment onBack={() => setPage('payments')} />
  }

  if (page === 'add-class') {
    return <AddClass onBack={() => setPage('classes')} />
  }

  if (page === 'edit-class') {
    return (
      <AddClass
        classId={selectedClassId}
        onBack={() => {
          setSelectedClassId(null)
          setPage('classes')
        }}
      />
    )
  }

  if (page === 'add-trainer') {
    return <AddTrainer onBack={() => setPage('trainers')} />
  }

  if (page === 'edit-trainer') {
    return (
      <AddTrainer
        trainerId={selectedTrainerId}
        onBack={() => {
          setSelectedTrainerId(null)
          setPage('trainers')
        }}
      />
    )
  }

  if (page === 'add-diet') {
    return <AddDiet onBack={() => setPage('diet')} />
  }

  if (page === 'add-banner') {
    return <AddBanner onBack={() => setPage('mobile')} />
  }

  if (page === 'edit-diet') {
    return (
      <AddDiet
        dietId={selectedDietId}
        onBack={() => {
          setSelectedDietId(null)
          setPage('diet')
        }}
      />
    )
  }

  if (page === 'add-user') {
    return (
      <AddUser
        onBack={() => setPage('users')}
        onPermissions={() => setPage('permissions')}
      />
    )
  }

  if (page === 'edit-user') {
    return (
      <EditUser
        onBack={() => setPage('users')}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'add-exercise') {
    return <AddExercise onBack={() => setPage('exercises')} />
  }

  if (page === 'add-body-part') {
    return <AddBodyPart onBack={() => setPage('body-parts')} />
  }

  if (page === 'edit-body-part') {
    return (
      <AddBodyPart
        bodyPartId={selectedBodyPartId}
        onBack={() => {
          setSelectedBodyPartId(null)
          setPage('body-parts')
        }}
      />
    )
  }

  if (page === 'edit-exercise') {
    return (
      <AddExercise
        exerciseId={selectedExerciseId}
        onBack={() => {
          setSelectedExerciseId(null)
          setPage('exercises')
        }}
      />
    )
  }

  if (page === 'add-equipment') {
    return <AddEquipment onBack={() => setPage('equipment')} />
  }

  if (page === 'edit-equipment') {
    return (
      <AddEquipment
        equipmentId={selectedEquipmentId}
        onBack={() => {
          setSelectedEquipmentId(null)
          setPage('equipment')
        }}
      />
    )
  }

  if (page === 'add-workout') {
    return <AddWorkout onBack={() => setPage('workouts')} />
  }

  if (page === 'edit-workout') {
    return (
      <AddWorkout
        workoutId={selectedWorkoutId}
        onBack={() => {
          setSelectedWorkoutId(null)
          setPage('workouts')
        }}
      />
    )
  }

  if (page === 'add-level') {
    return <AddWorkoutLevel onBack={() => setPage('levels')} />
  }

  if (page === 'edit-level') {
    return (
      <AddWorkoutLevel
        levelId={selectedLevelId}
        onBack={() => {
          setSelectedLevelId(null)
          setPage('levels')
        }}
      />
    )
  }

  if (page === 'exercises') {
    return (
      <Exercises
        onNavigate={(nextPage, exerciseId = null) => {
          setSelectedExerciseId(exerciseId)
          navigate(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'body-parts') {
    return (
      <BodyParts
        onNavigate={(nextPage, bodyPartId = null) => {
          setSelectedBodyPartId(bodyPartId)
          navigate(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'equipment') {
    return (
      <Equipment
        onNavigate={(nextPage, equipmentId = null) => {
          setSelectedEquipmentId(equipmentId)
          navigate(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'workouts') {
    return (
      <Workouts
        onNavigate={(nextPage, workoutId = null) => {
          if (memberMode && nextPage !== 'workouts' && nextPage !== 'dashboard') {
            navigate(nextPage)
            return
          }
          setSelectedWorkoutId(workoutId)
          navigate(nextPage)
        }}
        onLogout={handleLogout}
        memberMode={memberMode}
      />
    )
  }

  if (page === 'levels') {
    return (
      <WorkoutLevels
        onNavigate={(nextPage, levelId = null) => {
          setSelectedLevelId(levelId)
          navigate(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'attendance') {
    return (
      <Attendance
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'payments') {
    return (
      <Payments
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'mobile') {
    return (
      <MobileApp
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'reports') {
    return (
      <Reports
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'service-report') {
    return (
      <ServiceUsageReport
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'classes') {
    return (
      <Classes
        onNavigate={(nextPage, classId = null) => {
          setSelectedClassId(classId)
          navigate(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'manual-check-in') {
    return <ManualCheckIn onBack={() => setPage('attendance')} />
  }

  if (page === 'settings') {
    return (
      <Settings
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'trainers') {
    return (
      <Trainers
        onNavigate={(nextPage, trainerId = null) => {
          setSelectedTrainerId(trainerId)
          navigate(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'diet') {
    return (
      <Diet
        onNavigate={(nextPage, dietId = null) => {
          setSelectedDietId(dietId)
          navigate(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'users') {
    return (
      <UsersPage
        onNavigate={navigate}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'permissions') {
    return <Permissions onBack={() => setPage('users')} />
  }

  return (
    <Dashboard
      onNavigate={navigate}
      onLogout={handleLogout}
    />
  )
}

function readStoredUser() {
  try {
    const value = localStorage.getItem(authUserKey)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function getUserRole(user) {
  const roleValue = String(user?.role || user?.user_type || '').trim().toLowerCase()
  return roleDisplayMap[roleValue] || 'Admin'
}

function mergePagePermissions(defaultPermissions, incomingPermissions) {
  if (!incomingPermissions || typeof incomingPermissions !== 'object') {
    return defaultPermissions
  }

  return Object.fromEntries(
    Object.entries(defaultPermissions).map(([pageKey, roleMap]) => [
      pageKey,
      {
        ...roleMap,
        ...(incomingPermissions[pageKey] || {}),
      },
    ]),
  )
}

function hasPageAccess(pageId, role, pagePermissions) {
  const pageKey = pageAccessMap[pageId] || pageId
  const access = pagePermissions?.[pageKey]?.[role] || 'Full Access'
  return access !== 'No Access'
}

function isMemberUser(user) {
  const role = String(user?.role || '').trim().toLowerCase()
  const userType = String(user?.user_type || '').trim().toLowerCase()

  return role === 'member' || userType === 'member'
}

export default App
