import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../api/client'

interface Notif {
  id: number
  titre: string
  message: string
  type: string
  lu: number
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  note:            '📝',
  absence:         '⚠️',
  cours:           '📚',
  emploi_du_temps: '📅',
  general:         '🔔',
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ notifications: Notif[]; unread: number }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
  })

  const { mutate: markRead } = useMutation({
    mutationFn: (id: number) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const { mutate: markAll } = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Toutes les notifications lues')
    },
  })

  const notifs = data?.notifications ?? []
  const unread = data?.unread ?? 0

  if (isLoading) return <p className="p-6 text-gray-500">Chargement…</p>

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          {unread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={() => markAll()}
            className="text-sm text-blue-600 hover:underline">
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-500">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div
              key={n.id}
              onClick={() => !n.lu && markRead(n.id)}
              className={`bg-white rounded-xl border px-5 py-4 flex gap-4 cursor-pointer transition-all ${
                n.lu ? 'border-gray-100 opacity-70' : 'border-blue-100 shadow-sm hover:shadow'
              }`}
            >
              <span className="text-2xl shrink-0">{TYPE_ICONS[n.type] ?? '🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold text-gray-800 ${!n.lu ? 'font-bold' : ''}`}>
                    {n.titre}
                  </p>
                  {!n.lu && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
