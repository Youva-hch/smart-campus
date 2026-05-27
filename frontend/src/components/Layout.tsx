import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

interface NavItem {
  to: string
  label: string
  icon: string
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',        label: 'Dashboard',       icon: '⊞',  roles: ['admin','enseignant','etudiant'] },
  { to: '/etudiants',        label: 'Étudiants',       icon: '🎓', roles: ['admin'] },
  { to: '/enseignants',      label: 'Enseignants',     icon: '👨‍🏫', roles: ['admin'] },
  { to: '/cours',            label: 'Cours',           icon: '📚', roles: ['admin','enseignant','etudiant'] },
  { to: '/emploi-du-temps',  label: 'Emploi du temps', icon: '📅', roles: ['admin','enseignant','etudiant'] },
  { to: '/presences',        label: 'Présences',       icon: '✅', roles: ['admin','enseignant'] },
  { to: '/notifications',    label: 'Notifications',   icon: '🔔', roles: ['admin','enseignant','etudiant'] },
  { to: '/profil',           label: 'Mon profil',      icon: '👤', roles: ['admin','enseignant','etudiant'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const links = NAV_ITEMS.filter(item =>
    !item.roles || (user?.role && item.roles.includes(user.role))
  )

  const { data: notifData } = useQuery({
    queryKey: ['notif-unread'],
    queryFn: () => api.get('/notifications/unread').then(r => r.data as { unread: number }),
    refetchInterval: 30_000,
    enabled: !!user,
  })
  const unread = notifData?.unread ?? 0

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">SC</span>
            </div>
            <span className="text-base font-bold text-gray-800 tracking-tight">SmartCampus</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {links.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.to === '/notifications' && unread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer utilisateur */}
        <div className="px-3 py-3 border-t border-gray-50 space-y-1">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{user?.prenom} {user?.nom}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <span className="text-base">⎋</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
