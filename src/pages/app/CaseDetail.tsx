import { useState, useEffect, useMemo, lazy, Suspense, useRef, type FC, type ChangeEvent, type MouseEvent } from 'react';
const PdfViewer = lazy(() => import('../../components/PdfViewer'));
const MedicalImageViewer = lazy(() => import('../../components/MedicalImageViewer'));
import { useParams, useNavigate } from 'react-router-dom';
import { casesApi, uploadApi, organizationApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import './CaseDetail.css';
import {
    Pencil, Save, X, Trash2, Download, Mail, FileText,
    Upload, ArrowLeft, ClipboardList, Image, File, Eye,
    ChevronDown, ChevronRight, Printer, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['b', 'i', 'u', 'ul', 'ol', 'li', 'p', 'br', 'h1', 'h2', 'h3'];
const ALLOWED_ATTR: string[] = [];

const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
};

const SERVICE_TYPES = ['Sonography', 'Obs. Sonography', 'X-Ray', 'C.T.', 'M.R.I.', 'N.A.'] as const;
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Cheque', 'NEFT', 'Other'] as const;
const UPLOAD_TYPES = ['Scan', 'Prescription', 'Lab Result', 'Other'] as const;

// ─── Rich Text Editor Component ──────────────────────────────────────────────
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, valueArg: string = '') => {
    document.execCommand(command, false, valueArg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execFormatBlock = (tag: string) => {
    document.execCommand('formatBlock', false, tag);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      // Only set if different to avoid cursor jumping
      const currentContent = editorRef.current.innerHTML;
      const sanitizedValue = sanitizeHTML(value);
      if (currentContent !== sanitizedValue) {
        editorRef.current.innerHTML = sanitizedValue || '<p><br></p>';
      }
    }
  }, [value]);

  const ToolbarButton = ({ command, icon: Icon, title, active }: { command?: string; icon: any; title: string; active?: boolean }) => (
    <button
      type="button"
      onClick={() => command && execCommand(command)}
      title={title}
      style={{
        padding: '6px 10px',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-primary)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: command === 'bold' ? 'bold' : command === 'italic' ? 'italic' : 'normal',
        textDecoration: command === 'underline' ? 'underline' : command === 'strikeThrough' ? 'line-through' : 'none',
      }}
    >
      <Icon size={16} />
    </button>
  );

  const ToolbarTextButton = ({ command, label, title }: { command: string; label: string; title: string }) => (
    <button
      type="button"
      onClick={() => execCommand(command)}
      title={title}
      style={{
        padding: '6px 10px',
        background: 'transparent',
        color: 'var(--text-primary)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '8px',
        background: 'var(--bg-tertiary)',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
      }}>
        <button type="button" onClick={() => execFormatBlock('h1')} title="Heading 1" style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>H1</button>
        <button type="button" onClick={() => execFormatBlock('h2')} title="Heading 2" style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>H2</button>
        <button type="button" onClick={() => execFormatBlock('h3')} title="Heading 3" style={{ padding: '6px 10px', background: 'transparent', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>H3</button>
        <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />
        <ToolbarButton command="bold" icon={({size}: {size: number}) => <b style={{fontSize: size}}>B</b>} title="Bold" />
        <ToolbarButton command="italic" icon={({size}: {size: number}) => <i style={{fontSize: size}}>I</i>} title="Italic" />
        <ToolbarButton command="underline" icon={({size}: {size: number}) => <u style={{fontSize: size}}>U</u>} title="Underline" />
        <ToolbarButton command="strikeThrough" icon={({size}: {size: number}) => <s style={{fontSize: size}}>S</s>} title="Strikethrough" />
        <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />
        <ToolbarTextButton command="subscript" label="x₂" title="Subscript" />
        <ToolbarTextButton command="superscript" label="x²" title="Superscript" />
        <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />
        <ToolbarButton command="insertUnorderedList" icon={({size}: {size: number}) => <span style={{fontSize: size}}>•</span>} title="Bullet List" />
        <ToolbarButton command="insertOrderedList" icon={({size}: {size: number}) => <span style={{fontSize: size}}>1.</span>} title="Numbered List" />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        style={{
          minHeight: '200px',
          padding: '12px',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontSize: '14px',
          lineHeight: '1.6',
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────
type PreviewContent =
    | { kind: 'html'; html: string; title: string }
    | { kind: 'image'; url: string; title: string }
    | { kind: 'pdf'; url: string; title: string };

function PreviewModal({ content, onClose }: { content: PreviewContent; onClose: () => void }) {
    const isImage = content.kind === 'image';

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
                padding: 'var(--space-6)',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--bg)', width: '100%',
                    maxWidth: isImage ? 760 : 940,
                    height: isImage ? 'auto' : '88vh',
                    maxHeight: isImage ? '90vh' : '88vh',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 32px 64px rgba(0,0,0,0.3)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-4) var(--space-5)',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        {isImage ? <Image size={18} style={{ color: 'var(--accent)' }} /> : <FileText size={18} style={{ color: 'var(--accent)' }} />}
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>{content.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {/* Print button for Form F */}
                        {content.kind === 'html' && content.title === 'Form F' && (
                            <button className="btn btn-sm btn-primary" onClick={() => {
                                const iframe = document.querySelector('iframe');
                                if (iframe && iframe.contentWindow) {
                                    iframe.contentWindow.print();
                                }
                            }}>
                                <Printer size={14} /> Print
                            </button>
                        )}
                        {!isImage && (
                            <button className="btn btn-sm btn-outline" onClick={() => {
                                if (content.kind === 'html') {
                                    const blob = new Blob([content.html], { type: 'text/html' });
                                    window.open(URL.createObjectURL(blob), '_blank');
                                } else {
                                    window.open(content.url, '_blank');
                                }
                            }}>
                                <Download size={14} /> PDF
                            </button>
                        )}
                        <button className="btn btn-sm btn-outline" onClick={() => {
                            if (content.kind === 'html') {
                                const win = window.open('', '_blank');
                                if (win) { win.document.write(content.html); win.document.close(); }
                            } else {
                                window.open(content.url, '_blank');
                            }
                        }}>
                            <Eye size={14} /> Open
                        </button>
                        <button className="btn-icon" onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ 
                    flex: 1, 
                    overflow: 'hidden', 
                    background: (isImage || content.kind === 'pdf') ? 'var(--bg-tertiary)' : 'var(--bg-primary)', 
                    display: 'flex', 
                    alignItems: 'stretch', 
                    justifyContent: 'center' 
                }}>
                    {content.kind === 'html' && (
                        <iframe srcDoc={content.html} style={{ width: '100%', height: '100%', border: 'none' }} title={content.title} />
                    )}
                    {content.kind === 'image' && (
                        <Suspense fallback={
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', background: '#000' }}>
                                <div className="loader" style={{ width: 24, height: 24, borderTopColor: '#fff' }} />
                            </div>
                        }>
                            <MedicalImageViewer url={content.url} />
                        </Suspense>
                    )}
                    {content.kind === 'pdf' && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Suspense fallback={
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}>
                                    <div className="loader" style={{ width: 24, height: 24 }} />
                                </div>
                            }>
                                <PdfViewer url={content.url} />
                            </Suspense>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Detect if a URL is an image ───────────────────────────────────────────────
function isImageUrl(url: string) {
    if (!url) return false;
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'dcm'].includes(ext || '');
}

function isPdfUrl(url: string) {
    if (!url) return false;
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    return ext === 'pdf';
}

// ─── Chronology item types ─────────────────────────────────────────────────────
interface ChronoItem {
    id: string;
    kind: 'case' | 'visit' | 'report' | 'document';
    date: Date;
    title: string;
    subtitle?: string;
    icon: FC<any>;
    accentColor: string;
    // for preview
    reportId?: string;
    imageUrl?: string;
    fileUrl?: string;
    fileType?: string;
    content?: string;
    // for visits
    visitData?: any;
}

function groupByDate(items: ChronoItem[]): { label: string; dateKey: string; items: ChronoItem[] }[] {
    const map: Record<string, ChronoItem[]> = {};
    for (const item of items) {
        const key = item.date.toISOString().slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(item);
    }
    return Object.entries(map)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([dateKey, items]) => {
            const d = new Date(dateKey);
            const today = new Date().toISOString().slice(0, 10);
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            const label = dateKey === today ? 'Today'
                : dateKey === yesterday ? 'Yesterday'
                    : d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
            return { label, dateKey, items };
        });
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CaseDetail() {
    const { caseId } = useParams<{ caseId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

    const loadedCaseIdRef = useRef<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [caseData, setCaseData] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [visits, setVisits] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    // Upload
    const [uploading, setUploading] = useState(false);
    const [uploadNote, setUploadNote] = useState('');
    const [uploadType, setUploadType] = useState<typeof UPLOAD_TYPES[number]>('Scan');

    // Reporting template
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [reportContent, setReportContent] = useState('');
    const [creatingReport, setCreatingReport] = useState(false);

    // Email panel
    const [emailTarget, setEmailTarget] = useState<'self' | 'other' | null>(null);
    const [customEmail, setCustomEmail] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [selectedReportIdsForEmail, setSelectedReportIdsForEmail] = useState<string[]>([]);
    const [includeSignedUrls, setIncludeSignedUrls] = useState(true);

    // Preview modal
    const [preview, setPreview] = useState<PreviewContent | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Collapsed sections
    const [uploadOpen, setUploadOpen] = useState(false);
    const [reportingOpen, setReportingOpen] = useState(false);

    // Revisit modal
    const [revisitModalOpen, setRevisitModalOpen] = useState(false);
    const [visitDetailOpen, setVisitDetailOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<any>(null);
    const [staffList, setStaffList] = useState<{id: string; name: string}[]>([]);
    const [revisitForm, setRevisitForm] = useState({
        visitDate: new Date().toISOString().split('T')[0],
        reason: '',
        attendingStaffId: '',
        clinicalNotes: '',
        amount: '',
        paymentMode: '',
    });

    // Load staff list on component mount
    useEffect(() => {
        organizationApi.getHRStaffList().then((res: any) => {
            const list = (res.data.staff || []).map((s: any) => ({
                id: s.id,
                name: `${s.first_name} ${s.last_name}`.trim() || s.name || ''
            }));
            setStaffList(list);
        }).catch(() => {});
    }, []);

    // Calculate total amount (case + visits)
    const totalAmount = useMemo(() => {
        const caseAmount = Number(caseData?.amount) || 0;
        const visitsAmount = visits.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
        return caseAmount + visitsAmount;
    }, [caseData, visits]);

    const loadCase = async () => {
        if (!caseId) return;
        if (loadedCaseIdRef.current === caseId) return;
        loadedCaseIdRef.current = caseId;
        setLoading(true);
        try {
            const res = await casesApi.getDetail(caseId);
            setCaseData(res.data.case);
            setReports(res.data.reports || []);
            setVisits(res.data.visits || []);
            setDocuments(res.data.documents || []);
        } catch {
            toast.error('Failed to load case');
            navigate('/search');
        } finally {
            setLoading(false);
        }
    };

    const loadTemplates = async () => {
        try {
            const res = await organizationApi.getTemplates();
            setTemplates(res.data.templates || []);
        } catch { /* optional */ }
    };

    useEffect(() => { loadCase(); loadTemplates(); }, [caseId]);

    // Auto-save revisit form to localStorage every 5 seconds
    useEffect(() => {
        if (!revisitModalOpen) return;
        const timer = setTimeout(() => {
            localStorage.setItem(`revisit-autosave-${caseId}`, JSON.stringify(revisitForm));
        }, 5000);
        return () => clearTimeout(timer);
    }, [revisitForm, revisitModalOpen, caseId]);

    // Load autosaved revisit form on modal open
    useEffect(() => {
        if (revisitModalOpen && caseId) {
            const saved = localStorage.getItem(`revisit-autosave-${caseId}`);
            if (saved) {
                try {
                    setRevisitForm(JSON.parse(saved));
                } catch { /* ignore */ }
            }
        }
    }, [revisitModalOpen, caseId]);

    // Handle revisit form submission
    const handleLogRevisit = async () => {
        if (!caseId) return;
        try {
            await casesApi.logVisit(caseId, {
                visitDate: revisitForm.visitDate,
                reason: revisitForm.reason || undefined,
                attendingStaffId: revisitForm.attendingStaffId || undefined,
                clinicalNotes: revisitForm.clinicalNotes || undefined,
                amount: revisitForm.amount ? Number(revisitForm.amount) : undefined,
                paymentMode: revisitForm.paymentMode || undefined,
            });
            toast.success('Revisit logged successfully');
            setRevisitModalOpen(false);
            setRevisitForm({
                visitDate: new Date().toISOString().split('T')[0],
                reason: '',
                attendingStaffId: '',
                clinicalNotes: '',
                amount: '',
                paymentMode: '',
            });
            localStorage.removeItem(`revisit-autosave-${caseId}`);
            loadCase();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to log revisit');
        }
    };

    // Handle create new case from existing patient
    const handleCreateNewCase = () => {
        if (!caseData?.patient_id) return;
        navigate('/create-case', { state: { patientId: caseData.patient_id } });
    };

    // Auto-select template based on case service type when templates load
    useEffect(() => {
        if (!caseData?.service_type || templates.length === 0 || selectedTemplate) return;
        
        const serviceType = caseData.service_type.toLowerCase();
        // Find matching template (exact or partial match)
        const matchingTemplate = templates.find((t: any) => {
            const templateType = (t.report_type || '').toLowerCase();
            return templateType === serviceType || 
                   templateType.includes(serviceType) || 
                   serviceType.includes(templateType);
        });
        
        if (matchingTemplate) {
            applyTemplate(matchingTemplate.report_type);
        }
    }, [caseData, templates]);

    // ─── Chronology data ───────────────────────────────────────────────────────
    const chronoItems = useMemo<ChronoItem[]>(() => {
        const items: ChronoItem[] = [];

        // Case creation
        if (caseData) {
            items.push({
                id: `case-${caseData.id}`,
                kind: 'case',
                date: new Date(caseData.created_at),
                title: `Case Created — ${caseData.case_number}`,
                subtitle: `${caseData.service_type} · ₹${Number(caseData.amount ?? 0).toLocaleString()} · ${caseData.payment_mode}`,
                icon: ClipboardList,
                accentColor: 'var(--success, #30D158)',
            });
        }

        // Visits
        for (const v of visits) {
            const staffStr = v.attending_staff_name ? `${v.attending_staff_name}` : '';
            const amountStr = v.amount ? `₹${Number(v.amount).toLocaleString()}` : '';
            const subtitleParts = [staffStr, amountStr].filter(Boolean);

            items.push({
                id: `visit-${v.id}`,
                kind: 'visit',
                visitData: v,
                date: new Date(v.visit_date || v.created_at),
                title: v.reason || 'Visit Logged',
                subtitle: subtitleParts.join(' • '),
                icon: Eye,
                accentColor: 'var(--text-tertiary)',
            });
        }

        // Text reports (from templates)
        for (const r of reports) {
            items.push({
                id: `report-${r.id}`,
                kind: 'report',
                date: new Date(r.created_at),
                title: r.description || r.report_type || 'Report',
                subtitle: r.content ? `${r.content.slice(0, 80)}${r.content.length > 80 ? '…' : ''}` : '',
                icon: FileText,
                accentColor: 'var(--accent)',
                reportId: r.id,
                imageUrl: r.image_url || undefined,
                content: r.content || undefined,
            });
        }

        // Uploaded documents
        for (const d of documents) {
            const isImg = isImageUrl(d.file_url || '');
            items.push({
                id: `doc-${d.id}`,
                kind: 'document',
                date: new Date(d.created_at),
                title: d.file_name || d.file_type || 'Document',
                subtitle: d.notes || d.file_type || '',
                icon: isImg ? Image : File,
                accentColor: 'var(--warning)',
                fileUrl: d.file_url || undefined,
                fileType: d.file_type,
            });
        }

        return items.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [caseData, visits, reports, documents]);

    const grouped = useMemo(() => groupByDate(chronoItems), [chronoItems]);

    // ─── Preview handler ───────────────────────────────────────────────────────
    const openPreview = async (item: ChronoItem) => {
        // Document with image or PDF → get signed URL first
        if (item.kind === 'document' && item.fileUrl) {
            setLoadingPreview(true);
            try {
                const res = await uploadApi.getSignedUrlForFile(item.fileUrl);
                const signedUrl = res.data.signedUrl;
                
                if (isImageUrl(item.fileUrl)) {
                    setPreview({ kind: 'image', url: signedUrl, title: item.title });
                } else if (isPdfUrl(item.fileUrl)) {
                    setPreview({ kind: 'pdf', url: signedUrl, title: item.title });
                } else {
                    window.open(signedUrl, '_blank');
                }
            } catch (err) {
                console.error('Failed to get signed URL:', err);
                toast.error('Failed to access file');
            } finally {
                setLoadingPreview(false);
            }
            return;
        }

        // Report with only an image attached → get signed URL first
        if (item.kind === 'report' && !item.content && item.imageUrl) {
            setLoadingPreview(true);
            try {
                const res = await uploadApi.getSignedUrlForFile(item.imageUrl);
                const signedUrl = res.data.signedUrl;
                setPreview({ kind: 'image', url: signedUrl, title: item.title });
            } catch (err) {
                console.error('Failed to get signed URL for report image:', err);
                toast.error('Failed to access image');
            } finally {
                setLoadingPreview(false);
            }
            return;
        }

        // Text report → fetch HTML from backend
        if (item.kind === 'report' && item.reportId) {
            setLoadingPreview(true);
            try {
                const res = await casesApi.exportReportHtml(caseId!, item.reportId);
                setPreview({ kind: 'html', html: res.data, title: item.title });
            } catch {
                toast.error('Failed to load report preview');
            } finally {
                setLoadingPreview(false);
            }
        }
    };

    // ─── Template apply ────────────────────────────────────────────────────────
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

    // ─── Create report from template ──────────────────────────────────────────
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
            setReportingOpen(false);
            loadCase();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to create report');
        } finally {
            setCreatingReport(false);
        }
    };

    // ─── Edit case ─────────────────────────────────────────────────────────────
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

    // ─── Delete case ───────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!confirm('Delete this case? This cannot be undone.')) return;
        try {
            await casesApi.delete(caseId!);
            toast.success('Case deleted');
            navigate('/search');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Delete failed');
        }
    };

    // ─── Delete report ─────────────────────────────────────────────────────────
    const handleDeleteReport = async (e: MouseEvent, reportId: string) => {
        e.stopPropagation();
        if (!confirm('Delete this report?')) return;
        try {
            await casesApi.deleteReport(caseId!, reportId);
            toast.success('Report deleted');
            loadCase();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Delete failed');
        }
    };

    // ─── Delete document ───────────────────────────────────────────────────────
    const handleDeleteDocument = async (e: MouseEvent, documentId: string) => {
        e.stopPropagation();
        if (!confirm('Delete this document?')) return;
        try {
            await casesApi.deleteDocument(caseId!, documentId);
            toast.success('Document deleted');
            loadCase();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Delete failed');
        }
    };

    // ─── File upload — always creates a document ───────────────────────────────
    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadApi.uploadFile(file);
            const fileUrl = res.data.url || res.data.file?.url || '';
            await casesApi.createDocument(caseId!, {
                fileName: uploadNote || file.name,
                fileUrl,
                fileType: uploadType,
                notes: uploadNote || '',
            });
            toast.success(`${uploadType} uploaded`);
            setUploadNote('');
            loadCase();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // ─── Export / Form F ───────────────────────────────────────────────────────
    const handleExport = async (format: string, reportId?: string) => {
        const targetReportId = reportId || (reports.length > 0 ? reports[0].id : null);

        try {
            if (format === 'form-f') {
                const res = await casesApi.exportFormF(caseId!);
                setPreview({ kind: 'html', html: res.data, title: 'Form F' });
                return;
            }
            if (!targetReportId) {
                toast.error('No text report available. Create one from a template first.');
                return;
            }
            if (format === 'print') {
                const res = await casesApi.printReport(caseId!, targetReportId);
                const win = window.open('', '_blank');
                if (win) { win.document.write(res.data); win.document.close(); win.print(); }
            } else if (format === 'html') {
                const res = await casesApi.exportReportHtml(caseId!, targetReportId);
                setPreview({ kind: 'html', html: res.data, title: 'Report Preview' });
            } else if (format === 'md') {
                const res = await casesApi.exportReportMd(caseId!, targetReportId);
                const blob = new Blob([res.data], { type: 'text/markdown' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${caseData.case_number}-report.md`;
                a.click();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || err.message || 'Export failed');
        }
    };

    // ─── Email ─────────────────────────────────────────────────────────────────
    const handleEmailSend = async () => {
        if (!reports.length && !documents.length) {
            toast.error('No reports or documents to email');
            return;
        }
        const target = emailTarget === 'self' ? user?.email : customEmail;
        if (!target) { toast.error('Please enter an email address'); return; }
        const reportId = reports.length > 0 ? reports[0].id : null;
        if (!reportId) { toast.error('No text report found — create one from a template first'); return; }
        
        // Use selected reports or all reports if none selected
        const reportsToSend = selectedReportIdsForEmail.length > 0 ? selectedReportIdsForEmail : reports.map(r => r.id);
        
        setSendingEmail(true);
        try {
            await casesApi.emailReport(caseId!, reportId, target, reportsToSend, includeSignedUrls);
            toast.success(`Email sent to ${target}`);
            setEmailTarget(null);
            setCustomEmail('');
            setSelectedReportIdsForEmail([]);
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.details || 'Email failed';
            toast.error(msg);
        } finally {
            setSendingEmail(false);
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <div className="loader" />
        </div>
    );
    if (!caseData) return <p className="text-secondary">Case not found</p>;

    const patient = Array.isArray(caseData.patient) ? caseData.patient[0] : caseData.patient;
    const hasSonography = caseData.service_type?.toLowerCase().includes('sonography');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {/* ── Top bar ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <button className="btn-icon" onClick={() => navigate('/search')} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0 }}>Case Details</h1>
                        <p className="text-sm text-secondary" style={{ margin: 0 }}>{caseData.case_number}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {hasSonography && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleExport('form-f')}>
                            <FileText size={14} /> Form F
                        </button>
                    )}
                    <button className="btn btn-sm btn-outline" onClick={() => handleExport('html')}>
                        <Download size={14} /> PDF
                    </button>
                    {/* Email */}
                    <div style={{ position: 'relative' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => setEmailTarget(p => p ? null : 'self')}>
                            <Mail size={14} /> Email
                        </button>
                        {emailTarget && (
                            <div className="card shadow-md" style={{
                                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
                                minWidth: 280, padding: 'var(--space-3)', display: 'flex',
                                flexDirection: 'column', gap: 'var(--space-2)',
                            }}>
                                <select className="form-input" value={emailTarget} onChange={e => setEmailTarget(e.target.value as any)}>
                                    <option value="self">My email</option>
                                    <option value="other">Other address</option>
                                </select>
                                {emailTarget === 'other' && (
                                    <input className="form-input" type="email" placeholder="Email address" value={customEmail} onChange={e => setCustomEmail(e.target.value)} />
                                )}
                                
                                {/* Report Selection */}
                                {reports.length > 0 && (
                                    <>
                                        <label className="text-xs text-secondary" style={{ marginTop: 'var(--space-2)' }}>Select reports to include:</label>
                                        <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2)' }}>
                                            {reports.map((report: any) => (
                                                <label key={report.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: '4px 0', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedReportIdsForEmail.includes(report.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedReportIdsForEmail(prev => [...prev, report.id]);
                                                            } else {
                                                                setSelectedReportIdsForEmail(prev => prev.filter(id => id !== report.id));
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-sm">{report.report_type || report.description || 'Report'} ({new Date(report.created_at).toLocaleTimeString()})</span>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                )}
                                
                                {/* Signed URLs Option */}
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={includeSignedUrls}
                                        onChange={(e) => setIncludeSignedUrls(e.target.checked)}
                                    />
                                    <span className="text-sm">Include image hyperlinks</span>
                                </label>
                                
                                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                    <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={handleEmailSend} disabled={sendingEmail}>
                                        {sendingEmail ? 'Sending…' : 'Send'}
                                    </button>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setEmailTarget(null)}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Case overview ── */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, margin: 0 }}>Overview</h2>
                        <span className="badge badge-primary">{caseData.case_number}</span>
                        <span className="text-sm text-tertiary">
                            {new Date(caseData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {!editing && isDoctor && (
                            <button className="btn btn-sm btn-outline" onClick={handleCreateNewCase}>
                                <Plus size={14} /> New Case
                            </button>
                        )}
                        {!editing && isDoctor && (
                            <button className="btn btn-sm btn-outline" onClick={startEditing}><Pencil size={14} /> Edit</button>
                        )}
                    </div>
                </div>

                {editing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Service Type</label>
                                <select className="form-input" value={editForm.serviceType} onChange={e => setEditForm({ ...editForm, serviceType: e.target.value })}>
                                    {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Mode</label>
                                <select className="form-input" value={editForm.paymentMode} onChange={e => setEditForm({ ...editForm, paymentMode: e.target.value })}>
                                    {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                        {[
                            { label: 'Patient', value: patient?.name || '—' },
                            { label: 'Sex / Age', value: `${patient?.sex || '—'} · ${patient?.age_years ? `${patient.age_years}y` : ''}${patient?.age_months ? ` ${patient.age_months}m` : ''}` },
                            { label: 'Phone', value: patient?.phone || '—' },
                            { label: 'Guardian', value: patient?.guardian_name || '—' },
                            { label: 'Service', value: <span className="badge badge-primary">{caseData.service_type}</span> },
                            { label: 'Address', value: [patient?.address_line_1, patient?.area, patient?.city, patient?.pincode].filter(Boolean).join(', ') || '—' },
                            { label: 'Amount', value: `₹${Number(totalAmount ?? 0).toLocaleString()}` },
                            { label: 'Payment', value: <span className={`badge ${caseData.payment_mode === 'Cash' ? 'badge-success' : 'badge-warning'}`}>{caseData.payment_mode}</span> },
                            { label: 'Referred By', value: caseData.referred_by || '—' },
                            { label: 'Attending Staff', value: caseData.attending_staff_name || '—' },
                            // { label: 'Created By', value: caseData.created_by_username || '—' },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-xs text-tertiary" style={{ marginBottom: 2 }}>{label}</p>
                                <p style={{ fontWeight: 500 }}>{value}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Medical Chronology ── */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, margin: 0 }}>Medical Chronology</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span className="text-xs text-tertiary">{chronoItems.length} {chronoItems.length === 1 ? 'entry' : 'entries'}</span>
                        <button
                            type="button"
                            onClick={() => setRevisitModalOpen(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                                padding: '6px 12px',
                                background: 'var(--accent)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            <Plus size={14} />
                            Log Revisit
                        </button>
                    </div>
                </div>

                {loadingPreview && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', color: 'var(--accent)' }}>
                        <div className="loader" style={{ width: 16, height: 16 }} /> Loading preview…
                    </div>
                )}

                {grouped.length === 0 && (
                    <p className="text-sm text-secondary" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                        No entries yet. Upload a scan or create a report below.
                    </p>
                )}

                {grouped.map(({ label, dateKey, items }) => (
                    <div key={dateKey} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {/* Date label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{label}</span>
                            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        </div>

                        {/* Items for this date */}
                        <div className="widget" style={{ padding: 0, overflow: 'hidden' }}>
                            {items.map((item, idx) => {
                                const Icon = item.icon;
                                const isClickable = item.kind !== 'case' && item.kind !== 'visit';
                                const isVisit = item.kind === 'visit';
                                const canDelete = item.kind === 'report' || item.kind === 'document';
                                const canView = isClickable || isVisit;

                                const handleItemClick = () => {
                                    if (isClickable) {
                                        openPreview(item);
                                    } else if (isVisit && item.visitData) {
                                        setSelectedVisit(item.visitData);
                                        setVisitDetailOpen(true);
                                    }
                                };

                                return (
                                    <div
                                        key={item.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                                            padding: 'var(--space-3) var(--space-4)',
                                            borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                                            cursor: canView ? 'pointer' : 'default',
                                            transition: 'background var(--transition-fast)',
                                        }}
                                        onClick={handleItemClick}
                                        onMouseEnter={e => { if (canView) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                                    >
                                        {/* Color dot */}
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
                                            background: `${item.accentColor}18`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Icon size={16} style={{ color: item.accentColor }} />
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', margin: 0 }}>{item.title}</p>
                                            {item.subtitle && (
                                                <p className="text-xs text-tertiary" style={{ margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.subtitle}
                                                </p>
                                            )}
                                        </div>

                                        {/* Right: time + actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                                            {isClickable && (
                                                <span className="text-xs text-tertiary">
                                                    {item.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            {canView && (
                                                <span className="text-xs" style={{ color: 'var(--accent)', fontWeight: 500 }}>{isVisit ? 'View →' : 'Preview →'}</span>
                                            )}
                                            {canDelete && isDoctor && (
                                                <button
                                                    className="btn-icon"
                                                    style={{ padding: 4, opacity: 0.4 }}
                                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
                                                    onClick={e => {
                                                        if (item.kind === 'report') handleDeleteReport(e, item.reportId!);
                                                        else handleDeleteDocument(e, item.id.replace('doc-', ''));
                                                    }}
                                                >
                                                    <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Upload Files ── */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <button
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'none', border: 'none', width: '100%', cursor: 'pointer',
                        padding: 'var(--space-4)', textAlign: 'left',
                    }}
                    onClick={() => setUploadOpen(o => !o)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Upload size={16} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>Upload Scan / Document</span>
                        <span className="text-xs text-tertiary">{documents.length} uploaded</span>
                    </div>
                    {uploadOpen ? <ChevronDown size={16} className="text-tertiary" /> : <ChevronRight size={16} className="text-tertiary" />}
                </button>

                {uploadOpen && (
                    <div style={{ padding: '0 var(--space-4) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
                        <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-3)' }}>
                            Upload scans, X-ray films, prescriptions, or any other file. All uploads appear in the chronology above as clickable previews.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ minWidth: 150 }}>
                                <label className="form-label">Type</label>
                                <select className="form-input" value={uploadType} onChange={e => setUploadType(e.target.value as any)}>
                                    {UPLOAD_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                                <label className="form-label">Label / Note</label>
                                <input className="form-input" placeholder="e.g. Abdominal scan 1st trimester" value={uploadNote} onChange={e => setUploadNote(e.target.value)} />
                            </div>
                            <label className={`btn btn-primary btn-sm ${uploading ? 'disabled' : ''}`} style={{ cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: uploading ? 0.6 : 1 }}>
                                <Upload size={14} /> {uploading ? 'Uploading…' : 'Choose File'}
                                <input type="file" accept="image/*,.pdf,.doc,.docx,.dcm" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Reporting (doctor only) ── */}
            {isDoctor && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <button
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'none', border: 'none', width: '100%', cursor: 'pointer',
                            padding: 'var(--space-4)', textAlign: 'left',
                        }}
                        onClick={() => setReportingOpen(o => !o)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <ClipboardList size={16} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-md)', color: 'var(--text-primary)' }}>Generate Report from Template</span>
                            <span className="text-xs text-tertiary">{reports.filter(r => r.content).length} text reports</span>
                        </div>
                        {reportingOpen ? <ChevronDown size={16} className="text-tertiary" /> : <ChevronRight size={16} className="text-tertiary" />}
                    </button>

                    {reportingOpen && (
                        <div style={{ padding: '0 var(--space-4) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
                            <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-3)' }}>
                                Select a template to pre-fill report content. You can edit before saving.
                            </p>
                            <div className="form-group" style={{ maxWidth: 280 }}>
                                <label className="form-label">Template</label>
                                <select className="form-input" value={selectedTemplate} onChange={e => applyTemplate(e.target.value)}>
                                    <option value="">— Select template —</option>
                                    {templates.map((t: any) => (
                                        <option key={t.id || t.report_type} value={t.report_type}>{t.report_type}</option>
                                    ))}
                                    {templates.length === 0 && <option disabled>No templates configured in Settings</option>}
                                </select>
                            </div>
                            {selectedTemplate && (
                                <>
                                    <RichTextEditor value={reportContent} onChange={setReportContent} placeholder="Report content…" />
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-sm btn-secondary" onClick={() => { setSelectedTemplate(''); setReportContent(''); }}>
                                            <X size={14} /> Clear
                                        </button>
                                        <button className="btn btn-sm btn-primary" onClick={handleCreateReport} disabled={creatingReport}>
                                            <Save size={14} /> {creatingReport ? 'Saving…' : 'Save Report'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Danger zone ── */}
            {isDoctor && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2)' }}>
                    <button className="btn btn-sm btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', opacity: 0.7 }} onClick={handleDelete}>
                        <Trash2 size={14} /> Delete Case
                    </button>
                </div>
            )}

            {/* ── Preview Modal ── */}
            {preview && <PreviewModal content={preview} onClose={() => setPreview(null)} />}

            {/* ── Revisit Modal ── */}
            {revisitModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000,
                }} onClick={(e) => { if (e.target === e.currentTarget) setRevisitModalOpen(false); }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        width: '90%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: 'var(--space-6)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, margin: 0 }}>Log Patient Revisit</h3>
                            <button
                                type="button"
                                onClick={() => setRevisitModalOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">Visit Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={revisitForm.visitDate}
                                    onChange={(e) => setRevisitForm({ ...revisitForm, visitDate: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Reason for Revisit</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Follow-up, Check results, Treatment review"
                                    value={revisitForm.reason}
                                    onChange={(e) => setRevisitForm({ ...revisitForm, reason: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Attending Staff</label>
                                <select
                                    className="form-input"
                                    value={revisitForm.attendingStaffId}
                                    onChange={(e) => setRevisitForm({ ...revisitForm, attendingStaffId: e.target.value })}
                                >
                                    <option value="">— Select staff —</option>
                                    {staffList.map((staff) => (
                                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Clinical Notes</label>
                                <RichTextEditor
                                    value={revisitForm.clinicalNotes}
                                    onChange={(value) => setRevisitForm({ ...revisitForm, clinicalNotes: value })}
                                    placeholder="Enter clinical notes..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        value={revisitForm.amount}
                                        onChange={(e) => setRevisitForm({ ...revisitForm, amount: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Payment Mode</label>
                                    <select
                                        className="form-input"
                                        value={revisitForm.paymentMode}
                                        onChange={(e) => setRevisitForm({ ...revisitForm, paymentMode: e.target.value })}
                                    >
                                        <option value="">— Select —</option>
                                        {PAYMENT_MODES.map((mode) => (
                                            <option key={mode} value={mode}>{mode}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setRevisitModalOpen(false)}
                                >
                                    <X size={14} /> Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleLogRevisit}
                                >
                                    <Save size={14} /> Log Revisit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Visit Detail Modal ── */}
            {visitDetailOpen && selectedVisit && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000,
                }} onClick={(e) => { if (e.target === e.currentTarget) setVisitDetailOpen(false); }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        width: '100%',
                        maxWidth: 480,
                        maxHeight: '90vh',
                        overflow: 'auto',
                        padding: 'var(--space-5)',
                        position: 'relative',
                    }}>
                        {/* Apple-style close button */}
                        <button
                            type="button"
                            onClick={() => setVisitDetailOpen(false)}
                            style={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: '#FF5F57',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                            }}
                        >
                            <X size={14} style={{ color: '#fff' }} />
                        </button>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, margin: 0 }}>Revisit Details</h3>
                        </div>

                        {/* Visit Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {/* Reason with dashed label style */}
                            <div>
                                <p className="text-xs text-tertiary" style={{ marginBottom: 8, letterSpacing: '0.05em' }}>Reason</p>
                                <div style={{
                                    border: '1px solid var(--border)',
                                    padding: 'var(--space-3)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    <p style={{ fontWeight: 500, fontSize: 'var(--font-size-md)' }}>{selectedVisit.reason || '—'}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                <div>
                                    <p className="text-xs text-tertiary" style={{ marginBottom: 8, letterSpacing: '0.05em' }}>Visit Date</p>
                                    <div style={{
                                        border: '1px solid var(--border)',
                                        padding: 'var(--space-3)',
                                        borderRadius: 'var(--radius-md)',
                                    }}>
                                        <p style={{ fontWeight: 500, fontSize: 'var(--font-size-md)' }}>{selectedVisit.visit_date ? new Date(selectedVisit.visit_date).toLocaleDateString('en-IN') : '—'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-tertiary" style={{ marginBottom: 8, letterSpacing: '0.05em' }}>Amount</p>
                                    <div style={{
                                        border: '1px solid var(--border)',
                                        padding: 'var(--space-3)',
                                        borderRadius: 'var(--radius-md)',
                                    }}>
                                        <p style={{ fontWeight: 500, fontSize: 'var(--font-size-md)' }}>{selectedVisit.amount ? `₹${Number(selectedVisit.amount).toLocaleString()}` : '—'}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                <div>
                                    <p className="text-xs text-tertiary" style={{ marginBottom: 8, letterSpacing: '0.05em' }}>Attending Staff</p>
                                    <div style={{
                                        border: '1px solid var(--border)',
                                        padding: 'var(--space-3)',
                                        borderRadius: 'var(--radius-md)',
                                    }}>
                                        <p style={{ fontWeight: 500, fontSize: 'var(--font-size-md)' }}>{selectedVisit.attending_staff_name || '—'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-tertiary" style={{ marginBottom: 8, letterSpacing: '0.05em' }}>Payment Mode</p>
                                    <div style={{
                                        border: '1px solid var(--border)',
                                        padding: 'var(--space-3)',
                                        borderRadius: 'var(--radius-md)',
                                    }}>
                                        <p style={{ fontWeight: 500, fontSize: 'var(--font-size-md)' }}>{selectedVisit.payment_mode || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Revisit Description */}
                            <div>
                                <p className="text-xs text-tertiary" style={{ marginBottom: 8, letterSpacing: '0.05em' }}>Description</p>
                                <div
                                    style={{
                                        border: '1px solid var(--border)',
                                        padding: 'var(--space-3)',
                                        borderRadius: 'var(--radius-md)',
                                        maxHeight: 200,
                                        overflow: 'auto',
                                        lineHeight: 1.5,
                                        minHeight: 60,
                                        fontSize: 'var(--font-size-md)',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: selectedVisit.clinical_notes || '—' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
