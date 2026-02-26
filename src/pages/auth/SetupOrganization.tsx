import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Upload, X } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import toast from 'react-hot-toast';
import '../auth/Auth.css';

export default function SetupOrganization() {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        organizationName: '',
        organizationAddress: '',
        organizationPhone: '',
        organizationEmail: '',
        registrationNumber: '',
        website: '',
        sonographyPrice: '',
        obsSonographyPrice: '',
        ctPrice: '',
        mriPrice: '',
        xrayPrice: '',
        defaultPrice: '',
    });

    const update = (key: string, val: string) => setForm({ ...form, [key]: val });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Logo must be less than 2MB');
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.organizationName) {
            toast.error('Organization name is required');
            return;
        }
        setLoading(true);
        try {
            // Upload logo if selected
            let logoUrl: string | undefined;
            if (logoFile) {
                const formData = new FormData();
                formData.append('file', logoFile);
                formData.append('folder', 'logos');
                const uploadRes = await client.post('/upload/file', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                logoUrl = uploadRes.data.url;
            }

            const pricing: any = {};
            if (form.sonographyPrice) pricing.sonographyPrice = Number(form.sonographyPrice);
            if (form.obsSonographyPrice) pricing.obsSonographyPrice = Number(form.obsSonographyPrice);
            if (form.ctPrice) pricing.ctPrice = Number(form.ctPrice);
            if (form.mriPrice) pricing.mriPrice = Number(form.mriPrice);
            if (form.xrayPrice) pricing.xrayPrice = Number(form.xrayPrice);
            if (form.defaultPrice) pricing.defaultPrice = Number(form.defaultPrice);

            const res = await authApi.setupOrganization({
                organizationName: form.organizationName,
                organizationAddress: form.organizationAddress || undefined,
                organizationPhone: form.organizationPhone || undefined,
                organizationEmail: form.organizationEmail || undefined,
                registrationNumber: form.registrationNumber || undefined,
                website: form.website || undefined,
                logoUrl,
                pricing: Object.keys(pricing).length > 0 ? pricing : undefined,
            });

            toast.success('Organization setup complete!');

            // Update AuthContext user so login redirect works correctly
            updateUser({ organizationId: res.data.organizationId });

            navigate('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Setup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <motion.div className="auth-card card" style={{ maxWidth: 560 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="auth-header">
                    <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
                        <Building2 size={28} />
                    </div>
                    <h1>Setup Your Organization</h1>
                    <p className="text-secondary">Tell us about your clinic so we can configure everything</p>
                </div>

                <div className="auth-toggle" style={{ marginBottom: 'var(--space-6)' }}>
                    <button className={`toggle-btn ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>Clinic Info</button>
                    <button className={`toggle-btn ${step === 2 ? 'active' : ''}`} onClick={() => setStep(2)}>Service Pricing</button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {step === 1 && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Organization Name *</label>
                                <input className="form-input" placeholder="Sunrise Diagnostic Center" value={form.organizationName} onChange={(e) => update('organizationName', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea className="form-input" rows={2} placeholder="Full clinic address" value={form.organizationAddress} onChange={(e) => update('organizationAddress', e.target.value)} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" placeholder="+91 99999 99999" value={form.organizationPhone} onChange={(e) => update('organizationPhone', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" type="email" placeholder="clinic@email.com" value={form.organizationEmail} onChange={(e) => update('organizationEmail', e.target.value)} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Registration No.</label>
                                    <input className="form-input" placeholder="REG-001" value={form.registrationNumber} onChange={(e) => update('registrationNumber', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Website</label>
                                    <input className="form-input" placeholder="https://clinic.com" value={form.website} onChange={(e) => update('website', e.target.value)} />
                                </div>
                            </div>

                            {/* Logo Upload */}
                            <div className="form-group">
                                <label className="form-label">Hospital Logo (Optional)</label>
                                <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-2)' }}>This logo will appear on all generated reports</p>
                                {logoPreview ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                                        <img src={logoPreview} alt="Logo preview" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
                                        <span className="text-sm" style={{ flex: 1 }}>{logoFile?.name}</span>
                                        <button type="button" onClick={removeLogo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)',
                                            padding: 'var(--space-4)', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer', color: 'var(--text-tertiary)', transition: 'border-color 0.2s',
                                        }}
                                    >
                                        <Upload size={24} />
                                        <span className="text-sm">Click to upload logo (PNG, JPG — max 2MB)</span>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" style={{ display: 'none' }} onChange={handleLogoChange} />
                            </div>

                            <button type="button" className="btn btn-primary btn-lg auth-submit" onClick={() => setStep(2)}>Next: Service Pricing</button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-2)' }}>Set default prices per service type (₹)</p>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Sonography</label>
                                    <input className="form-input" type="number" placeholder="500" value={form.sonographyPrice} onChange={(e) => update('sonographyPrice', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Obs. Sonography</label>
                                    <input className="form-input" type="number" placeholder="700" value={form.obsSonographyPrice} onChange={(e) => update('obsSonographyPrice', e.target.value)} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">C.T.</label>
                                    <input className="form-input" type="number" placeholder="2000" value={form.ctPrice} onChange={(e) => update('ctPrice', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">M.R.I.</label>
                                    <input className="form-input" type="number" placeholder="5000" value={form.mriPrice} onChange={(e) => update('mriPrice', e.target.value)} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">X-Ray</label>
                                    <input className="form-input" type="number" placeholder="300" value={form.xrayPrice} onChange={(e) => update('xrayPrice', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Default</label>
                                    <input className="form-input" type="number" placeholder="500" value={form.defaultPrice} onChange={(e) => update('defaultPrice', e.target.value)} />
                                </div>
                            </div>
                            <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={loading}>
                                {loading ? <span className="loader" style={{ width: 20, height: 20 }}></span> : 'Complete Setup'}
                            </button>
                            <button type="button" className="btn btn-secondary auth-submit" onClick={() => setStep(1)}>Back to Clinic Info</button>
                        </>
                    )}
                </form>
            </motion.div>
        </div>
    );
}
