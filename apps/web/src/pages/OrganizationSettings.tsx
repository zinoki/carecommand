import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface AxisCareConfig {
  id: string;
  siteNumber: string;
  lastSyncAt: string | null;
}

export function OrganizationSettings() {
  const { getHeaders } = useAuth();
  const [config, setConfig] = useState<AxisCareConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteNumber, setSiteNumber] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncResult, setSyncResult] = useState<{
    applicants: number;
    caregivers: number;
    clients: number;
    leads: number;
  } | null>(null);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/integrations/axiscare`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data) {
          setSiteNumber(data.siteNumber || '');
        }
      } else {
        setConfig(null);
      }
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteNumber.trim()) return;
    if (!hasConfig && !apiToken.trim()) return;
    setSaveStatus('saving');
    try {
      const body: { siteNumber: string; apiToken?: string } = { siteNumber: siteNumber.trim() };
      if (apiToken.trim()) body.apiToken = apiToken.trim();
      const res = await fetch(`${API_URL}/api/integrations/axiscare`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setConfig(data);
      setSaveStatus('saved');
      setApiToken(''); // Clear token after save (we don't store it in state)
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleTest = async () => {
    setTestStatus('testing');
    try {
      const res = await fetch(`${API_URL}/api/integrations/axiscare/test`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection failed');
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (err: any) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    setSyncResult(null);
    try {
      const res = await fetch(`${API_URL}/api/integrations/axiscare/sync`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setSyncResult({
        applicants: data.applicants ?? 0,
        caregivers: data.caregivers ?? 0,
        clients: data.clients ?? 0,
        leads: data.leads ?? 0,
      });
      setSyncStatus('success');
      fetchConfig();
      setTimeout(() => setSyncStatus('idle'), 5000);
    } catch (err: any) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const hasConfig = !!config;
  const canSync = hasConfig;

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Organization settings</h1>
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Organization settings</h1>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="font-semibold mb-2">AxisCare integration</h2>
          <p className="text-slate-500 text-sm mb-4">
            Connect Care Command to AxisCare using a read-only API token. Data syncs one way: AxisCare → Care Command.
          </p>
          <form onSubmit={handleSave} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Site number</label>
              <input
                type="text"
                value={siteNumber}
                onChange={(e) => setSiteNumber(e.target.value)}
                placeholder="e.g. 12345"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Your AxisCare site number (used in the URL)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">API token</label>
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder={hasConfig ? '••••••••••••' : 'Enter your read-only API token'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required={!hasConfig}
              />
              <p className="text-xs text-slate-500 mt-1">
                {hasConfig ? 'Leave blank to keep existing token, or enter a new one to update.' : 'Create a read-only token in AxisCare Settings → API.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saveStatus === 'saving' || !siteNumber.trim() || (!apiToken.trim() && !hasConfig)}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save'}
              </button>
              {saveStatus === 'saved' && (
                <span className="text-green-600 text-sm py-2">Saved</span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-600 text-sm py-2">Failed to save</span>
              )}
            </div>
          </form>
          {hasConfig && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testStatus === 'testing'}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Test connection'}
                </button>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncStatus === 'syncing' || !canSync}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncStatus === 'syncing' ? 'Syncing...' : 'Sync now'}
                </button>
                {config?.lastSyncAt && (
                  <span className="text-sm text-slate-500">
                    Last sync: {new Date(config.lastSyncAt).toLocaleString()}
                  </span>
                )}
              </div>
              {testStatus === 'success' && (
                <p className="text-green-600 text-sm mt-2">Connection successful</p>
              )}
              {testStatus === 'error' && (
                <p className="text-red-600 text-sm mt-2">Connection failed. Check site number and token.</p>
              )}
              {syncStatus === 'success' && syncResult && (
                <p className="text-green-600 text-sm mt-2">
                  Synced: {syncResult.applicants} applicants, {syncResult.caregivers} caregivers,{' '}
                  {syncResult.clients} clients, {syncResult.leads} leads
                </p>
              )}
              {syncStatus === 'error' && (
                <p className="text-red-600 text-sm mt-2">Sync failed. Check the connection and try again.</p>
              )}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Branding</h2>
          <p className="text-slate-500 text-sm">Customize your agency branding</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Templates</h2>
          <p className="text-slate-500 text-sm">Onboarding and compliance templates</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">SLA rules</h2>
          <p className="text-slate-500 text-sm">Configure SLA and escalation rules</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Billing</h2>
          <p className="text-slate-500 text-sm">Stripe billing portal</p>
        </div>
      </div>
    </div>
  );
}
