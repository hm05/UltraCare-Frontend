import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, MessageSquare } from 'lucide-react';
import { contactApi } from '../../api';
import toast from 'react-hot-toast';
import './ContactUs.css';

export default function ContactUs() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) {
            toast.error('Please fill in all required fields');
            return;
        }
        setLoading(true);
        try {
            await contactApi.submit(form);
            toast.success('Message sent successfully! We\'ll get back to you soon.');
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page">
            <div className="container">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="section-title">Get in Touch</h1>
                    <p className="section-subtitle">
                        Have questions about UltraCare? We'd love to hear from you.
                    </p>
                </motion.div>

                <div className="contact-grid">
                    <motion.form
                        className="contact-form card"
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2><MessageSquare size={20} /> Send a Message</h2>
                        <div className="form-group">
                            <label className="form-label">Name *</label>
                            <input className="form-input" placeholder="Your name" value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input className="form-input" type="email" placeholder="your@email.com" value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Subject</label>
                            <input className="form-input" placeholder="How can we help?" value={form.subject}
                                onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Message *</label>
                            <textarea className="form-input" rows={5} placeholder="Tell us more..." value={form.message}
                                onChange={(e) => setForm({ ...form, message: e.target.value })} />
                        </div>
                        <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                            {loading ? <span className="loader" style={{ width: 18, height: 18 }}></span> : <><Send size={16} /> Send Message</>}
                        </button>
                    </motion.form>

                    <motion.div
                        className="contact-info"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="info-card card">
                            <Mail size={24} />
                            <h3>Email Us Directly</h3>
                            <p>For direct inquiries, reach out at:</p>
                            <a href="mailto:ultracare@nexeo-security.tech" className="email-link">
                                ultracare@nexeo-security.tech
                            </a>
                        </div>
                        <div className="info-card card">
                            <MessageSquare size={24} />
                            <h3>Response Time</h3>
                            <p>We typically respond within 24 hours during business days.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
