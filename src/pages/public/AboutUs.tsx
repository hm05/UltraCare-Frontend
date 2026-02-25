import { motion } from 'framer-motion';
import { Shield, Lock, Server, Globe, CheckCircle } from 'lucide-react';
import './AboutUs.css';

const compliances = [
    { icon: Shield, name: 'HIPAA Compliant', desc: 'Patient data handled per healthcare privacy standards.' },
    { icon: Lock, name: 'End-to-End Encryption', desc: 'All data encrypted in transit and at rest.' },
    { icon: Server, name: 'ISO 27001', desc: 'Information security management best practices.' },
    { icon: Globe, name: 'GDPR Ready', desc: 'Data protection regulation compliant architecture.' },
];

export default function AboutUs() {
    return (
        <div className="about-page">
            <div className="container">
                <motion.div className="section-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="section-title">About UltraCare</h1>
                    <p className="section-subtitle">Transforming radiology clinic management with technology that puts patient care first.</p>
                </motion.div>

                <motion.section className="about-mission" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="mission-card card">
                        <h2>Our Mission</h2>
                        <p>UltraCare was born from a simple observation: diagnostic imaging centers spend too much time on administrative tasks and not enough on patient care. We built a platform that automates the repetitive — case registration, billing, report generation, referral tracking — so radiologists and their teams can focus on what matters most: delivering accurate diagnoses.</p>
                        <div className="mission-values">
                            <div className="value-item"><CheckCircle size={18} /><span>Simplify clinic operations</span></div>
                            <div className="value-item"><CheckCircle size={18} /><span>Reduce administrative overhead</span></div>
                            <div className="value-item"><CheckCircle size={18} /><span>Provide actionable financial insights</span></div>
                            <div className="value-item"><CheckCircle size={18} /><span>Ensure data security and compliance</span></div>
                        </div>
                    </div>
                </motion.section>

                <section className="about-compliance">
                    <h2 className="section-title" style={{ fontSize: 'var(--font-size-2xl)' }}>Compliance & Security</h2>
                    <p className="section-subtitle" style={{ marginBottom: 'var(--space-10)' }}>Your data security is our top priority. We follow industry-leading standards.</p>
                    <div className="compliance-grid">
                        {compliances.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <motion.div key={item.name} className="compliance-card card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                    <div className="compliance-icon"><Icon size={24} /></div>
                                    <h3>{item.name}</h3>
                                    <p>{item.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
