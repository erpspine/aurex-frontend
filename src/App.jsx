import { useCallback, useState } from 'react'

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
import Members from './pages/Members'
import MembershipPlans from './pages/MembershipPlans'
import MobileApp from './pages/MobileApp'
import Payments from './pages/Payments'
import Permissions from './pages/Permissions'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Trainers from './pages/Trainers'
import UsersPage from './pages/Users'
import WorkoutLevels from './pages/WorkoutLevels'
import Workouts from './pages/Workouts'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
const authTokenKey = 'aurex_admin_token'
const authUserKey = 'aurex_admin_user'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem(authTokenKey)),
  )
  const [page, setPage] = useState('dashboard')
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
    setIsLoggedIn(true)
    setPage('dashboard')
  }

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
    setIsLoggedIn(false)
    setPage('dashboard')
  }, [])

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />
  }

  if (page === 'members') {
    return (
      <Members
        onNavigate={(nextPage, memberId = null) => {
          setSelectedMemberId(memberId)
          setPage(nextPage)
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
          setPage(nextPage)
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
          setPage(nextPage)
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
          setPage(nextPage)
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
          setPage(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'workouts') {
    return (
      <Workouts
        onNavigate={(nextPage, workoutId = null) => {
          setSelectedWorkoutId(workoutId)
          setPage(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'levels') {
    return (
      <WorkoutLevels
        onNavigate={(nextPage, levelId = null) => {
          setSelectedLevelId(levelId)
          setPage(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'attendance') {
    return (
      <Attendance
        onNavigate={setPage}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'payments') {
    return (
      <Payments
        onNavigate={setPage}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'mobile') {
    return (
      <MobileApp
        onNavigate={setPage}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'reports') {
    return (
      <Reports
        onNavigate={setPage}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'classes') {
    return (
      <Classes
        onNavigate={(nextPage, classId = null) => {
          setSelectedClassId(classId)
          setPage(nextPage)
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
        onNavigate={setPage}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'trainers') {
    return (
      <Trainers
        onNavigate={(nextPage, trainerId = null) => {
          setSelectedTrainerId(trainerId)
          setPage(nextPage)
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
          setPage(nextPage)
        }}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'users') {
    return (
      <UsersPage
        onNavigate={setPage}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'permissions') {
    return <Permissions onBack={() => setPage('users')} />
  }

  return (
    <Dashboard
      onNavigate={setPage}
      onLogout={handleLogout}
    />
  )
}

export default App
