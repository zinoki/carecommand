import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';

export function Compliance() {
  const { getHeaders } = useAuth();

  const { data: _items = [], isLoading } = useQuery({
    queryKey: ['compliance'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/compliance`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Compliance</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Expiring soon</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <p className="text-slate-500">No expiring items</p>
          )}
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Overdue</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <p className="text-slate-500">No overdue items</p>
          )}
        </div>
      </div>
    </div>
  );
}
