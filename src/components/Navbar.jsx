import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Car, Search, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon-wrapper">
            <ShieldAlert size={24} className="brand-icon" />
          </div>
          <span className="brand-text">Traffic<span className="brand-highlight">Watch</span></span>
        </Link>

        {/* Desktop Menu */}
        <nav className="navbar-nav desktop-nav">
          <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
          <Link to="/report" className={`nav-link ${isActive('/report')}`}>
            <Car size={18} />
            Report Violation
          </Link>
          <Link to="/fines" className={`nav-link ${isActive('/fines')}`}>
            <Search size={18} />
            Check Fines
          </Link>
          <Link to="/admin" className={`nav-link admin-link ${isActive('/admin')}`}>Admin</Link>
        </nav>

        {/* Mobile Toggle */}
        <button className="mobile-toggle" onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="mobile-menu animate-fade-in">
          <div className="container">
            <Link to="/" className={`mobile-nav-link ${isActive('/')}`} onClick={toggleMenu}>Home</Link>
            <Link to="/report" className={`mobile-nav-link ${isActive('/report')}`} onClick={toggleMenu}>
              <Car size={18} /> Report Violation
            </Link>
            <Link to="/fines" className={`mobile-nav-link ${isActive('/fines')}`} onClick={toggleMenu}>
              <Search size={18} /> Check Fines
            </Link>
            <Link to="/admin" className={`mobile-nav-link admin-link ${isActive('/admin')}`} onClick={toggleMenu}>
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
