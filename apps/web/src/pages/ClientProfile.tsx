import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { AxisCareDataDisplay } from '../components/AxisCareDataDisplay';

const API_URL = import.meta.env.VITE_API_URL || '';

export function ClientProfile() {
  const { id } = useParams();
  const { getHeaders } = useAuth();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/axiscare-entities/clients/${id}`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading || !client) return <div>Loading...</div>;

  const rawData = (client.rawData || {}) as Record<string, unknown>;

  return (
    <div>
      <Link to="/app/clients" className="text-sky-600 hover:underline mb-4 inline-block">
        Back to clients
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        {client.firstName} {client.lastName}
      </h1>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Contact</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-500 uppercase">Email</span>
              <p className="text-slate-800">{client.email || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Phone</span>
              <p className="text-slate-800">{client.phone || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Address</span>
              <p className="text-slate-800">{client.address || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Status</span>
              <p className="text-slate-800">{client.status || '—'}</p>
            </div>
          </div>
        </div>
        <AxisCareDataDisplay data={rawData} title="Full AxisCare data" />
      </div>
    </div>
  );
}
