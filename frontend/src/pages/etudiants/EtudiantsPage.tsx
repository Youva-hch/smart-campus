import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { SkeletonTable } from '../../components/ui/Skeleton'
import SearchBar from '../../components/ui/SearchBar'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'

interface Etudiant {
  id: number
  nom: string
  prenom: string
  email: string
  numero_etudiant: string
  niveau: string
  filiere: string
  statut: 'inscrit' | 'suspendu' | 'diplome'
}

const STATUT_STYLES = {
  inscrit:  'bg-emerald-100 text-emerald-700',
  suspendu: 'bg-amber-100 text-amber-700',
  diplome:  'bg-gray-100 text-gray-600',
}

export default function EtudiantsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: etudiants = [], isLoading } = useQuery<Etudiant[]>({
    queryKey: ['etudiants'],
    queryFn: () => api.get('/etudiants').then(r => r.data),
  })

  const { mutate: deleteEtudiant } = useMutation({
    mutationFn: (id: number) => api.delete(`/etudiants/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['etudiants'] })
      toast.success('Étudiant supprimé')
      setDeleteId(null)
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })

  const filtered = etudiants.filter(e => {
    const q = search.toLowerCase()
    return !q || [e.nom, e.prenom, e.email, e.numero_etudiant, e.filiere, e.niveau]
      .some(v => v?.toLowerCase().includes(q))
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Étudiants</h1>
          <p className="text-sm text-gray-400 mt-0.5">{etudiants.length} étudiant{etudiants.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un étudiant…" />
          {user?.role === 'admin' && (
            <Link to="/etudiants/create"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap">
              + Ajouter
            </Link>
          )}
        </div>
      </div>

      {isLoading ? <SkeletonTable rows={5} cols={6} /> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left border-b border-gray-100 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">N° Étudiant</th>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Niveau</th>
                <th className="px-4 py-3 font-medium">Filière</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                {user?.role === 'admin' && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/etudiants/${e.id}`} className="text-blue-600 hover:underline font-mono text-xs">
                      {e.numero_etudiant}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{e.prenom} {e.nom}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{e.email}</td>
                  <td className="px-4 py-3 text-gray-600">{e.niveau}</td>
                  <td className="px-4 py-3 text-gray-600">{e.filiere}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUT_STYLES[e.statut]}`}>
                      {e.statut}
                    </span>
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeleteId(e.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition">
                        Supprimer
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr><td colSpan={7}>
                  <EmptyState icon="🎓" title={search ? 'Aucun résultat' : 'Aucun étudiant'} />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Supprimer l'étudiant ?"
          message="Cette action supprimera également toutes ses notes et inscriptions. Cette action est irréversible."
          confirmLabel="Supprimer"
          danger
          onConfirm={() => deleteEtudiant(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
