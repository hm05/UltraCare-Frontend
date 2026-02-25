import React, { useState } from 'react';
import { patientsApi } from '../../api';
import { Search as SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Search.css';

export default function SearchCase() {
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState<'name' | 'phone' | 'caseNumber'>('name');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const params: any = {};
            if (searchType === 'name') params.q = query;
            else if (searchType === 'phone') params.phone = query;
            else params.caseNumber = query;
            const res = await patientsApi.search(params);
            setResults(res.data.results || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-page">
            <form onSubmit={handleSearch} className="search-bar card">
                <div className="search-tabs">
                    {(['name', 'phone', 'caseNumber'] as const).map((t) => (
                        <button key={t} type="button" className={`tab ${searchType === t ? 'active' : ''}`} onClick={() => setSearchType(t)}>
                            {t === 'caseNumber' ? 'Case #' : t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="search-input-wrapper">
                    <SearchIcon size={20} className="search-icon" />
                    <input
                        className="search-input"
                        placeholder={searchType === 'name' ? 'Search by patient name...' : searchType === 'phone' ? 'Search by phone number...' : 'Search by case number (UC-XXXXX)...'}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                        {loading ? <span className="loader" style={{ width: 16, height: 16 }}></span> : 'Search'}
                    </button>
                </div>
            </form>

            {searched && (
                <div className="search-results">
                    {results.length > 0 ? (
                        searchType === 'caseNumber' ? (
                            <div className="table-wrapper card">
                                <table>
                                    <thead><tr><th>Case #</th><th>Patient</th><th>Service</th><th>Amount</th><th>Date</th></tr></thead>
                                    <tbody>
                                        {results.map((c: any) => (
                                            <tr key={c.id}>
                                                <td><span className="badge badge-primary">{c.case_number}</span></td>
                                                <td>{c.patient?.name ?? '—'}</td>
                                                <td>{c.service_type}</td>
                                                <td>₹{Number(c.amount ?? 0).toLocaleString()}</td>
                                                <td className="text-sm text-tertiary">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="patient-grid">
                                {results.map((p: any) => (
                                    <Link to={`/patient/${p.id}`} key={p.id} className="patient-card card">
                                        <div className="patient-avatar">{p.name?.charAt(0)}</div>
                                        <div className="patient-info">
                                            <h3>{p.name}</h3>
                                            <p className="text-sm text-secondary">{p.sex} · {p.age_years ? `${p.age_years}y` : ''} {p.age_months ? `${p.age_months}m` : ''}</p>
                                            <p className="text-xs text-tertiary">{p.phone} · {p.city || p.address_line_1 || ''}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="no-results card">
                            <p className="text-secondary">No results found for "{query}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
