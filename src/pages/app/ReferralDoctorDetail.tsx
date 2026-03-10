import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { referralApi } from '../../api';
import { ArrowLeft, Building2, Percent, Users, IndianRupee, Download, Calendar } from 'lucide-react';
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
    const [exporting, setExporting] = useState(false);

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

    const handleExport = async () => {
        if (!doctorId) return;
        setExporting(true);
        try {
            const res = await referralApi.exportDoctorPdf(doctorId, { startDate, endDate });
            const blob = new Blob([res.data], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (!win) toast.error('Pop-up blocked. Please allow pop-ups for this site.');
        } catch {
            toast.error('Export failed');
        } finally {
            setExporting(false);
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
                </div>
                <button
                    className="btn btn-outline btn-sm"
                    onClick={handleExport}
                    disabled={exporting}
                    style={{ alignSelf: 'flex-start' }}
                >
                    <Download size={14} /> {exporting ? 'Exporting...' : 'Export PDF'}
                </button>
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
