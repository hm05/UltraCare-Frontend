import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    LogOut,
    DollarSign,
    UserPlus,
    Stethoscope
} from 'lucide-react';
import './Sidebar.css';

const Sidebar: React.FC = () => {
    const { user, role, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const doctorLinks = [
        { to: '/app/doctor', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/app/doctor/cases', icon: FileText, label: 'Daily Cases' },
        { to: '/app/doctor/collection', icon: DollarSign, label: 'Collection' },
        { to: '/app/doctor/referrals', icon: Stethoscope, label: 'Referrals' },
        { to: '/app/doctor/settings', icon: Settings, label: 'Settings' },
    ];

    const staffLinks = [
        { to: '/app/staff', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { to: '/app/staff/create-case', icon: UserPlus, label: 'Create Case' },
        { to: '/app/staff/patients', icon: Users, label: 'Patients' },
    ];

    const links = role === 'doctor' ? doctorLinks : staffLinks;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <span className="logo-icon">U</span>
                    <span className="logo-text">UltraCare</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? 'active' : ''}`
                        }
                    >
                        <link.icon size={20} />
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-details">
                        <span className="user-name">
                            {user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user?.email}
                        </span>
                        <span className="user-role">{role === 'doctor' ? 'Doctor' : 'Staff'}</span>
                    </div>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
