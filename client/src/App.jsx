import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Services from './pages/Services.jsx';
import Contact from './pages/Contact.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const isAdmin = useLocation().pathname.startsWith('/admin');

  return (
    <div className="app">
      <p className="demo-banner">
        Prototype built for Cynbit’s internship task. This is not the official cynbit.in site.
      </p>
      <Header isAdmin={isAdmin} />
      <main id="main">
        <Routes>
          <Route path="/" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}
