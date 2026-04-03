import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Signup() {
    const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { register } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await register({
                email: form.email,
                password: form.password,
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone || undefined,
            });
            navigate('/login');
        } catch (err: any) {
            const apiError = err.response?.data;
            const passwordMessage =
                apiError?.details?.password?.[0] ||
                apiError?.details?.password?.[0]?.message;
            const message =
                passwordMessage ||
                (typeof apiError?.error === 'string' ? apiError.error : null) ||
                'Registration failed';
            // Show specific password error when password is too short
            if (passwordMessage) {
                toast.error(passwordMessage);
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const update = (key: string, val: string) => setForm({ ...form, [key]: val });

    return (
        <div className="auth-page">
            <motion.div className="auth-card card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <img src={theme === 'light' ? '../../../public/logo-light-mode.svg' : '../../../public/logo-dark-mode.svg'} alt="UltraCare" className="logo-img" style={{ height: 40 }} />
                    </Link>
                    <h1>Create Account</h1>
                    <p className="text-secondary">Register as a doctor to get started</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">First Name</label>
                            <input className="form-input" placeholder="John" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name</label>
                            <input className="form-input" placeholder="Doe" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" placeholder="doctor@clinic.com" value={form.email} onChange={(e) => update('email', e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone (Optional)</label>
                        <input className="form-input" placeholder="+91 99999 99999" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-with-icon">
                                <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={(e) => update('password', e.target.value)} required />
                                <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <div className="input-with-icon">
                                <input className="form-input" type={showConfirm ? 'text' : 'password'} placeholder="Confirm Password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />
                                <button type="button" className="input-icon-btn" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={loading}>
                        {loading ? <span className="loader" style={{ width: 20, height: 20 }}></span> : 'Create Account'}
                    </button>
                </form>
                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                </div>
            </motion.div>
        </div>
    );
}
