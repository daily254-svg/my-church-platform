import { Navigate, useRoutes } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import LoginPage from '../pages/auth/LoginPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import LiveServicePage from '../pages/live-service/LiveServicePage'
import SermonsPage from '../pages/sermons/SermonsPage'
import AnnouncementsPage from '../pages/announcements/AnnouncementsPage'
import MonitoringPage from '../pages/monitoring/MonitoringPage'
import GivingReportsPage from '../pages/giving/GivingReportsPage'

import { useServiceStore } from '../store/service.store'
import { useAuthStore } from '../store/auth.store'
import type { Role } from '../types/media.types'

function LoginRoute() {
  return <LoginPage onLogin={() => undefined} />
}

function DashboardRoute() {
  const { isLive, connectedCount } = useServiceStore()
  const role = (useAuthStore.getState().user?.role as Role) ?? 'Media'
  return <DashboardPage role={role} liveActive={isLive} setScreen={() => undefined} connectedCount={connectedCount} />
}

function LiveServiceRoute() {
  const { isLive, setLive } = useServiceStore()
  const role = (useAuthStore.getState().user?.role as Role) ?? 'Media'
  return <LiveServicePage role={role} liveActive={isLive} setLiveActive={setLive} />
}

function SermonsRoute() {
  return <SermonsPage role="Admin" />
}

function AnnouncementsRoute() {
  return <AnnouncementsPage role="Admin" />
}

function MonitoringRoute() {
  return <MonitoringPage />
}

function GivingReportsRoute() {
  return <GivingReportsPage role="Admin" />
}

const routes = [
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardRoute /> },
      { path: 'live-service', element: <LiveServiceRoute /> },
      { path: 'sermons', element: <SermonsRoute /> },
      { path: 'announcements', element: <AnnouncementsRoute /> },
      { path: 'monitoring', element: <MonitoringRoute /> },
      { path: 'giving', element: <GivingReportsRoute /> },
    ],
  },
  { path: 'login', element: <LoginRoute /> },
  { path: '*', element: <Navigate to="/" replace /> },
]

export function AppRouter() {
  return useRoutes(routes)
}
