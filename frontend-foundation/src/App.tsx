import { CTA } from "./components/CTA";
import { Features } from "./components/Features";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Navbar } from "./components/Navbar";
import { TaxOnboardingForm } from "./components/TaxOnboardingForm";
import { Trust } from "./components/Trust";

export function App() {
  return (
    <div className="min-h-screen bg-brand-mist text-brand-ink">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Trust />
        <section id="onboarding" className="bg-brand-mist px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="animate-rise">
              <p className="text-sm font-semibold uppercase text-brand-blue">
                Start securely
              </p>
              <h2 className="mt-3 max-w-xl text-3xl font-bold text-brand-ink sm:text-4xl">
                Begin your NRI filing profile without sharing passwords.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
                This first onboarding flow captures only the minimum information needed
                to understand the user profile and route the future filing workflow.
              </p>
              <div className="mt-6 rounded-xl border border-brand-rule bg-brand-surface p-5">
                <p className="text-sm font-semibold text-brand-ink">Security note</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  NRITAX.AI never asks for or stores your Income Tax Department
                  password. Future integrations should use consent-based official
                  workflows only.
                </p>
              </div>
            </div>
            <TaxOnboardingForm />
          </div>
        </section>
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
