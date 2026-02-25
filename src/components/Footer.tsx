import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="copyright">
                        <p>Copyright © 2026 UltraCare. All rights reserved.</p>
                    </div>
                    <div className="footer-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Use</a>
                    </div>
                </div>
                <div className="powered-by">
                    <p>Powered by Nexeo Security</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
