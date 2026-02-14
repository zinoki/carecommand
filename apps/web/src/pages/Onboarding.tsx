import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';

export function Onboarding() {
  const { id } = useParams();
  const { getHeaders } = useAuth();

  const { data: person, isLoading } = useQuery({
    queryKey: ['person', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/persons/${id}`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading || !person) return <div>Loading...</div>;

  const requirements = person.personRequirements || [];

  return (
    <div>
      <Link to="/app/caregivers" className="text-sky-600 hover:underline mb-4 inline-block">
        Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        Onboarding: {person.firstName} {person.lastName}
      </h1>
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold mb-4">Checklist</h2>
        {requirements.length === 0 ? (
          <p className="text-slate-500">No onboarding requirements configured</p>
        ) : (
          <ul className="space-y-2">
            {requirements.map((r: any) => (
              <li key={r.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={r.status === 'Complete'}
                  readOnly
                  className="rounded"
                />
                <span>{r.templateItem?.name || 'Requirement'}</span>
                <span className="text-slate-500 text-sm">({r.status})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
