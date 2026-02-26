import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    LayoutDashboard, Search, FilePlus, DollarSign, Users,
    Building2, Sun, Moon, LogOut, ChevronRight, Activity
} from 'lucide-react';
import './AppLayout.css';

export default function AppLayout() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const isDoctor = user?.role === 'doctor' || user?.role === 'admin';
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const doctorLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/search', label: 'Search Case', icon: Search },
        { path: '/create-case', label: 'Create Case', icon: FilePlus },
        { path: '/collection', label: 'Collection Data', icon: DollarSign },
        { path: '/referrals', label: 'Referral Data', icon: Users },
        { path: '/logs', label: 'Activity Logs', icon: Activity },
        { path: '/settings', label: 'Organisation', icon: Building2 },
    ];

    const staffLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/search', label: 'Search Case', icon: Search },
        { path: '/create-case', label: 'Create Case', icon: FilePlus },
    ];

    const links = isDoctor ? doctorLinks : staffLinks;

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Link to="/dashboard" className="sidebar-logo">
                        <img
                            src={sidebarCollapsed ? `/icon-${theme}-mode.svg` : `/logo-${theme}-mode.svg`}
                            alt="UltraCare"
                            className="logo-img"
                            style={{
                                height: sidebarCollapsed ? '32px' : '40px',
                                transition: 'all 0.2s ease-in-out'
                            }}
                        />
                    </Link>
                    <button
                        className="btn-icon sidebar-collapse-btn"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    >
                        <ChevronRight size={16} style={{ transform: sidebarCollapsed ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={20} />
                                {!sidebarCollapsed && <span>{link.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={toggleTheme} className="sidebar-link">
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        {!sidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
                    </button>
                    <button onClick={handleLogout} className="sidebar-link sidebar-logout">
                        <LogOut size={20} />
                        {!sidebarCollapsed && <span>Log Out</span>}
                    </button>
                </div>
            </aside>

            <div className="app-content">
                <header className="app-header">
                    <div className="app-header-left">
                        <h1 className="page-title">
                            {links.find((l) => l.path === location.pathname)?.label || 'UltraCare'}
                        </h1>
                    </div>
                    <div className="app-header-right">
                        <div className="user-info">
                            <div className="user-avatar">
                                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            </div>
                            {<span className="user-name">
                                {user?.firstName} {user?.lastName}
                            </span>}
                            <span className="badge badge-primary">{user?.role}</span>
                        </div>
                    </div>
                </header>

                <main className="app-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
