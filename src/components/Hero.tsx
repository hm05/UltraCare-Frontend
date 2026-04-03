import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import './Hero.css';

const Hero = () => {
    return (
        <section id="hero" className="hero">
            <div className="container hero-container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="hero-content"
                >
                    <h1 className="hero-title">
                        Radiology. <br />
                        <span className="gradient-text">Reimagined.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Experience the future of medical imaging reporting. <br />
                        Powerful, intuitive, and designed for professionals.
                    </p>
                    <div className="hero-actions">
                        <button className="cta-button">
                            Get Started
                        </button>
                        <button className="learn-more-button">
                            Learn more <ArrowRight size={16} />
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="hero-image-placeholder"
                >
                    {/* In a real scenario, this would be a high-quality dashboard screenshot */}
                    <div className="placeholder-screen">
                        <div className="screen-header">
                            <div className="dot red"></div>
                            <div className="dot yellow"></div>
                            <div className="dot green"></div>
                        </div>
                        <div className="screen-body">
                            <div className="screen-sidebar"></div>
                            <div className="screen-content">
                                <div className="skeleton-line w-75"></div>
                                <div className="skeleton-line w-50"></div>
                                <div className="skeleton-grid">
                                    <div className="skeleton-card"></div>
                                    <div className="skeleton-card"></div>
                                    <div className="skeleton-card"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
