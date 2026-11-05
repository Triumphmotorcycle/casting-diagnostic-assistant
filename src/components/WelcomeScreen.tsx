import { ArrowRight, ClipboardList, FlaskConical, Gauge, ImagePlus, Lightbulb, Microscope, ShieldCheck } from 'lucide-react';

type Props = {
  onStartCase: () => void;
  onOpenCases: () => void;
  onDismiss: () => void;
  dontShowAgain: boolean;
  onDontShowAgain: (checked: boolean) => void;
};

const stages = [
  { number: '01', title: 'Setup', detail: 'Workshop, machine, alloy and investment', icon: Gauge },
  { number: '02', title: 'Parameters', detail: 'Record the actual casting settings', icon: FlaskConical },
  { number: '03', title: 'Defect', detail: 'Describe, locate and photograph the fault', icon: ImagePlus },
  { number: '04', title: 'Diagnosis', detail: 'Assess possible causes systematically', icon: Microscope },
  { number: '05', title: 'Trials', detail: 'Record controlled changes and results', icon: Lightbulb },
  { number: '06', title: 'Report', detail: 'Review the findings before submission', icon: ClipboardList },
];

export function WelcomeScreen({ onStartCase, onOpenCases, onDismiss, dontShowAgain, onDontShowAgain }: Props) {
  return (
    <section className="cda-welcome space-y-6">
      <div className="cda-welcome-hero">
        <div className="cda-welcome-hero-copy">
          <p className="cda-eyebrow">TJ GOLD &amp; DIAMOND · TECHNICAL WORKSHOP</p>
          <h2>Better casting starts<br /><em>with better information.</em></h2>
          <p className="cda-welcome-intro">A structured tool for recording precious-metal casting conditions, investigating defects and sharing clear technical reports with the central team.</p>
          <div className="cda-welcome-hero-actions">
            <button onClick={onStartCase} className="cda-gold-button">Start a new diagnostic case <ArrowRight size={17} /></button>
            <button onClick={onOpenCases} className="cda-outline-button">Open my cases</button>
          </div>
        </div>
        <div className="cda-welcome-hero-art" aria-label="Molten precious metal being poured into a jewellery investment flask">
          <div className="cda-art-ring cda-art-ring-one" />
          <div className="cda-art-ring cda-art-ring-two" />
          <div className="cda-art-pour" />
          <div className="cda-art-glow" />
          <span>PRECISION · PROCESS · PERFORMANCE</span>
        </div>
      </div>

      <div className="cda-welcome-section-head">
        <div><p className="cda-eyebrow">THE DIAGNOSTIC PROCESS</p><h3>Six steps. One clear record.</h3></div>
        <p>Work through each stage in order. You can move between stages and review your entries before submitting.</p>
      </div>
      <div className="cda-stage-grid">
        {stages.map(({ number, title, detail, icon: Icon }) => (
          <article className="cda-stage-card" key={number}>
            <div className="cda-stage-card-top"><span>{number}</span><Icon size={20} strokeWidth={1.5} /></div>
            <h4>{title}</h4><p>{detail}</p>
          </article>
        ))}
      </div>

      <div className="cda-guidance-grid">
        <article className="cda-guidance-panel">
          <div className="cda-guidance-title"><ShieldCheck size={21} /><h3>Before you begin</h3></div>
          <ul>
            <li>Have the casting job and alloy details to hand.</li>
            <li>Record the machine, flask, investment and process settings actually used.</li>
            <li>Photograph the defect clearly, including its position on the casting where possible.</li>
            <li>If a value is unknown, leave it unknown rather than guessing.</li>
          </ul>
        </article>
        <article className="cda-guidance-panel cda-guidance-panel-dark">
          <p className="cda-eyebrow">GOOD DIAGNOSTIC PRACTICE</p>
          <h3>Observe first.<br /><em>Change one thing at a time.</em></h3>
          <p>Keep the original conditions accurate. Record each trial and its result separately so that the effect of a change can be understood.</p>
          <p className="cda-guidance-note">This assistant supports technical investigation. It does not replace specialist judgement or approval of process changes.</p>
        </article>
      </div>

      <div className="cda-submission-strip">
        <div><p className="cda-eyebrow">WHAT HAPPENS NEXT</p><h3>Your report goes to Workshop System Central.</h3><p>Submitting creates a central case reference for the technical team to review. Keep your own notes and evidence accurate and complete.</p></div>
        <div className="cda-submission-mark"><ClipboardList size={30} /><span>SUBMIT · REVIEW · INVESTIGATE</span></div>
      </div>

      <div className="cda-welcome-bottom">
        <label className="cda-dont-show"><input type="checkbox" checked={dontShowAgain} onChange={e => onDontShowAgain(e.target.checked)} /> Don't show this welcome screen automatically again</label>
        <button onClick={onDismiss} className="cda-continue-button">Continue to Case Resolution Centre <ArrowRight size={16} /></button>
      </div>
    </section>
  );
}
