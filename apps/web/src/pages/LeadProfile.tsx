import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { AxisCareDataDisplay } from '../components/AxisCareDataDisplay';

const API_URL = import.meta.env.VITE_API_URL || '';
const STAGES = ['Lead', 'Assessment', 'Matching', 'Matched', 'OnHold', 'Offboarding', 'Offboarded'];

export function LeadProfile() {
  const { id } = useParams();
  const { getHeaders } = useAuth();
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/clients/${id}`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!id,
  });

  const stageMutation = useMutation({
    mutationFn: async (stage: string) => {
      const res = await fetch(`${API_URL}/api/clients/${id}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  if (isLoading || !lead) return <div>Loading...</div>;

  const rawData = (lead.rawData || {}) as Record<string, unknown>;
  const currentStage = lead.clientPipelineStage || 'Lead';

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
            {lead.address && (
              <div className="sm:col-span-2">
                <span className="text-xs text-slate-500 uppercase">Address</span>
                <p className="text-slate-800">{lead.address}</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Stage</h2>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((stage) => (
              <button
                key={stage}
                onClick={() => stageMutation.mutate(stage)}
                disabled={stageMutation.isPending || stage === currentStage}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  stage === currentStage
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
        {lead.axisCareId && (
          <AxisCareDataDisplay data={rawData} title="Full AxisCare data" />
        )}
      </div>
    </div>
  );
}
