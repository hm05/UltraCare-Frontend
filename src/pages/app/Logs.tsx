import { useState, useEffect, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { logsApi } from '../../api';
import {
    FilePlus, Pencil, Eye, FileText, Trash2, Activity,
    Search, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';

// ─── Action config ────────────────────────────────────────────────────────────
const ACTION_META: Record<string, { label: string; icon: FC<any>; color: string; bg: string }> = {
    created_case: { label: 'Case Created', icon: FilePlus, color: 'var(--success)', bg: 'var(--success-bg)' },
    edited_case: { label: 'Case Edited', icon: Pencil, color: 'var(--warning)', bg: 'var(--warning-bg)' },
    viewed_case: { label: 'Case Viewed', icon: Eye, color: 'var(--accent)', bg: 'var(--accent-light)' },
    added_report: { label: 'Report Added', icon: FileText, color: '#AF52DE', bg: 'rgba(175,82,222,0.1)' },
    deleted_case: { label: 'Case Deleted', icon: Trash2, color: 'var(--danger)', bg: 'var(--danger-bg)' },
};

const DEFAULT_META = { label: 'Activity', icon: Activity, color: 'var(--text-tertiary)', bg: 'var(--bg-secondary)' };

function getActionMeta(action: string) {
    return ACTION_META[action] ?? { ...DEFAULT_META, label: action.replace(/_/g, ' ') };
}

function formatRelative(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return 'yesterday';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function groupByDate(logs: any[]): { label: string; items: any[] }[] {
    const groups: Record<string, any[]> = {};
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    for (const log of logs) {
        const d = new Date(log.created_at).toISOString().slice(0, 10);
        const label = d === today ? 'Today' : d === yesterday ? 'Yesterday'
            : new Date(log.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        if (!groups[label]) groups[label] = [];
        groups[label].push(log);
    }

    return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export default function Logs() {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    useEffect(() => {
        logsApi.list()
            .then(res => setLogs(res.data.logs || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        return logs.filter(log => {
            const actorName = `${log.user?.first_name || ''} ${log.user?.last_name || ''}`.toLowerCase();
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || actorName.includes(q) || log.action.includes(q)
                || JSON.stringify(log.details || {}).toLowerCase().includes(q);
            const matchesFilter = filterAction === 'all' || log.action === filterAction;
            return matchesSearch && matchesFilter;
        });
    }, [logs, searchQuery, filterAction]);

    const grouped = useMemo(() => groupByDate(filtered), [filtered]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loader"></div>
                <p className="text-secondary">Loading activity...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Header stats */}
            <div className="stats-row">
                <div className="widget stat-widget">
                    <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        <Activity size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Total Events</span>
                        <span className="widget-value">{logs.length}</span>
                    </div>
                </div>
                <div className="widget stat-widget">
                    <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <FilePlus size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Cases Created</span>
                        <span className="widget-value">{logs.filter(l => l.action === 'created_case').length}</span>
                    </div>
                </div>
                <div className="widget stat-widget">
                    <div className="stat-icon" style={{ background: 'rgba(175,82,222,0.1)', color: '#AF52DE' }}>
                        <FileText size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Reports Added</span>
                        <span className="widget-value">{logs.filter(l => l.action === 'added_report').length}</span>
                    </div>
                </div>
                <div className="widget stat-widget">
                    <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                        <Trash2 size={22} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label-text">Cases Deleted</span>
                        <span className="widget-value">{logs.filter(l => l.action === 'deleted_case').length}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap', padding: 'var(--space-4)' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                    <input
                        className="form-input"
                        placeholder="Search by actor, action, or details..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: 36 }}
                    />
                </div>
                <select
                    className="form-input"
                    value={filterAction}
                    onChange={e => setFilterAction(e.target.value)}
                    style={{ width: 'auto', minWidth: 160 }}
                >
                    <option value="all">All Actions</option>
                    {Object.entries(ACTION_META).map(([key, meta]) => (
                        <option key={key} value={key}>{meta.label}</option>
                    ))}
                </select>
                <span className="text-sm text-secondary">{filtered.length} events</span>
            </div>

            {/* Timeline */}
            {grouped.length === 0 ? (
                <div className="widget" style={{ alignItems: 'center', justifyContent: 'center', padding: 'var(--space-16)', gap: 'var(--space-3)' }}>
                    <Calendar size={40} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-secondary">{searchQuery || filterAction !== 'all' ? 'No events match your filters' : 'No activity recorded yet'}</p>
                </div>
            ) : (
                grouped.map(({ label, items }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {/* Date divider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: '0 var(--space-1)' }}>
                            <span style={{
                                fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-tertiary)',
                                textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                            }}>{label}</span>
                            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                                {items.length} {items.length === 1 ? 'event' : 'events'}
                            </span>
                        </div>

                        {/* Log cards */}
                        <div className="widget" style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
                            {items.map((log, idx) => {
                                const meta = getActionMeta(log.action);
                                const Icon = meta.icon;
                                const isExpanded = expandedLog === log.id;
                                const isClickable = log.entity_type === 'case' && log.entity_id;
                                const hasDetails = log.details && Object.keys(log.details).length > 0;

                                return (
                                    <div
                                        key={log.id}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                                                padding: 'var(--space-3) var(--space-5)',
                                                cursor: hasDetails ? 'pointer' : 'default',
                                                transition: 'background var(--transition-fast)',
                                            }}
                                            onClick={() => hasDetails && setExpandedLog(isExpanded ? null : log.id)}
                                            onMouseEnter={e => { if (hasDetails) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                                        >
                                            {/* Action icon */}
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
                                                background: meta.bg, color: meta.color,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Icon size={16} />
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{meta.label}</span>
                                                    {log.details?.patient_name && (
                                                        <span className="text-secondary text-xs">— {log.details.patient_name}</span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 2 }}>
                                                    <span className="text-xs text-tertiary">
                                                        {log.user?.first_name} {log.user?.last_name}
                                                    </span>
                                                    {log.user?.role && (
                                                        <span className="badge" style={{
                                                            fontSize: 10, padding: '1px 6px',
                                                            background: log.user.role === 'doctor' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                                                            color: log.user.role === 'doctor' ? 'var(--accent)' : 'var(--text-tertiary)',
                                                        }}>{log.user.role}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right side */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                                                <span className="text-xs text-tertiary">{formatRelative(log.created_at)}</span>
                                                {isClickable && (
                                                    <button
                                                        className="btn btn-sm btn-outline"
                                                        style={{ fontSize: 11, padding: '2px 10px' }}
                                                        onClick={e => { e.stopPropagation(); navigate(`/case/${log.entity_id}`); }}
                                                    >
                                                        View Case
                                                    </button>
                                                )}
                                                {hasDetails && (
                                                    isExpanded ? <ChevronUp size={14} style={{ color: 'var(--text-tertiary)' }} />
                                                        : <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded details */}
                                        {isExpanded && hasDetails && (
                                            <div style={{
                                                padding: 'var(--space-3) var(--space-5) var(--space-4)',
                                                paddingLeft: `calc(var(--space-5) + 36px + var(--space-4))`,
                                                background: 'var(--bg-secondary)',
                                                borderTop: '1px solid var(--border)',
                                            }}>
                                                {Object.entries(log.details).map(([k, v]) => (
                                                    <div key={k} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 4 }}>
                                                        <span className="text-xs text-tertiary" style={{ minWidth: 100, textTransform: 'capitalize' }}>
                                                            {k.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="text-xs" style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                                            {Array.isArray(v) ? (v as any[]).join(', ') : String(v)}
                                                        </span>
                                                    </div>
                                                ))}
                                                <p className="text-xs text-tertiary" style={{ marginTop: 'var(--space-2)' }}>
                                                    {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'medium' })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
