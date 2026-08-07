import { ITD_PORTAL_HOME, ITD_PORTAL_LABEL, ITD_PORTAL_LOGIN } from '@/lib/itd/portal';

const STEPS = [
  {
    title: 'Open the official e-Filing site',
    text: `Go to the ${ITD_PORTAL_LABEL}. Use only the government domain — we never ask you to register on a third-party site.`,
  },
  {
    title: 'Register with your PAN',
    text: 'Choose Register / Create account. Your user ID will be your PAN. Keep the password you set — you will enter it here after registration.',
  },
  {
    title: 'Verify mobile or email',
    text: 'Complete OTP verification with the mobile or email registered to your PAN. Save the confirmation.',
  },
  {
    title: 'Return here and continue',
    text: 'Come back to NRITAX, choose “I have my portal password”, and enter the same PAN and password. We then use browser automation for this session only.',
  },
] as const;

export function LandingCreateAccountGuide() {
  return (
    <section
      id="create-account"
      className="ntx-section ntx-landing-alt"
      aria-labelledby="create-account-heading"
    >
      <div className="ntx-shell">
        <p className="ntx-landing-kicker">No password yet</p>
        <h2 id="create-account-heading" className="ntx-display-lg mt-3 text-[var(--ink)]">
          Create an Income Tax Department user ID first
        </h2>
        <p className="ntx-landing-section-lede max-w-3xl">
          We do not keep your Income Tax data. You must have an e-Filing account on the department
          portal. Creating one is straightforward — we guide the steps, then you return with the
          password for this session.
        </p>

        <ol className="ntx-landing-steps mt-8">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="ntx-landing-step-no" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            className="ntx-btn ntx-btn-primary"
            href={ITD_PORTAL_LOGIN}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open e-Filing register / login
          </a>
          <a className="ntx-btn ntx-btn-secondary" href={ITD_PORTAL_HOME} target="_blank" rel="noopener noreferrer">
            Portal home
          </a>
          <a className="ntx-btn ntx-btn-quiet" href="#start">
            I have a password now — continue setup
          </a>
        </div>
      </div>
    </section>
  );
}
