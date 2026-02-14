import { Link } from 'react-router-dom';

export function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex justify-between items-center px-6 py-4 bg-white border-b">
        <Link to="/" className="text-xl font-semibold text-slate-900">
          CareCommand
        </Link>
        <div className="flex gap-4">
          <Link to="/login" className="text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500"
          >
            Get started
          </Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-center mb-12">Pricing</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Free</h2>
            <p className="text-3xl font-bold mb-4">$0<span className="text-lg font-normal text-slate-500">/mo</span></p>
            <p className="text-slate-600 mb-6">Full access for testing and internal use.</p>
            <ul className="space-y-2 mb-6 text-sm">
              <li>Unlimited caregivers</li>
              <li>Recruiting pipeline</li>
              <li>Onboarding & compliance</li>
              <li>AxisCare integration</li>
            </ul>
            <Link
              to="/signup"
              className="block w-full py-2 text-center border rounded-lg hover:bg-slate-50"
            >
              Get started
            </Link>
          </div>
          <div className="bg-white rounded-xl border-2 border-sky-500 p-6 shadow-sm relative">
            <span className="absolute -top-3 left-4 px-2 py-0.5 bg-sky-500 text-white text-xs rounded">
              Coming soon
            </span>
            <h2 className="text-xl font-semibold mb-2">Starter</h2>
            <p className="text-3xl font-bold mb-4">TBD</p>
            <p className="text-slate-600 mb-6">For small agencies.</p>
            <ul className="space-y-2 mb-6 text-sm text-slate-500">
              <li>Per active caregiver billing</li>
              <li>Priority support</li>
            </ul>
            <button disabled className="block w-full py-2 text-center border rounded-lg text-slate-400 cursor-not-allowed">
              Coming soon
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
