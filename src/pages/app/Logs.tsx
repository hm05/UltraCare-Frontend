import { useState, useEffect } from 'react';
import { logsApi } from '../../api/logsApi';
import { MonitorPlay, FilePlus, Edit, Eye, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import './Logs.css';

export default function Logs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await logsApi.getLogs();
            setLogs(res.data.logs || []);
        } catch (err) {
            toast.error('Failed to load activity logs.');
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'created_case': return <FilePlus size={18} className="text-blue" />;
            case 'viewed_case': return <Eye size={18} className="text-gray" />;
            case 'edited_case': return <Edit size={18} className="text-yellow" />;
            case 'added_report': return <MonitorPlay size={18} className="text-green" />;
            default: return <MonitorPlay size={18} className="text-gray" />;
        }
    };

    const formatActionText = (action: string) => {
        return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const filteredLogs = filter === 'All'
        ? logs
        : logs.filter(log => log.action === filter);

    return (
        <div className="logs-container">
            <header className="logs-header">
                <div>
                    <h1 className="text-2xl font-bold">Activity Logs</h1>
                    <p className="text-sm text-secondary">Compliance tracking for all organization operations.</p>
                </div>

                <div className="filter-group">
                    <Filter size={16} />
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
                        <option value="All">All Actions</option>
                        <option value="created_case">Created Case</option>
                        <option value="viewed_case">Viewed Case</option>
                        <option value="edited_case">Edited Case</option>
                        <option value="added_report">Added Report</option>
                    </select>
                </div>
            </header>

            <main className="logs-main card">
                {loading ? (
                    <div className="table-loader"><span className="loader"></span></div>
                ) : filteredLogs.length === 0 ? (
                    <div className="empty-state">
                        <p>No activity logs found for this filter.</p>
                    </div>
                ) : (
                    <div className="logs-timeline">
                        {filteredLogs.map(log => (
                            <div key={log.id} className="log-row">
                                <div className="log-icon-container">
                                    {getActionIcon(log.action)}
                                </div>

                                <div className="log-details">
                                    <div className="log-actor">
                                        <strong>{log.user?.first_name || 'System'} {log.user?.last_name || 'User'}</strong>
                                        <span className="log-role">({log.user?.role || 'user'})</span>
                                    </div>
                                    <div className="log-action">
                                        <span className="action-tag">{formatActionText(log.action)}</span>
                                        {log.entity_type === 'case' && log.details?.patient_name && (
                                            <span className="action-context">
                                                for patient <strong>{log.details.patient_name}</strong>
                                            </span>
                                        )}
                                        {log.entity_type === 'case' && log.details?.updates && (
                                            <span className="action-context">
                                                updating fields: <em>{log.details.updates.join(', ')}</em>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="log-time text-sm text-secondary">
                                    {new Date(log.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
