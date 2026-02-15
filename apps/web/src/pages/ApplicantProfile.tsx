import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { AxisCareDataDisplay } from '../components/AxisCareDataDisplay';

const API_URL = import.meta.env.VITE_API_URL || '';

export function ApplicantProfile() {
  const { id } = useParams();
  const { getHeaders } = useAuth();

  const { data: applicant, isLoading } = useQuery({
    queryKey: ['applicant', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/axiscare-entities/applicants/${id}`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading || !applicant) return <div>Loading...</div>;

  const rawData = (applicant.rawData || {}) as Record<string, unknown>;

  return (
    <div>
      <Link to="/app/applicants" className="text-sky-600 hover:underline mb-4 inline-block">
        Back to applicants
      </Link>
      <h1 className="text-2xl font-bold mb-6">
        {applicant.firstName} {applicant.lastName}
      </h1>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Contact</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-500 uppercase">Email</span>
              <p className="text-slate-800">{applicant.email || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase">Phone</span>
              <p className="text-slate-800">{applicant.phone || '—'}</p>
            </div>
          </div>
        </div>
        <AxisCareDataDisplay data={rawData} title="Full AxisCare data" />
      </div>
    </div>
  );
}
