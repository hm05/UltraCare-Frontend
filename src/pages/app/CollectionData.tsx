import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { collectionApi } from '../../api';
import { Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#0071E3', '#30D158', '#FF9F0A', '#FF3B30', '#AF52DE', '#FF6482'];

export default function CollectionData() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

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
                const url = URL.createObjectURL(blob);
                window.open(url);
            } else if (format === 'xlsx') {
                const res = await collectionApi.exportXlsx({ startDate, endDate });
                const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `collection-${startDate}.xlsx`; a.click();
            } else {
                const res = await collectionApi.exportMd({ startDate, endDate });
                const blob = new Blob([res.data], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `collection-${startDate}.md`; a.click();
            }
            toast.dismiss();
            toast.success('Export ready!');
        } catch { toast.dismiss(); toast.error('Export failed'); }
    };

    const serviceData = data?.serviceBreakdown ? Object.entries(data.serviceBreakdown).map(([name, val]: any) => ({ name, value: val.totalAmount || val.amount || 0, count: val.count || 0 })) : [];

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
                    <button className="btn btn-outline btn-sm" onClick={() => handleExport('md')}><FileText size={14} /> MD</button>
                </div>
            </div>

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
                                    <Tooltip formatter={(v: number | undefined) => `₹${(v ?? 0).toLocaleString()}`} />
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
                    <div className="widget-header"><h3 className="widget-title">Cases</h3></div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Case #</th><th>Patient</th><th>Service</th><th>Amount</th><th>Payment</th><th>Date</th></tr></thead>
                            <tbody>
                                {data.cases.map((c: any) => (
                                    <tr key={c.id || c.case_id}>
                                        <td><span className="badge badge-primary">{c.case_number || '—'}</span></td>
                                        <td>{c.patient_name || c.patient?.name || '—'}</td>
                                        <td>{c.service_type}</td>
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
