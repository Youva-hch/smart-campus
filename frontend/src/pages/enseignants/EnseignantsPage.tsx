import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../api/client'

interface Enseignant {
  id: number
  nom: string
  prenom: string
  email: string
  numero_enseignant: string
  departement: string
  grade: string
}

export default function EnseignantsPage() {
  const { data: enseignants = [], isLoading } = useQuery<Enseignant[]>({
    queryKey: ['enseignants'],
    queryFn: () => api.get('/enseignants').then((r) => r.data),
  })

  if (isLoading) return <p className="p-6 text-gray-500">Chargement…</p>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Enseignants</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-left">
              <th className="px-4 py-2">N°</th>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Département</th>
              <th className="px-4 py-2">Grade</th>
            </tr>
          </thead>
          <tbody>
            {enseignants.map((e) => (
              <tr key={e.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link to={`/enseignants/${e.id}`} className="text-blue-600 hover:underline">
                    {e.numero_enseignant}
                  </Link>
                </td>
                <td className="px-4 py-2">{e.prenom} {e.nom}</td>
                <td className="px-4 py-2 text-gray-500">{e.email}</td>
                <td className="px-4 py-2">{e.departement}</td>
                <td className="px-4 py-2">{e.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
