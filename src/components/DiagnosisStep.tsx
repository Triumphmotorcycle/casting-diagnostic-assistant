import { useMemo } from "react";
import { CastingCase } from "@/types/casting";
import { runDiagnosis } from "@/lib/diagnosticEngine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, AlertTriangle, FlaskConical, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  castingCase: CastingCase;
  onBack: () => void;
  onNext: () => void;
}

const STATUS_TONE: Record<string, string> = {
  "site-validated": "border-teal-200 bg-teal-50 text-teal-800",
  experimental: "border-amber-200 bg-amber-50 text-amber-800",
  "published-research": "border-sky-200 bg-sky-50 text-sky-800",
  "general-guidance": "border-slate-200 bg-slate-100 text-slate-700",
};

const STATUS_LABEL: Record<string, string> = {
  "site-validated": "Site-validated",
  experimental: "Experimental",
  "published-research": "Published research",
  "general-guidance": "General guidance",
};

export function DiagnosisStep({ castingCase, onBack, onNext }: Props) {
  const hypotheses = useMemo(() => runDiagnosis(castingCase), [castingCase]);
  const lowConfidence = castingCase.alloy.measurementConfidence !== "validated";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {lowConfidence && (
          <Card className="border-amber-300 bg-amber-50 shadow-sm">
            <CardContent className="flex gap-3 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">
                Casting-temperature measurement is recorded as <strong>{castingCase.alloy.measurementConfidence}</strong>.
                Any thermal adjustment is built on an unreliable baseline until the measurement is validated.
              </p>
            </CardContent>
          </Card>
        )}

        {hypotheses.map((h, i) => (
          <Card key={h.id} className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                    i === 0 ? "bg-teal-700 text-white" : "bg-slate-200 text-slate-600"
                  )}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-slate-800">{h.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={STATUS_TONE[h.recommendationStatus]}>
                        {STATUS_LABEL[h.recommendationStatus]}
                      </Badge>
                      <span className="text-sm font-bold text-teal-700">{Math.round(h.confidence * 100)}%</span>
                    </div>
                  </div>
                  <CardDescription className="mt-1">{h.mechanism}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-600">Why ranked here</p>
                <p className="mt-0.5 text-xs text-slate-500">{h.confidenceReason}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold text-teal-700">Supporting evidence</p>
                  <ul className="mt-1.5 space-y-1">
                    {h.supporting.map((s, k) => (
                      <li key={k} className="text-xs text-slate-600">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-rose-600">Conflicting evidence</p>
                  <ul className="mt-1.5 space-y-1">
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
                  <p className="text-xs font-semibold text-amber-600">Missing information</p>
                  <ul className="mt-1.5 space-y-1">
                    {h.missing.map((s, k) => (
                      <li key={k} className="text-xs text-slate-600">• {s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
                <Info className="h-4 w-4 shrink-0 text-sky-600" />
                <div>
                  <p className="text-xs font-semibold text-sky-800">Safest next check</p>
                  <p className="mt-0.5 text-xs text-sky-900/80">{h.nextCheck}</p>
                </div>
              </div>

              <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
                <p className="text-xs font-semibold text-teal-800">Suggested process adjustment</p>
                <p className="mt-0.5 text-xs text-teal-900/90">{h.adjustment}</p>
                <p className="mt-1 text-xs text-teal-900/70">
                  <span className="font-medium">Rationale: </span>
                  {h.adjustmentRationale}
                </p>
              </div>

              <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <FlaskConical className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">Controlled trial</p>
                  <p className="mt-0.5 text-xs text-slate-500">{h.trial}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">Expected if correct: </span>
                    {h.expected}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Card className="border-teal-200 bg-teal-50/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-teal-900">How to read this</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-teal-900/80">
            <p>
              Several causes can be plausible at once. The ranking reflects the recorded evidence, not a certainty.
            </p>
            <p>
              Each hypothesis lists what supports it, what weakens it and what is still missing. The safest next check
              is listed before any adjustment.
            </p>
            <p>
              If the evidence is ambiguous, the app recommends an examination that can distinguish the possibilities
              rather than a change.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={onNext} className="bg-teal-700 hover:bg-teal-800">
            Plan a trial <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}