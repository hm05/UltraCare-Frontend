import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { referralApi } from '../../api';
import { ArrowLeft, Building2, Percent, Users, IndianRupee, Download, Calendar, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Indian FY helper
function getIndianFYStart(): string {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}-04-01`;
}

export default function ReferralDoctorDetail() {
    const { doctorId } = useParams<{ doctorId: string }>();
    const navigate = useNavigate();

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(getIndianFYStart());
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ doctorName: '', hospitalName: '', designation: '', phone: '', referralPercentage: '' });
    const [saving, setSaving] = useState(false);

    const loadReport = useCallback(async (start: string, end: string) => {
        if (!doctorId) return;
        setLoading(true);
        try {
            const res = await referralApi.getReport(doctorId, { startDate: start, endDate: end });
            setData(res.data);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to load referral report');
            navigate('/referrals');
        } finally {
            setLoading(false);
        }
    }, [doctorId, navigate]);

    useEffect(() => { loadReport(startDate, endDate); }, []);

    const handleSave = async () => {
        if (!doctorId) return;
        setSaving(true);
        try {
            await referralApi.update(doctorId, {
                doctorName: editForm.doctorName,
                hospitalName: editForm.hospitalName,
                designation: editForm.designation,
                phone: editForm.phone,
                referralPercentage: Number(editForm.referralPercentage)
            });
            toast.success('Doctor details updated successfully');
            setEditing(false);
            loadReport(startDate, endDate);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update doctor');
        } finally {
            setSaving(false);
        }
    };

    const handleExportPdf = async () => {
        if (!doctorId) return;
        setExportingPdf(true);
        try {
            const res = await referralApi.exportDoctorPdf(doctorId, { startDate, endDate });
            const blob = new Blob([res.data], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (!win) toast.error('Pop-up blocked. Please allow pop-ups for this site.');
        } catch {
            toast.error('PDF export failed');
        } finally {
            setExportingPdf(false);
        }
    };

    const handleExportExcel = async () => {
        if (!doctorId) return;
        setExportingExcel(true);
        try {
            const res = await referralApi.exportDoctorExcel(doctorId, { startDate, endDate });
            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `referral-${doctor.name.replace(/\s+/g, '-')}.xlsx`;
            a.click();
        } catch {
            toast.error('Excel export failed');
        } finally {
            setExportingExcel(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loader"></div>
                <p className="text-secondary">Loading referral report...</p>
            </div>
        );
    }

    if (!data) return null;

    const { doctor, patients, totalAmount, referralAmount, patientCount } = data;
    const commissionRate = doctor.referralPercentage || 0;

    return (
        <div className="dashboard-page">
            {/* Back */}
            <button onClick={() => navigate('/referrals')} className="btn btn-sm btn-outline" style={{ alignSelf: 'flex-start' }}>
                <ArrowLeft size={14} /> Back to Referrals
            </button>

            {/* Doctor info header */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
                    {!editing ? (
                        <>
                            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                {doctor.name}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                    <Building2 size={14} /> {doctor.hospitalName}
                                </span>
                                {doctor.designation && (
                                    <span className="badge badge-primary">{doctor.designation}</span>
                                )}
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-sm)', color: 'var(--warning)' }}>
                                    <Percent size={14} /> {commissionRate}% commission
                                </span>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Doctor Name</label>
                                    <input 
                                        className="form-input" 
                                        value={editForm.doctorName} 
                                        onChange={(e) => setEditForm({ ...editForm, doctorName: e.target.value })}
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Hospital</label>
                                    <input 
                                        className="form-input" 
                                        value={editForm.hospitalName} 
                                        onChange={(e) => setEditForm({ ...editForm, hospitalName: e.target.value })}
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Designation</label>
                                    <input 
                                        className="form-input" 
                                        value={editForm.designation} 
                                        onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input 
                                        className="form-input" 
                                        value={editForm.phone} 
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Commission %</label>
                                    <input 
                                        className="form-input" 
                                        type="number" 
                                        value={editForm.referralPercentage} 
                                        onChange={(e) => setEditForm({ ...editForm, referralPercentage: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignSelf: 'flex-start' }}>
                    {!editing ? (
                        <>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                    setEditing(true);
                                    setEditForm({
                                        doctorName: doctor.name,
                                        hospitalName: doctor.hospitalName,
                                        designation: doctor.designation || '',
                                        phone: doctor.phone || '',
                                        referralPercentage: doctor.referralPercentage.toString()
                                    });
                                }}
                            >
                                <Edit size={14} /> Edit
                            </button>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={handleExportPdf}
                                disabled={exportingPdf}
                            >
                                <Download size={14} /> {exportingPdf ? 'Exporting...' : 'PDF'}
                            </button>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={handleExportExcel}
                                disabled={exportingExcel}
                            >
                                <Download size={14} /> {exportingExcel ? 'Exporting...' : 'Excel'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                                <X size={14} /> Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Date range filter */}
            <div className="card" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-4)', flexWrap: 'wrap', padding: 'var(--space-4)' }}>
                <Calendar size={16} style={{ color: 'var(--text-tertiary)', marginBottom: 2 }} />
                <div className="form-group" style={{ minWidth: 140 }}>
                    <label className="form-label">From</label>
                    <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ minWidth: 140 }}>
                    <label className="form-label">To</label>
                    <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => loadReport(startDate, endDate)}>
                    Apply
                </button>
            </div>

            {/* Summary stats */}
            <div className="stats-row">
                <div className="widget stat-widget">
                    <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        <Users size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Total Patients</span>
                        <span className="widget-value">{patientCount}</span>
                    </div>
                </div>
                <div className="widget stat-widget">
                    <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <IndianRupee size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Total Collection</span>
                        <span className="widget-value">₹{Number(totalAmount).toLocaleString()}</span>
                    </div>
                </div>
                <div className="widget stat-widget">
                    <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                        <Percent size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Commission ({commissionRate}%)</span>
                        <span className="widget-value">₹{Number(referralAmount).toLocaleString()}</span>
                    </div>
                </div>
                <div className="widget stat-widget" style={{ background: 'var(--bg-secondary)', border: '1.5px dashed var(--border)' }}>
                    <div className="stat-icon" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                        <IndianRupee size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Avg per Patient</span>
                        <span className="widget-value">
                            ₹{patientCount > 0 ? Math.round(totalAmount / patientCount).toLocaleString() : 0}
                        </span>
                    </div>
                </div>
            </div>

            {/* Cases table */}
            <div className="widget cases-widget">
                <div className="widget-header">
                    <h3 className="widget-title">Referred Cases</h3>
                    <span className="text-xs text-tertiary">
                        {new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' — '}
                        {new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>

                {patients.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Case No.</th>
                                    <th>Patient</th>
                                    <th>Service</th>
                                    <th>Payment Mode</th>
                                    <th>Amount</th>
                                    <th>Commission</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map((p: any, i: number) => (
                                    <tr key={i}>
                                        <td className="text-tertiary text-xs">{i + 1}</td>
                                        <td><span className="badge badge-primary">{p.caseNumber}</span></td>
                                        <td className="font-semibold">{p.patientName}</td>
                                        <td>{p.serviceType}</td>
                                        <td>
                                            <span className={`badge ${p.paymentMode === 'Cash' ? 'badge-success' : 'badge-warning'}`}>
                                                {p.paymentMode}
                                            </span>
                                        </td>
                                        <td>₹{Number(p.amount).toLocaleString()}</td>
                                        <td className="font-semibold" style={{ color: 'var(--warning)' }}>
                                            ₹{Math.round(Number(p.amount) * commissionRate / 100).toLocaleString()}
                                        </td>
                                        <td className="text-sm text-tertiary">
                                            {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: 'var(--bg-secondary)', fontWeight: 600 }}>
                                    <td colSpan={5} style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>Total</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--font-size-sm)' }}>₹{Number(totalAmount).toLocaleString()}</td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--warning)', fontSize: 'var(--font-size-sm)' }}>₹{Number(referralAmount).toLocaleString()}</td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                ) : (
                    <p className="text-secondary text-center" style={{ padding: 'var(--space-10)' }}>
                        No cases referred in this date range.
                    </p>
                )}
            </div>
        </div>
    );
}
