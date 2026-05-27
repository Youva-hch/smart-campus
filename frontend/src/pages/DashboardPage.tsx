import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  if (user.role === 'admin')      return <DashboardAdmin />
  if (user.role === 'enseignant') return <DashboardEnseignant />
  return <DashboardEtudiant />
}

// ── Admin ──────────────────────────────────────────────────────────────────

function DashboardAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-admin'],
    queryFn: () => api.get('/dashboard/admin').then(r => r.data),
  })

  if (isLoading) return <Spinner />

  const { stats, coursPopulaires, derniersInscrits } = data ?? {}

  const statCards = [
    { label: 'Étudiants inscrits',  value: stats?.total_etudiants,    color: 'blue'   },
    { label: 'Enseignants',         value: stats?.total_enseignants,   color: 'violet' },
    { label: 'Cours actifs',        value: stats?.total_cours_actifs,  color: 'emerald'},
    { label: 'Inscriptions',        value: stats?.total_inscriptions,  color: 'amber'  },
  ]

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Tableau de bord administrateur</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cours les plus remplis */}
        <Section title="Cours les plus remplis">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left border-b">
                <th className="pb-2 font-medium">Code</th>
                <th className="pb-2 font-medium">Nom</th>
                <th className="pb-2 font-medium text-right">Inscrits</th>
                <th className="pb-2 font-medium text-right">Taux</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(coursPopulaires ?? []).map((c: CoursPopulaire) => (
                <tr key={c.code}>
                  <td className="py-2 font-mono text-blue-600">{c.code}</td>
                  <td className="py-2 text-gray-700 truncate max-w-[120px]">{c.nom}</td>
                  <td className="py-2 text-right">{c.nb_inscrits} / {c.capacite_max}</td>
                  <td className="py-2 text-right">
                    <TauxBadge taux={c.taux_remplissage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Derniers inscrits */}
        <Section title="Derniers inscrits">
          <ul className="space-y-3">
            {(derniersInscrits ?? []).map((e: DernierInscrit) => (
              <li key={e.numero_etudiant} className="flex items-center gap-3">
                <Avatar name={`${e.prenom} ${e.nom}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{e.prenom} {e.nom}</p>
                  <p className="text-xs text-gray-400">{e.filiere} · {e.niveau}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400 shrink-0">
                  {formatDate(e.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  )
}

// ── Enseignant ─────────────────────────────────────────────────────────────

function DashboardEnseignant() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-enseignant'],
    queryFn: () => api.get('/dashboard/enseignant').then(r => r.data),
  })

  if (isLoading) return <Spinner />

  const { cours = [], evaluationsAVenir = [], prochainesSeances = [] } = data ?? {}

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">
        Bonjour, {user?.prenom} {user?.nom}
      </h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mes cours */}
        <Section title={`Mes cours (${cours.length})`}>
          <ul className="space-y-3">
            {cours.map((c: CoursEnseignant) => (
              <li key={c.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    <span className="font-mono text-blue-600 mr-2">{c.code}</span>
                    {c.nom}
                  </p>
                  <p className="text-xs text-gray-400">{c.niveau} · {c.semestre}</p>
                </div>
                <CapaciteBadge current={c.nb_inscrits} max={c.capacite_max} />
              </li>
            ))}
            {cours.length === 0 && <Empty text="Aucun cours assigné" />}
          </ul>
        </Section>

        {/* Évaluations à venir */}
        <Section title="Évaluations à venir">
          <ul className="space-y-3">
            {evaluationsAVenir.map((ev: EvaluationAVenir) => (
              <li key={ev.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800">{ev.nom}</p>
                  <p className="text-xs text-gray-400">
                    {ev.cours_code} · {ev.type}
                    {ev.date_evaluation && ` · ${formatDate(ev.date_evaluation)}`}
                  </p>
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {ev.notes_saisies}/{ev.nb_inscrits} notes
                </span>
              </li>
            ))}
            {evaluationsAVenir.length === 0 && <Empty text="Aucune évaluation à venir" />}
          </ul>
        </Section>
      </div>

      {/* Prochaines séances */}
      <Section title="Prochaines séances">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {prochainesSeances.map((s: Seance, i: number) => (
            <SeanceCard key={i} seance={s} />
          ))}
          {prochainesSeances.length === 0 && <Empty text="Aucune séance à venir" />}
        </div>
      </Section>
    </div>
  )
}

// ── Étudiant ───────────────────────────────────────────────────────────────

function DashboardEtudiant() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-etudiant'],
    queryFn: () => api.get('/dashboard/etudiant').then(r => r.data),
  })

  if (isLoading) return <Spinner />

  const { cours = [], notesRecentes = [], prochainesSeances = [], absences = [] } = data ?? {}

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">
        Bonjour, {user?.prenom} {user?.nom}
      </h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mes cours du semestre */}
        <Section title={`Mes cours (${cours.length})`}>
          <ul className="space-y-2">
            {cours.map((c: CoursEtudiant) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-blue-600 w-20 shrink-0">{c.code}</span>
                <span className="flex-1 text-gray-700 truncate">{c.nom}</span>
                <span className="text-gray-400 text-xs">{c.credits} cr.</span>
              </li>
            ))}
            {cours.length === 0 && <Empty text="Aucun cours inscrit" />}
          </ul>
        </Section>

        {/* Notes récentes */}
        <Section title="Dernières notes">
          <ul className="space-y-3">
            {notesRecentes.map((n: NoteRecente, i: number) => (
              <li key={i} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{n.evaluation_nom}</p>
                  <p className="text-xs text-gray-400">{n.cours_code} · {formatDate(n.date_saisie)}</p>
                </div>
                <NoteBadge note={n.note} />
              </li>
            ))}
            {notesRecentes.length === 0 && <Empty text="Aucune note disponible" />}
          </ul>
        </Section>
      </div>

      {/* Prochaines séances */}
      <Section title="Emploi du temps">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {prochainesSeances.map((s: Seance, i: number) => (
            <SeanceCard key={i} seance={s} />
          ))}
          {prochainesSeances.length === 0 && <Empty text="Aucune séance à venir" />}
        </div>
      </Section>

      {/* Absences */}
      {absences.length > 0 && (
        <Section title={`Absences / Retards (${absences.length})`}>
          <ul className="space-y-2">
            {absences.map((a: Absence, i: number) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  a.statut === 'absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {a.statut}
                </span>
                <span className="text-gray-600 capitalize">{a.jour_semaine} {a.heure_debut}</span>
                <span className="text-gray-400 truncate">{a.cours_code} – {a.cours_nom}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

// ── Composants UI partagés ─────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-700',
    violet:  'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
  }
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value ?? '—'}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  )
}

function TauxBadge({ taux }: { taux: number }) {
  const color = taux >= 90 ? 'text-red-600' : taux >= 70 ? 'text-amber-600' : 'text-emerald-600'
  return <span className={`font-semibold text-xs ${color}`}>{taux}%</span>
}

function CapaciteBadge({ current, max }: { current: number; max: number }) {
  const pct = Math.round((current / max) * 100)
  const color = pct >= 90 ? 'bg-red-100 text-red-700' : pct >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${color}`}>
      {current}/{max}
    </span>
  )
}

function NoteBadge({ note }: { note: number | null }) {
  if (note === null) return <span className="text-gray-400 text-sm">—</span>
  const color = note >= 14 ? 'text-emerald-600' : note >= 10 ? 'text-amber-600' : 'text-red-600'
  return <span className={`font-bold text-sm shrink-0 ${color}`}>{note}/20</span>
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

function SeanceCard({ seance }: { seance: Seance }) {
  const typeColors: Record<string, string> = {
    cours:   'bg-blue-50 text-blue-700',
    td:      'bg-violet-50 text-violet-700',
    tp:      'bg-emerald-50 text-emerald-700',
    examen:  'bg-red-50 text-red-700',
  }
  return (
    <div className="border border-gray-100 rounded-lg p-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="capitalize text-xs font-medium text-gray-500">{seance.jour_semaine}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColors[seance.type] ?? 'bg-gray-100 text-gray-600'}`}>
          {seance.type}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-800 truncate">{seance.cours_nom}</p>
      <p className="text-xs text-gray-400">{seance.heure_debut} – {seance.heure_fin}</p>
      {seance.salle_nom && (
        <p className="text-xs text-gray-400">{seance.salle_nom} · {seance.batiment}</p>
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 py-2">{text}</p>
}

function Spinner() {
  return <p className="p-6 text-gray-400">Chargement…</p>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

// ── Types locaux ───────────────────────────────────────────────────────────

interface CoursPopulaire  { code: string; nom: string; capacite_max: number; nb_inscrits: number; taux_remplissage: number }
interface DernierInscrit  { nom: string; prenom: string; filiere: string; niveau: string; numero_etudiant: string; created_at: string }
interface CoursEnseignant { id: number; code: string; nom: string; niveau: string; semestre: string; nb_inscrits: number; capacite_max: number }
interface CoursEtudiant   { id: number; code: string; nom: string; credits: number }
interface EvaluationAVenir{ id: number; nom: string; type: string; cours_code: string; date_evaluation?: string; notes_saisies: number; nb_inscrits: number }
interface NoteRecente     { evaluation_nom: string; cours_code: string; note: number | null; date_saisie: string }
interface Seance          { jour_semaine: string; heure_debut: string; heure_fin: string; type: string; cours_nom: string; salle_nom?: string; batiment?: string }
interface Absence         { statut: string; jour_semaine: string; heure_debut: string; cours_code: string; cours_nom: string }
