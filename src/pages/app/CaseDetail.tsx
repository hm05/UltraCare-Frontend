import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { casesApi, uploadApi, organizationApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Pencil, Save, X, Trash2, Download, Printer, Mail, FileText, Upload, ArrowLeft, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

const SERVICE_TYPES = ['Sonography', 'Obs. Sonography', 'X-Ray', 'C.T.', 'M.R.I.', 'N.A.'] as const;
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Cheque', 'NEFT', 'Other'] as const;

export default function CaseDetail() {
    const { caseId } = useParams<{ caseId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

    const [loading, setLoading] = useState(true);
    const [caseData, setCaseData] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [visits, setVisits] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadNote, setUploadNote] = useState('');

    // Reporting template state
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [reportContent, setReportContent] = useState('');
    const [creatingReport, setCreatingReport] = useState(false);
    const [uploadType, setUploadType] = useState('Report');

    const loadCase = async () => {
        if (!caseId) return;
        setLoading(true);
        try {
            const res = await casesApi.getDetail(caseId);
            setCaseData(res.data.case);
            setReports(res.data.reports || []);
            setVisits(res.data.visits || []);
            setDocuments(res.data.documents || []);
        } catch (err) {
            toast.error('Failed to load case');
            navigate('/search');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCase(); loadTemplates(); }, [caseId]);

    const loadTemplates = async () => {
        try {
            const res = await organizationApi.getTemplates();
            setTemplates(res.data.templates || []);
        } catch { /* templates optional */ }
    };

    const applyTemplate = (reportType: string) => {
        setSelectedTemplate(reportType);
        const tmpl = templates.find((t: any) => t.report_type === reportType);
        if (tmpl && caseData) {
            const p = Array.isArray(caseData.patient) ? caseData.patient[0] : caseData.patient;
            let content = tmpl.template_content || '';
            content = content.replace(/\{\{patient_name\}\}/gi, p?.name || '—');
            content = content.replace(/\{\{age\}\}/gi, `${p?.age_years || ''}y ${p?.age_months || ''}m`);
            content = content.replace(/\{\{sex\}\}/gi, p?.sex || '—');
            content = content.replace(/\{\{case_number\}\}/gi, caseData.case_number || '—');
            content = content.replace(/\{\{service_type\}\}/gi, caseData.service_type || '—');
            content = content.replace(/\{\{date\}\}/gi, new Date(caseData.created_at).toLocaleDateString('en-IN'));
            content = content.replace(/\{\{referred_by\}\}/gi, caseData.referred_by || '—');
            setReportContent(content);
        } else {
            setReportContent('');
        }
    };

    const handleCreateReport = async () => {
        if (!reportContent.trim()) { toast.error('Report content is empty'); return; }
        setCreatingReport(true);
        try {
            await casesApi.createReport(caseId!, {
                type: caseData.service_type,
                content: reportContent,
                description: selectedTemplate || 'General',
            });
            toast.success('Report created');
            setReportContent('');
            setSelectedTemplate('');
            loadCase();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to create report');
        } finally { setCreatingReport(false); }
    };

    const startEditing = () => {
        setEditForm({
            serviceType: caseData.service_type,
            amount: caseData.amount,
            paymentMode: caseData.payment_mode,
            referredBy: caseData.referred_by || '',
            attendingStaff: caseData.attending_staff || '',
        });
        setEditing(true);
    };

    const saveEdit = async () => {
        try {
            await casesApi.edit(caseId!, editForm);
            toast.success('Case updated');
            setEditing(false);
            loadCase();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Update failed');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this case? This action cannot be undone.')) return;
        try {
            await casesApi.delete(caseId!);
            toast.success('Case deleted');
            navigate('/search');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Delete failed');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadApi.uploadFile(file);
            const fileUrl = res.data.url || res.data.file?.url || '';
            // Create report document record
            await casesApi.createReport(caseId!, {
                description: uploadNote || file.name,
                imageUrl: fileUrl,
                reportType: uploadType,
            });
            toast.success('Report uploaded');
            setUploadNote('');
            loadCase();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleExport = async (format: string) => {
        if (!reports.length) {
            toast.error('No reports to export');
            return;
        }
        try {
            if (format === 'print') {
                const res = await casesApi.printReport(caseId!, reports[0].id);
                const win = window.open('', '_blank');
                if (win) { win.document.write(res.data); win.document.close(); win.print(); }
            } else if (format === 'html') {
                const res = await casesApi.exportReportHtml(caseId!, reports[0].id);
                const blob = new Blob([res.data], { type: 'text/html' });
                window.open(URL.createObjectURL(blob));
            } else if (format === 'md') {
                const res = await casesApi.exportReportMd(caseId!, reports[0].id);
                const blob = new Blob([res.data], { type: 'text/markdown' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${caseData.case_number}-report.md`;
                a.click();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Export failed');
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><div className="loader"></div></div>;
    if (!caseData) return <p className="text-secondary">Case not found</p>;

    const patient = Array.isArray(caseData.patient) ? caseData.patient[0] : caseData.patient;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Back button */}
            <button onClick={() => navigate('/search')} className="btn btn-sm btn-outline" style={{ alignSelf: 'flex-start' }}>
                <ArrowLeft size={14} /> Back to Cases
            </button>

            {/* Case Details Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span className="badge badge-primary" style={{ fontSize: 'var(--font-size-md)' }}>{caseData.case_number}</span>
                        <span className="text-sm text-tertiary" style={{ marginLeft: 'var(--space-3)' }}>
                            {new Date(caseData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    {!editing && (
                        <button className="btn btn-sm btn-outline" onClick={startEditing}>
                            <Pencil size={14} /> Edit
                        </button>
                    )}
                </div>

                {editing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Service Type</label>
                                <select className="form-input" value={editForm.serviceType} onChange={e => setEditForm({ ...editForm, serviceType: e.target.value })}>
                                    {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Mode</label>
                                <select className="form-input" value={editForm.paymentMode} onChange={e => setEditForm({ ...editForm, paymentMode: e.target.value })}>
                                    {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount (₹)</label>
                                <input className="form-input" type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: Number(e.target.value) })} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Referred By</label>
                                <input className="form-input" value={editForm.referredBy} onChange={e => setEditForm({ ...editForm, referredBy: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Attending Staff</label>
                                <input className="form-input" value={editForm.attendingStaff} onChange={e => setEditForm({ ...editForm, attendingStaff: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-sm btn-primary" onClick={saveEdit}><Save size={14} /> Save</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditing(false)}><X size={14} /> Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Patient</p>
                            <p className="font-semibold">{patient?.name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Sex / Age</p>
                            <p>{patient?.sex || '—'} · {patient?.age_years ? `${patient.age_years}y` : ''}{patient?.age_months ? ` ${patient.age_months}m` : ''}</p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Phone</p>
                            <p>{patient?.phone || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Guardian</p>
                            <p>{patient?.guardian_name || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Service Type</p>
                            <p><span className="badge badge-primary">{caseData.service_type}</span></p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Amount</p>
                            <p className="font-semibold">₹{Number(caseData.amount ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Payment</p>
                            <p><span className={`badge ${caseData.payment_mode === 'Cash' ? 'badge-success' : 'badge-warning'}`}>{caseData.payment_mode}</span></p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Referred By</p>
                            <p>{caseData.referred_by || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>Address</p>
                            <p className="text-sm">{[patient?.address_line_1, patient?.area, patient?.city, patient?.pincode].filter(Boolean).join(', ') || '—'}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Reports Section */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>Reports & Documents</h3>

                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 150 }}>
                        <label className="form-label">Report Type</label>
                        <select className="form-input" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                            <option>Report</option>
                            <option>Scan</option>
                            <option>X-Ray</option>
                            <option>Prescription</option>
                            <option>Lab Result</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
                        <label className="form-label">Note</label>
                        <input className="form-input" placeholder="Brief description..." value={uploadNote} onChange={e => setUploadNote(e.target.value)} />
                    </div>
                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload File'}
                        <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                    </label>
                </div>

                {/* Uploaded documents grid */}
                {(reports.length > 0 || documents.length > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                        {reports.map((r: any) => (
                            <div key={r.id} style={{
                                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 4,
                            }}>
                                {r.image_url ? (
                                    <div style={{
                                        width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <img src={r.image_url} alt={r.description} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    </div>
                                ) : (
                                    <div style={{
                                        width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-sm)',
                                        background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <FileText size={28} className="text-tertiary" />
                                    </div>
                                )}
                                <p className="text-xs font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {r.report_type || r.description || 'Report'}
                                </p>
                                <p className="text-xs text-tertiary">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                            </div>
                        ))}
                    </div>
                )}
                {reports.length === 0 && documents.length === 0 && (
                    <p className="text-sm text-secondary" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No reports uploaded yet</p>
                )}
            </div>

            {/* Medical Chronology */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>Medical Chronology</h3>
                <div style={{ position: 'relative', paddingLeft: 'var(--space-6)' }}>
                    <div style={{
                        position: 'absolute', left: 10, top: 0, bottom: 0, width: 2,
                        background: 'var(--border)', borderRadius: 2,
                    }} />
                    {visits.map((v: any) => (
                        <div key={v.id} style={{ position: 'relative', paddingBottom: 'var(--space-4)' }}>
                            <div style={{
                                position: 'absolute', left: -18, top: 4, width: 10, height: 10,
                                borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg)',
                            }} />
                            <div>
                                <p className="font-semibold text-sm">{v.notes || 'Visit'}</p>
                                <p className="text-xs text-tertiary">
                                    {new Date(v.visit_date || v.created_at).toLocaleDateString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {/* Case Creation Event — always shown */}
                    <div style={{ position: 'relative', paddingBottom: 0 }}>
                        <div style={{
                            position: 'absolute', left: -18, top: 4, width: 10, height: 10,
                            borderRadius: '50%', background: 'var(--success, #30D158)', border: '2px solid var(--bg)',
                        }} />
                        <div>
                            <p className="font-semibold text-sm">Case Created — {caseData.case_number}</p>
                            <p className="text-xs text-tertiary">
                                {new Date(caseData.created_at).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                            </p>
                            <p className="text-xs text-secondary" style={{ marginTop: 2 }}>
                                {caseData.service_type} · ₹{Number(caseData.amount ?? 0).toLocaleString()} · {caseData.payment_mode}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reporting Template */}
            {isDoctor && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <ClipboardList size={18} />
                        <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>Reporting</h3>
                    </div>
                    <p className="text-xs text-secondary">Select a report template, edit the pre-filled content, and create a report for this case.</p>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ minWidth: 200 }}>
                            <label className="form-label">Report Template</label>
                            <select className="form-input" value={selectedTemplate} onChange={e => applyTemplate(e.target.value)}>
                                <option value="">— Select template —</option>
                                {templates.map((t: any) => (
                                    <option key={t.id || t.report_type} value={t.report_type}>{t.report_type}</option>
                                ))}
                                {templates.length === 0 && <option disabled>No templates configured</option>}
                            </select>
                        </div>
                    </div>
                    {selectedTemplate && (
                        <>
                            <textarea
                                className="form-input"
                                style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}
                                value={reportContent}
                                onChange={e => setReportContent(e.target.value)}
                                placeholder="Report content will appear here after selecting a template..."
                            />
                            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => { setSelectedTemplate(''); setReportContent(''); }}>
                                    <X size={14} /> Clear
                                </button>
                                <button className="btn btn-sm btn-primary" onClick={handleCreateReport} disabled={creatingReport}>
                                    <Save size={14} /> {creatingReport ? 'Creating...' : 'Create Report'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Action Bar */}
            <div className="card" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
                gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
            }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-outline" onClick={() => handleExport('html')}><Download size={14} /> Export PDF</button>
                    <button className="btn btn-sm btn-outline" onClick={() => handleExport('print')}><Printer size={14} /> Print</button>
                    <button className="btn btn-sm btn-outline" onClick={() => toast('Email export coming soon', { icon: '📧' })}><Mail size={14} /> Email</button>
                    <button className="btn btn-sm btn-outline" onClick={() => handleExport('md')}><FileText size={14} /> Markdown</button>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    {isDoctor && (
                        <button className="btn btn-sm" onClick={handleDelete} style={{
                            background: 'var(--danger, #ef4444)', color: '#fff', border: 'none',
                        }}>
                            <Trash2 size={14} /> Delete Case
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
