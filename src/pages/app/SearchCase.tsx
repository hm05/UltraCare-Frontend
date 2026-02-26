import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesApi } from '../../api';
import { Search as SearchIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './Search.css';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function SearchCase() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const loadCases = useCallback(async (searchQuery?: string, p?: number, l?: number) => {
        setLoading(true);
        try {
            const res = await casesApi.list({
                q: searchQuery || undefined,
                page: p ?? page,
                limit: l ?? limit,
            });
            setCases(res.data.cases || []);
            setTotal(res.data.total || 0);
            setTotalPages(res.data.totalPages || 1);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load cases');
        } finally {
            setLoading(false);
        }
    }, [page, limit]);

    useEffect(() => {
        loadCases(query, page, limit);
    }, [page, limit]);

    // Fast, realtime type-to-search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            loadCases(query, 1, limit);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Standard Submit Form Handler
    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        setPage(1);
        loadCases(query, 1, limit);
    };

    const handlePageSizeChange = (newLimit: number) => {
        setLimit(newLimit);
        setPage(1);
        loadCases(query, 1, newLimit);
    };

    return (
        <div className="search-page">
            <form onSubmit={handleSearch} className="search-bar card">
                <div className="search-input-wrapper">
                    <SearchIcon size={20} className="search-icon" />
                    <input
                        className="search-input"
                        placeholder="Search by UC-101 Case ID or Patient Name..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                        {loading ? <span className="loader" style={{ width: 16, height: 16 }}></span> : 'Search'}
                    </button>
                </div>
            </form>

            <div className="widget cases-widget" style={{ marginTop: 'var(--space-4)' }}>
                <div className="widget-header">
                    <h3 className="widget-title">
                        All Cases <span className="text-secondary text-sm" style={{ fontWeight: 400 }}>({total})</span>
                    </h3>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10)' }}>
                        <div className="loader"></div>
                    </div>
                ) : cases.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Case #</th>
                                    <th>Patient</th>
                                    <th>Phone</th>
                                    <th>Service</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.map((c: any) => (
                                    <tr key={c.id} onClick={() => navigate(`/case/${c.id}`)} style={{ cursor: 'pointer' }}>
                                        <td><span className="badge badge-primary">{c.case_number}</span></td>
                                        <td className="font-semibold">{c.patient?.name ?? '—'}</td>
                                        <td className="text-secondary text-sm">{c.patient?.phone ?? '—'}</td>
                                        <td>{c.service_type}</td>
                                        <td>₹{Number(c.amount ?? 0).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${c.payment_mode === 'Cash' ? 'badge-success' : 'badge-warning'}`}>
                                                {c.payment_mode}
                                            </span>
                                        </td>
                                        <td className="text-sm text-tertiary">
                                            {new Date(c.created_at).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-secondary text-center" style={{ padding: 'var(--space-10)' }}>
                        {query ? `No cases found for "${query}"` : 'No cases created yet'}
                    </p>
                )}

                {/* Pagination */}
                {totalPages > 0 && (
                    <div style={{
                        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                        gap: 'var(--space-4)', padding: 'var(--space-4) var(--space-4) var(--space-2)',
                        borderTop: '1px solid var(--border)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <button
                                className="btn-icon"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                style={{ opacity: page <= 1 ? 0.3 : 1 }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        style={{
                                            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                                            background: page === pageNum ? 'var(--accent)' : 'var(--bg)',
                                            color: page === pageNum ? '#fff' : 'var(--text)',
                                            cursor: 'pointer', fontWeight: page === pageNum ? 600 : 400,
                                            fontSize: 'var(--font-size-sm)',
                                        }}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                className="btn-icon"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                style={{ opacity: page >= totalPages ? 0.3 : 1 }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                        <select
                            className="form-input"
                            value={limit}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            style={{ width: 'auto', minWidth: 90, fontSize: 'var(--font-size-sm)', padding: '6px 10px' }}
                        >
                            {PAGE_SIZE_OPTIONS.map(s => (
                                <option key={s} value={s}>{s}/Page</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
}
