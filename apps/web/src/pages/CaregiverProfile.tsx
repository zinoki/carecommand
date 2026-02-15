import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { AxisCareDataDisplay } from '../components/AxisCareDataDisplay';

const API_URL = import.meta.env.VITE_API_URL || '';

export function CaregiverProfile() {
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

  const rawData = (person.axisCareMapping?.rawData || {}) as Record<string, unknown>;
  const episode = person.episodes?.[0];

  return (
    <div>
      <Link to="/app/caregivers" className="text-sky-600 hover:underline mb-4 inline-block">
        Back to caregivers
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        {person.firstName} {person.lastName}
      </h1>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Contact</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-500 uppercase">Email</span>
              <p className="text-slate-800">{person.email || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Phone</span>
              <p className="text-slate-800">{person.phone || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Status</span>
              <p className="text-slate-800">{episode?.lifecycleStatus || '—'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Requirements</h2>
          <p className="text-slate-500">No requirements yet</p>
        </div>
        <AxisCareDataDisplay data={rawData} title="Full AxisCare data" />
      </div>
    </div>
  );
}
