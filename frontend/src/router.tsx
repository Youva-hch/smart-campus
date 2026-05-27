import { createBrowserRouter, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import EtudiantsPage from './pages/etudiants/EtudiantsPage'
import EtudiantDetailPage from './pages/etudiants/EtudiantDetailPage'
import EnseignantsPage from './pages/enseignants/EnseignantsPage'
import CoursPage from './pages/cours/CoursPage'
import CoursDetailPage from './pages/cours/CoursDetailPage'
import CreateCoursPage from './pages/cours/CreateCoursPage'
import CreateEtudiantPage from './pages/etudiants/CreateEtudiantPage'
import EmploiDuTempsPage from './pages/EmploiDuTempsPage'
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
import PresencePage from './pages/presences/PresencePage'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          // Accessible à tous les rôles
          { path: '/dashboard',        element: <DashboardPage /> },
          { path: '/cours',            element: <CoursPage /> },
          { path: '/cours/create',     element: <CreateCoursPage /> },
          { path: '/cours/:id',        element: <CoursDetailPage /> },
          { path: '/emploi-du-temps',  element: <EmploiDuTempsPage /> },
          { path: '/notifications',    element: <NotificationsPage /> },
          { path: '/profil',           element: <ProfilePage /> },

          // Admin + enseignant
          {
            element: <PrivateRoute allowedRoles={['admin', 'enseignant']} />,
            children: [
              { path: '/presences', element: <PresencePage /> },
            ],
          },

          // Admin uniquement
          {
            element: <PrivateRoute allowedRoles={['admin']} />,
            children: [
              { path: '/etudiants',        element: <EtudiantsPage /> },
              { path: '/etudiants/create', element: <CreateEtudiantPage /> },
              { path: '/etudiants/:id',    element: <EtudiantDetailPage /> },
              { path: '/enseignants',      element: <EnseignantsPage /> },
            ],
          },
        ],
      },
    ],
  },
])

export default router
