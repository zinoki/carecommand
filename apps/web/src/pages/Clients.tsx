import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';

export function Clients() {
  const { getHeaders } = useAuth();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/axiscare-entities/clients`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clients</h1>
      <p className="text-slate-500 mb-4">Clients synced from AxisCare (read-only)</p>
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
                <th className="text-left px-4 py-3">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: { id: string; firstName: string; lastName: string; email?: string; phone?: string; status: string }) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">
                    {c.firstName} {c.lastName}
                  </td>
                  <td className="px-4 py-3">{c.email || '-'}</td>
                  <td className="px-4 py-3">{c.phone || '-'}</td>
                  <td className="px-4 py-3">{c.status}</td>
                  <td className="px-4 py-3">
                    <Link to={`/app/clients/${c.id}`} className="text-sky-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <p className="p-8 text-center text-slate-500">No clients yet. Sync from AxisCare in Organization settings.</p>
          )}
        </div>
      )}
    </div>
  );
}
