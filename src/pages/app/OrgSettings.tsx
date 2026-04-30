import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationApi, uploadApi } from '../../api';
import { authApi } from '../../api/auth';
import { Building2, DollarSign, Users, FileText, Plus, Trash2, Save, Pencil, Key, Eye, EyeOff, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgSettings() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'info' | 'pricing' | 'users' | 'hrstaff' | 'templates' | 'formF'>('info');
    const [loading, setLoading] = useState(true);
    const [org, setOrg] = useState<any>({});
    const [pricing, setPricing] = useState<any>({});
    const [users, setUsers] = useState<any[]>([]);
    const [hrStaff, setHrStaff] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

    // User creation form
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', changePasswordOnLogin: false });

    // HR Staff creation form
    const [showAddHRStaff, setShowAddHRStaff] = useState(false);
    const [newHRStaff, setNewHRStaff] = useState({ firstName: '', lastName: '', phone: '', birthday: '', salary: '' });

    // Staff password reset modal
    const [passwordResetStaff, setPasswordResetStaff] = useState<{ id: string; name: string } | null>(null);
    const [passwordReset, setPasswordReset] = useState({ newPassword: '', confirmPassword: '' });
    const [passwordResetLoading, setPasswordResetLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            const [orgRes, pricingRes, usersRes, hrRes, templatesRes] = await Promise.allSettled([
                organizationApi.getInfo(),
                organizationApi.getPricing(),
                organizationApi.listUsers(),
                organizationApi.getHRStaffList(),
                organizationApi.getTemplates(),
            ]);
            if (orgRes.status === 'fulfilled') setOrg(orgRes.value.data.organization || {});
            else console.error('Org info failed:', (orgRes as any).reason?.response?.data || (orgRes as any).reason?.message);

            if (pricingRes.status === 'fulfilled') setPricing(pricingRes.value.data.pricing || {});
            else console.error('Pricing failed:', (pricingRes as any).reason?.response?.data || (pricingRes as any).reason?.message);

            if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.users || []);
            else console.error('Users failed:', (usersRes as any).reason?.response?.data || (usersRes as any).reason?.message);

            if (hrRes.status === 'fulfilled') setHrStaff(hrRes.value.data.staff || []);
            else console.error('HR Staff failed:', (hrRes as any).reason?.response?.data || (hrRes as any).reason?.message);

            if (templatesRes.status === 'fulfilled') setTemplates(templatesRes.value.data.templates || []);
            else console.error('Templates failed:', (templatesRes as any).reason?.response?.data || (templatesRes as any).reason?.message);
        } catch (e) {
            console.error('Failed to load settings', e);
        } finally {
            setLoading(false);
        }
    };

    const saveOrg = async () => {
        try {
            const payload: any = { ...org };
            if (org.form_f_image_url !== undefined) payload.formFImageUrl = org.form_f_image_url || null;
            if (org.form_f_config !== undefined) payload.formFConfig = org.form_f_config;
            await organizationApi.updateInfo(payload);
            toast.success('Organization info saved');
        } catch (err: any) { toast.error(err.response?.data?.error || 'Save failed'); }
    };

    const saveFormFSettings = async () => {
        try {
            await organizationApi.updateInfo({
                ...org,
                formFImageUrl: org.form_f_image_url || null,
                formFConfig: org.form_f_config || {},
            });
            toast.success('Form F settings saved');
        } catch (err: any) { toast.error(err.response?.data?.error || 'Save failed'); }
    };

    const uploadFormFImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            toast.error('Please upload an image (JPG, PNG) or PDF');
            return;
        }
        try {
            toast.loading('Uploading Form F...');
            const res = await uploadApi.uploadFile(file);
            const url = res.data?.url;
            if (url) {
                setOrg((prev: any) => ({ ...prev, form_f_image_url: url }));
                toast.dismiss();
                toast.success('Form F uploaded. Click Save to use it.');
            } else {
                toast.dismiss();
                toast.error('Upload failed');
            }
        } catch {
            toast.dismiss();
            toast.error('Upload failed');
        }
        e.target.value = '';
    };

    const savePricing = async () => {
        try {
            await organizationApi.updatePricing({
                sonographyPrice: Number(pricing.sonography_price || 0),
                obsSonographyPrice: Number(pricing.obs_sonography_price || 0),
                ctPrice: Number(pricing.ct_price || 0),
                mriPrice: Number(pricing.mri_price || 0),
                xrayPrice: Number(pricing.xray_price || 0),
                defaultPrice: Number(pricing.default_price || 0),
            });
            toast.success('Pricing saved');
        } catch (err: any) { toast.error(err.response?.data?.error || 'Save failed'); }
    };

    const addUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password) { toast.error('Required fields missing'); return; }
        try {
            await authApi.createUser({
                ...newUser
            });
            toast.success('User created');
            setShowAddUser(false);
            setNewUser({ username: '', password: '', changePasswordOnLogin: false });
            loadAll();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    };

    const addHRStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHRStaff.firstName || !newHRStaff.lastName) { toast.error('Required fields missing'); return; }
        try {
            await organizationApi.createHRStaff({
                ...newHRStaff,
                salary: newHRStaff.salary ? Number(newHRStaff.salary) : undefined,
                phone: newHRStaff.phone || undefined,
                birthday: newHRStaff.birthday || undefined,
            });
            toast.success('Staff created');
            setShowAddHRStaff(false);
            setNewHRStaff({ firstName: '', lastName: '', phone: '', birthday: '', salary: '' });
            loadAll();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    };

    const deleteUser = async (id: string, name: string) => {
        if (!confirm(`Delete user "${name}"?`)) return;
        try { await organizationApi.deleteUser(id); toast.success('Deleted'); loadAll(); } catch { toast.error('Delete failed'); }
    };

    const deleteHRStaff = async (id: string, name: string) => {
        if (!confirm(`Delete staff "${name}"?`)) return;
        try { await organizationApi.deleteHRStaff(id); toast.success('Deleted'); loadAll(); } catch { toast.error('Delete failed'); }
    };

    const openResetPasswordModal = (userId: string, name: string) => {
        setPasswordResetStaff({ id: userId, name });
        setPasswordReset({ newPassword: '', confirmPassword: '' });
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordResetStaff) return;

        const { newPassword, confirmPassword } = passwordReset;
        if (!newPassword || !confirmPassword) {
            toast.error('Please enter and confirm the new password');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setPasswordResetLoading(true);
            await authApi.resetPassword(passwordResetStaff.id, newPassword, confirmPassword);
            toast.success(`Password reset for ${passwordResetStaff.name}`);
            setPasswordResetStaff(null);
            setPasswordReset({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Password reset failed');
        } finally {
            setPasswordResetLoading(false);
        }
    };

    const saveTemplate = async (reportType: string, content: string) => {
        try {
            await organizationApi.upsertTemplate(reportType, content);
            toast.success(`Template "${reportType}" saved`);
        } catch { toast.error('Save failed'); }
    };

    if (loading) return <div className="dashboard-loading"><div className="loader"></div></div>;

    const tabs = [
        { key: 'info', label: 'Organisation', icon: Building2 },
        { key: 'pricing', label: 'Pricing', icon: DollarSign },
        { key: 'users', label: 'Users', icon: Users },
        { key: 'hrstaff', label: 'Staff', icon: Users },
        { key: 'templates', label: 'Templates', icon: FileText },
        { key: 'formF', label: 'Form F', icon: FileText },
    ] as const;

    const formFConfig = org.form_f_config || {};
    const setFormFConfig = (key: string, value: boolean) => {
        setOrg((prev: any) => ({
            ...prev,
            form_f_config: { ...(prev.form_f_config || {}), [key]: value },
        }));
    };

    return (
        <div className="dashboard-page">
            {/* Tabs */}
            <div className="tabs">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    return (
                        <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                            <Icon size={14} style={{ marginRight: 6 }} />{t.label}
                        </button>
                    );
                })}
            </div>

            {/* Organisation Info */}
            {tab === 'info' && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="form-group"><label className="form-label">Organisation Name</label><input className="form-input" value={org.name || ''} onChange={(e) => setOrg({ ...org, name: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Address</label><textarea className="form-input" rows={2} value={org.address || ''} onChange={(e) => setOrg({ ...org, address: e.target.value })} /></div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={org.phone || ''} onChange={(e) => setOrg({ ...org, phone: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={org.email || ''} onChange={(e) => setOrg({ ...org, email: e.target.value })} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Registration Number</label><input className="form-input" value={org.registration_number || ''} onChange={(e) => setOrg({ ...org, registrationNumber: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Website</label><input className="form-input" value={org.website || ''} onChange={(e) => setOrg({ ...org, website: e.target.value })} /></div>
                    </div>
                    <button className="btn btn-primary" onClick={saveOrg} style={{ alignSelf: 'flex-end' }}><Save size={16} /> Save</button>
                </div>
            )}

            {/* Pricing */}
            {tab === 'pricing' && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Sonography (₹)</label><input className="form-input" type="number" value={pricing.sonography_price || ''} onChange={(e) => setPricing({ ...pricing, sonography_price: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Obs. Sonography (₹)</label><input className="form-input" type="number" value={pricing.obs_sonography_price || ''} onChange={(e) => setPricing({ ...pricing, obs_sonography_price: e.target.value })} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">C.T. (₹)</label><input className="form-input" type="number" value={pricing.ct_price || ''} onChange={(e) => setPricing({ ...pricing, ct_price: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">M.R.I. (₹)</label><input className="form-input" type="number" value={pricing.mri_price || ''} onChange={(e) => setPricing({ ...pricing, mri_price: e.target.value })} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">X-Ray (₹)</label><input className="form-input" type="number" value={pricing.xray_price || ''} onChange={(e) => setPricing({ ...pricing, xray_price: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Default (₹)</label><input className="form-input" type="number" value={pricing.default_price || ''} onChange={(e) => setPricing({ ...pricing, default_price: e.target.value })} /></div>
                    </div>
                    <button className="btn btn-primary" onClick={savePricing} style={{ alignSelf: 'flex-end' }}><Save size={16} /> Save Pricing</button>
                </div>
            )}

            {/* Users */}
            {tab === 'users' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(!showAddUser)}><Plus size={14} /> Add User</button>
                    </div>
                    {showAddUser && (
                        <form onSubmit={addUser} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Username *</label><input className="form-input" placeholder="user1" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required /></div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                                <div
                                    onClick={() => setNewUser({ ...newUser, changePasswordOnLogin: !newUser.changePasswordOnLogin })}
                                    style={{
                                        width: 40, height: 22, borderRadius: 11, position: 'relative', cursor: 'pointer',
                                        background: newUser.changePasswordOnLogin ? 'var(--accent)' : 'var(--border)',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    <div style={{
                                        width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute',
                                        top: 2, left: newUser.changePasswordOnLogin ? 20 : 2,
                                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }} />
                                </div>
                                Require password change on first login
                            </label>
                            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>Create User</button>
                        </form>
                    )}
                    <div className="widget">
                        <div className="table-wrapper">
                            <table>
                                <thead><tr><th>Username</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {users.map((s: any) => (
                                        <tr key={s.id}>
                                            <td><span className="badge badge-primary">{s.username}</span></td>
                                            <td>{s.role}</td>
                                            <td className="text-xs text-tertiary">{new Date(s.created_at || s.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                    <button 
                                                        className="btn-icon" 
                                                        onClick={() => openResetPasswordModal(s.id, s.username)}
                                                        title="Reset Password"
                                                        style={{ color: 'var(--warning)' }}
                                                    >
                                                        <Key size={16} />
                                                    </button>
                                                    <button 
                                                        className="btn-icon" 
                                                        onClick={() => deleteUser(s.id, s.username)}
                                                        title="Delete User"
                                                        style={{ color: 'var(--danger)' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && <tr><td colSpan={4} className="text-center text-secondary" style={{ padding: 'var(--space-8)' }}>No user accounts yet</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* HR Staff */}
            {tab === 'hrstaff' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddHRStaff(!showAddHRStaff)}><Plus size={14} /> Add Staff</button>
                    </div>
                    {showAddHRStaff && (
                        <form onSubmit={addHRStaff} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" value={newHRStaff.firstName} onChange={(e) => setNewHRStaff({ ...newHRStaff, firstName: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" value={newHRStaff.lastName} onChange={(e) => setNewHRStaff({ ...newHRStaff, lastName: e.target.value })} required /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={newHRStaff.phone} onChange={(e) => setNewHRStaff({ ...newHRStaff, phone: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Birthday</label><input className="form-input" type="date" value={newHRStaff.birthday} onChange={(e) => setNewHRStaff({ ...newHRStaff, birthday: e.target.value })} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Base Salary (₹)</label><input className="form-input" type="number" value={newHRStaff.salary} onChange={(e) => setNewHRStaff({ ...newHRStaff, salary: e.target.value })} /></div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>Create Staff</button>
                        </form>
                    )}
                    <div className="widget">
                        <div className="table-wrapper">
                            <table>
                                <thead><tr><th>Name</th><th>Phone</th><th>Salary</th><th>Absences (Mo)</th><th>Calc. Salary</th><th>Created</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {hrStaff.map((s: any) => (
                                        <tr
                                            key={s.id}
                                            onClick={() => navigate(`/staff/${s.id}`)}
                                            style={{ cursor: 'pointer' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = '')}
                                        >
                                            <td className="font-semibold">{s.name || `${s.first_name} ${s.last_name}`}</td>
                                            <td className="text-secondary">{s.phone || '—'}</td>
                                            <td>₹{Number(s.base_salary || 0).toLocaleString()}</td>
                                            <td><span className="badge badge-warning">{s.absences_this_month || 0}</span></td>
                                            <td className="font-semibold" style={{ color: 'var(--success)' }}>₹{Number(s.calculated_salary || 0).toLocaleString()}</td>
                                            <td className="text-xs text-tertiary">{new Date(s.created_at || s.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                    <button 
                                                        className="btn-icon" 
                                                        onClick={e => { e.stopPropagation(); deleteHRStaff(s.id, s.name); }}
                                                        title="Delete Staff"
                                                        style={{ color: 'var(--danger)' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {hrStaff.length === 0 && <tr><td colSpan={7} className="text-center text-secondary" style={{ padding: 'var(--space-8)' }}>No staff yet</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Templates */}
            {tab === 'templates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {editingTemplateId ? (() => {
                        const editType = editingTemplateId;
                        const existing = templates.find(t => t.report_type === editType);
                        const content = existing?.template_content ?? '';
                        return (
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Edit Template — {editType}</h3>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                        <button className="btn btn-sm btn-primary" onClick={() => {
                                            const textarea = document.getElementById('template-editor') as HTMLTextAreaElement;
                                            if (textarea) {
                                                saveTemplate(editType, textarea.value);
                                                // Update local state
                                                if (existing) {
                                                    setTemplates(templates.map(t => t.report_type === editType ? { ...t, template_content: textarea.value } : t));
                                                } else {
                                                    setTemplates([...templates, { id: `new-${editType}`, report_type: editType, template_content: textarea.value }]);
                                                }
                                            }
                                            setEditingTemplateId(null);
                                        }}><Save size={14} /> Save</button>
                                        <button className="btn btn-sm btn-secondary" onClick={() => setEditingTemplateId(null)}>Cancel</button>
                                    </div>
                                </div>
                                <textarea
                                    id="template-editor"
                                    className="form-input"
                                    rows={20}
                                    defaultValue={content}
                                    placeholder={`Enter the HTML/Handlebars template for ${editType} reports...`}
                                    style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}
                                />
                            </div>
                        );
                    })() : (
                        <>
                            <div className="card">
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>Report Templates</h3>
                                    <p className="text-sm text-secondary">Edit the HTML/Handlebars template used for each report type</p>
                                </div>
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Service Type</th>
                                                <th>Status</th>
                                                <th>Last Updated</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {['Sonography', 'Obs. Sonography', 'X-Ray', 'C.T.', 'M.R.I.'].map(type => {
                                                const tpl = templates.find(t => t.report_type === type);
                                                return (
                                                    <tr key={type}>
                                                        <td className="font-semibold">{type}</td>
                                                        <td>
                                                            {tpl ? (
                                                                <span className="badge badge-success">Configured</span>
                                                            ) : (
                                                                <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>Not set</span>
                                                            )}
                                                        </td>
                                                        <td className="text-sm text-tertiary">
                                                            {tpl?.updated_at ? new Date(tpl.updated_at).toLocaleDateString('en-IN') : '—'}
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-sm btn-outline" onClick={() => setEditingTemplateId(type)}>
                                                                <Pencil size={14} /> {tpl ? 'Edit' : 'Create'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Form F — organisation-specific form and auto-fill options */}
            {tab === 'formF' && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                    <div>
                        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>Form F (PNDT)</h3>
                        <p className="text-sm text-secondary">
                            Upload your organisation’s Form F image. When generating Form F for a case, the system will use this form and overlay patient & case data. Choose which organisation/doctor fields the system should auto-fill.
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Form F image (blank form)</label>
                        {org.form_f_image_url && (
                            <div style={{ marginBottom: 'var(--space-3)' }}>
                                <a href={org.form_f_image_url} target="_blank" rel="noopener noreferrer" className="text-sm" style={{ color: 'var(--accent)' }}>
                                    Current form (open in new tab)
                                </a>
                            </div>
                        )}
                        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
                            <Upload size={14} /> Upload Form F (image or PDF)
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={uploadFormFImage}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    <div>
                        <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Auto-fill by system</h4>
                        <p className="text-xs text-secondary" style={{ marginBottom: 'var(--space-3)' }}>
                            When unchecked, the field is left blank on the generated Form F so you can fill it manually (e.g. if you have multiple doctors or don’t want org name on the form).
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)', alignItems: 'center' }}>
                            <div>
                                <div className="font-semibold">Organisation name & address</div>
                                <div className="text-xs text-tertiary">Section A, item 1</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={formFConfig.fillOrgName !== false}
                                onChange={(e) => setFormFConfig('fillOrgName', e.target.checked)}
                                style={{ width: 16, height: 16 }}
                            />

                            <div>
                                <div className="font-semibold">Organisation address / phone in same block</div>
                                <div className="text-xs text-tertiary">Included in item 1 line</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={formFConfig.fillOrgAddress !== false}
                                onChange={(e) => setFormFConfig('fillOrgAddress', e.target.checked)}
                                style={{ width: 16, height: 16 }}
                            />

                            <div>
                                <div className="font-semibold">Registration No.</div>
                                <div className="text-xs text-tertiary">Section A, item 2</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={formFConfig.fillRegistrationNo !== false}
                                onChange={(e) => setFormFConfig('fillRegistrationNo', e.target.checked)}
                                style={{ width: 16, height: 16 }}
                            />

                            <div>
                                <div className="font-semibold">Doctor name</div>
                                <div className="text-xs text-tertiary">Section B, item 9 & declarations</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={formFConfig.fillDoctorName !== false}
                                onChange={(e) => setFormFConfig('fillDoctorName', e.target.checked)}
                                style={{ width: 16, height: 16 }}
                            />
                        </div>
                    </div>

                    <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={saveFormFSettings}>
                        <Save size={16} /> Save Form F settings
                    </button>
                </div>
            )}

            {/* Staff password reset modal */}
            {passwordResetStaff && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50,
                        padding: 'var(--space-6)',
                    }}
                    onClick={() => !passwordResetLoading && setPasswordResetStaff(null)}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: 420,
                            width: '100%',
                            padding: 'var(--space-5)',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <Key size={18} style={{ color: 'var(--warning)' }} />
                                <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
                                    Reset password — {passwordResetStaff.name}
                                </h3>
                            </div>
                            <button
                                className="btn-icon"
                                type="button"
                                onClick={() => !passwordResetLoading && setPasswordResetStaff(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
                            Set a new password for this staff member. They will use the new password on their next login.
                        </p>
                        <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordReset.newPassword}
                                        onChange={(e) => setPasswordReset({ ...passwordReset, newPassword: e.target.value })}
                                        placeholder="••••••••"
                                        minLength={8}
                                        required
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((v) => !v)}
                                        style={{
                                            position: 'absolute',
                                            right: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-tertiary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: 0,
                                        }}
                                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={passwordReset.confirmPassword}
                                        onChange={(e) => setPasswordReset({ ...passwordReset, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        minLength={8}
                                        required
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        style={{
                                            position: 'absolute',
                                            right: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-tertiary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: 0,
                                        }}
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => !passwordResetLoading && setPasswordResetStaff(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-sm btn-primary"
                                    disabled={passwordResetLoading}
                                >
                                    {passwordResetLoading ? 'Saving…' : 'Save Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
