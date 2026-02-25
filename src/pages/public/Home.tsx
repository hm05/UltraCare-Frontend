import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, BarChart3, Users, FileText, Cloud, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Home.css';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

const features = [
    { icon: Activity, title: 'Case Management', desc: 'Create, track, and manage diagnostic cases with streamlined workflows.' },
    { icon: FileText, title: 'Report Generation', desc: 'Pre-built templates for Sonography, CT, MRI, X-Ray with instant export.' },
    { icon: BarChart3, title: 'Financial Analytics', desc: 'Real-time collection tracking with service-wise breakdown and graphs.' },
    { icon: Users, title: 'Referral Tracking', desc: 'Monitor referring doctors, commissions, and generate professional reports.' },
    { icon: Cloud, title: 'Cloud Storage', desc: 'Secure DICOM and report file uploads with enterprise-grade cloud storage.' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Separate doctor and staff dashboards with granular permission controls.' },
];

const stats = [
    { value: '10K+', label: 'Cases Managed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '500+', label: 'Clinics Trust Us' },
    { value: '50+', label: 'Report Templates' },
];

export default function Home() {
    return (
        <div className="home-page">
            {/* Hero */}
            <section className="hero-section">
                <div className="container">
                    <motion.div
                        className="hero-content"
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div className="hero-badge" custom={0} variants={fadeUp}>
                            <span className="badge badge-primary">Now Available</span>
                        </motion.div>
                        <motion.h1 className="hero-title" custom={1} variants={fadeUp}>
                            Radiology Clinic
                            <br />
                            <span className="gradient-text">Management</span>
                            <br />
                            Reimagined.
                        </motion.h1>
                        <motion.p className="hero-subtitle" custom={2} variants={fadeUp}>
                            UltraCare streamlines your diagnostic imaging center with intelligent case management,
                            instant report generation, and real-time financial analytics — all in one elegant platform.
                        </motion.p>
                        <motion.div className="hero-actions" custom={3} variants={fadeUp}>
                            <Link to="/signup" className="btn btn-primary btn-lg">
                                Get Started Free <ArrowRight size={18} />
                            </Link>
                            <Link to="/about-us" className="btn btn-secondary btn-lg">
                                Learn More
                            </Link>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="hero-visual"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        <div className="hero-dashboard-preview">
                            <div className="preview-header">
                                <div className="preview-dots">
                                    <span></span><span></span><span></span>
                                </div>
                                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>Dashboard</span>
                            </div>
                            <div className="preview-body">
                                {/* Mini stat cards */}
                                <div className="preview-stats-row">
                                    <div className="preview-stat-card">
                                        <div className="preview-stat-dot" style={{ background: '#0071E3' }}></div>
                                        <div><div className="preview-stat-num">24</div><div className="preview-stat-lbl">Cases</div></div>
                                    </div>
                                    <div className="preview-stat-card">
                                        <div className="preview-stat-dot" style={{ background: '#30D158' }}></div>
                                        <div><div className="preview-stat-num">₹18.5K</div><div className="preview-stat-lbl">Collection</div></div>
                                    </div>
                                    <div className="preview-stat-card">
                                        <div className="preview-stat-dot" style={{ background: '#FF9F0A' }}></div>
                                        <div><div className="preview-stat-num">156</div><div className="preview-stat-lbl">Patients</div></div>
                                    </div>
                                </div>
                                {/* Mini line graph */}
                                <div className="preview-chart">
                                    <svg viewBox="0 0 200 80" className="preview-line-svg" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M0,60 L28,45 L57,55 L85,30 L114,40 L142,15 L171,25 L200,10 L200,80 L0,80Z" fill="url(#lineGrad)" />
                                        <polyline points="0,60 28,45 57,55 85,30 114,40 142,15 171,25 200,10" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="preview-line-path" />
                                        {[{ x: 0, y: 60 }, { x: 28, y: 45 }, { x: 57, y: 55 }, { x: 85, y: 30 }, { x: 114, y: 40 }, { x: 142, y: 15 }, { x: 171, y: 25 }, { x: 200, y: 10 }].map((p, i) => (
                                            <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent)" />
                                        ))}
                                    </svg>
                                </div>
                                {/* Mini table — aligned columns */}
                                <div className="preview-table">
                                    <div className="preview-table-header">
                                        <span>Case</span><span>Service</span><span className="text-right">Amount</span>
                                    </div>
                                    {[
                                        { id: 'UC-00142', service: 'Sonography', amount: '₹500' },
                                        { id: 'UC-00143', service: 'X-Ray', amount: '₹300' },
                                        { id: 'UC-00144', service: 'MRI', amount: '₹5,000' },
                                        { id: 'UC-00145', service: 'CT Scan', amount: '₹2,000' },
                                    ].map((row, i) => (
                                        <div key={i} className="preview-table-row" style={{ animationDelay: `${i * 0.1}s` }}>
                                            <span className="preview-case-num">{row.id}</span>
                                            <span>{row.service}</span>
                                            <span className="text-right">{row.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="features-section">
                <div className="container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="section-title">Everything Your Clinic Needs</h2>
                        <p className="section-subtitle">
                            Built for radiologists and diagnostic centers, UltraCare brings all your operations under one roof.
                        </p>
                    </motion.div>

                    <div className="features-grid">
                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    className="feature-card card"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08, duration: 0.5 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <div className="feature-icon">
                                        <Icon size={24} />
                                    </div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Why Choose UltraCare */}
            <section className="why-section">
                <div className="container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="section-title">Why Choose UltraCare?</h2>
                    </motion.div>

                    <div className="why-grid">
                        <motion.div
                            className="why-card"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h3>🏥 Purpose-Built</h3>
                            <p>Designed exclusively for radiology and diagnostic imaging centers — not a generic EHR system.</p>
                        </motion.div>
                        <motion.div
                            className="why-card"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h3>⚡ Lightning Fast</h3>
                            <p>Powered by edge computing for sub-100ms response times. Your workflow never waits.</p>
                        </motion.div>
                        <motion.div
                            className="why-card"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            <h3>🔒 Enterprise Security</h3>
                            <p>End-to-end encryption, role-based access, and row-level security at the database level.</p>
                        </motion.div>
                        <motion.div
                            className="why-card"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            <h3>📊 Actionable Insights</h3>
                            <p>Real-time dashboards, collection reports, and referral analytics to grow your practice.</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                className="stat-item"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <div className="container">
                    <motion.div
                        className="cta-card card-glass"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2>Ready to Transform Your Clinic?</h2>
                        <p>Join hundreds of diagnostic centers already using UltraCare to streamline operations.</p>
                        <Link to="/signup" className="btn btn-primary btn-lg">
                            Start Free Trial <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
