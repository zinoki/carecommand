export function OrganizationSettings() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Organization settings</h1>
      <div className="space-y-4">
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
          <h2 className="font-semibold mb-2">Integrations</h2>
          <p className="text-slate-500 text-sm">AxisCare and other integrations</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Billing</h2>
          <p className="text-slate-500 text-sm">Stripe billing portal</p>
        </div>
      </div>
    </div>
  );
}
