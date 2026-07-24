import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4 text-center">
      <div className="max-w-md animate-scale-in">
        <div className="text-9xl font-extrabold gradient-text font-display mb-4">404</div>
        <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The page you are looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <Link to="/" className="btn-primary py-3 px-8">
          Go back home
        </Link>
      </div>
    </div>
  );
}
