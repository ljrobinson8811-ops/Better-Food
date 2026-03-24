import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function PageNotFound() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
              Better Food
            </p>
            <h1 className="text-6xl font-semibold text-slate-900">404</h1>
            <p className="text-lg font-medium text-slate-800">Page not found</p>
            <p className="text-sm leading-6 text-slate-600 break-all">
              No route exists for <span className="font-semibold">{location.pathname}</span>.
            </p>
          </div>

          {user?.role === 'admin' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
              <p className="text-sm font-semibold text-amber-800">Admin note</p>
              <p className="mt-1 text-sm text-amber-700">
                This route exists in navigation flow but does not currently map to a valid screen,
                or the screen import/export is broken.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Go home
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}