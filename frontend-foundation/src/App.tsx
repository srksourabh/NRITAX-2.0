import { Features } from "./components/Features";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Navbar } from "./components/Navbar";
import { ProductShowcase } from "./components/ProductShowcase";
import { TaxOnboardingForm } from "./components/TaxOnboardingForm";
import { Trust } from "./components/Trust";
import { TrustStrip } from "./components/TrustStrip";

export function App() {
  return (
    <div className="min-h-screen bg-brand-mist text-brand-ink">
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <ProductShowcase />
        <Features />
        <HowItWorks />
        <Trust />
        <section id="onboarding" className="relative overflow-hidden px-6 py-10 sm:py-14 lg:px-8 lg:py-[72px]">
          <div className="absolute inset-0 bg-brand-mist" />
          <div className="relative mx-auto grid max-w-[1280px] gap-5 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <p className="text-caption uppercase tracking-wide text-brand-blue">
                Onboarding preview
              </p>
              <h2 className="mt-3 max-w-[620px] font-heading text-section text-brand-ink">
                Begin your profile inside a secure banking-grade flow.
              </h2>
              <p className="mt-3 max-w-[560px] text-body-lg text-brand-muted">
                This first onboarding flow captures only the minimum information needed
                to understand the user profile and route the future filing workflow.
              </p>
              <div className="mt-5 rounded-lg border border-brand-rule bg-white p-5 shadow-soft">
                <p className="font-heading text-card text-brand-ink">Security note</p>
                <p className="mt-2 text-body text-brand-muted">
                  NRITAX 2.0 never asks for or stores your Income Tax Department
                  password. Future integrations should use consent-based official
                  workflows only.
                </p>
              </div>
            </div>
            <div className="w-full max-w-[520px] rounded-lg border border-brand-rule bg-white p-2 shadow-premium lg:col-span-7 lg:ml-auto">
              <TaxOnboardingForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
