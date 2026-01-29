import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'compliance', 'about', 'contact']
      let currentSection = 'home'

      sections.forEach((section) => {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100) {
            currentSection = section
          }
        }
      })

      setActiveSection(currentSection)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (section: string) => {
    const element = document.getElementById(section)
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="app-container">
      {/* Navigation */}
      <nav className={`navbar ${activeSection === 'home' ? 'navbar-light' : 'navbar-dark'}`}>
        <div className="navbar-content">
          <div className="logo">UltraCare</div>
          <ul className="nav-links">
            <li><a onClick={() => scrollToSection('home')} className={activeSection === 'home' ? 'active' : ''}>Home</a></li>
            <li><a onClick={() => scrollToSection('features')} className={activeSection === 'features' ? 'active' : ''}>Features</a></li>
            <li><a onClick={() => scrollToSection('compliance')} className={activeSection === 'compliance' ? 'active' : ''}>Compliance</a></li>
            <li><a onClick={() => scrollToSection('about')} className={activeSection === 'about' ? 'active' : ''}>About</a></li>
            <li><a onClick={() => scrollToSection('contact')} className={activeSection === 'contact' ? 'active' : ''}>Contact</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">UltraCare</h1>
          <p className="hero-subtitle">Radiology Reporting & Practice Management Platform</p>
          <p className="hero-description">
            Transform your radiology practice with AI-powered insights and integrated collection tracking
          </p>
          <button className="cta-button" onClick={() => scrollToSection('features')}>Explore Features</button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title">Our Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            {/* <div className="feature-icon">🩻</div> */}
            <h3>X-Ray Reporting</h3>
            <p>Fast and accurate X-ray analysis with AI assistance</p>
          </div>
          <div className="feature-card">
            {/* <div className="feature-icon">🔬</div> */}
            <h3>Sonography</h3>
            <p>Ultrasound reporting made easy and comprehensive</p>
          </div>
          <div className="feature-card">
            {/* <div className="feature-icon">🧠</div> */}
            <h3>CT Scan</h3>
            <p>Advanced CT analysis with detailed insights</p>
          </div>
          <div className="feature-card">
            {/* <div className="feature-icon">💫</div> */}
            <h3>MRI Reporting</h3>
            <p>Detailed MRI insights and comprehensive reports</p>
          </div>
          <div className="feature-card">
            {/* <div className="feature-icon">🤖</div> */}
            <h3>AI Assistant</h3>
            <p>Your intelligent junior doctor for report generation</p>
          </div>
          <div className="feature-card">
            {/* <div className="feature-icon">💰</div> */}
            <h3>Collection Tracking</h3>
            <p>Comprehensive collection information and analytics</p>
          </div>
        </div>
      </section>
      
      {/* Compliance Notice */}
      <section id="compliance" className="compliance-section">
        <h2 className="section-title">Compliance & Data Protection</h2>
        <div className='compliance-details'>
          <p className="compliance-text">
            UltraCare is built with privacy, security, and clinical responsibility at its core.
          </p>
          <ul className="compliance-list">
            <li>Patient data is securely stored and accessible only to authorized medical professionals</li>
            <li>All sensitive actions are logged for audit and accountability</li>
            <li>AI-generated insights are assistive and do not replace medical judgment</li>
            <li>Designed in alignment with global healthcare data protection principles (HIPAA, GDPR, DPDP)</li>
          </ul>
        </div>
        <p className="compliance-footnote">
          Final diagnosis and reporting remain solely under the responsibility of the licensed doctor.
        </p>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <h2 className="section-title">About UltraCare</h2>
        <div className="about-content">
          <p>
            UltraCare is an intelligent platform designed specifically for radiologists to streamline medical imaging reporting combined with comprehensive practice management. 
          </p>
          <p>
            With AI-powered insights for Sonography, X-Ray, CT Scan, and MRI reports, plus integrated collection information tracking, UltraCare helps you manage your radiology practice more efficiently than ever before.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <h2 className="section-title">Get In Touch</h2>
        <div className="contact-content">
          <p>Interested in learning more about UltraCare?</p>
          <button className="contact-button">Send us a message</button>
        </div>
      </section>


      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 UltraCare. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
