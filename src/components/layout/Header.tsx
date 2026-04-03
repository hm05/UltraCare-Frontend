import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
    const { user, role } = useAuth();

    const getInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
        }
        return user?.email?.[0]?.toUpperCase() || 'U';
    };

    return (
        <header className="app-header">
            <div className="header-left">
                <div className="page-info">
                    <h1 className="page-title">{title}</h1>
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                </div>
            </div>

            <div className="header-right">
                <div className="search-container">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search patients, reports..."
                        className="search-input"
                    />
                </div>

                <button className="notification-btn">
                    <Bell size={20} />
                    <span className="notification-badge"></span>
                </button>

                <div className="header-user">
                    <div className="header-avatar">{getInitials()}</div>
                    <div className="header-user-info">
                        <span className="header-user-name">
                            {user?.firstName
                                ? `${role === 'doctor' ? 'Dr. ' : ''}${user.firstName}`
                                : user?.email}
                        </span>
                        <span className="header-user-role">{role === 'doctor' ? 'Doctor' : 'Staff'}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
