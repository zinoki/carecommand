import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';
const STAGES = ['Interview', 'ManagerReview', 'Onboarding', 'Ready', 'OnHold', 'Offboarding', 'Offboarded'];

export function CandidateProfile() {
  const { id } = useParams();
  const { getHeaders } = useAuth();
  const queryClient = useQueryClient();

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

  const stageMutation = useMutation({
    mutationFn: async (stage: string) => {
      const res = await fetch(`${API_URL}/api/recruiting/${id}/stage`, {
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
      queryClient.invalidateQueries({ queryKey: ['person', id] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });

  if (isLoading || !person) return <div>Loading...</div>;

  const recruiting = person.personRecruiting || {};
  const currentStage = recruiting.stage || 'Interview';

  return (
    <div>
      <Link to="/app/recruiting" className="text-sky-600 hover:underline mb-4 inline-block">
        Back to recruiting
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        {person.firstName} {person.lastName}
      </h1>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Contact</h2>
          <p>Email: {person.email || '-'}</p>
          <p>Phone: {person.phone || '-'}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Pipeline stage</h2>
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
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Interview</h2>
          <p className="text-slate-600 whitespace-pre-wrap">
            {recruiting.interviewNotes || 'No notes yet'}
          </p>
        </div>
      </div>
    </div>
  );
}
