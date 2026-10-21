import { useEffect, useState } from "react";
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

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8 print:max-w-none print:p-0">
        <div className="print:hidden">
          <CaseHeader castingCase={castingCase} update={update} />
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
            <ReportStep castingCase={castingCase} update={update} onBack={() => setStep("trials")} />
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