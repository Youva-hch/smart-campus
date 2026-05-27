import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'] as const
const HEURES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
                '14:00', '15:00', '16:00', '17:00', '18:00']

interface Seance {
  id: number
  jour_semaine: string
  heure_debut: string
  heure_fin: string
  type: 'cours' | 'td' | 'tp' | 'examen'
  cours_nom: string
  cours_code: string
  salle_nom?: string
  batiment?: string
  enseignant_nom?: string
  nb_inscrits?: number
}

const TYPE_COLORS: Record<string, string> = {
  cours:  'bg-blue-100 border-blue-400 text-blue-800',
  td:     'bg-violet-100 border-violet-400 text-violet-800',
  tp:     'bg-emerald-100 border-emerald-400 text-emerald-800',
  examen: 'bg-red-100 border-red-400 text-red-800',
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const GRID_START = timeToMinutes('08:00')
const SLOT_HEIGHT = 64 // px par heure

function seanceStyle(seance: Seance) {
  const start = timeToMinutes(seance.heure_debut) - GRID_START
  const duration = timeToMinutes(seance.heure_fin) - timeToMinutes(seance.heure_debut)
  return {
    top:    `${(start / 60) * SLOT_HEIGHT}px`,
    height: `${(duration / 60) * SLOT_HEIGHT - 4}px`,
  }
}

export default function EmploiDuTempsPage() {
  const { user } = useAuth()

  const endpoint = user?.role === 'enseignant'
    ? null  // résolu après fetch du profil enseignant
    : '/seances?etudiant_id=0' // placeholder remplacé dynamiquement

  // Récupère l'id profil (etudiant ou enseignant) depuis /auth/me étendu
  const { data: profil } = useQuery({
    queryKey: ['profil-id', user?.id],
    queryFn: async () => {
      if (user?.role === 'etudiant') {
        const r = await api.get('/etudiants')
        const list: Array<{ id: number; utilisateur_id: number }> = r.data
        return list.find(e => e.utilisateur_id === user.id)?.id ?? null
      }
      if (user?.role === 'enseignant') {
        const r = await api.get('/enseignants')
        const list: Array<{ id: number; utilisateur_id: number }> = r.data
        return list.find(e => e.utilisateur_id === user.id)?.id ?? null
      }
      return null
    },
    enabled: !!user && user.role !== 'admin',
  })

  const seancesEndpoint =
    user?.role === 'etudiant'   && profil ? `/seances?etudiant_id=${profil}` :
    user?.role === 'enseignant' && profil ? `/seances?enseignant_id=${profil}` :
    null

  const { data: seances = [], isLoading } = useQuery<Seance[]>({
    queryKey: ['seances-edt', seancesEndpoint],
    queryFn: () => api.get(seancesEndpoint!).then(r => r.data),
    enabled: !!seancesEndpoint,
  })

  // Admin : charge toutes les séances via cours
  const { data: tousLesCours = [] } = useQuery<Array<{ id: number }>>({
    queryKey: ['cours'],
    queryFn: () => api.get('/cours').then(r => r.data),
    enabled: user?.role === 'admin',
  })

  const { data: seancesAdmin = [] } = useQuery<Seance[]>({
    queryKey: ['seances-admin'],
    queryFn: async () => {
      const all = await Promise.all(
        tousLesCours.map(c => api.get(`/seances?cours_id=${c.id}`).then(r => r.data))
      )
      return all.flat()
    },
    enabled: user?.role === 'admin' && tousLesCours.length > 0,
  })

  const data: Seance[] = user?.role === 'admin' ? seancesAdmin : seances

  if (isLoading || (user?.role !== 'admin' && !seancesEndpoint)) {
    return <p className="p-6 text-gray-500">Chargement…</p>
  }

  // Grouper par jour
  const parJour: Record<string, Seance[]> = {}
  JOURS.forEach(j => { parJour[j] = [] })
  data.forEach(s => {
    if (parJour[s.jour_semaine]) parJour[s.jour_semaine].push(s)
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Emploi du temps</h1>
        <div className="flex gap-3 text-xs">
          {Object.entries(TYPE_COLORS).map(([type, cls]) => (
            <span key={type} className={`px-2 py-1 rounded border-l-2 font-medium ${cls}`}>
              {type.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {data.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          Aucune séance planifiée
        </div>
      )}

      {data.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <div className="flex min-w-[700px]">
            {/* Colonne heures */}
            <div className="w-16 flex-shrink-0 border-r border-gray-100 pt-10">
              {HEURES.map(h => (
                <div key={h} style={{ height: SLOT_HEIGHT }}
                  className="flex items-start justify-end pr-2 pt-1">
                  <span className="text-xs text-gray-400">{h}</span>
                </div>
              ))}
            </div>

            {/* Colonnes jours */}
            {JOURS.map(jour => (
              <div key={jour} className="flex-1 border-r border-gray-100 last:border-r-0">
                {/* En-tête jour */}
                <div className="h-10 flex items-center justify-center border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-600 capitalize">{jour}</span>
                </div>

                {/* Grille */}
                <div className="relative" style={{ height: SLOT_HEIGHT * HEURES.length }}>
                  {/* Lignes horizontales */}
                  {HEURES.map((_, i) => (
                    <div key={i} style={{ top: i * SLOT_HEIGHT }}
                      className="absolute inset-x-0 border-t border-gray-50" />
                  ))}

                  {/* Séances */}
                  {parJour[jour].map(s => (
                    <div
                      key={s.id}
                      style={seanceStyle(s)}
                      className={`absolute inset-x-1 rounded-lg border-l-4 px-2 py-1 overflow-hidden
                        shadow-sm cursor-default transition-shadow hover:shadow-md
                        ${TYPE_COLORS[s.type] ?? 'bg-gray-100 border-gray-400 text-gray-800'}`}
                    >
                      <p className="text-xs font-bold leading-tight truncate">{s.cours_code}</p>
                      <p className="text-xs leading-tight truncate opacity-80">{s.cours_nom}</p>
                      <p className="text-xs leading-tight opacity-60 mt-0.5">
                        {s.heure_debut.slice(0, 5)} – {s.heure_fin.slice(0, 5)}
                      </p>
                      {s.salle_nom && (
                        <p className="text-xs leading-tight opacity-60 truncate">{s.salle_nom}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
