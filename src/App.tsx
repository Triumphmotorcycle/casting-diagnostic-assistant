import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { AlertCircle, CheckCircle2, ClipboardList, LogIn, LogOut, Plus, RefreshCw, Save, Search, Send } from 'lucide-react';
import { CastingCase } from '@/types/casting';
import { CaseStatus, RegisterCase, emptyCase, saveCase } from '@/lib/caseStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CaseHeader } from '@/components/CaseHeader';
import { SetupStep } from '@/components/SetupStep';
import { ParametersStep } from '@/components/ParametersStep';
import { DefectStep } from '@/components/DefectStep';
import { DiagnosisStep } from '@/components/DiagnosisStep';
import { TrialStep } from '@/components/TrialStep';
import { ReportStep } from '@/components/ReportStep';
import { cn } from '@/lib/utils';

type StepId = 'setup' | 'parameters' | 'defect' | 'diagnosis' | 'trials' | 'report';
const STEPS: { id: StepId; label: string }[] = [
  { id: 'setup', label: 'Setup' }, { id: 'parameters', label: 'Parameters' }, { id: 'defect', label: 'Defect' },
  { id: 'diagnosis', label: 'Diagnosis' }, { id: 'trials', label: 'Trials' }, { id: 'report', label: 'Report' },
];
const STATUS_LABEL: Record<CaseStatus, string> = { draft: 'Draft', awaiting_review: 'Awaiting review', under_investigation: 'Under investigation', closed: 'Closed' };
const STATUS_CLASS: Record<CaseStatus, string> = { draft: 'bg-slate-100 text-slate-700', awaiting_review: 'bg-amber-100 text-amber-800', under_investigation: 'bg-blue-100 text-blue-800', closed: 'bg-emerald-100 text-emerald-800' };

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [cases, setCases] = useState<RegisterCase[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [castingCase, setCastingCase] = useState<CastingCase>(() => emptyCase());
  const [step, setStep] = useState<StepId>('setup');
  const [view, setView] = useState<'register' | 'editor' | 'review'>('register');
  const [filter, setFilter] = useState<CaseStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refreshCases = useCallback(async () => {
    if (!supabase) return;
    const { data, error: fetchError } = await supabase.from('workshop_cases').select('id, case_number, case_ref, site_name, title, status, submitted_at, submitted_by, original_submission, is_shared').order('case_number', { ascending: false });
    if (fetchError) throw fetchError;
    const mapped = (data ?? []).map((row: any) => {
      const submitted = row.original_submission ?? {};
      const diagnosticData = submitted.casting_case && typeof submitted.casting_case === 'object' ? submitted.casting_case as CastingCase : emptyCase();
      const caseRef = row.case_ref || `CAST-${String(row.case_number).padStart(6, '0')}`;
      // The central register is the source of truth for the permanent case reference.
      // Apply it whenever a submitted case is loaded so reports never revert to "NEW CASE".
      const dataWithReference: CastingCase = {
        ...diagnosticData,
        setup: { ...diagnosticData.setup, caseRef }
      };
      const status: CaseStatus = row.status === 'closed' ? 'closed' : row.status === 'under_investigation' ? 'under_investigation' : 'awaiting_review';
      return { id: row.id, case_ref: caseRef, status, data: dataWithReference, created_at: row.submitted_at, updated_at: row.submitted_at, created_by: row.submitted_by, submitted_at: row.submitted_at, reviewer_notes: '', corrective_action: '', verification_result: '', closed_at: null } as RegisterCase;
    });
    setCases(mapped);
  }, []);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setUser(data.session?.user ?? null); setAuthReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession); setUser(nextSession?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !supabase) { setCases([]); return; }
    refreshCases().catch((e: Error) => setError(e.message));
  }, [user, refreshCases]);

  const activeRecord = useMemo(() => cases.find((item) => item.id === activeId) ?? null, [cases, activeId]);
  const update = (patch: Partial<CastingCase>) => setCastingCase((prev) => ({ ...prev, ...patch }));
  const beginNewCase = () => {
    setActiveId(null); setCastingCase(emptyCase()); setStep('setup'); setView('editor'); setMessage('New case started. A reference number is assigned when you save it.'); setError('');
  };
  const openCase = (record: RegisterCase) => {
    setActiveId(record.id); setCastingCase(record.data); setStep('setup'); setView(record.status === 'closed' || record.status === 'awaiting_review' || record.status === 'under_investigation' ? 'review' : 'editor');
    setReviewerNotes(record.reviewer_notes ?? ''); setCorrectiveAction(record.corrective_action ?? ''); setVerificationResult(record.verification_result ?? ''); setMessage(''); setError('');
  };

  const saveDraft = async () => {
    saveCase(castingCase);
    setMessage('Draft saved on this device. It has not been submitted to the central register.');
    setError('');
  };

  const submitForReview = async () => {
    if (!supabase || !user || activeId) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const siteName = castingCase.setup.site.trim() || 'Unspecified workshop';
      const defectSummary = castingCase.defect.types.length
        ? castingCase.defect.types.join(', ')
        : castingCase.defect.location.trim() || 'Casting diagnostic report';
      const caseTitle = `${defectSummary} — ${castingCase.alloy.metal} casting`.slice(0, 200);
      const submittedAt = new Date().toISOString();
      const { data, error: insertError } = await supabase.from('workshop_cases').insert({
        site_name: siteName,
        title: caseTitle,
        submitted_by: user.id,
        status: 'submitted',
        is_shared: true,
        original_submission: {
          details: `Casting Diagnostic Assistant report\n\n${JSON.stringify(castingCase, null, 2)}`,
          submitted_at_client: submittedAt,
          submitted_from: 'Casting Diagnostic Assistant',
          casting_case: castingCase
        }
      }).select('case_number, case_ref').single();
      if (insertError) throw insertError;
      const ref = data.case_ref || `CAST-${String(data.case_number).padStart(6, '0')}`;
      setCastingCase((current) => ({ ...current, setup: { ...current.setup, caseRef: ref } }));
      await refreshCases();
      setView('register');
      setFilter('awaiting_review');
      setMessage(`${ref} submitted successfully to Workshop System Central. Review and closure are managed there.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not submit case.'); }
    finally { setBusy(false); }
  };

  const signIn = async (event: FormEvent) => {
    event.preventDefault(); if (!supabase) return; setBusy(true); setError(''); setMessage('');
    try {
      const result = authMode === 'signin' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      if (authMode === 'signup' && !result.data.session) setMessage('Account created. Check your email to confirm the account, then sign in.');
      else setMessage('Signed in.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Authentication failed.'); }
    finally { setBusy(false); }
  };

  if (!isSupabaseConfigured) return <div className="min-h-screen bg-slate-100 p-6"><div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-slate-900">Casting Diagnostic Assistant</h1><p className="mt-3 text-slate-700">The shared case register needs a Supabase project configured before it can sign in or store cases.</p><ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-600"><li>Create a Supabase project.</li><li>Run the SQL setup script included in this project at <code>supabase/schema.sql</code>.</li><li>Add the project URL and publishable/anon key as GitHub Actions repository secrets named <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li><li>Re-run the Pages deployment workflow.</li></ol><p className="mt-4 text-sm text-slate-500">Never put a service-role key in the website or GitHub Pages build.</p></div></div>;

  if (!authReady) return <div className="p-10 text-center text-slate-600">Loading sign-in…</div>;
  if (!session || !user) return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4"><form onSubmit={signIn} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><div><p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Workshop quality system</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Casting Diagnostic Assistant</h1><p className="mt-2 text-sm text-slate-600">Sign in to use the diagnostic tool and submit reports to Workshop System Central.</p></div>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}<label className="block text-sm font-medium text-slate-700">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" autoComplete="email" /></label><label className="block text-sm font-medium text-slate-700">Password<input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} /></label><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-800 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Please wait…' : <><LogIn size={17} /> {authMode === 'signin' ? 'Sign in' : 'Create account'}</>}</button><button type="button" onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }} className="w-full text-sm text-teal-800 underline">{authMode === 'signin' ? 'Create a workshop account' : 'Already have an account? Sign in'}</button><p className="text-xs text-slate-500">New accounts may need email confirmation and reviewer permissions set by the administrator.</p></form></div>;

  const filtered = cases.filter(c => (filter === 'all' || c.status === filter) && `${c.case_ref} ${c.data?.setup?.site ?? ''} ${c.data?.setup?.operative ?? ''} ${c.data?.defect?.location ?? ''} ${(c.data?.defect?.types ?? []).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const stepIndex = STEPS.findIndex(s => s.id === step);
  const activeEditable = !activeRecord || activeRecord.status === 'draft';

  return <div className="min-h-screen bg-slate-100 print:bg-white"><div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-8 print:max-w-none print:p-0">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-teal-900 to-teal-700 px-6 py-5 text-white"><div><p className="text-xs font-semibold uppercase tracking-widest text-teal-100">Workshop quality system</p><h1 className="mt-1 text-2xl font-bold">Casting Diagnostic Assistant</h1><p className="mt-1 text-sm text-teal-100">Diagnostic reporting tool · Signed in as {user.email}</p></div><button onClick={() => supabase?.auth.signOut()} className="flex items-center gap-2 rounded-lg border border-white/30 px-3 py-2 text-sm hover:bg-white/10"><LogOut size={16}/> Sign out</button></header>
    {(error || message) && <div className={cn('flex items-start gap-2 rounded-xl p-3 text-sm', error ? 'bg-red-50 text-red-800' : 'bg-teal-50 text-teal-900')}>{error ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}<span>{error || message}</span><button className="ml-auto underline" onClick={() => {setError('');setMessage('');}}>Dismiss</button></div>}
    <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><button onClick={() => setView('register')} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold', view === 'register' ? 'bg-teal-800 text-white' : 'text-slate-600 hover:bg-slate-100')}><ClipboardList size={16}/> Case Resolution Centre</button><button onClick={beginNewCase} className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-100"><Plus size={16}/> New Case</button>{view !== 'register' && <span className="ml-auto self-center text-sm text-slate-500">{activeRecord?.case_ref ?? 'Unsaved new case'}</span>}</nav>
    {view === 'register' && <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">Case Resolution Centre</h2><p className="mt-1 text-sm text-slate-500">Submitted reports are visible in the central Workshop System register. Use this tool to prepare and submit a diagnostic report.</p></div><button onClick={() => refreshCases().catch((e: Error) => setError(e.message))} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RefreshCw size={15}/> Refresh</button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(['draft','awaiting_review','under_investigation','closed'] as CaseStatus[]).map(status => <button key={status} onClick={() => setFilter(filter === status ? 'all' : status)} className={cn('rounded-xl border p-4 text-left', filter === status ? 'border-teal-700 ring-2 ring-teal-100' : 'border-slate-200')}><span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-semibold', STATUS_CLASS[status])}>{STATUS_LABEL[status]}</span><p className="mt-2 text-2xl font-bold text-slate-900">{cases.filter(c => c.status === status).length}</p></button>)}</div><div className="flex flex-wrap gap-3"><div className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search reference, site, operative or defect…" className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm"/></div><select value={filter} onChange={e => setFilter(e.target.value as CaseStatus | 'all')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="all">All statuses</option><option value="draft">Draft</option><option value="awaiting_review">Awaiting review</option><option value="under_investigation">Under investigation</option><option value="closed">Closed</option></select></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-slate-500"><th className="p-3">Reference / date</th><th className="p-3">Site / operative</th><th className="p-3">Defect</th><th className="p-3">Status</th><th className="p-3">Updated</th><th className="p-3">Action</th></tr></thead><tbody>{filtered.map(record => <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-3"><span className="font-bold text-slate-900">{record.case_ref}</span><span className="mt-1 block text-xs text-slate-500">{record.data?.setup?.date ?? '—'}</span></td><td className="p-3">{record.data?.setup?.site || '—'}<span className="mt-1 block text-xs text-slate-500">{record.data?.setup?.operative || '—'}</span></td><td className="p-3">{(record.data?.defect?.types ?? []).join(', ') || record.data?.defect?.location || 'Not specified'}</td><td className="p-3"><span className={cn('rounded-full px-2 py-1 text-xs font-semibold', STATUS_CLASS[record.status])}>{STATUS_LABEL[record.status]}</span></td><td className="p-3 text-slate-500">{new Date(record.updated_at).toLocaleDateString()}</td><td className="p-3"><button onClick={() => openCase(record)} className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-white">{record.status === 'draft' ? 'Open draft' : 'Review case'}</button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="p-10 text-center text-sm text-slate-500">No cases match this view yet.</div>}</div></section>}
    {view === 'editor' && (
      <>
        <div className="print:hidden"><CaseHeader castingCase={castingCase} update={update} /></div>
        <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm print:hidden">
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => setStep(s.id)} className={cn('flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium', step === s.id ? 'bg-teal-800 text-white' : i < stepIndex ? 'text-teal-800 hover:bg-teal-50' : 'text-slate-500 hover:bg-slate-100')}>
              <span className="font-bold">{i + 1}</span>{s.label}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap gap-2">
            <button disabled={busy || !activeEditable} onClick={saveDraft} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50"><Save size={15} /> {busy ? 'Saving…' : 'Save draft'}</button>
            <button disabled={busy || (!!activeRecord && activeRecord.status !== 'draft')} onClick={submitForReview} className="flex items-center gap-2 rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Send size={15} /> Submit for review</button>
          </div>
        </nav>
        {!activeEditable && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This report has already been submitted. Formal review and closure are managed in Workshop System Central.</p>}
        <main>
          {step === 'setup' && <SetupStep castingCase={castingCase} update={update} onNext={() => setStep('parameters')} />}
          {step === 'parameters' && <ParametersStep castingCase={castingCase} update={update} onBack={() => setStep('setup')} onNext={() => setStep('defect')} />}
          {step === 'defect' && <DefectStep castingCase={castingCase} update={update} onBack={() => setStep('parameters')} onNext={() => setStep('diagnosis')} />}
          {step === 'diagnosis' && <DiagnosisStep castingCase={castingCase} onBack={() => setStep('defect')} onNext={() => setStep('trials')} />}
          {step === 'trials' && <TrialStep castingCase={castingCase} update={update} onBack={() => setStep('diagnosis')} onNext={() => setStep('report')} />}
          {step === 'report' && <ReportStep castingCase={castingCase} update={update} onBack={() => setStep('trials')} />}
        </main>
      </>
    )}
    {view === 'review' && activeRecord && <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Submitted diagnostic report</p><h2 className="mt-1 text-2xl font-bold">{activeRecord.case_ref}</h2><p className="mt-1 text-sm text-slate-500">{activeRecord.data.setup.site || 'Site not specified'} · {activeRecord.data.setup.date}</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4"><h3 className="font-semibold">Reported defect</h3><p className="mt-2 text-sm">{activeRecord.data.defect.types.join(', ') || 'Not specified'}</p><p className="mt-1 text-sm text-slate-600">Location: {activeRecord.data.defect.location || 'Not specified'}</p><p className="mt-2 text-sm text-slate-600">Operative: {activeRecord.data.setup.operative || 'Not specified'}</p></div>
        <div className="rounded-xl bg-slate-50 p-4"><h3 className="font-semibold">Casting setup</h3><p className="mt-2 text-sm">{activeRecord.data.setup.machineMake} {activeRecord.data.setup.machineModel}</p><p className="mt-1 text-sm text-slate-600">Metal: {activeRecord.data.alloy.metal} · {activeRecord.data.alloy.composition || 'Composition not specified'}</p><p className="mt-1 text-sm text-slate-600">Investment: {activeRecord.data.investment.manufacturer} {activeRecord.data.investment.product}</p></div>
      </div>
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This report is stored in Workshop System Central. Formal review, investigation and closure are managed in the central Hub.</p>
      <div className="flex flex-wrap gap-2"><button onClick={()=>{setCastingCase(activeRecord.data);setStep('report');setView('editor');}} className="rounded-lg border px-3 py-2 text-sm font-semibold">View full report</button><button onClick={()=>setView('register')} className="text-sm font-medium text-teal-800 underline">Back to submitted reports</button></div>
    </section>}
    <footer className="pb-8 text-center text-xs text-slate-400">Decision-support only. Technical changes must be validated and approved by the responsible specialist.</footer>
  </div></div>;
}
