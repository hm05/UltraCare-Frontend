import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { referralApi } from '../../api';
import { Download, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

// Indian FY helper — FY starts April 1
function getIndianFYStart(): string {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}-04-01`;
}

type SortMode = 'name' | 'amount_desc' | 'amount_asc' | 'date_added' | 'recent_referral';

export default function ReferralData() {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newDoc, setNewDoc] = useState({ doctorName: '', hospitalName: '', designation: '', phone: '', referralPercentage: '' });
    const [sortMode, setSortMode] = useState<SortMode>('amount_desc');
    const [filterStart, setFilterStart] = useState(getIndianFYStart());
    const [filterEnd, setFilterEnd] = useState(new Date().toISOString().slice(0, 10));

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

    const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (!confirm(`Delete referral doctor "${name}"?`)) return;
        try {
            await referralApi.delete(id);
            toast.success('Deleted');
            loadDoctors();
        } catch { toast.error('Delete failed'); }
    };

    const handleExportDashboard = async (format: 'pdf' | 'xlsx') => {
        try {
            toast.loading('Generating...');
            const res = await referralApi.exportDashboard({ format });
            if (format === 'xlsx') {
                const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'referral-dashboard.xlsx';
                a.click();
            } else {
                const blob = new Blob([res.data], { type: 'text/html' });
                window.open(URL.createObjectURL(blob));
            }
            toast.dismiss(); toast.success('Export ready!');
        } catch { toast.dismiss(); toast.error('Export failed'); }
    };

    const getCommissionAmount = (d: any) => {
        const total = Number(d.total_amount || 0);
        const pct = Number(d.referral_percentage || 0);
        return Math.round(total * pct / 100);
    };

    // Sort
    const sortedDoctors = useMemo(() => {
        const arr = [...doctors];
        switch (sortMode) {
            case 'name':
                arr.sort((a, b) => (a.doctor_name || '').localeCompare(b.doctor_name || ''));
                break;
            case 'amount_desc':
                arr.sort((a, b) => getCommissionAmount(b) - getCommissionAmount(a));
                break;
            case 'amount_asc':
                arr.sort((a, b) => getCommissionAmount(a) - getCommissionAmount(b));
                break;
            case 'date_added':
                arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                break;
            case 'recent_referral':
                arr.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());
                break;
        }
        return arr;
    }, [doctors, sortMode]);

    const chartData = sortedDoctors.map(d => ({
        name: d.doctor_name?.split(' ').slice(-1)[0] || d.doctor_name,
        cases: d.case_count || 0,
        amount: getCommissionAmount(d),
    })).sort((a, b) => b.amount - a.amount);

    if (loading) return <div className="dashboard-loading"><div className="loader"></div></div>;

    return (
        <div className="dashboard-page">
            {/* Header + Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Referral Doctors ({doctors.length})</h2>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleExportDashboard('pdf')}><Download size={14} /> PDF</button>
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

            {/* Chart — max bar width for 1-2 doctors */}
            {chartData.length > 0 && (
                <div className="widget chart-widget">
                    <div className="widget-header"><h3 className="widget-title">Commission by Doctor</h3></div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData.slice(0, 10)} barSize={chartData.length <= 3 ? 60 : undefined}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                            <Tooltip
  formatter={(v: unknown) => `₹${(Number(v) || 0).toLocaleString()}`}
  contentStyle={{
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '8px 12px',
  }}
  itemStyle={{ color: 'var(--text-primary)' }}
  cursor={{ fill: 'var(--accent-light)' }}
/>
                            <Bar dataKey="amount" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={80} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Compact Filter + Sort — just above the table */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap',
                padding: 'var(--space-2) 0',
            }}>
                <input type="date" className="form-input" value={filterStart} onChange={e => setFilterStart(e.target.value)}
                    style={{ padding: '4px 8px', fontSize: 'var(--font-size-xs)', width: 130 }} />
                <span className="text-xs text-tertiary">to</span>
                <input type="date" className="form-input" value={filterEnd} onChange={e => setFilterEnd(e.target.value)}
                    style={{ padding: '4px 8px', fontSize: 'var(--font-size-xs)', width: 130 }} />
                <div style={{ marginLeft: 'auto' }}>
                    <select className="form-input" value={sortMode} onChange={e => setSortMode(e.target.value as SortMode)}
                        style={{ padding: '4px 8px', fontSize: 'var(--font-size-xs)', minWidth: 160 }}>
                        <option value="amount_desc">Commission ↓</option>
                        <option value="amount_asc">Commission ↑</option>
                        <option value="name">Name A–Z</option>
                        <option value="date_added">Date Added</option>
                        <option value="recent_referral">Most Recent</option>
                    </select>
                </div>
            </div>

            {/* Doctors List */}
            <div className="widget" style={{ marginTop: 0 }}>
                <div className="table-wrapper">
                    <table>
                        <thead><tr><th>Doctor</th><th>Hospital</th><th>Designation</th><th>Phone</th><th>Commission</th><th>Cases</th><th>Commission Amt</th><th></th></tr></thead>
                        <tbody>
                            {sortedDoctors.map((d: any) => (
                                <tr key={d.id} onClick={() => navigate(`/referral/${d.id}`)} style={{ cursor: 'pointer' }}>
                                    <td className="font-semibold">{d.doctor_name}</td>
                                    <td>{d.hospital_name}</td>
                                    <td className="text-secondary">{d.designation || '—'}</td>
                                    <td className="text-secondary">{d.phone || '—'}</td>
                                    <td><span className="badge badge-warning">{d.referral_percentage}%</span></td>
                                    <td>{d.case_count || 0}</td>
                                    <td className="font-semibold">₹{getCommissionAmount(d).toLocaleString()}</td>
                                    <td><button className="btn-icon" onClick={(e) => handleDelete(e, d.id, d.doctor_name)}><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
