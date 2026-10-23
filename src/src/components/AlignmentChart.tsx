import { CastingCase } from "@/types/casting";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface Props {
  castingCase: CastingCase;
}

type Alignment = "aligned" | "watch" | "off" | "unknown";

interface Axis {
  key: string;
  label: string;
  sublabel: string;
  score: number;
  alignment: Alignment;
  detail: string;
}

const TONE: Record<Alignment, { bar: string; chip: string; icon: React.ElementType; label: string }> = {
  aligned: { bar: "bg-teal-500", chip: "border-teal-200 bg-teal-50 text-teal-800", icon: CheckCircle2, label: "Aligned" },
  watch: { bar: "bg-amber-500", chip: "border-amber-200 bg-amber-50 text-amber-800", icon: AlertTriangle, label: "Watch" },
  off: { bar: "bg-rose-500", chip: "border-rose-200 bg-rose-50 text-rose-800", icon: XCircle, label: "Off" },
  unknown: { bar: "bg-slate-300", chip: "border-slate-200 bg-slate-100 text-slate-600", icon: HelpCircle, label: "Unknown" },
};

function band(score: number): Alignment {
  if (score >= 75) return "aligned";
  if (score >= 50) return "watch";
  if (score > 0) return "off";
  return "unknown";
}

function scoreAxis(c: CastingCase): Axis[] {
  const { alloy, investment, tree, setup, defect } = c;

  const melt = parseFloat(alloy.meltTemp);
  const flask = parseFloat(investment.flaskTemp);
  let thermal = 0;
  let thermalDetail = "Casting and flask temperature not recorded.";
  if (!isNaN(melt) && !isNaN(flask)) {
    thermal = 70;
    thermalDetail = `Casting temp ${melt} °C, flask ${flask} °C.`;
    if (alloy.measurementConfidence === "validated") thermal += 20;
    else if (alloy.measurementConfidence === "partial") thermal += 5;
    else thermal -= 20;
    if (alloy.superheatDuration) thermal += 5;
  } else if (!isNaN(melt) || !isNaN(flask)) {
    thermal = 40;
    thermalDetail = "Only one of casting temp or flask temp recorded.";
  }

  let inv = 0;
  let invDetail = "Investment details incomplete.";
  const invFields = [investment.product, investment.liquidRatio, investment.flaskTemp, investment.burnoutSchedule];
  const invFilled = invFields.filter(Boolean).length;
  inv = Math.round((invFilled / invFields.length) * 60);
  invDetail = `${invFilled}/${invFields.length} key investment fields recorded.`;
  if (investment.formulationModified || investment.additiveUsed) {
    inv -= 20;
    invDetail += " Formulation modified — experimental until qualified.";
  }
  if (investment.permeabilityNotes) inv += 10;
  if (investment.strengthNotes) inv += 10;

  let alloyScore = 0;
  let alloyDetail = "Alloy condition not documented.";
  const alloyFields = [alloy.composition, alloy.supplier, alloy.batch, alloy.chargeMass];
  const alloyFilled = alloyFields.filter(Boolean).length;
  alloyScore = Math.round((alloyFilled / alloyFields.length) * 50);
  alloyDetail = `${alloyFilled}/${alloyFields.length} alloy fields recorded.`;
  if (alloy.chargeType === "recycled" || alloy.chargeType === "mixed") {
    alloyScore -= 15;
    alloyDetail += ` Charge is ${alloy.chargeType}.`;
  }
  if (alloy.contaminationConcerns) {
    alloyScore -= 25;
    alloyDetail += " Contamination or alloy-history concerns noted.";
  }
  if (alloy.measurementConfidence === "validated") alloyScore += 15;

  let flow = 0;
  let flowDetail = "Tree geometry incomplete.";
  const treeFields = [tree.treeType, tree.sprueDiameter, tree.gateDimensions, tree.orientation, tree.venting];
  const treeFilled = treeFields.filter(Boolean).length;
  flow = Math.round((treeFilled / treeFields.length) * 60);
  flowDetail = `${treeFilled}/${treeFields.length} tree fields recorded.`;
  if (tree.positioning === "favourable") flow += 20;
  else if (tree.positioning === "unfavourable") {
    flow -= 20;
    flowDetail += " Component positioning is unfavourable.";
  }
  if (tree.venting) flow += 10;

  let meas = 0;
  let measDetail = "Measurement system not documented.";
  if (alloy.measurementConfidence === "validated") {
    meas = 90;
    measDetail = "Temperature measurement validated.";
  } else if (alloy.measurementConfidence === "partial") {
    meas = 55;
    measDetail = "Temperature measurement partially validated.";
  } else {
    meas = 25;
    measDetail = "Temperature measurement uncertain.";
  }
  if (setup.calibrationStatus) meas += 5;
  if (setup.pyrometerMode) meas += 5;

  let evidence = 0;
  let evidenceDetail = "Defect evidence incomplete.";
  const evFields = [
    defect.types.length > 0,
    !!defect.location,
    defect.morphology !== "unknown",
    defect.internal !== "unknown",
    !!defect.radiographyEvidence,
  ];
  const evFilled = evFields.filter(Boolean).length;
  evidence = Math.round((evFilled / evFields.length) * 100);
  evidenceDetail = `${evFilled}/${evFields.length} evidence fields recorded.`;

  const clamp = (n: number) => Math.max(0, Math.min(100, n));

  return [
    { key: "thermal", label: "Thermal", sublabel: "Casting & flask temp", score: clamp(thermal), alignment: band(clamp(thermal)), detail: thermalDetail },
    { key: "investment", label: "Investment", sublabel: "Formulation & burnout", score: clamp(inv), alignment: band(clamp(inv)), detail: invDetail },
    { key: "alloy", label: "Alloy condition", sublabel: "Composition & charge", score: clamp(alloyScore), alignment: band(clamp(alloyScore)), detail: alloyDetail },
    { key: "flow", label: "Flow / tree", sublabel: "Geometry & venting", score: clamp(flow), alignment: band(clamp(flow)), detail: flowDetail },
    { key: "measurement", label: "Measurement", sublabel: "Confidence & calibration", score: clamp(meas), alignment: band(clamp(meas)), detail: measDetail },
    { key: "evidence", label: "Evidence", sublabel: "Defect documentation", score: clamp(evidence), alignment: band(clamp(evidence)), detail: evidenceDetail },
  ];
}

