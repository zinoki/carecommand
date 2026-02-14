import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';
const TABS = ['Active', 'Ineligible', 'Offboarded', 'Blacklisted'] as const;

export function Caregivers() {
  const { getHeaders } = useAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Active');

  const statusMap: Record<(typeof TABS)[number], string> = {
    Active: 'Active',
    Ineligible: 'Ineligible',
    Offboarded: 'Quit,Fired,OnLeave,Other',
    Blacklisted: 'Blacklisted',
  };

  const { data: persons = [], isLoading } = useQuery({
    queryKey: ['caregivers', tab],
    queryFn: async () => {
      const statuses = statusMap[tab].split(',');
      const res = await fetch(
        `${API_URL}/api/persons?type=Caregiver&status=${statuses.join(',')}`,
        { headers: getHeaders(), credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Caregivers</h1>
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === t ? 'bg-sky-600 text-white' : 'bg-white border text-slate-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {persons.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="px-4 py-3">{p.email || '-'}</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/app/caregivers/${p.id}`}
                      className="text-sky-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {persons.length === 0 && (
            <p className="p-8 text-center text-slate-500">No caregivers in this category</p>
          )}
        </div>
      )}
    </div>
  );
}
