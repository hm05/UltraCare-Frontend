import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Footer from '../components/Footer';

const LandingPage = () => {
    return (
        <>
            <Navbar />
            <Hero />
            <Features />
            <section id="compliance" className="py-20 bg-[#f5f5f7] border-t border-[#d2d2d7]">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Uncompromised Security</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        We adhere to the strictest global standards for healthcare data protection, ensuring your patient's information remains private and secure.
                    </p>
                </div>
            </section>
            <Footer />
        </>
    );
};

export default LandingPage;
