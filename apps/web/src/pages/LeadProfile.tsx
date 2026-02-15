import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { AxisCareDataDisplay } from '../components/AxisCareDataDisplay';

const API_URL = import.meta.env.VITE_API_URL || '';

export function LeadProfile() {
  const { id } = useParams();
  const { getHeaders } = useAuth();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/axiscare-entities/leads/${id}`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading || !lead) return <div>Loading...</div>;

  const rawData = (lead.rawData || {}) as Record<string, unknown>;

  return (
    <div>
      <Link to="/app/leads" className="text-sky-600 hover:underline mb-4 inline-block">
        Back to leads
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        {lead.firstName} {lead.lastName}
      </h1>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Contact</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-500 uppercase">Email</span>
              <p className="text-slate-800">{lead.email || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Phone</span>
              <p className="text-slate-800">{lead.phone || '—'}</p>
            </div>
          </div>
        </div>
        <AxisCareDataDisplay data={rawData} title="Full AxisCare data" />
      </div>
    </div>
  );
}
