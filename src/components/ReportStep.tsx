import { useMemo, useState } from "react";
import { CastingCase, RecommendationStatus } from "@/types/casting";
import { runDiagnosis, alloyNote } from "@/lib/diagnosticEngine";
import { saveCase } from "@/lib/caseStore";
import { AlignmentChart } from "@/components/AlignmentChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  castingCase: CastingCase;
  update?: (patch: Partial<CastingCase>) => void;
  onBack: () => void;
  backLabel?: string;
  onSubmitToRegister?: (castingCase: CastingCase) => Promise<{ caseRef?: string; error?: string }>;
}

const STATUS_LABEL: Record<RecommendationStatus, string> = {
  "site-validated": "Site-validated",
  experimental: "Experimental",
  "published-research": "Published research",
  "general-guidance": "General guidance",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-right text-sm text-slate-800">{value || "—"}</span>
    </div>
  );
}

export function ReportStep({ castingCase, onBack, backLabel = 'Back to trials' }: Props) {
  const hypotheses = useMemo(() => runDiagnosis(castingCase), [castingCase]);
  const [saved, setSaved] = useState(false);
  const { setup, alloy, investment, tree, defect } = castingCase;
  const note = alloyNote(alloy.composition);
  const lowConfidence = alloy.measurementConfidence !== "validated";

  const handleSave = () => {
    saveCase(castingCase);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePrint = () => window.print();



  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <AlignmentChart castingCase={castingCase} />

        <Card className="border-slate-200 shadow-sm print:break-inside-avoid">
          <CardHeader className="border-b border-slate-100 bg-slate-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="font-serif text-lg font-bold text-slate-800">
                  Case report — {setup.caseRef}
                </CardTitle>
                <CardDescription>
                  {setup.site || "Site not set"} · {setup.operative || "Operative not set"} · {setup.date}
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
                Diagnostic report
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-teal-800">Setup & equipment</h3>
              <Row label="Machine" value={`${setup.machineMake} ${setup.machineModel}`.trim()} />
              <Row label="Casting method" value={setup.castingMethod} />
              <Row label="Temperature system" value={setup.tempSystem} />
              <Row label="Calibration" value={setup.calibrationStatus} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-teal-800">Alloy</h3>
              <Row label="Metal" value={alloy.metal} />
              <Row label="Composition" value={alloy.composition} />
              <Row label="Charge type" value={alloy.chargeType} />
              <Row label="Casting temperature" value={alloy.meltTemp ? `${alloy.meltTemp} °C` : ""} />
              <Row label="Measurement confidence" value={alloy.measurementConfidence} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-teal-800">Investment</h3>
              <Row label="Product" value={investment.product} />
              <Row label="Family" value={investment.family} />
              <Row label="Liquid-to-powder" value={investment.liquidRatio} />
              <Row
                label="Liquid split"
                value={
                  investment.waterFraction || investment.expansionFluidFraction
                    ? `${investment.waterFraction || "?"}% water / ${investment.expansionFluidFraction || "?"}% ${
                        investment.expansionFluidType || "expansion fluid"
                      }`
                    : ""
                }
              />
              <Row label="Flask temperature" value={investment.flaskTemp ? `${investment.flaskTemp} °C` : ""} />
              <Row label="Formulation modified" value={investment.formulationModified ? "Yes" : "No"} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-teal-800">Tree geometry</h3>
              <Row label="Tree type" value={tree.treeType} />
              <Row label="Components" value={tree.componentCount} />
              <Row label="Sprue diameter" value={tree.sprueDiameter} />
              <Row label="Positioning" value={tree.positioning} />
              <Row label="Venting" value={tree.venting} />
            </div>
            <div className="sm:col-span-2">
              <h3 className="mb-2 text-sm font-semibold text-teal-800">Defect</h3>
              <Row label="Symptoms" value={defect.types.join(", ")} />
              <Row label="Location" value={defect.location} />
              <Row label="Morphology" value={defect.morphology} />
              <Row label="Internal / surface" value={defect.internal} />
              <Row label="Recurrence" value={defect.recurrence} />
              <Row label="Recent changes" value={defect.recentChanges} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm print:break-inside-avoid">
          <CardHeader className="border-b border-slate-100 bg-slate-50">
            <CardTitle className="text-base font-semibold text-slate-800">Initial diagnostic ranking</CardTitle>
            <CardDescription>Supporting evidence, conflicting evidence and missing information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {hypotheses.map((h, i) => (
              <div
                key={h.id}
                className="rounded-xl border border-slate-200 bg-white p-4 print:break-inside-avoid"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      i === 0 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{h.title}</p>
                      <span className="text-xs font-semibold text-teal-700">
                        {Math.round(h.confidence * 100)}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{h.mechanism}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">Why ranked here: </span>
                      {h.confidenceReason}
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold text-teal-700">Supporting</p>
                        <ul className="mt-1 space-y-1">
                          {h.supporting.map((s, k) => (
                            <li key={k} className="text-xs text-slate-600">• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-rose-600">Conflicting</p>
                        <ul className="mt-1 space-y-1">
                          {h.conflicting.length === 0 ? (
                            <li className="text-xs text-slate-400">—</li>
                          ) : (
                            h.conflicting.map((s, k) => (
                              <li key={k} className="text-xs text-slate-600">• {s}</li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-600">Missing</p>
                        <ul className="mt-1 space-y-1">
                          {h.missing.map((s, k) => (
                            <li key={k} className="text-xs text-slate-600">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 p-3">
                      <p className="text-xs font-semibold text-teal-800">Process adjustment</p>
                      <p className="mt-0.5 text-xs text-teal-900/90">{h.adjustment}</p>
                      <p className="mt-1 text-xs text-teal-900/70">
                        <span className="font-medium">Rationale: </span>
                        {h.adjustmentRationale}
                      </p>
                      <p className="mt-1 text-xs text-teal-900/70">
                        <span className="font-medium">Status: </span>
                        {STATUS_LABEL[h.recommendationStatus]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm print:break-inside-avoid">
          <CardHeader className="border-b border-slate-100 bg-slate-50">
            <CardTitle className="text-base font-semibold text-slate-800">Trials & outcomes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {castingCase.trials.length === 0 ? (
              <p className="text-sm text-slate-400">No trials recorded.</p>
            ) : (
              castingCase.trials.map((t, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 print:break-inside-avoid">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">
                      Trial {i + 1}: {t.hypothesis}
                    </span>
                    <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700">
                      {t.outcome}
                    </Badge>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-600">Variable: </span>
                      {t.primaryVariable || "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-600">Range: </span>
                      {t.adjustmentRange || "—"}
                    </p>
                    <p className="text-xs text-slate-500 sm:col-span-2">
                      <span className="font-medium text-slate-600">Constants: </span>
                      {t.constants || "—"}
                    </p>
                    <p className="text-xs text-slate-500 sm:col-span-2">
                      <span className="font-medium text-slate-600">Expected: </span>
                      {t.expectedResult || "—"}
                    </p>
                    <p className="text-xs text-slate-500 sm:col-span-2">
                      <span className="font-medium text-slate-600">Observed: </span>
                      {t.observedResult || "—"}
                    </p>
                    <p className="text-xs text-slate-500 sm:col-span-2">
                      <span className="font-medium text-slate-600">Next step: </span>
                      {t.nextStep || "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {note && (
          <Card className="border-teal-200 bg-teal-50/60 shadow-sm print:break-inside-avoid">
            <CardContent className="p-4 text-sm text-teal-900/80">
              <span className="font-semibold text-teal-900">Alloy note: </span>
              {note}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        {lowConfidence && (
          <Card className="border-amber-300 bg-amber-50 shadow-sm print:break-inside-avoid">
            <CardContent className="flex gap-3 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">
                Temperature measurement is not fully validated. Any process change that depends on it must be checked by the responsible technical specialist.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-2 print:hidden">
          <Button onClick={handleSave} className="bg-teal-700 hover:bg-teal-800">
            {saved ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 text-teal-600" /> Saved
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save report
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Export / print report
          </Button>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {backLabel}
          </Button>
        </div>

        <Card className="border-slate-200 bg-slate-50 shadow-sm print:break-inside-avoid">
          <CardContent className="flex items-center gap-3 p-4 text-xs text-slate-500">
            <ClipboardList className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              This report is a decision-support record. Formal review, corrective actions and approval are recorded in Workshop Hub.
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}