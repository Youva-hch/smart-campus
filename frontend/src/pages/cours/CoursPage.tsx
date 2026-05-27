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

interface Cours {
  id: number
  code: string
  nom: string
  credits: number
  semestre: string
  niveau: string
  enseignant_nom: string
  capacite_max: number
  departement: string
}

export default function CoursPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch]       = useState('')
  const [niveauFilter, setNiveau] = useState('')
  const [disableId, setDisableId] = useState<number | null>(null)

  const { data: cours = [], isLoading } = useQuery<Cours[]>({
    queryKey: ['cours'],
    queryFn: () => api.get('/cours').then(r => r.data),
  })

  const { mutate: disableCours } = useMutation({
    mutationFn: (id: number) => api.delete(`/cours/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cours'] })
      toast.success('Cours désactivé')
      setDisableId(null)
    },
    onError: () => toast.error('Erreur'),
  })

  const niveaux = [...new Set(cours.map(c => c.niveau).filter(Boolean))]

  const filtered = cours.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || [c.code, c.nom, c.enseignant_nom, c.departement]
      .some(v => v?.toLowerCase().includes(q))
    const matchNiveau = !niveauFilter || c.niveau === niveauFilter
    return matchSearch && matchNiveau
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cours</h1>
          <p className="text-sm text-gray-400 mt-0.5">{cours.length} cours actif{cours.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Code, nom, enseignant…" />
          <select value={niveauFilter} onChange={e => setNiveau(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Tous niveaux</option>
            {niveaux.map(n => <option key={n}>{n}</option>)}
          </select>
          {user?.role === 'admin' && (
            <Link to="/cours/create"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap">
              + Ajouter
            </Link>
          )}
        </div>
      </div>

      {isLoading ? <SkeletonTable rows={6} cols={5} /> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left border-b border-gray-100 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Niveau</th>
                <th className="px-4 py-3 font-medium">Semestre</th>
                <th className="px-4 py-3 font-medium">Crédits</th>
                <th className="px-4 py-3 font-medium">Enseignant</th>
                {user?.role === 'admin' && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/cours/${c.id}`} className="font-mono text-blue-600 hover:underline text-xs font-bold">
                      {c.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.nom}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.niveau}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.semestre}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{c.credits}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.enseignant_nom ?? '—'}</td>
                  {user?.role === 'admin' && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDisableId(c.id)}
                        className="text-xs text-amber-500 hover:text-amber-700 transition">
                        Désactiver
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr><td colSpan={7}>
                  <EmptyState icon="📚" title={search ? 'Aucun résultat' : 'Aucun cours'} />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {disableId && (
        <ConfirmDialog
          title="Désactiver ce cours ?"
          message="Le cours sera masqué mais les données (notes, inscriptions) seront conservées."
          confirmLabel="Désactiver"
          onConfirm={() => disableCours(disableId)}
          onCancel={() => setDisableId(null)}
        />
      )}
    </div>
  )
}
