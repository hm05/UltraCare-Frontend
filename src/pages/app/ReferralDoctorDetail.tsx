import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { referralApi } from '../../api';
import { ArrowLeft, Pencil, Save, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReferralDoctorDetail() {
    const { doctorId } = useParams<{ doctorId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    // Default to Indian financial year start (April 1)
    const fyStart = (() => {
        const now = new Date();
        const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        return `${year}-04-01`;
    })();
    const [startDate, setStartDate] = useState(fyStart);
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [filterKey, setFilterKey] = useState(0); // triggers reload

    // Edit state
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    const loadReport = useCallback(async (sd?: string, ed?: string) => {
        if (!doctorId) return;
        setLoading(true);
        try {
            const params: any = {};
            const s = sd !== undefined ? sd : startDate;
            const e = ed !== undefined ? ed : endDate;
            if (s) params.startDate = s;
            if (e) params.endDate = e;
            const res = await referralApi.getReport(doctorId, params);
            setData(res.data);
        } catch {
            toast.error('Failed to load doctor details');
            navigate('/referrals');
        } finally {
            setLoading(false);
        }
    }, [doctorId, startDate, endDate, navigate]);

    useEffect(() => { loadReport(); }, [doctorId, filterKey]);

    const handleFilter = () => { setFilterKey(k => k + 1); };

    const handleClear = () => {
        setStartDate('');
        setEndDate('');
        // Load with empty dates immediately
        loadReport('', '');
    };

    const startEditing = () => {
        const d = data?.doctor;
        setEditForm({
            doctorName: d?.name || '',
            hospitalName: d?.hospitalName || '',
            designation: d?.designation || '',
            phone: d?.phone || '',
            referralPercentage: d?.referralPercentage ?? '',
        });
        setEditing(true);
    };

    const saveEdit = async () => {
        try {
            await referralApi.register({
                ...editForm,
                referralPercentage: Number(editForm.referralPercentage) || 0,
            });
            toast.success('Doctor updated');
            setEditing(false);
            loadReport();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Update failed');
        }
    };

    const handleExport = async (format: 'pdf' | 'xlsx') => {
        try {
            toast.loading('Generating...');
            if (format === 'pdf') {
                const res = await referralApi.exportDoctorPdf(doctorId!, { startDate, endDate });
                const blob = new Blob([res.data], { type: 'text/html' });
                window.open(URL.createObjectURL(blob));
            }
            toast.dismiss();
            toast.success('Export ready!');
        } catch {
            toast.dismiss();
            toast.error('Export failed');
        }
    };

    if (loading && !data) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><div className="loader"></div></div>;
    if (!data) return <p className="text-secondary">Doctor not found</p>;

    const doctor = data.doctor;
    const commissionAmount = Math.round((data.totalAmount || 0) * (doctor.referralPercentage || 0) / 100);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <button onClick={() => navigate('/referrals')} className="btn btn-sm btn-outline" style={{ alignSelf: 'flex-start' }}>
                <ArrowLeft size={14} /> Back to Referrals
            </button>

            {/* Doctor Info Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>{doctor.name}</h2>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {!editing && (
                            <button className="btn btn-sm btn-outline" onClick={startEditing}>
                                <Pencil size={14} /> Edit
                            </button>
                        )}
                        <button className="btn btn-sm btn-outline" onClick={() => handleExport('pdf')}>
                            <Download size={14} /> Export PDF
                        </button>
                    </div>
                </div>

                {editing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Doctor Name</label>
                                <input className="form-input" value={editForm.doctorName} onChange={e => setEditForm({ ...editForm, doctorName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hospital</label>
                                <input className="form-input" value={editForm.hospitalName} onChange={e => setEditForm({ ...editForm, hospitalName: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Designation</label>
                                <input className="form-input" value={editForm.designation} onChange={e => setEditForm({ ...editForm, designation: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Commission %</label>
                                <input className="form-input" type="number" value={editForm.referralPercentage} onChange={e => setEditForm({ ...editForm, referralPercentage: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-sm btn-primary" onClick={saveEdit}><Save size={14} /> Save</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditing(false)}><X size={14} /> Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Hospital</p>
                            <p className="font-semibold">{doctor.hospitalName || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Designation</p>
                            <p>{doctor.designation || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Phone</p>
                            <p>{doctor.phone || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Commission Rate</p>
                            <p><span className="badge badge-warning">{doctor.referralPercentage}%</span></p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Total Cases</p>
                            <p className="font-semibold">{data.patientCount || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Total Amount</p>
                            <p className="font-semibold">₹{Number(data.totalAmount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Commission Due</p>
                            <p className="font-semibold" style={{ color: 'var(--accent)' }}>₹{commissionAmount.toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Date Range Filter */}
            <div className="card" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ minWidth: 150 }}>
                    <label className="form-label">From</label>
                    <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ minWidth: 150 }}>
                    <label className="form-label">To</label>
                    <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleFilter} disabled={loading}>
                    {loading ? <span className="loader" style={{ width: 16, height: 16 }}></span> : 'Filter'}
                </button>
                {(startDate || endDate) && (
                    <button className="btn btn-secondary btn-sm" onClick={handleClear}>
                        Clear
                    </button>
                )}
            </div>

            {/* Referred Cases */}
            <div className="widget">
                <div className="widget-header"><h3 className="widget-title">Referred Cases ({data.patients?.length || 0})</h3></div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr><th>Case #</th><th>Patient</th><th>Service</th><th>Payment</th><th>Amount</th><th>Commission</th><th>Date</th></tr>
                        </thead>
                        <tbody>
                            {(data.patients || []).map((p: any, i: number) => (
                                <tr key={i}>
                                    <td><span className="badge badge-primary">{p.caseNumber || '—'}</span></td>
                                    <td className="font-semibold">{p.patientName}</td>
                                    <td>{p.serviceType}</td>
                                    <td><span className={`badge ${p.paymentMode === 'Cash' ? 'badge-success' : 'badge-warning'}`}>{p.paymentMode || '—'}</span></td>
                                    <td>₹{Number(p.amount || 0).toLocaleString()}</td>
                                    <td className="font-semibold" style={{ color: 'var(--accent)' }}>
                                        ₹{Math.round(Number(p.amount || 0) * (doctor.referralPercentage || 0) / 100).toLocaleString()}
                                    </td>
                                    <td className="text-sm text-tertiary">{p.date ? new Date(p.date).toLocaleDateString('en-IN') : '—'}</td>
                                </tr>
                            ))}
                            {(!data.patients || data.patients.length === 0) && (
                                <tr><td colSpan={7} className="text-center text-secondary" style={{ padding: 'var(--space-6)' }}>No cases found for this date range</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
