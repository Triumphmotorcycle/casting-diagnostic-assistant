import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CastingCase } from "@/types/casting";
import { emptyCase, loadCase, saveCase } from "@/lib/caseStore";
import { CaseHeader } from "@/components/CaseHeader";
import { SetupStep } from "@/components/SetupStep";
import { ParametersStep } from "@/components/ParametersStep";
import { DefectStep } from "@/components/DefectStep";
import { DiagnosisStep } from "@/components/DiagnosisStep";
import { TrialStep } from "@/components/TrialStep";
import { ReportStep } from "@/components/ReportStep";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2 } from "lucide-react";

const STEPS = [
  { id: "setup", label: "Setup" },
  { id: "parameters", label: "Parameters" },
  { id: "defect", label: "Defect" },
  { id: "diagnosis", label: "Diagnosis" },
  { id: "trials", label: "Trials" },
  { id: "report", label: "Report" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export default function App() {
  const [castingCase, setCastingCase] = useState<CastingCase>(() => loadCase() ?? emptyCase());
  const [step, setStep] = useState<StepId>("setup");
  const [saved, setSaved] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [profile, setProfile] = useState<{ display_name: string; site_name: string } | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError(error.message);
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user.id || !supabase) {
      setProfile(null);
      return;
    }
    let active = true;
    supabase
      .from("workshop_profiles")
      .select("display_name, site_name")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setAuthError(`Could not load workshop profile: ${error.message}`);
          return;
        }
        if (data) {
          setProfile(data);
          setCastingCase((current) => ({
            ...current,
            setup: {
              ...current.setup,
              site: current.setup.site || data.site_name || "",
              operative: current.setup.operative || data.display_name || "",
            },
          }));
        }
      });
    return () => { active = false; };
  }, [session?.user.id]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setAuthBusy(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) setAuthError(error.message);
    setAuthBusy(false);
  }

  async function handleSubmitToRegister(submittedCase: CastingCase): Promise<{ caseRef?: string; error?: string }> {
    if (!supabase || !session?.user) return { error: "Sign in before submitting this diagnostic report." };
    const siteName = submittedCase.setup.site.trim() || profile?.site_name?.trim() || "";
    if (!siteName) return { error: "Enter the workshop site in Setup before submitting." };
    const defectLabel = submittedCase.defect.types.length
      ? submittedCase.defect.types.join(", ")
      : "Defect investigation";
    const caseTitle = `Casting diagnostic — ${defectLabel}`;
    const { data, error } = await supabase
      .from("workshop_cases")
      .insert({
        site_name: siteName,
        title: caseTitle,
        original_submission: {
          details: `Casting diagnostic submitted by ${submittedCase.setup.operative.trim() || profile?.display_name || "an authorised workshop user"}.`,
          submitted_at_client: new Date().toISOString(),
          submitted_from: "Casting Diagnostic Assistant",
          diagnostic_case: submittedCase,
        },
        submitted_by: session.user.id,
        status: "submitted",
      })
      .select("case_number, case_ref")
      .single();
    if (error) return { error: error.message };
    const caseRef = data.case_ref || `CAST-${String(data.case_number).padStart(6, "0")}`;
    return { caseRef };
  }

  const update = (patch: Partial<CastingCase>) =>
    setCastingCase((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    const id = setTimeout(() => saveCase(castingCase), 600);
    return () => clearTimeout(id);
  }, [castingCase]);

  const handleSave = () => {
    saveCase(castingCase);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Workshop connection not configured</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The diagnostic tool needs the Workshop System Supabase URL and public anon key in its GitHub Actions build settings.
            No case has been submitted or stored centrally.
          </p>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return <div className="p-10 text-center text-slate-600">Checking workshop sign-in…</div>;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <form onSubmit={handleSignIn} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">Workshop quality system</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Casting Diagnostic Assistant</h1>
            <p className="mt-2 text-sm text-slate-600">Sign in with your authorised Workshop System account.</p>
          </div>
          {authError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{authError}</p>}
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-1 w-full rounded-lg border border-slate-300 p-3" />
          </label>
          <button disabled={authBusy} className="w-full rounded-lg bg-teal-800 px-4 py-3 font-semibold text-white disabled:opacity-50">
            {authBusy ? "Signing in…" : "Sign in securely"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8 print:max-w-none print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <CaseHeader castingCase={castingCase} update={update} />
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{session.user.email}</span>
            <button type="button" onClick={() => supabase?.auth.signOut()} className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-white">Sign out</button>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm print:hidden">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                step === s.id
                  ? "bg-teal-700 text-white shadow-sm"
                  : i < stepIndex
                    ? "text-teal-700 hover:bg-teal-50"
                    : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                  step === s.id ? "bg-white/20 text-white" : i < stepIndex ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"
                )}
              >
                {i + 1}
              </span>
              {s.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              {saved ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-teal-600" /> Saved
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save
                </>
              )}
            </Button>
          </div>
        </nav>

        <main>
          {step === "setup" && (
            <SetupStep castingCase={castingCase} update={update} onNext={() => setStep("parameters")} />
          )}
          {step === "parameters" && (
            <ParametersStep
              castingCase={castingCase}
              update={update}
              onBack={() => setStep("setup")}
              onNext={() => setStep("defect")}
            />
          )}
          {step === "defect" && (
            <DefectStep
              castingCase={castingCase}
              update={update}
              onBack={() => setStep("parameters")}
              onNext={() => setStep("diagnosis")}
            />
          )}
          {step === "diagnosis" && (
            <DiagnosisStep
              castingCase={castingCase}
              onBack={() => setStep("defect")}
              onNext={() => setStep("trials")}
            />
          )}
          {step === "trials" && (
            <TrialStep
              castingCase={castingCase}
              update={update}
              onBack={() => setStep("diagnosis")}
              onNext={() => setStep("report")}
            />
          )}
          {step === "report" && (
            <ReportStep castingCase={castingCase} onBack={() => setStep("trials")} />
          )}
        </main>

        <footer className="pb-8 text-center text-xs text-slate-400 print:hidden">
          Decision-support tool. The responsible technical specialist remains accountable for approving new process
          limits.
        </footer>
      </div>
    </div>
  );
}