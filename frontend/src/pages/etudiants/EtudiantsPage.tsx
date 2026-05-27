import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

interface Etudiant {
  id: number
  nom: string
  prenom: string
  email: string
  numero_etudiant: string
  niveau: string
  filiere: string
  statut: string
}

export default function EtudiantsPage() {
  const { user } = useAuth()
  const { data: etudiants = [], isLoading } = useQuery<Etudiant[]>({
    queryKey: ['etudiants'],
    queryFn: () => api.get('/etudiants').then((r) => r.data),
  })

  if (isLoading) return <p className="p-6 text-gray-500">Chargement…</p>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Étudiants</h1>
        {user?.role === 'admin' && (
          <Link
            to="/etudiants/create"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            + Ajouter un étudiant
          </Link>
        )}
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-left border-b border-gray-100">
              <th className="px-4 py-3 font-medium">N° Étudiant</th>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Niveau</th>
              <th className="px-4 py-3 font-medium">Filière</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {etudiants.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/etudiants/${e.id}`} className="text-blue-600 hover:underline font-mono">
                    {e.numero_etudiant}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{e.prenom} {e.nom}</td>
                <td className="px-4 py-3 text-gray-500">{e.email}</td>
                <td className="px-4 py-3">{e.niveau}</td>
                <td className="px-4 py-3">{e.filiere}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                    e.statut === 'inscrit'  ? 'bg-emerald-100 text-emerald-700' :
                    e.statut === 'suspendu' ? 'bg-amber-100 text-amber-700' :
                                              'bg-gray-100 text-gray-600'
                  }`}>
                    {e.statut}
                  </span>
                </td>
              </tr>
            ))}
            {etudiants.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun étudiant</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
