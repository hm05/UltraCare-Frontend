import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
    const [mode, setMode] = useState<'doctor' | 'staff'>('doctor');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, staffLogin } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'doctor') {
                const result = await login(email, password);
                if (result.organizationSetupRequired) {
                    navigate('/setup-organization');
                } else {
                    navigate('/dashboard');
                }
                toast.success('Welcome back!');
            } else {
                const result = await staffLogin(username, password);
                if (result.changePasswordRequired) {
                    toast('Please change your password.', { icon: '🔒' });
                }
                navigate('/dashboard');
                toast.success('Welcome back!');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <motion.div className="auth-card card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <img src={theme === 'light' ? 'https://objectstorage.ap-mumbai-1.oraclecloud.com/n/bmuzdalqtcix/b/UltraCare-assets/o/logo-light-mode.svg' : 'https://objectstorage.ap-mumbai-1.oraclecloud.com/n/bmuzdalqtcix/b/UltraCare-assets/o/logo-dark-mode.svg'} alt="UltraCare" className="logo-img" style={{ height: 40 }} />
                    </Link>
                    <h1>Welcome Back</h1>
                    <p className="text-secondary">Sign in to your account</p>
                </div>

                <div className="auth-toggle">
                    <button className={`toggle-btn ${mode === 'doctor' ? 'active' : ''}`} onClick={() => setMode('doctor')}>Doctor</button>
                    <button className={`toggle-btn ${mode === 'staff' ? 'active' : ''}`} onClick={() => setMode('staff')}>Staff</button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {mode === 'doctor' ? (
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" placeholder="doctor@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                    ) : (
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input className="form-input" placeholder="staff_username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                                    display: 'flex', alignItems: 'center', padding: 0,
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={loading}>
                        {loading ? <span className="loader" style={{ width: 20, height: 20 }}></span> : 'Sign In'}
                    </button>
                </form>
                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
                </div>
            </motion.div>
        </div>
    );
}
