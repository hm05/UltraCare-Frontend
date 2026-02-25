import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { referralApi } from '../../api';
import { Download, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferralData() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newDoc, setNewDoc] = useState({ doctorName: '', hospitalName: '', designation: '', phone: '', referralPercentage: '' });

    useEffect(() => { loadDoctors(); }, []);

    const loadDoctors = async () => {
        try {
            const res = await referralApi.list();
            setDoctors(res.data.doctors || []);
        } catch { console.error('Failed to load referrals'); } finally { setLoading(false); }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoc.doctorName || !newDoc.hospitalName) { toast.error('Name and hospital required'); return; }
        try {
            await referralApi.register({ ...newDoc, referralPercentage: Number(newDoc.referralPercentage) || 0 });
            toast.success('Doctor added');
            setShowAdd(false);
            setNewDoc({ doctorName: '', hospitalName: '', designation: '', phone: '', referralPercentage: '' });
            loadDoctors();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete referral doctor "${name}"?`)) return;
        try {
            await referralApi.delete(id);
            toast.success('Deleted');
            loadDoctors();
        } catch { toast.error('Delete failed'); }
    };

    const handleExportDashboard = async (format: string) => {
        try {
            toast.loading('Generating...');
            const res = await referralApi.exportDashboard({ format });
            const blob = new Blob([res.data], { type: format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/html' });
            const url = URL.createObjectURL(blob);
            if (format === 'xlsx') { const a = document.createElement('a'); a.href = url; a.download = 'referral-dashboard.xlsx'; a.click(); }
            else window.open(url);
            toast.dismiss(); toast.success('Export ready!');
        } catch { toast.dismiss(); toast.error('Export failed'); }
    };

    const chartData = doctors.map(d => ({ name: d.doctor_name?.split(' ').slice(-1)[0] || d.doctor_name, cases: d.case_count || 0, amount: d.total_amount || 0 })).sort((a, b) => b.amount - a.amount);

    if (loading) return <div className="dashboard-loading"><div className="loader"></div></div>;

    return (
        <div className="dashboard-page">
            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Referral Doctors ({doctors.length})</h2>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleExportDashboard('html')}><Download size={14} /> HTML</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleExportDashboard('xlsx')}><Download size={14} /> Excel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}><Plus size={14} /> Add Doctor</button>
                </div>
            </div>

            {/* Add Form */}
            {showAdd && (
                <form onSubmit={handleAdd} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Doctor Name *</label><input className="form-input" placeholder="Dr. Name" value={newDoc.doctorName} onChange={(e) => setNewDoc({ ...newDoc, doctorName: e.target.value })} required /></div>
                        <div className="form-group"><label className="form-label">Hospital *</label><input className="form-input" placeholder="Hospital name" value={newDoc.hospitalName} onChange={(e) => setNewDoc({ ...newDoc, hospitalName: e.target.value })} required /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Designation</label><input className="form-input" placeholder="MD, MS" value={newDoc.designation} onChange={(e) => setNewDoc({ ...newDoc, designation: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Phone</label><input className="form-input" placeholder="Phone" value={newDoc.phone} onChange={(e) => setNewDoc({ ...newDoc, phone: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Commission %</label><input className="form-input" type="number" placeholder="10" value={newDoc.referralPercentage} onChange={(e) => setNewDoc({ ...newDoc, referralPercentage: e.target.value })} /></div>
                    </div>
                    <button className="btn btn-primary btn-sm" type="submit">Save</button>
                </form>
            )}

            {/* Chart */}
            {chartData.length > 0 && (
                <div className="widget chart-widget">
                    <div className="widget-header"><h3 className="widget-title">Contribution by Doctor</h3></div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                            <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                            <Bar dataKey="amount" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Doctors List */}
            <div className="widget">
                <div className="table-wrapper">
                    <table>
                        <thead><tr><th>Doctor</th><th>Hospital</th><th>Designation</th><th>Phone</th><th>Commission</th><th>Cases</th><th>Amount</th><th></th></tr></thead>
                        <tbody>
                            {doctors.map((d: any) => (
                                <tr key={d.id}>
                                    <td className="font-semibold">{d.doctor_name}</td>
                                    <td>{d.hospital_name}</td>
                                    <td className="text-secondary">{d.designation || '—'}</td>
                                    <td className="text-secondary">{d.phone || '—'}</td>
                                    <td><span className="badge badge-warning">{d.referral_percentage}%</span></td>
                                    <td>{d.case_count || 0}</td>
                                    <td>₹{(d.total_amount || 0).toLocaleString()}</td>
                                    <td><button className="btn-icon" onClick={() => handleDelete(d.id, d.doctor_name)}><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
