/**
 * Displays ALL AxisCare rawData in a readable, formatted layout.
 * Recursively shows every field including nested objects and arrays.
 */
interface AxisCareDataDisplayProps {
  data: Record<string, unknown> | null | undefined;
  title?: string;
  className?: string;
}

function formatPrimitive(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-slate-400">—</span>;
  if (value === '') return <span className="text-slate-400">(empty)</span>;
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

function DataRow({
  label,
  value,
  depth = 0,
}: {
  label: string;
  value: unknown;
  depth?: number;
}) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const entries = Object.entries(obj);
    if (entries.length === 0) {
      return (
        <div className={depth > 0 ? 'ml-4 mt-1' : ''}>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{humanize(label)}</span>
          <span className="text-slate-400 ml-2">(empty object)</span>
        </div>
      );
    }
    return (
      <div className={depth > 0 ? 'ml-4 mt-2 border-l-2 border-slate-100 pl-3' : ''}>
        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide block mb-1">{humanize(label)}</span>
        <div className="space-y-1">
          {entries.map(([k, v]) => (
            <DataRow key={k} label={k} value={v} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className={depth > 0 ? 'ml-4 mt-1' : ''}>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{humanize(label)}</span>
          <span className="text-slate-400 ml-2">(empty)</span>
        </div>
      );
    }
    return (
      <div className={depth > 0 ? 'ml-4 mt-2 border-l-2 border-slate-100 pl-3' : ''}>
        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide block mb-1">{humanize(label)}</span>
        <div className="space-y-2">
          {value.map((item, i) => (
            <div key={i} className="p-2 bg-slate-50 rounded">
              {typeof item === 'object' && item !== null && !Array.isArray(item) ? (
                Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                  <DataRow key={k} label={k} value={v} depth={0} />
                ))
              ) : (
                <DataRow label={`[${i}]`} value={item} depth={0} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-w-0 py-1">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{humanize(label)}</span>
      <span className="text-slate-800 mt-0.5 break-words">{formatPrimitive(value)}</span>
    </div>
  );
}

export function AxisCareDataDisplay({ data, title = 'AxisCare data', className = '' }: AxisCareDataDisplayProps) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const entries = Object.entries(data);
  if (entries.length === 0) {
    return (
      <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
        <div className="px-4 py-3 bg-slate-50 border-b">
          <h3 className="font-semibold text-slate-700">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Synced from AxisCare (read-only)</p>
        </div>
        <div className="p-4">
          <p className="text-slate-500">No data available yet. Re-sync from Organization settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      <div className="px-4 py-3 bg-slate-50 border-b">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">All data synced from AxisCare (read-only)</p>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <DataRow key={key} label={key} value={value} />
          ))}
        </div>
      </div>
    </div>
  );
}
