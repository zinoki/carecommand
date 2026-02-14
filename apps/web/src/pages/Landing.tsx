import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white">
      <nav className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-semibold">CareCommand</span>
        <div className="flex gap-4">
          <Link to="/pricing" className="text-slate-300 hover:text-white">
            Pricing
          </Link>
          <Link to="/login" className="text-slate-300 hover:text-white">
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-sky-600 rounded-lg hover:bg-sky-500 font-medium"
          >
            Get started
          </Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Home care agency management, simplified
        </h1>
        <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
          Recruit, onboard, and manage caregivers with compliance tracking, AxisCare sync, and HIPAA-ready security.
        </p>
        <Link
          to="/signup"
          className="inline-block px-8 py-4 bg-sky-600 rounded-xl hover:bg-sky-500 font-semibold text-lg"
        >
          Start free trial
        </Link>
      </main>
    </div>
  );
}
