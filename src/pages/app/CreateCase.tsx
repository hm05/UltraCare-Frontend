import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesApi } from '../../api';
import toast from 'react-hot-toast';
import './CreateCase.css';

const SERVICE_TYPES = ['Sonography', 'Obs. Sonography', 'X-Ray', 'C.T.', 'M.R.I.', 'N.A.'] as const;
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Cheque', 'NEFT', 'Other'] as const;
const SEX_OPTIONS = ['Male', 'Female', 'Other'] as const;

export default function CreateCase() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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

    const update = (key: string, val: string) => setForm({ ...form, [key]: val });
    const isFemale = form.sex === 'Female';

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
            toast.error(err.response?.data?.error || 'Failed to create case');
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
                        <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-input" type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Age (Years)</label><input className="form-input" type="number" placeholder="0" value={form.ageYears} onChange={(e) => update('ageYears', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Age (Months)</label><input className="form-input" type="number" placeholder="0" value={form.ageMonths} onChange={(e) => update('ageMonths', e.target.value)} /></div>
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
                                <div className="form-group"><label className="form-label">LMP</label><input className="form-input" type="date" value={form.lmp} onChange={(e) => update('lmp', e.target.value)} /></div>
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
                        <div className="form-group"><label className="form-label">Referred By</label><input className="form-input" placeholder="Dr. name" value={form.referredBy} onChange={(e) => update('referredBy', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Attending Staff</label><input className="form-input" placeholder="Staff name" value={form.attendingStaff} onChange={(e) => update('attendingStaff', e.target.value)} /></div>
                    </div>
                </div>

                <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ alignSelf: 'flex-end' }}>
                    {loading ? <span className="loader" style={{ width: 20, height: 20 }}></span> : 'Create Case'}
                </button>
            </form>
        </div>
    );
}
