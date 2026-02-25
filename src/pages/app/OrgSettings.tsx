import React, { useState, useEffect } from 'react';
import { organizationApi } from '../../api';
import { authApi } from '../../api/auth';
import { Building2, DollarSign, Users, FileText, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgSettings() {
    const [tab, setTab] = useState<'info' | 'pricing' | 'staff' | 'templates'>('info');
    const [loading, setLoading] = useState(true);
    const [org, setOrg] = useState<any>({});
    const [pricing, setPricing] = useState<any>({});
    const [staff, setStaff] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);

    // Staff creation form
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [newStaff, setNewStaff] = useState({ username: '', password: '', firstName: '', lastName: '', phone: '', salary: '', changePasswordOnLogin: false });

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            const [orgRes, pricingRes, staffRes, templatesRes] = await Promise.all([
                organizationApi.getInfo(), organizationApi.getPricing(), organizationApi.listStaff(), organizationApi.getTemplates(),
            ]);
            setOrg(orgRes.data.organization || {});
            setPricing(pricingRes.data.pricing || {});
            setStaff(staffRes.data.staff || []);
            setTemplates(templatesRes.data.templates || []);
        } catch { console.error('Failed to load settings'); } finally { setLoading(false); }
    };

    const saveOrg = async () => {
        try {
            await organizationApi.updateInfo(org);
            toast.success('Organization info saved');
        } catch (err: any) { toast.error(err.response?.data?.error || 'Save failed'); }
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

    const addStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStaff.username || !newStaff.password || !newStaff.firstName || !newStaff.lastName) { toast.error('Required fields missing'); return; }
        try {
            await authApi.createStaff({
                ...newStaff,
                salary: newStaff.salary ? Number(newStaff.salary) : undefined,
                phone: newStaff.phone || undefined,
            });
            toast.success('Staff created');
            setShowAddStaff(false);
            setNewStaff({ username: '', password: '', firstName: '', lastName: '', phone: '', salary: '', changePasswordOnLogin: false });
            loadAll();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    };

    const deleteStaff = async (id: string, name: string) => {
        if (!confirm(`Delete staff "${name}"?`)) return;
        try { await organizationApi.deleteStaff(id); toast.success('Deleted'); loadAll(); } catch { toast.error('Delete failed'); }
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
        { key: 'staff', label: 'Staff', icon: Users },
        { key: 'templates', label: 'Templates', icon: FileText },
    ] as const;

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

            {/* Staff */}
            {tab === 'staff' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddStaff(!showAddStaff)}><Plus size={14} /> Add Staff</button>
                    </div>
                    {showAddStaff && (
                        <form onSubmit={addStaff} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Username *</label><input className="form-input" placeholder="staff1" value={newStaff.username} onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" placeholder="••••••••" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} required /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" value={newStaff.firstName} onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" value={newStaff.lastName} onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })} required /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Salary (₹)</label><input className="form-input" type="number" value={newStaff.salary} onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })} /></div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={newStaff.changePasswordOnLogin} onChange={(e) => setNewStaff({ ...newStaff, changePasswordOnLogin: e.target.checked })} /> Change password on first login
                            </label>
                            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>Create Staff</button>
                        </form>
                    )}
                    <div className="widget">
                        <div className="table-wrapper">
                            <table>
                                <thead><tr><th>Username</th><th>Name</th><th>Phone</th><th>Salary</th><th>Created</th><th></th></tr></thead>
                                <tbody>
                                    {staff.map((s: any) => (
                                        <tr key={s.id}>
                                            <td><span className="badge badge-primary">{s.username}</span></td>
                                            <td className="font-semibold">{s.first_name} {s.last_name}</td>
                                            <td className="text-secondary">{s.phone || '—'}</td>
                                            <td>₹{Number(s.salary || 0).toLocaleString()}</td>
                                            <td className="text-xs text-tertiary">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                                            <td><button className="btn-icon" onClick={() => deleteStaff(s.id, s.first_name)}><Trash2 size={16} /></button></td>
                                        </tr>
                                    ))}
                                    {staff.length === 0 && <tr><td colSpan={6} className="text-center text-secondary" style={{ padding: 'var(--space-8)' }}>No staff members yet</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Templates */}
            {tab === 'templates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {templates.map((t: any) => (
                        <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>{t.report_type}</h3>
                                <button className="btn btn-sm btn-primary" onClick={() => saveTemplate(t.report_type, t.template_content)}><Save size={14} /> Save</button>
                            </div>
                            <textarea className="form-input" rows={8} value={t.template_content} onChange={(e) => {
                                const updated = templates.map(tt => tt.id === t.id ? { ...tt, template_content: e.target.value } : tt);
                                setTemplates(updated);
                            }} style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }} />
                        </div>
                    ))}
                    {templates.length === 0 && <div className="card text-center text-secondary" style={{ padding: 'var(--space-10)' }}>No templates configured yet. They will be created automatically when you set up your organization.</div>}
                </div>
            )}
        </div>
    );
}
