import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';

export function Leads() {
  const { getHeaders } = useAuth();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/axiscare-entities/leads`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Leads</h1>
      <p className="text-slate-500 mb-4">Leads synced from AxisCare (read-only)</p>
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
              {leads.map((l: { id: string; firstName: string; lastName: string; email?: string; phone?: string }) => (
                <tr key={l.id} className="border-t">
                  <td className="px-4 py-3">
                    {l.firstName} {l.lastName}
                  </td>
                  <td className="px-4 py-3">{l.email || '-'}</td>
                  <td className="px-4 py-3">{l.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <Link to={`/app/leads/${l.id}`} className="text-sky-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && (
            <p className="p-8 text-center text-slate-500">No leads yet. Sync from AxisCare in Organization settings.</p>
          )}
        </div>
      )}
    </div>
  );
}
