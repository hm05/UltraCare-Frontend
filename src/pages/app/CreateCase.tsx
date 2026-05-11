import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { casesApi, referralApi, organizationApi, patientsApi } from '../../api';
import toast from 'react-hot-toast';
import './CreateCase.css';

const SERVICE_TYPES = ['Sonography', 'Obs. Sonography', 'X-Ray', 'C.T.', 'M.R.I.', 'N.A.'] as const;
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Cheque', 'NEFT', 'Other'] as const;
const SEX_OPTIONS = ['Male', 'Female', 'Other'] as const;

/** Compute years + months from a date-of-birth string. */
function calcAge(dob: string): { years: number; months: number } {
    const birth = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    return { years: Math.max(0, years), months: Math.max(0, months) };
}

function calcPregnancy(lmp: string): { weeks: number; days: number } {
    const lmpDate = new Date(lmp);
    const today = new Date();
    const diffTime = today.getTime() - lmpDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { weeks: 0, days: 0 };
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return { weeks, days };
}

export default function CreateCase() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [referralDoctors, setReferralDoctors] = useState<{ id: string; doctor_name: string }[]>([]);
    const [staffList, setStaffList] = useState<{id: string; name: string}[]>([]);
    const [form, setForm] = useState({
        // Patient
        name: '', sex: 'Male' as string, dateOfBirth: '', ageYears: '', ageMonths: '',
        addressLine1: '', addressLine2: '', area: '', city: '', pincode: '',
        guardianName: '', phone: '', alternatePhone: '',
        numberOfBoys: '', numberOfGirls: '', lmp: '', pregnancyWeeks: '', pregnancyDays: '',
        // Case
        serviceType: 'Sonography' as string, referredBy: '', attendingStaff: '',
        amount: '', paymentMode: 'Cash' as string,
    });

    // Fetch referral doctors and staff on mount
    useEffect(() => {
        referralApi.list().then(res => {
            setReferralDoctors(res.data.doctors ?? res.data ?? []);
        }).catch(() => { /* no referral doctors yet */ });

        organizationApi.getHRStaffList().then((res: any) => {
            const list = (res.data.staff || []).map((s: any) => ({
                id: s.id,
                name: `${s.first_name} ${s.last_name}`.trim() || s.name || ''
            }));
            setStaffList(list);
        }).catch(() => {});
    }, []);

    // Prefill patient data if patientId is in route state
    useEffect(() => {
        const patientId = location.state?.patientId;
        if (patientId) {
            // Fetch patient and their latest case in parallel
            Promise.all([
                patientsApi.getDetail(patientId),
                casesApi.list({ patientId, limit: 1 })
            ]).then(([patientRes, casesRes]) => {
                const p = patientRes.data.patient;
                const medHistory = p.medicalHistory || {};
                const latestCase = casesRes.data?.cases?.[0];
                
                setForm(prev => ({
                    ...prev,
                    name: p.name || '',
                    sex: p.sex || 'Male',
                    dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
                    ageYears: p.ageYears ? String(p.ageYears) : '',
                    ageMonths: p.ageMonths ? String(p.ageMonths) : '',
                    addressLine1: p.addressLine1 || '',
                    addressLine2: p.addressLine2 || '',
                    area: p.area || '',
                    city: p.city || '',
                    pincode: p.pincode || '',
                    guardianName: p.guardianName || '',
                    phone: p.phone || '',
                    alternatePhone: p.alternatePhone || '',
                    numberOfBoys: medHistory.numberOfBoys ? String(medHistory.numberOfBoys) : '',
                    numberOfGirls: medHistory.numberOfGirls ? String(medHistory.numberOfGirls) : '',
                    lmp: medHistory.lmp ? new Date(medHistory.lmp).toISOString().split('T')[0] : '',
                    pregnancyWeeks: medHistory.pregnancyWeeks ? String(medHistory.pregnancyWeeks) : '',
                    pregnancyDays: medHistory.pregnancyDays ? String(medHistory.pregnancyDays) : '',
                    // Use previous case amount and payment mode (snake_case from backend)
                    serviceType: latestCase?.service_type || 'Sonography',
                    referredBy: latestCase?.referred_by || '',
                    amount: latestCase?.amount ? String(latestCase.amount) : '',
                    paymentMode: latestCase?.payment_mode || 'Cash',
                }));
            }).catch(err => {
                console.error('Failed to fetch patient:', err);
                toast.error('Failed to load patient data');
            });
        }
    }, [location.state]);

    const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));
    const isFemale = form.sex === 'Female';

    const handleDOBChange = (dob: string) => {
        if (dob) {
            const { years, months } = calcAge(dob);
            setForm(prev => ({
                ...prev,
                dateOfBirth: dob,
                ageYears: String(years),
                ageMonths: String(months),
            }));
        } else {
            setForm(prev => ({ ...prev, dateOfBirth: '', ageYears: '', ageMonths: '' }));
        }
    };

    const handleLMPChange = (lmp: string) => {
        if (lmp) {
            const { weeks, days } = calcPregnancy(lmp);
            setForm(prev => ({
                ...prev,
                lmp,
                pregnancyWeeks: String(weeks),
                pregnancyDays: String(days),
            }));
        } else {
            setForm(prev => ({ ...prev, lmp: '', pregnancyWeeks: '', pregnancyDays: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.addressLine1 || !form.guardianName || !form.phone || !form.serviceType) {
            toast.error('Please fill in all required fields');
            return;
        }
        setLoading(true);
        try {
            const patient: any = {
                name: form.name, sex: form.sex, guardianName: form.guardianName, phone: form.phone,
                addressLine1: form.addressLine1, addressLine2: form.addressLine2 || undefined,
                area: form.area || undefined, city: form.city || undefined,
                pincode: form.pincode || undefined, alternatePhone: form.alternatePhone || undefined,
            };
            if (form.dateOfBirth) patient.dateOfBirth = form.dateOfBirth;
            if (form.ageYears) patient.ageYears = Number(form.ageYears);
            if (form.ageMonths) patient.ageMonths = Number(form.ageMonths);
            if (isFemale) {
                if (form.numberOfBoys) patient.numberOfBoys = Number(form.numberOfBoys);
                if (form.numberOfGirls) patient.numberOfGirls = Number(form.numberOfGirls);
                if (form.lmp) patient.lmp = form.lmp;
                if (form.pregnancyWeeks) patient.pregnancyWeeks = Number(form.pregnancyWeeks);
                if (form.pregnancyDays) patient.pregnancyDays = Number(form.pregnancyDays);
            }

            const payload: any = {
                patient,
                serviceType: form.serviceType,
                paymentMode: form.paymentMode,
            };
            if (form.referredBy) payload.referredBy = form.referredBy;
            if (form.attendingStaff) payload.attendingStaff = form.attendingStaff;
            if (form.amount) payload.amount = Number(form.amount);

            await casesApi.create(payload);
            toast.success('Case created successfully!');
            navigate('/dashboard');
        } catch (err: any) {
            const data = err.response?.data;
            if (data?.details) {
                const messages: string[] = [];
                for (const [field, errors] of Object.entries(data.details)) {
                    if (Array.isArray(errors)) {
                        const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase());
                        messages.push(`${label}: ${errors.join(', ')}`);
                    }
                }
                if (messages.length > 0) {
                    toast.error(messages.join('\n'), { duration: 5000, style: { whiteSpace: 'pre-line' } });
                } else {
                    toast.error(data.error || 'Validation failed');
                }
            } else {
                toast.error(data?.error || 'Failed to create case');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-case-page">
            <form onSubmit={handleSubmit} className="create-case-form">
                {/* Patient Info */}
                <div className="form-section card">
                    <h2 className="form-section-title">Patient Information</h2>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Patient Name *</label><input className="form-input" placeholder="Full name" value={form.name} onChange={(e) => update('name', e.target.value)} required /></div>
                        <div className="form-group"><label className="form-label">Sex *</label>
                            <select className="form-input" value={form.sex} onChange={(e) => update('sex', e.target.value)}>
                                {SEX_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-input" type="date" value={form.dateOfBirth} onChange={(e) => handleDOBChange(e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Age (Years)</label><input className="form-input" type="number" placeholder="Auto from DOB" value={form.ageYears} onChange={(e) => update('ageYears', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Age (Months)</label><input className="form-input" type="number" placeholder="Auto from DOB" value={form.ageMonths} onChange={(e) => update('ageMonths', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Address Line 1 *</label><input className="form-input" placeholder="Street address" value={form.addressLine1} onChange={(e) => update('addressLine1', e.target.value)} required /></div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Address Line 2</label><input className="form-input" placeholder="Apt, suite, etc." value={form.addressLine2} onChange={(e) => update('addressLine2', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Area</label><input className="form-input" placeholder="Area / locality" value={form.area} onChange={(e) => update('area', e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">City</label><input className="form-input" placeholder="City" value={form.city} onChange={(e) => update('city', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Pincode</label><input className="form-input" placeholder="6-digit" value={form.pincode} onChange={(e) => update('pincode', e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Guardian Name *</label><input className="form-input" placeholder="Father / Husband name" value={form.guardianName} onChange={(e) => update('guardianName', e.target.value)} required /></div>
                        <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" placeholder="+91 99999 99999" value={form.phone} onChange={(e) => update('phone', e.target.value)} required /></div>
                        <div className="form-group"><label className="form-label">Alternate Phone</label><input className="form-input" placeholder="Optional" value={form.alternatePhone} onChange={(e) => update('alternatePhone', e.target.value)} /></div>
                    </div>

                    {isFemale && (
                        <>
                            <h3 style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>Female-Specific Fields</h3>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">No. of Boys</label><input className="form-input" type="number" value={form.numberOfBoys} onChange={(e) => update('numberOfBoys', e.target.value)} /></div>
                                <div className="form-group"><label className="form-label">No. of Girls</label><input className="form-input" type="number" value={form.numberOfGirls} onChange={(e) => update('numberOfGirls', e.target.value)} /></div>
                                <div className="form-group"><label className="form-label">LMP</label><input className="form-input" type="date" value={form.lmp} onChange={(e) => handleLMPChange(e.target.value)} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Pregnancy (Weeks)</label><input className="form-input" type="number" placeholder="W" value={form.pregnancyWeeks} onChange={(e) => update('pregnancyWeeks', e.target.value)} /></div>
                                <div className="form-group"><label className="form-label">Pregnancy (Days)</label><input className="form-input" type="number" placeholder="D" value={form.pregnancyDays} onChange={(e) => update('pregnancyDays', e.target.value)} /></div>
                            </div>
                        </>
                    )}
                </div>

                {/* Case Info */}
                <div className="form-section card">
                    <h2 className="form-section-title">Case Details</h2>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Service Type *</label>
                            <select className="form-input" value={form.serviceType} onChange={(e) => update('serviceType', e.target.value)}>
                                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label className="form-label">Payment Mode</label>
                            <select className="form-input" value={form.paymentMode} onChange={(e) => update('paymentMode', e.target.value)}>
                                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Amount (₹)</label><input className="form-input" type="number" placeholder="Auto from pricing" value={form.amount} onChange={(e) => update('amount', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Referred By</label>
                            <select className="form-input" value={form.referredBy} onChange={(e) => update('referredBy', e.target.value)}>
                                <option value="">None</option>
                                {referralDoctors.map(d => (
                                    <option key={d.id} value={d.doctor_name}>{d.doctor_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Attending Staff</label>
                            <select 
                              className="form-input" 
                              value={form.attendingStaff} 
                              onChange={(e) => update('attendingStaff', e.target.value)}
                            >
                              <option value="">None</option>
                              {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                        </div>
                    </div>
                </div>

                <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ alignSelf: 'flex-end' }}>
                    {loading ? <span className="loader" style={{ width: 20, height: 20 }}></span> : 'Create Case'}
                </button>
            </form>
        </div>
    );
}
