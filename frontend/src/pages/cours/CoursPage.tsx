import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

interface Cours {
  id: number
  code: string
  nom: string
  credits: number
  semestre: string
  niveau: string
  enseignant_nom: string
  capacite_max: number
}

export default function CoursPage() {
  const { user } = useAuth()
  const { data: cours = [], isLoading } = useQuery<Cours[]>({
    queryKey: ['cours'],
    queryFn: () => api.get('/cours').then((r) => r.data),
  })

  if (isLoading) return <p className="p-6 text-gray-500">Chargement…</p>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Cours</h1>
        {user?.role === 'admin' && (
          <Link
            to="/cours/create"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            + Ajouter un cours
          </Link>
        )}
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-left border-b border-gray-100">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Niveau</th>
              <th className="px-4 py-3 font-medium">Semestre</th>
              <th className="px-4 py-3 font-medium">Crédits</th>
              <th className="px-4 py-3 font-medium">Enseignant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cours.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/cours/${c.id}`} className="font-mono text-blue-600 hover:underline">
                    {c.code}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{c.nom}</td>
                <td className="px-4 py-3">{c.niveau}</td>
                <td className="px-4 py-3">{c.semestre}</td>
                <td className="px-4 py-3 text-center">{c.credits}</td>
                <td className="px-4 py-3 text-gray-500">{c.enseignant_nom ?? '—'}</td>
              </tr>
            ))}
            {cours.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun cours</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
