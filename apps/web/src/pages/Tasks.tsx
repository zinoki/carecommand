import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';

export function Tasks() {
  const { getHeaders } = useAuth();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/tasks`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Due</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t: any) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3">{new Date(t.dueAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <p className="p-8 text-center text-slate-500">No tasks</p>
          )}
        </div>
      )}
    </div>
  );
}
