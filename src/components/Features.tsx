import { motion } from 'framer-motion';
import { Activity, Zap, Shield, FileText, BarChart, Smartphone } from 'lucide-react';
import './Features.css';

const features = [
    {
        icon: <Activity size={32} />,
        title: "AI-Assisted Reporting",
        description: "Intelligent suggestions for X-Ray, MRI, and CT scans to speed up your workflow."
    },
    {
        icon: <Zap size={32} />,
        title: "Lightning Fast",
        description: "Optimized for speed. Generate comprehensive reports in seconds, not minutes."
    },
    {
        icon: <Shield size={32} />,
        title: "Bank-Grade Security",
        description: "Your patient data is encrypted and protected with enterprise-level security protocols."
    },
    {
        icon: <FileText size={32} />,
        title: "Smart Templates",
        description: "Customizable templates that adapt to your reporting style and preferences."
    },
    {
        icon: <BarChart size={32} />,
        title: "Analytics Dashboard",
        description: "Track your practice's performance with detailed insights and collection tracking."
    },
    {
        icon: <Smartphone size={32} />,
        title: "Mobile Ready",
        description: "Access your reports and manage your practice from any device, anywhere."
    }
];

const Features = () => {
    return (
        <section id="features" className="features">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Everything you need.</h2>
                    <p className="section-subtitle">A complete suite of tools designed for the modern radiologist.</p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            className="feature-card"
                        >
                            <div className="feature-icon">{feature.icon}</div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
