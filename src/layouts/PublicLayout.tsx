import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Menu, X } from 'lucide-react';
import './PublicLayout.css';

export default function PublicLayout() {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = React.useState(false);

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/about-us', label: 'About Us' },
        { path: '/contact-us', label: 'Contact Us' },
    ];

    return (
        <div className="public-layout">
            <header className="public-header">
                <div className="container public-header-inner">
                    <Link to="/" className="public-logo">
                        <img src={theme === 'light' ? '../../../public/logo-light-mode.svg' : '../../../public/logo-dark-mode.svg'} alt="UltraCare" className="logo-img" />
                    </Link>

                    <nav className={`public-nav ${menuOpen ? 'open' : ''}`}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="nav-actions">
                            <button onClick={toggleTheme} className="btn-icon theme-toggle" aria-label="Toggle theme">
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                            <Link to="/login" className="btn btn-outline btn-sm">Log In</Link>
                            <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
                        </div>
                    </nav>

                    <button className="mobile-menu-btn btn-icon" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </header>

            <main className="public-main">
                <Outlet />
            </main>

            <footer className="public-footer">
                <div className="container public-footer-inner">
                    <div className="footer-brand">
                        <img src={theme === 'light' ? '../../../public/logo-light-mode.svg' : '../../../public/logo-dark-mode.svg'} alt="UltraCare" className="logo-img" style={{ height: 32 }} />
                        <p className="text-sm text-secondary">
                            Advanced Radiology Clinic Management System
                        </p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-col">
                            <h4>Product</h4>
                            <Link to="/">Home</Link>
                            <Link to="/about-us">About Us</Link>
                            <Link to="/contact-us">Contact Us</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Account</h4>
                            <Link to="/login">Log In</Link>
                            <Link to="/signup">Sign Up</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Contact</h4>
                            <a href="mailto:ultracare@nexeo-security.tech">ultracare@nexeo-security.tech</a>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p className="text-xs text-tertiary">&copy; {new Date().getFullYear()} UltraCare. All rights reserved.</p>
                        <p className="text-xs text-tertiary">Powered by <strong>Nexeo Security</strong></p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