export function AlignmentChart({ castingCase }: Props) {
  const axes = scoreAxis(castingCase);
  const offAxes = axes.filter((a) => a.alignment === "off");
  const watchAxes = axes.filter((a) => a.alignment === "watch");

  const overall = Math.round(axes.reduce((s, a) => s + a.score, 0) / axes.length);
  const overallAlignment = band(overall);

  return (
    <Card className="border-slate-200 shadow-sm print:break-inside-avoid">
      <CardHeader className="border-b border-slate-100 bg-slate-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800">Process alignment overview</CardTitle>
            <CardDescription>
              How well each part of the casting system is documented and aligned. Not a quality score — a map of where
              to look.
            </CardDescription>
          </div>
          <Badge variant="outline" className={TONE[overallAlignment].chip}>
            Overall {overall}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {axes.map((a) => {
            const tone = TONE[a.alignment];
            const Icon = tone.icon;
            return (
              <div key={a.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.label}</p>
                    <p className="text-xs text-slate-400">{a.sublabel}</p>
                  </div>
                  <Icon className={cn("h-4 w-4", a.alignment === "aligned" ? "text-teal-600" : a.alignment === "watch" ? "text-amber-600" : a.alignment === "off" ? "text-rose-600" : "text-slate-400")} />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn("h-full rounded-full transition-all", tone.bar)} style={{ width: `${a.score}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{a.score}%</span>
                  <Badge variant="outline" className={tone.chip}>{tone.label}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">{a.detail}</p>
              </div>
            );
          })}
        </div>

        {(offAxes.length > 0 || watchAxes.length > 0) && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-sm font-semibold text-teal-900">Where to look first</p>
            <ul className="mt-2 space-y-1.5">
              {offAxes.map((a) => (
                <li key={a.key} className="flex gap-2 text-sm text-teal-900/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>
                    <span className="font-medium">{a.label}</span> is off — {a.detail}
                  </span>
                </li>
              ))}
              {watchAxes.map((a) => (
                <li key={a.key} className="flex gap-2 text-sm text-teal-900/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>
                    <span className="font-medium">{a.label}</span> needs attention — {a.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}