import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';
const STAGES = ['Applied', 'Screening', 'Interviewing', 'Offered'];

export function Recruiting() {
  const { getHeaders } = useAuth();

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/persons?type=Candidate`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const byStage = STAGES.reduce((acc, s) => ({ ...acc, [s]: [] }), {} as Record<string, any[]>);
  candidates.forEach((c: any) => {
    const stage = c.personRecruiting?.stage || 'Applied';
    if (byStage[stage]) byStage[stage].push(c);
    else byStage['Applied'].push(c);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recruiting pipeline</h1>
        <Link
          to="/app/recruiting/new"
          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 font-medium"
        >
          Add candidate
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
                {(byStage[stage] || []).map((c: any) => (
                  <Link
                    key={c.id}
                    to={`/app/recruiting/${c.id}`}
                    className="block bg-white p-3 rounded border hover:border-sky-500"
                  >
                    {c.firstName} {c.lastName}
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
