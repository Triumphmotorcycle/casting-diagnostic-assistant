import { useMemo, useState } from "react";
import { CastingCase, TrialPlan } from "@/types/casting";
import { runDiagnosis } from "@/lib/diagnosticEngine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Plus, Trash2, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  castingCase: CastingCase;
  update: (patch: Partial<CastingCase>) => void;
  onBack: () => void;
  onNext: () => void;
}

const OUTCOME_TONE: Record<TrialPlan["outcome"], string> = {
  improved: "border-teal-200 bg-teal-50 text-teal-800",
  worsened: "border-rose-200 bg-rose-50 text-rose-800",
  moved: "border-amber-200 bg-amber-50 text-amber-800",
  unchanged: "border-slate-200 bg-slate-100 text-slate-700",
  pending: "border-sky-200 bg-sky-50 text-sky-800",
};

export function TrialStep({ castingCase, update, onBack, onNext }: Props) {
  const hypotheses = useMemo(() => runDiagnosis(castingCase), [castingCase]);
  const [selected, setSelected] = useState<string>(hypotheses[0]?.id ?? "");

  const addTrial = () => {
    const h = hypotheses.find((x) => x.id === selected);
    if (!h) return;
    const trial: TrialPlan = {
      hypothesis: h.title,
      baseline: `Casting ${castingCase.alloy.meltTemp || "?"}°C, Flask ${castingCase.investment.flaskTemp || "?"}°C, ${castingCase.setup.castingMethod}`,
      primaryVariable: "",
      constants: "Casting temperature, flask temperature, machine force and investment formulation held constant.",
      adjustmentRange: "",
      expectedResult: h.expected,
      observedResult: "",
      outcome: "pending",
      nextStep: "",
    };
    update({ trials: [...castingCase.trials, trial] });
  };

  const updateTrial = (i: number, patch: Partial<TrialPlan>) => {
    const next = castingCase.trials.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    update({ trials: next });
  };

  const removeTrial = (i: number) => {
    update({ trials: castingCase.trials.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50">
            <CardTitle className="text-base font-semibold text-slate-800">Create a controlled trial</CardTitle>
            <CardDescription>
              Change one primary variable at a time. Simultaneous changes make the outcome uninterpretable.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Hypothesis to test</Label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {hypotheses.map((h) => (
                    <SelectItem key={h.id} value={h.id}>{h.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addTrial} className="bg-teal-700 hover:bg-teal-800">
              <Plus className="mr-2 h-4 w-4" /> Add trial
            </Button>
          </CardContent>
        </Card>

        {castingCase.trials.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-slate-50 shadow-sm">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <FlaskConical className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">No trials planned yet</p>
              <p className="max-w-sm text-xs text-slate-400">
                Select a hypothesis above and add a trial. Each trial records the baseline, the single variable changed
                and the expected result.
              </p>
            </CardContent>
          </Card>
        ) : (
          castingCase.trials.map((t, i) => (
            <Card key={i} className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100 bg-slate-50">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800">Trial {i + 1}</CardTitle>
                  <CardDescription className="mt-0.5">{t.hypothesis}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={OUTCOME_TONE[t.outcome]}>{t.outcome}</Badge>
                  <button onClick={() => removeTrial(i)} className="text-slate-400 transition-colors hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-medium text-slate-600">Baseline conditions</Label>
                  <Input value={t.baseline} onChange={(e) => updateTrial(i, { baseline: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Primary variable changed</Label>
                  <Input value={t.primaryVariable} onChange={(e) => updateTrial(i, { primaryVariable: e.target.value })} placeholder="e.g. Casting temperature only" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Permitted adjustment range</Label>
                  <Input value={t.adjustmentRange} onChange={(e) => updateTrial(i, { adjustmentRange: e.target.value })} placeholder="From site-approved spec" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-medium text-slate-600">Variables held constant</Label>
                  <Textarea value={t.constants} rows={2} onChange={(e) => updateTrial(i, { constants: e.target.value })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-medium text-slate-600">Expected result if hypothesis is correct</Label>
                  <Textarea value={t.expectedResult} rows={2} onChange={(e) => updateTrial(i, { expectedResult: e.target.value })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-medium text-slate-600">Observed result</Label>
                  <Textarea value={t.observedResult} rows={2} onChange={(e) => updateTrial(i, { observedResult: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Outcome</Label>
                  <Select value={t.outcome} onValueChange={(v) => updateTrial(i, { outcome: v as TrialPlan["outcome"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="improved">Improved</SelectItem>
                      <SelectItem value="worsened">Worsened</SelectItem>
                      <SelectItem value="moved">Moved</SelectItem>
                      <SelectItem value="unchanged">Unchanged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Next recommended step</Label>
                  <Input value={t.nextStep} onChange={(e) => updateTrial(i, { nextStep: e.target.value })} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <Card className="border-teal-200 bg-teal-50/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-teal-900">Controlled trial discipline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-teal-900/80">
            <p>
              Change one primary variable at a time. Simultaneous changes to casting temperature, flask temperature,
              machine force and investment formulation make the outcome difficult to interpret.
            </p>
            <p>
              Operating limits must come from equipment documentation, alloy or investment supplier guidance and
              site-approved process specifications. This tool does not invent validated limits.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={onNext} className="bg-teal-700 hover:bg-teal-800">
            View report <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}