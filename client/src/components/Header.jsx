import { Link, NavLink } from 'react-router-dom';

export default function Header({ isAdmin }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to={isAdmin ? '/admin' : '/'} className="wordmark">
          Cynbit{isAdmin && <span className="wordmark-tag">Inquiries</span>}
        </Link>
        {!isAdmin && (
          <nav aria-label="Main">
            <NavLink to="/" end>Services</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}
