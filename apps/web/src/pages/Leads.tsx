import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';
const STAGES = ['Lead', 'Assessment', 'Matching', 'Matched', 'OnHold', 'Offboarding', 'Offboarded'];

export function Leads() {
  const { getHeaders } = useAuth();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/clients?type=lead`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const byStage = STAGES.reduce((acc, s) => ({ ...acc, [s]: [] }), {} as Record<string, any[]>);
  leads.forEach((l: any) => {
    const stage = l.clientPipelineStage || 'Lead';
    if (byStage[stage]) byStage[stage].push(l);
    else byStage['Lead'].push(l);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lead pipeline</h1>
        <Link
          to="/app/leads/new"
          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 font-medium"
        >
          Add lead
        </Link>
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className="flex-shrink-0 w-64 bg-slate-100 rounded-lg p-4"
            >
              <h3 className="font-semibold mb-3">{stage}</h3>
              <div className="space-y-2">
                {(byStage[stage] || []).map((l: any) => (
                  <Link
                    key={l.id}
                    to={`/app/leads/${l.id}`}
                    className="block bg-white p-3 rounded border hover:border-sky-500"
                  >
                    <div className="flex justify-between items-start">
                      <span>{l.firstName} {l.lastName}</span>
                      {l.axisCareId && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-1 rounded">AxisCare</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
