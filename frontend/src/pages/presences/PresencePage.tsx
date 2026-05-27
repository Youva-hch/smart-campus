import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { SkeletonTable } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'

interface Seance {
  id: number
  cours_id: number
  jour_semaine: string
  heure_debut: string
  heure_fin: string
  type: string
  cours_code: string
  cours_nom: string
  salle_nom?: string
}

interface Presence {
  id: number
  etudiant_id: number
  nom: string
  prenom: string
  numero_etudiant: string
  statut: 'present' | 'absent' | 'retard' | 'excuse'
  commentaire?: string
}

const STATUTS = ['present', 'absent', 'retard', 'excuse'] as const
const STATUT_STYLES: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  absent:  'bg-red-100 text-red-700 border-red-200',
  retard:  'bg-amber-100 text-amber-700 border-amber-200',
  excuse:  'bg-gray-100 text-gray-600 border-gray-200',
}
const STATUT_ICONS: Record<string, string> = {
  present: '✓', absent: '✗', retard: '⏱', excuse: '~'
}

export default function PresencePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selectedSeance, setSelectedSeance] = useState<number | null>(null)

  // Récupère l'id enseignant
  const { data: enseignantId } = useQuery({
    queryKey: ['enseignant-id', user?.id],
    queryFn: async () => {
      const r = await api.get('/enseignants')
      const list = r.data as Array<{ id: number; utilisateur_id: number }>
      return list.find(e => e.utilisateur_id === user?.id)?.id ?? null
    },
    enabled: !!user && user.role === 'enseignant',
  })

  // Séances de l'enseignant (ou toutes pour admin)
  const { data: seances = [], isLoading: loadingSeances } = useQuery<Seance[]>({
    queryKey: ['seances-presence', enseignantId, user?.role],
    queryFn: async () => {
      if (user?.role === 'admin') {
        const cours = await api.get('/cours').then(r => r.data as Array<{ id: number }>)
        const all = await Promise.all(cours.map(c => api.get(`/seances?cours_id=${c.id}`).then(r => r.data)))
        return all.flat()
      }
      if (enseignantId) return api.get(`/seances?enseignant_id=${enseignantId}`).then(r => r.data)
      return []
    },
    enabled: user?.role === 'admin' || !!enseignantId,
  })

  // Présences de la séance sélectionnée
  const { data: presences = [], isLoading: loadingPresences } = useQuery<Presence[]>({
    queryKey: ['presences', selectedSeance],
    queryFn: () => api.get(`/presences?seance_id=${selectedSeance}`).then(r => r.data),
    enabled: !!selectedSeance,
  })

  // Init feuille de présence
  const { mutate: initSeance, isPending: initing } = useMutation({
    mutationFn: () => api.post(`/presences/seance/${selectedSeance}/init`),
    onSuccess: (r) => {
      const count = (r.data as { created: number }).created
      toast.success(count > 0 ? `Feuille initialisée (${count} étudiants)` : 'Feuille déjà initialisée')
      qc.invalidateQueries({ queryKey: ['presences', selectedSeance] })
    },
    onError: () => toast.error('Erreur lors de l\'initialisation'),
  })

  // Modifier un statut
  const { mutate: updatePresence } = useMutation({
    mutationFn: ({ etudiantId, statut }: { etudiantId: number; statut: string }) =>
      api.post('/presences', { etudiant_id: etudiantId, seance_id: selectedSeance, statut }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presences', selectedSeance] })
      toast.success('Présence enregistrée')
    },
    onError: () => toast.error('Erreur'),
  })

  const seanceActive = seances.find(s => s.id === selectedSeance)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Gestion des présences</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Liste des séances */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Séances</p>
          </div>
          {loadingSeances ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-lg" />)}
            </div>
          ) : seances.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">Aucune séance</div>
          ) : (
            <ul className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {seances.map(s => (
                <li
                  key={s.id}
                  onClick={() => setSelectedSeance(s.id)}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedSeance === s.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800">
                    <span className="font-mono text-blue-600 mr-1">{s.cours_code}</span>
                    <span className="text-xs text-gray-400 ml-1">{s.type}</span>
                  </p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                    {s.jour_semaine} · {s.heure_debut.slice(0,5)} – {s.heure_fin.slice(0,5)}
                  </p>
                  {s.salle_nom && <p className="text-xs text-gray-400">{s.salle_nom}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Feuille de présence */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!selectedSeance ? (
            <EmptyState icon="📋" title="Sélectionnez une séance" description="Choisissez une séance dans la liste pour gérer les présences." />
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-50 bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">
                    {seanceActive?.cours_code} – {seanceActive?.cours_nom}
                  </p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                    {seanceActive?.jour_semaine} · {seanceActive?.heure_debut?.slice(0,5)} – {seanceActive?.heure_fin?.slice(0,5)}
                  </p>
                </div>
                {presences.length === 0 && (
                  <button
                    onClick={() => initSeance()}
                    disabled={initing}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {initing ? 'Init…' : '+ Initialiser'}
                  </button>
                )}
                {presences.length > 0 && (
                  <div className="flex gap-2 text-xs">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">
                      ✓ {presences.filter(p => p.statut === 'present').length} présents
                    </span>
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                      ✗ {presences.filter(p => p.statut === 'absent').length} absents
                    </span>
                  </div>
                )}
              </div>

              {loadingPresences ? (
                <div className="p-4"><SkeletonTable rows={4} cols={3} /></div>
              ) : presences.length === 0 ? (
                <EmptyState
                  icon="📋"
                  title="Feuille non initialisée"
                  description="Cliquez sur Initialiser pour créer la feuille de présence."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-left border-b border-gray-50 text-xs uppercase tracking-wide">
                        <th className="px-5 py-3 font-medium">Étudiant</th>
                        <th className="px-5 py-3 font-medium">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {presences.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-800">{p.prenom} {p.nom}</p>
                            <p className="text-xs text-gray-400">{p.numero_etudiant}</p>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2 flex-wrap">
                              {STATUTS.map(s => (
                                <button
                                  key={s}
                                  onClick={() => updatePresence({ etudiantId: p.etudiant_id, statut: s })}
                                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium capitalize transition-all ${
                                    p.statut === s
                                      ? STATUT_STYLES[s]
                                      : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                  }`}
                                >
                                  {STATUT_ICONS[s]} {s}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
