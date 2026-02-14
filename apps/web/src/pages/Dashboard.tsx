import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';

export function Dashboard() {
  const { getHeaders } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [tasksRes, personsRes] = await Promise.all([
        fetch(`${API_URL}/api/tasks?filter=due`, { headers: getHeaders(), credentials: 'include' }),
        fetch(`${API_URL}/api/persons?type=Caregiver`, { headers: getHeaders(), credentials: 'include' }),
      ]);
      const tasks = tasksRes.ok ? await tasksRes.json() : [];
      const persons = personsRes.ok ? await personsRes.json() : [];
      const ineligible = persons.filter((p: any) => p.status === 'Ineligible');
      const overdue = tasks.filter((t: any) => new Date(t.dueAt) < new Date() && t.status !== 'completed');
      const dueToday = tasks.filter((t: any) => {
        const d = new Date(t.dueAt);
        const today = new Date();
        return d.toDateString() === today.toDateString() && t.status !== 'completed';
      });
      return { overdue: overdue.length, dueToday: dueToday.length, ineligible: ineligible.length, totalCaregivers: persons.length };
    },
  });

  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm text-slate-500 mb-1">Tasks overdue</h3>
          <p className="text-2xl font-bold text-red-600">{stats?.overdue ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm text-slate-500 mb-1">Due today</h3>
          <p className="text-2xl font-bold">{stats?.dueToday ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm text-slate-500 mb-1">Ineligible caregivers</h3>
          <p className="text-2xl font-bold text-amber-600">{stats?.ineligible ?? 0}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold mb-2">Quick stats</h2>
        <p className="text-slate-600">Total active caregivers: {stats?.totalCaregivers ?? 0}</p>
      </div>
    </div>
  );
}
