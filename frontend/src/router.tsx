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

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  // Toutes les routes protégées partagent le Layout (sidebar)
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/dashboard',       element: <DashboardPage /> },
          { path: '/emploi-du-temps', element: <EmploiDuTempsPage /> },
          { path: '/cours',           element: <CoursPage /> },
          { path: '/cours/create', element: <CreateCoursPage /> },
          { path: '/cours/:id',    element: <CoursDetailPage /> },
          // Admin uniquement (PrivateRoute imbriqué pour le contrôle de rôle)
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
