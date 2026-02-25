import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('doctor' | 'staff' | 'admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, isLoading, role } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login with return URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        // Redirect to appropriate dashboard if role not allowed
        return <Navigate to={role === 'doctor' ? '/app/doctor' : '/app/staff'} replace />;
    }

    return <>{children}</>;
};

// Convenience wrapper components
export const DoctorOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ProtectedRoute allowedRoles={['doctor']}>{children}</ProtectedRoute>
);

export const StaffOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ProtectedRoute allowedRoles={['staff']}>{children}</ProtectedRoute>
);

export default ProtectedRoute;
