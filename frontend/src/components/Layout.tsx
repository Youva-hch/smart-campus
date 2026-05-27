import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface NavItem {
  to: string
  label: string
  icon: string
}

const navByRole: Record<string, NavItem[]> = {
  admin: [
    { to: '/dashboard',        label: 'Dashboard',       icon: '▦'  },
    { to: '/etudiants',        label: 'Étudiants',       icon: '🎓' },
    { to: '/enseignants',      label: 'Enseignants',     icon: '👨‍🏫' },
    { to: '/cours',            label: 'Cours',           icon: '📚' },
    { to: '/emploi-du-temps',  label: 'Emploi du temps', icon: '📅' },
  ],
  enseignant: [
    { to: '/dashboard',       label: 'Dashboard',       icon: '▦'  },
    { to: '/cours',           label: 'Cours',           icon: '📚' },
    { to: '/emploi-du-temps', label: 'Emploi du temps', icon: '📅' },
  ],
  etudiant: [
    { to: '/dashboard',       label: 'Dashboard',       icon: '▦'  },
    { to: '/cours',           label: 'Cours',           icon: '📚' },
    { to: '/emploi-du-temps', label: 'Emploi du temps', icon: '📅' },
  ],
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = user ? (navByRole[user.role] ?? []) : []

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-blue-600 tracking-tight">SmartCampus</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-2">
          {user && (
            <div className="text-xs text-gray-500 truncate">
              <p className="font-medium text-gray-700 truncate">{user.prenom} {user.nom}</p>
              <p className="capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span>⎋</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
