import { useState, useEffect } from 'react';
import { casesApi } from '../../api';
import { Link } from 'react-router-dom';
import { Search, FilePlus } from 'lucide-react';
import '../Dashboard.css';

export default function StaffDashboard() {
    const [todayCases, setTodayCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        casesApi.getDailyCases()
            .then((res) => {
                setTodayCases(Array.isArray(res.data) ? res.data : []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loader"></div>
                <p className="text-secondary">Loading...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Quick Actions */}
            <div className="stats-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <Link to="/search" className="widget stat-widget" style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        <Search size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Find a Case</span>
                        <span className="widget-value" style={{ fontSize: 'var(--font-size-lg)' }}>Search Case</span>
                    </div>
                </Link>
                <Link to="/create-case" className="widget stat-widget" style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <FilePlus size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Register Patient</span>
                        <span className="widget-value" style={{ fontSize: 'var(--font-size-lg)' }}>Create Case</span>
                    </div>
                </Link>
            </div>

            {/* Today's Cases */}
            <div className="widget cases-widget">
                <div className="widget-header">
                    <h3 className="widget-title">Today's Cases ({todayCases.length})</h3>
                </div>
                {todayCases.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Case #</th>
                                    <th>Patient</th>
                                    <th>Service</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayCases.map((c: any) => (
                                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/case/${c.id}`}>
                                        <td><span className="badge badge-primary">{c.case_number}</span></td>
                                        <td>{c.patient?.name ?? '—'}</td>
                                        <td>{c.service_type}</td>
                                        <td>₹{Number(c.amount ?? 0).toLocaleString()}</td>
                                        <td><span className={`badge ${c.payment_mode === 'Cash' ? 'badge-success' : 'badge-warning'}`}>{c.payment_mode}</span></td>
                                        <td className="text-tertiary text-sm">{new Date(c.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-secondary text-center" style={{ padding: 'var(--space-10)' }}>No cases yet today.</p>
                )}
            </div>
        </div>
    );
}
