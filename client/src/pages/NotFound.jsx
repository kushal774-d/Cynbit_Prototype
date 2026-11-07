import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container narrow page-pad">
      <h1>Page not found</h1>
      <p className="muted">The link may be old or mistyped.</p>
      <Link to="/" className="btn">Go to services</Link>
    </div>
  );
}
