import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { casesApi, organizationApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { CalendarDays, TrendingUp, Users, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const CHART_COLORS = ['#0071E3', '#30D158', '#FF9F0A', '#FF3B30', '#AF52DE', '#FF6482'];

// Generate last 7 days labels
function getLast7Days(): { day: string; dateStr: string }[] {
    const days: { day: string; dateStr: string }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            day: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            dateStr: d.toLocaleDateString('en-CA'), // Returns local timezone YYYY-MM-DD
        });
    }
    return days;
}

export default function DoctorDashboard() {
    const { } = useAuth();
    const navigate = useNavigate();
    const [todayCases, setTodayCases] = useState<any[]>([]);
    const [dashboard, setDashboard] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [casesRes, dashRes] = await Promise.all([
                casesApi.getDailyCases(),
                organizationApi.getDashboard({ period: 'daily' }),
            ]);
            setTodayCases(casesRes.data.cases || []);
            setDashboard(dashRes.data);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const serviceData = dashboard?.serviceBreakdown
        ? Object.entries(dashboard.serviceBreakdown).map(([name, val]: any) => ({ name, value: val.amount, count: val.count }))
        : [];

    // Build patient trend for last 7 days — always show, even if all zeros
    const patientTrend = useMemo(() => {
        const last7 = getLast7Days();
        const backendTrend: any[] = dashboard?.weeklyTrend || [];

        return last7.map(({ day, dateStr }) => {
            // Try to match from backend data
            const match = backendTrend.find((t: any) => {
                if (t.date) return t.date === dateStr;
                if (t.day) return t.day === day;
                return false;
            });
            // Count today's cases if dateStr matches today
            const today = new Date().toISOString().slice(0, 10);
            if (dateStr === today && todayCases.length > 0) {
                return { day, count: todayCases.length };
            }
            return { day, count: match?.count ?? 0 };
        });
    }, [dashboard, todayCases]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loader"></div>
                <p className="text-secondary">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Stats Row */}
            <div className="stats-row">
                <div className="widget stat-widget">
                    <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        <Activity size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Today's Cases</span>
                        <span className="widget-value">{todayCases.length}</span>
                    </div>
                </div>
                <div className="widget stat-widget">
                    <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <TrendingUp size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Total Collection</span>
                        <span className="widget-value">₹{(dashboard?.totalCollection ?? 0).toLocaleString()}</span>
                    </div>
                </div>
                <div className="widget stat-widget">
                    <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                        <Users size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Total Patients</span>
                        <span className="widget-value">{dashboard?.patientCount ?? 0}</span>
                    </div>
                </div>
                <div className="widget stat-widget">
                    <div className="stat-icon" style={{ background: 'rgba(175,82,222,0.1)', color: '#AF52DE' }}>
                        <CalendarDays size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Net Collection</span>
                        <span className="widget-value">₹{(dashboard?.netCollection ?? 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                <div className="widget chart-widget">
                    <div className="widget-header">
                        <h3 className="widget-title">Collection by Service</h3>
                    </div>
                    {serviceData.length > 0 ? (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={serviceData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                                        {serviceData.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number | undefined) => `₹${(value ?? 0).toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="chart-legend">
                                {serviceData.map((d, i) => (
                                    <div key={d.name} className="legend-item">
                                        <span className="legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}></span>
                                        <span className="legend-label">{d.name}</span>
                                        <span className="legend-value">₹{d.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-secondary text-center" style={{ padding: 'var(--space-10)' }}>No data yet for today</p>
                    )}
                </div>

                <div className="widget chart-widget">
                    <div className="widget-header">
                        <h3 className="widget-title">Patient Trend</h3>
                        <span className="badge badge-primary">This Week</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={patientTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                            <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} allowDecimals={false} domain={[0, 'auto']} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--accent)' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Today's Cases — clickable rows */}
            <div className="widget cases-widget">
                <div className="widget-header">
                    <h3 className="widget-title">Today's Cases</h3>
                    <Link to="/search" className="btn btn-sm btn-outline">View All</Link>
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
                                    <tr key={c.id} onClick={() => navigate(`/case/${c.id}`)} style={{ cursor: 'pointer' }}>
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
                    <p className="text-secondary text-center" style={{ padding: 'var(--space-10)' }}>No cases registered today. <Link to="/create-case">Create one →</Link></p>
                )}
            </div>
        </div>
    );
}
