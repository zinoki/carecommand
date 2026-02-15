/**
 * Displays AxisCare rawData in a readable, formatted layout.
 * Handles nested objects, arrays, and skips internal keys.
 */
interface AxisCareDataDisplayProps {
  data: Record<string, unknown> | null | undefined;
  title?: string;
  className?: string;
}

function formatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-slate-400">—</span>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (obj.label && typeof obj.label === 'string') return obj.label;
    if (obj.name && typeof obj.name === 'string') return obj.name;
  }
  return String(value);
}

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
}

const SKIP_KEYS = new Set(['responsibleParties']);

export function AxisCareDataDisplay({ data, title = 'AxisCare details', className = '' }: AxisCareDataDisplayProps) {
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return null;
  }

  const sections: { label: string; items: [string, unknown][] }[] = [];
  const mainItems: [string, unknown][] = [];
  const nestedKeys = ['status', 'residentialAddress', 'referredBy', 'classes', 'administrators'];

  for (const [key, value] of Object.entries(data)) {
    if (SKIP_KEYS.has(key)) continue;
    if (value === null || value === undefined || value === '') continue;
    if (nestedKeys.includes(key) && typeof value === 'object' && value !== null) {
      sections.push({ label: humanize(key), items: Object.entries(value as Record<string, unknown>) });
    } else if (Array.isArray(value) && value.length > 0) {
      sections.push({ label: humanize(key), items: value.map((v, i) => [`[${i}]`, v]) });
    } else {
      mainItems.push([key, value]);
    }
  }

  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      <div className="px-4 py-3 bg-slate-50 border-b">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">Synced from AxisCare (read-only)</p>
      </div>
      <div className="p-4 space-y-4">
        {mainItems.length > 0 && (
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {mainItems.map(([key, value]) => (
              <div key={key} className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{humanize(key)}</span>
                <span className="text-slate-800 mt-0.5 break-words">{formatValue(value)}</span>
              </div>
            ))}
          </div>
        )}
        {sections.map(({ label, items }) => (
          <div key={label} className="pt-3 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-600 mb-2">{label}</h4>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {items.map(([key, value]) => (
                <div key={key} className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{humanize(key)}</span>
                  <span className="text-slate-800 mt-0.5 break-words">{formatValue(value)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Array.isArray(data.responsibleParties) && data.responsibleParties.length > 0 ? (
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-600 mb-2">Responsible parties</h4>
            <div className="space-y-2">
              {(data.responsibleParties as Record<string, unknown>[]).map((rp, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm">
                  {typeof rp === 'object' && rp !== null && Object.entries(rp)
                    .filter(([k, v]) => v != null && v !== '' && !['id', 'listNumber'].includes(k))
                    .map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-slate-500 min-w-[100px]">{humanize(k)}:</span>
                        <span>{formatValue(v)}</span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
