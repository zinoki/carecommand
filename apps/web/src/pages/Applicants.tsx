import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';

export function Applicants() {
  const { getHeaders } = useAuth();

  const { data: applicants = [], isLoading } = useQuery({
    queryKey: ['applicants'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/axiscare-entities/applicants`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Applicants</h1>
      <p className="text-slate-500 mb-4">Applicants synced from AxisCare (read-only)</p>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((a: { id: string; firstName: string; lastName: string; email?: string; phone?: string }) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3">
                    {a.firstName} {a.lastName}
                  </td>
                  <td className="px-4 py-3">{a.email || '-'}</td>
                  <td className="px-4 py-3">{a.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <Link to={`/app/applicants/${a.id}`} className="text-sky-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {applicants.length === 0 && (
            <p className="p-8 text-center text-slate-500">No applicants yet. Sync from AxisCare in Organization settings.</p>
          )}
        </div>
      )}
    </div>
  );
}
