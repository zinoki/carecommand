import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || '';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  birthday: '',
  city: '',
  hca: '',
  expectedAvailabilityStart: '',
  referrerName: '',
  referrerRelationship: '',
  referrerEmail: '',
  referenceNotes: '',
};

const GENDERS = ['', 'Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];

function isValidEmail(email: string): boolean {
  if (!email.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AddCandidate() {
  const { getHeaders } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: async ({ data, file }: { data: typeof initialForm; file: File | null }) => {
      const fd = new FormData();
      fd.append('type', 'Candidate');
      fd.append('firstName', data.firstName.trim());
      fd.append('lastName', data.lastName.trim());
      fd.append('email', data.email.trim());
      fd.append('phone', data.phone.trim());
      if (data.gender) fd.append('gender', data.gender);
      if (data.birthday) fd.append('birthday', data.birthday);
      if (data.city) fd.append('city', data.city);
      if (data.hca) fd.append('hca', data.hca);
      if (data.expectedAvailabilityStart) fd.append('expectedAvailabilityStart', data.expectedAvailabilityStart);
      if (data.referrerName) fd.append('referrerName', data.referrerName);
      if (data.referrerRelationship) fd.append('referrerRelationship', data.referrerRelationship);
      if (data.referrerEmail) fd.append('referrerEmail', data.referrerEmail);
      if (data.referenceNotes) fd.append('referenceNotes', data.referenceNotes);
      if (file) fd.append('resume', file);
      const headers = getHeaders();
      const res = await fetch(`${API_URL}/api/persons`, {
        method: 'POST',
        headers: { ...headers } as HeadersInit,
        credentials: 'include',
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add applicant');
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      navigate(`/app/recruiting/${data.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!form.lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!form.phone.trim()) {
      setError('Phone is required');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (form.phone.length > 50) {
      setError('Phone must be 50 characters or less');
      return;
    }
    createMutation.mutate({ data: form, file: resumeFile });
  };

  return (
    <div>
      <Link to="/app/recruiting" className="text-sky-600 hover:underline mb-4 inline-block">
        ← Back to recruiting
      </Link>
      <h1 className="text-2xl font-bold mb-6">Add applicant</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First name *</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last name *</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              maxLength={50}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {GENDERS.map((g) => (
                <option key={g || 'empty'} value={g}>{g || '—'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Birthday</label>
            <input
              type="date"
              value={form.birthday}
              onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">HCA</label>
            <input
              type="text"
              value={form.hca}
              onChange={(e) => setForm((f) => ({ ...f, hca: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Expected Availability Start</label>
          <input
            type="date"
            value={form.expectedAvailabilityStart}
            onChange={(e) => setForm((f) => ({ ...f, expectedAvailabilityStart: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg max-w-xs"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Resume (optional)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            className="w-full px-3 py-2 border rounded-lg file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-sky-50 file:text-sky-700"
          />
        </div>
        <div className="border-t pt-4 mt-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Reference</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Referrer Name</label>
                <input
                  type="text"
                  value={form.referrerName}
                  onChange={(e) => setForm((f) => ({ ...f, referrerName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Referrer Relationship</label>
                <input
                  type="text"
                  value={form.referrerRelationship}
                  onChange={(e) => setForm((f) => ({ ...f, referrerRelationship: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Referrer Email</label>
              <input
                type="email"
                value={form.referrerEmail}
                onChange={(e) => setForm((f) => ({ ...f, referrerEmail: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg max-w-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes about the Reference</label>
              <textarea
                value={form.referenceNotes}
                onChange={(e) => setForm((f) => ({ ...f, referenceNotes: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2 pt-4">
          <Link
            to="/app/recruiting"
            className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Adding...' : 'Add applicant'}
          </button>
        </div>
      </form>
    </div>
  );
}
