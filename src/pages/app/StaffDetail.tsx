import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizationApi } from '../../api';
import { ArrowLeft, User, Phone, DollarSign, Calendar, ClipboardList, Save, X, Ban, Cake, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffDetail() {
    const { staffId } = useParams<{ staffId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<any>(null);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '', birthday: '', salary: '' });
    const [loggingAbsent, setLoggingAbsent] = useState(false);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        if (!staffId) return;
        setLoading(true);
        try {
            const res = await organizationApi.getHRStaffDetail(staffId);
            setStaff(res.data);
            setEditForm({
                firstName: res.data.first_name || '',
                lastName: res.data.last_name || '',
                phone: res.data.phone || '',
                birthday: res.data.birthday ? res.data.birthday.slice(0, 10) : '',
                salary: res.data.salary || '',
            });
        } catch {
            toast.error('Failed to load staff details');
            navigate('/settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [staffId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await organizationApi.updateHRStaff(staffId!, {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                phone: editForm.phone || undefined,
                birthday: editForm.birthday || undefined,
                salary: editForm.salary ? Number(editForm.salary) : undefined,
            });
            toast.success('Staff updated');
            setEditing(false);
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <div className="loader" />
        </div>
    );

    if (!staff) return <p className="text-secondary">Staff not found.</p>;

    const fullName = `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || '—';
    const initials = ((staff.first_name?.[0] ?? '') + (staff.last_name?.[0] ?? '')).toUpperCase() || '?';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* ── Top bar ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <button
                    className="btn-icon"
                    onClick={() => navigate('/settings')}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0 }}>Staff Profile</h1>
                    <p className="text-sm text-secondary" style={{ margin: 0 }}>{fullName}</p>
                </div>
            </div>

            {/* ── Profile card ── */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'var(--accent-light)', color: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 'var(--font-size-lg)',
                        }}>
                            {initials}
                        </div>
                        <div>
                            <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, margin: 0 }}>{fullName}</h2>
                            <p className="text-sm text-secondary" style={{ margin: 0 }}>Staff Member</p>
                        </div>
                    </div>
                    {!editing ? (
                        (() => {
                            const today = new Date().toISOString().slice(0, 10);
                            const isAbsentToday = staff.events?.some((e: any) =>
                                e.type === 'absent' && new Date(e.date).toISOString().slice(0, 10) === today
                            );
                            return (
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    <button className="btn btn-sm btn-outline" onClick={() => setEditing(true)}>
                                        Edit Details
                                    </button>
                                    <button
                                        className={`btn btn-sm ${isAbsentToday ? 'btn-success' : 'btn-danger'}`}
                                        onClick={async () => {
                                            setLoggingAbsent(true);
                                            try {
                                                await organizationApi.markStaffAbsent(staffId!, today);
                                                toast.success(isAbsentToday ? 'Absent removed for today' : 'Staff marked absent for today');
                                                load();
                                            } catch (err: any) {
                                                toast.error(err.response?.data?.error || 'Failed');
                                            } finally {
                                                setLoggingAbsent(false);
                                            }
                                        }}
                                        disabled={loggingAbsent}
                                        style={isAbsentToday ? {
                                            background: 'var(--success)',
                                            color: '#000',
                                            fontWeight: 600,
                                            border: '2px solid var(--success)',
                                            boxShadow: '0 0 0 2px rgba(48, 209, 88, 0.3)'
                                        } : undefined}
                                    >
                                        {isAbsentToday ? (
                                            <><CheckCircle size={14} /> {loggingAbsent ? 'Updating...' : 'Remove Absent'}</>
                                        ) : (
                                            <><Ban size={14} /> {loggingAbsent ? 'Logging...' : 'Log Absent'}</>
                                        )}
                                    </button>
                                </div>
                            );
                        })()
                    ) : (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
                                <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditing(false)}>
                                <X size={14} /> Cancel
                            </button>
                        </div>
                    )}
                </div>

                {editing ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <div className="form-group">
                            <label className="form-label">First Name *</label>
                            <input
                                className="form-input"
                                value={editForm.firstName}
                                onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name *</label>
                            <input
                                className="form-input"
                                value={editForm.lastName}
                                onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input
                                className="form-input"
                                value={editForm.phone}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Base Salary (₹)</label>
                            <input
                                className="form-input"
                                type="number"
                                value={editForm.salary}
                                onChange={e => setEditForm({ ...editForm, salary: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Birthday</label>
                            <input
                                className="form-input"
                                type="date"
                                value={editForm.birthday}
                                onChange={e => setEditForm({ ...editForm, birthday: e.target.value })}
                            />
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
                        {[
                            { icon: User, label: 'Full Name', value: fullName },
                            { icon: Phone, label: 'Phone', value: staff.phone || '—' },
                            { icon: DollarSign, label: 'Base Salary', value: staff.salary ? `₹${Number(staff.salary).toLocaleString()}` : '—' },
                            { icon: Calendar, label: 'Absences', value: `${staff.absences ?? 0} days` },
                            { icon: Cake, label: 'Birthday', value: staff.birthday ? new Date(staff.birthday).toLocaleDateString('en-IN') : '—' },
                            { icon: ClipboardList, label: 'Cases Handled', value: `${staff.cases?.length ?? 0}` },
                            { icon: Calendar, label: 'Joined', value: staff.created_at ? new Date(staff.created_at).toLocaleDateString('en-IN') : '—' },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                                    <Icon size={14} style={{ color: 'var(--text-tertiary)' }} />
                                    <p className="text-xs text-tertiary" style={{ margin: 0 }}>{label}</p>
                                </div>
                                <p style={{ fontWeight: 600, margin: 0 }}>{value}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Events Calendar ── */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, margin: 0 }}>Events Calendar</h3>
                    <span className="text-xs text-tertiary">{staff.events?.length ?? 0} events</span>
                </div>
                {staff.events?.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Event</th>
                                    <th>Date</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.events.map((event: any, idx: number) => (
                                    <tr key={idx}>
                                        <td>
                                            <span className={`badge ${
                                                event.type === 'birthday' ? 'badge-success' : 
                                                event.type === 'absent' ? 'badge-danger' : 
                                                'badge-primary'
                                            }`}>
                                                {event.type === 'birthday' && <Cake size={12} style={{ marginRight: 4 }} />}
                                                {event.type === 'absent' && <Ban size={12} style={{ marginRight: 4 }} />}
                                                {event.type === 'joined' && <User size={12} style={{ marginRight: 4 }} />}
                                                {event.title}
                                            </span>
                                        </td>
                                        <td className="text-xs text-tertiary">
                                            {new Date(event.date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td>{event.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-secondary text-center" style={{ padding: 'var(--space-8)' }}>
                        No events recorded yet.
                    </p>
                )}
            </div>

            {/* ── Cases handled ── */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, margin: 0 }}>Cases Handled</h3>
                    <span className="text-xs text-tertiary">{staff.cases?.length ?? 0} total</span>
                </div>
                {staff.cases?.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Case #</th>
                                    <th>Patient</th>
                                    <th>Service</th>
                                    <th>Amount</th>
                                    <th>Payment</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.cases.map((c: any) => (
                                    <tr
                                        key={c.id}
                                        onClick={() => navigate(`/case/${c.id}`)}
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                                    >
                                        <td><span className="badge badge-primary">{c.case_number}</span></td>
                                        <td>{c.patient_name || '—'}</td>
                                        <td>{c.service_type || '—'}</td>
                                        <td>₹{Number(c.amount ?? 0).toLocaleString()}</td>
                                        <td>
                                            <span className={`badge ${c.payment_mode === 'Cash' ? 'badge-success' : 'badge-warning'}`}>
                                                {c.payment_mode || '—'}
                                            </span>
                                        </td>
                                        <td className="text-xs text-tertiary">
                                            {new Date(c.created_at).toLocaleDateString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-secondary text-center" style={{ padding: 'var(--space-8)' }}>
                        No cases assigned to this staff member yet.
                    </p>
                )}
            </div>
        </div>
    );
}
