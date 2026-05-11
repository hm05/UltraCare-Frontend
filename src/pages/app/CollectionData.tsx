import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { collectionApi } from '../../api';
import { Download, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#0071E3', '#30D158', '#FF9F0A', '#FF3B30', '#AF52DE', '#FF6482'];

export default function CollectionData() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // Default to Indian financial year start (April 1)
    const fyStart = (() => {
        const now = new Date();
        const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        return `${year}-04-01`;
    })();
    const [startDate, setStartDate] = useState(fyStart);
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

    // Modified export state
    const [showModified, setShowModified] = useState(false);
    const [modTargetAmount, setModTargetAmount] = useState('');
    const [modPercentage, setModPercentage] = useState('');
    const [modFormat, setModFormat] = useState<'pdf' | 'xlsx' | 'md'>('pdf');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await collectionApi.get({ startDate, endDate });
            setData(res.data);
        } catch { console.error('Failed to load collection'); } finally { setLoading(false); }
    };

    const handleExport = async (format: 'pdf' | 'xlsx' | 'md') => {
        try {
            toast.loading('Generating export...');
            if (format === 'pdf') {
                const res = await collectionApi.exportPdf({ startDate, endDate });
                const blob = new Blob([res.data], { type: 'text/html' });
                window.open(URL.createObjectURL(blob));
            } else if (format === 'xlsx') {
                const res = await collectionApi.exportXlsx({ startDate, endDate });
                const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `collection-${startDate}.xlsx`; a.click();
            } else {
                const res = await collectionApi.exportMd({ startDate, endDate });
                const blob = new Blob([res.data], { type: 'text/markdown' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `collection-${startDate}.md`; a.click();
            }
            toast.dismiss(); toast.success('Export ready!');
        } catch { toast.dismiss(); toast.error('Export failed'); }
    };

    const handleModifiedExport = async () => {
        try {
            toast.loading('Generating modified export...');
            const payload: any = { format: modFormat, startDate, endDate };
            if (modTargetAmount) {
                payload.targetAmount = Number(modTargetAmount);
                payload.percentage = 0;
            } else {
                payload.percentage = Number(modPercentage) || 0;
            }
            const res = await collectionApi.exportModified(payload);
            if (modFormat === 'pdf') {
                const blob = new Blob([res.data], { type: 'text/html' });
                window.open(URL.createObjectURL(blob));
            } else {
                const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `collection-modified-${startDate}.xlsx`; a.click();
            }
            toast.dismiss(); toast.success('Modified export ready!');
            setShowModified(false);
        } catch { toast.dismiss(); toast.error('Modified export failed'); }
    };

    const serviceData = data?.serviceBreakdown
        ? Object.entries(data.serviceBreakdown).map(([name, val]: any) => ({
            name,
            value: val.totalAmount || val.amount || 0,
            count: val.count || 0,
        }))
        : [];

    return (
        <div className="dashboard-page">
            {/* Filters */}
            <div className="card" style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ minWidth: 150 }}>
                    <label className="form-label">From</label>
                    <input className="form-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ minWidth: 150 }}>
                    <label className="form-label">To</label>
                    <input className="form-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={loadData} disabled={loading}>
                    {loading ? <span className="loader" style={{ width: 16, height: 16 }}></span> : 'Load'}
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleExport('pdf')}><Download size={14} /> PDF</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleExport('xlsx')}><Download size={14} /> Excel</button>
                    <button className="btn btn-sm" onClick={() => setShowModified(!showModified)}
                        style={{ background: 'var(--accent-secondary, #FF9F0A)', color: '#fff', border: 'none' }}>
                        <Settings2 size={14} /> Modified
                    </button>
                </div>
            </div>

            {/* Modified Export Panel */}
            {showModified && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', border: '1px solid var(--accent-secondary, #FF9F0A)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>Modified Export</h3>
                    <p className="text-xs text-secondary">Adjust cash amounts for reporting. Only cash totals are changed; online payments stay the same. This does NOT affect your actual data.</p>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Target Total Amount (₹)</label>
                            <input className="form-input" type="number" placeholder="e.g. 1750" value={modTargetAmount}
                                onChange={e => { setModTargetAmount(e.target.value); if (e.target.value) setModPercentage(''); }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Or Reduce Cash By %</label>
                            <input className="form-input" type="number" placeholder="e.g. 25" value={modPercentage}
                                onChange={e => { setModPercentage(e.target.value); if (e.target.value) setModTargetAmount(''); }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Format</label>
                            <select className="form-input" value={modFormat} onChange={e => setModFormat(e.target.value as any)}>
                                <option value="pdf">PDF</option>
                                <option value="xlsx">Excel</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-primary btn-sm" onClick={handleModifiedExport}
                            disabled={!modTargetAmount && !modPercentage}>
                            <Download size={14} /> Generate Modified Report
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowModified(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Chart & Summary */}
            <div className="charts-row">
                <div className="widget chart-widget">
                    <div className="widget-header"><h3 className="widget-title">Collection Breakdown</h3></div>
                    {serviceData.length > 0 ? (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={serviceData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                                        {serviceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: unknown) => `₹${(Number(v) || 0).toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="chart-legend">
                                {serviceData.map((d, i) => (
                                    <div key={d.name} className="legend-item">
                                        <span className="legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}></span>
                                        <span className="legend-label">{d.name} ({d.count})</span>
                                        <span className="legend-value">₹{d.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <p className="text-secondary text-center" style={{ padding: 'var(--space-10)' }}>No data for selected range</p>}
                </div>

                <div className="widget">
                    <div className="widget-header"><h3 className="widget-title">Summary</h3></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-secondary">Total Cases</span><span className="font-semibold">{data?.totalCases ?? 0}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-secondary">Total Collection</span><span className="font-semibold">₹{(data?.totalAmount ?? 0).toLocaleString()}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-secondary">Cash Collection</span><span className="font-semibold">₹{(data?.cashTotal ?? 0).toLocaleString()}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-secondary">Online Collection</span><span className="font-semibold">₹{(data?.onlineTotal ?? 0).toLocaleString()}</span></div>
                    </div>
                </div>
            </div>

            {/* Cases Table */}
            {data?.cases?.length > 0 && (
                <div className="widget cases-widget">
                    <div className="widget-header"><h3 className="widget-title">Cases & Revisits</h3></div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Case #</th><th>Patient</th><th>Service</th><th>Amount</th><th>Payment</th><th>Date</th></tr></thead>
                            <tbody>
                                {data.cases.map((c: any) => (
                                    <tr key={c.id || c.case_number} className={c.is_revisit ? 'revisit-row' : ''}>
                                        <td><span className={`badge ${c.is_revisit ? 'badge-secondary' : 'badge-primary'}`}>{c.case_number || '—'}</span></td>
                                        <td>{c.patient_name || '—'}</td>
                                        <td>
                                            {c.is_revisit ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF9F0A' }}></span>
                                                    Revisit {c.reason ? `(${c.reason})` : ''}
                                                </span>
                                            ) : c.service_type}
                                        </td>
                                        <td>₹{Number(c.amount ?? 0).toLocaleString()}</td>
                                        <td><span className={`badge ${c.payment_mode === 'Cash' ? 'badge-success' : 'badge-warning'}`}>{c.payment_mode}</span></td>
                                        <td className="text-sm text-tertiary">{c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
