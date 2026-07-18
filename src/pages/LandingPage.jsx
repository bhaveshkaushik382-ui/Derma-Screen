import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const elementsRef = useRef([]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    elementsRef.current.forEach(el => {
      if (el) {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const addToRef = (el) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary font-bold text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
          <span className="font-headline-md text-headline-md font-bold text-primary">DermaScreen</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#features">Features</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#how-it-works">How it Works</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#faq">FAQ</a>
          <Link className="px-5 py-2.5 bg-primary text-white rounded-full font-label-md text-label-md hover:bg-primary-container transition-all active:scale-95" to="/auth">Sign In</Link>
        </nav>
        <Link to="/auth" className="md:hidden text-primary p-2">
          <span className="material-symbols-outlined">menu</span>
        </Link>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] lg:min-h-[90vh] flex items-center overflow-hidden px-margin-mobile md:px-margin-desktop py-20">
          <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md mb-6 animate-fade-in">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                AI-Powered Medical Excellence
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-background mb-6 leading-tight">
                AI-Powered Early <span className="text-gradient">Skin Lesion</span> Screening
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 leading-relaxed max-w-xl">
                Upload a skin image and receive an AI-powered screening result in seconds. Monitor your scans, track progress, and know when professional evaluation may be appropriate.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth" className="px-8 py-4 bg-primary text-white rounded-xl font-label-md text-label-md font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:bg-primary-container transition-all active:scale-95 flex items-center justify-center gap-2">
                  Start Free Scan
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
                <a href="#features" className="px-8 py-4 border-2 border-primary text-primary rounded-xl font-label-md text-label-md font-bold hover:bg-primary/5 transition-all active:scale-95 flex items-center justify-center">
                  Learn More
                </a>
              </div>
              <div className="mt-12 flex items-center gap-8 border-t border-outline-variant pt-8">
                <div>
                  <div className="font-headline-md text-headline-md text-primary">90%+</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">Clinical Accuracy</div>
                </div>
                <div className="w-[1px] h-10 bg-outline-variant"></div>
                <div>
                  <div className="font-headline-md text-headline-md text-primary">10k+</div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">Successful Scans</div>
                </div>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>
              <div className="relative glass-card border border-white/50 p-6 rounded-[32px] shadow-2xl">
                <img 
                  className="w-full h-auto rounded-2xl shadow-sm border border-outline-variant" 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800" 
                  alt="Dermatology Dashboard Mockup"
                />
                <div className="absolute -right-8 top-1/4 glass-card p-4 rounded-2xl shadow-xl border border-white/60 animate-bounce transition-all duration-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">analytics</span>
                    </div>
                    <div>
                      <div className="font-label-md text-label-md text-on-background">Fast Analysis</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Completed in 2.4s</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-24 bg-surface" id="features">
          <div className="container mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">Advanced Technology, Human-Centric Care</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">DermaScreen combines state-of-the-art computer vision with clinical protocols to provide you with peace of mind and proactive health monitoring.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div ref={addToRef} className="p-8 bg-white rounded-[24px] border border-outline-variant hover:border-primary transition-all group">
                <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[32px]">bolt</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background mb-3">Fast Analysis</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Our proprietary neural networks analyze textures and patterns in milliseconds, providing instant feedback when you need it most.
                </p>
              </div>

              {/* Feature 2 */}
              <div ref={addToRef} className="p-8 bg-white rounded-[24px] border border-outline-variant hover:border-primary transition-all group">
                <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[32px]">shield</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background mb-3">Privacy First</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  All scans are encrypted and processed with HIPAA-grade security. Your medical data stays private, secure, and under your control.
                </p>
              </div>

              {/* Feature 3 */}
              <div ref={addToRef} className="p-8 bg-white rounded-[24px] border border-outline-variant hover:border-primary transition-all group">
                <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[32px]">clinical_notes</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background mb-3">Expert Insights</h3>
                <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  AI results are mapped to clinical frameworks, giving you the context needed to discuss findings with your healthcare provider.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Workflow */}
        <section className="py-24 relative overflow-hidden" id="how-it-works">
          <div className="container mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2">
                <div className="relative rounded-[40px] overflow-hidden">
                  <img 
                    className="w-full aspect-[4/5] object-cover" 
                    src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800" 
                    alt="Taking skin photo with smartphone"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
                </div>
              </div>
              
              <div className="lg:w-1/2">
                <h2 className="font-headline-lg text-headline-lg text-on-background mb-10">How It Works</h2>
                <div className="space-y-12">
                  {/* Step 1 */}
                  <div ref={addToRef} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-headline-md text-headline-md">1</div>
                    <div>
                      <h4 className="font-headline-md text-headline-md text-on-background mb-2">Upload Photo</h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">Take a clear, well-lit photo of the skin lesion or area of concern using your smartphone camera.</p>
                    </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div ref={addToRef} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-headline-md text-headline-md">2</div>
                    <div>
                      <h4 className="font-headline-md text-headline-md text-on-background mb-2">AI Analysis</h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">Our trained AI models compare your image against a database of thousands of clinically validated samples.</p>
                    </div>
                  </div>
                  
                  {/* Step 3 */}
                  <div ref={addToRef} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-headline-md text-headline-md">3</div>
                    <div>
                      <h4 className="font-headline-md text-headline-md text-on-background mb-2">Detailed Report</h4>
                      <p className="font-body-md text-body-md text-on-surface-variant">Receive a comprehensive PDF report detailing the probability scores and recommended next steps.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-12">
                  <Link to="/auth" className="inline-block px-8 py-4 bg-primary text-white rounded-xl font-label-md text-label-md font-bold hover:bg-primary-container transition-all">
                    Try the Experience
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">90%</div>
                <p className="font-label-md opacity-80 uppercase tracking-wider">Accuracy</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">10k+</div>
                <p className="font-label-md opacity-80 uppercase tracking-wider">Users</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">15+</div>
                <p className="font-label-md opacity-80 uppercase tracking-wider">Countries</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
                <p className="font-label-md opacity-80 uppercase tracking-wider">Availability</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-surface" id="faq">
          <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">Frequently Asked Questions</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Get the answers you need about our technology and security.</p>
            </div>
            
            <div className="space-y-4">
              <details ref={addToRef} className="group bg-white border border-outline-variant rounded-2xl overflow-hidden" open>
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-headline-md text-headline-md text-on-background group-hover:text-primary transition-colors">
                  Is DermaScreen a replacement for a doctor?
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <div className="px-6 pb-6 font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  No, DermaScreen is a screening tool designed for early detection and awareness. It is meant to assist you in monitoring your skin and to provide helpful information for your next visit to a board-certified dermatologist. It is not a definitive diagnosis.
                </div>
              </details>
              
              <details ref={addToRef} className="group bg-white border border-outline-variant rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-headline-md text-headline-md text-on-background group-hover:text-primary transition-colors">
                  How accurate is the AI screening?
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <div className="px-6 pb-6 font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Our AI has been validated in clinical studies showing over 90% sensitivity in identifying suspicious lesions. However, results can vary based on photo quality, lighting, and specific skin conditions.
                </div>
              </details>
              
              <details ref={addToRef} className="group bg-white border border-outline-variant rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-headline-md text-headline-md text-on-background group-hover:text-primary transition-colors">
                  How is my data stored?
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                </summary>
                <div className="px-6 pb-6 font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Your images and personal data are encrypted using AES-256 standards. We adhere to GDPR and HIPAA compliance guidelines, ensuring your health records are accessible only by you.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-margin-mobile md:px-margin-desktop">
          <div className="container mx-auto">
            <div className="relative bg-on-background rounded-[48px] p-12 md:p-20 overflow-hidden text-center">
              <div className="relative z-10">
                <h2 className="font-headline-xl text-headline-xl text-white mb-6">Ready to take control of your skin health?</h2>
                <p className="font-body-lg text-body-lg text-white/70 mb-10 max-w-2xl mx-auto">Join over 10,000 users who trust DermaScreen for their regular skin monitoring. Start your first scan today for free.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/auth" className="px-10 py-5 bg-primary text-white rounded-xl font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-xl shadow-primary/20">
                    Get Started Now
                  </Link>
                  <Link to="/auth" className="px-10 py-5 bg-white/10 text-white rounded-xl font-label-md text-label-md font-bold hover:bg-white/20 backdrop-blur-md transition-all">
                    View Demo Scan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Professional Footer */}
      <footer className="bg-surface pt-20 pb-10 border-t border-outline-variant">
        <div className="container mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary font-bold text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
                <span className="font-headline-md text-headline-md font-bold text-primary">DermaScreen</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                The future of clinical dermatology assistant. Empowering patients and practitioners with high-precision AI diagnostics.
              </p>
            </div>
            <div>
              <h5 className="font-label-md text-label-md text-on-background uppercase tracking-widest mb-6">Product</h5>
              <ul className="space-y-4">
                <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Screening AI</a></li>
                <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Patient Portal</a></li>
                <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Professional API</a></li>
                <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Clinical Studies</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-label-md text-label-md text-on-background uppercase tracking-widest mb-6">Company</h5>
              <ul className="space-y-4">
                <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">About Us</a></li>
                <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Careers</a></li>
                <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Press Kit</a></li>
                <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-label-md text-label-md text-on-background uppercase tracking-widest mb-6">Legal</h5>
              <ul className="space-y-4">
                <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a></li>
                <li><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Medical Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="font-body-sm text-body-sm text-on-surface-variant">© 2026 DermaScreen AI. All rights reserved.</p>
            <div className="flex gap-6">
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg>
              </a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
