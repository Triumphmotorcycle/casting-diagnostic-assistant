import { CastingCase } from "@/types/casting";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Thermometer, Gauge, Layers, AlertTriangle } from "lucide-react";

interface Props {
  castingCase: CastingCase;
  update: (patch: Partial<CastingCase>) => void;
  onBack: () => void;
  onNext: () => void;
}

function Stat({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold text-slate-800">{value || "—"}</span>
        {unit && <span className="ml-1 text-sm text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

export function ParametersStep({ castingCase, update, onBack, onNext }: Props) {
  const { alloy, investment, setup } = castingCase;
  const setAlloy = (patch: Partial<CastingCase["alloy"]>) => update({ alloy: { ...alloy, ...patch } });
  const setInv = (patch: Partial<CastingCase["investment"]>) =>
    update({ investment: { ...investment, ...patch } });

  const confidenceTone =
    alloy.measurementConfidence === "validated"
      ? "border-teal-200 bg-teal-50 text-teal-800"
      : alloy.measurementConfidence === "partial"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-rose-200 bg-rose-50 text-rose-800";

  const water = parseFloat(investment.waterFraction);
  const expansion = parseFloat(investment.expansionFluidFraction);
  const splitValid = !isNaN(water) && !isNaN(expansion) && Math.abs(water + expansion - 100) < 0.5;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Thermometer} label="Casting temperature" value={alloy.meltTemp} unit="°C" tone="bg-rose-100 text-rose-700" />
        <Stat icon={Layers} label="Flask temperature" value={investment.flaskTemp} unit="°C" tone="bg-amber-100 text-amber-700" />
        <Stat icon={Gauge} label="Charge mass" value={alloy.chargeMass} unit="g" tone="bg-teal-100 text-teal-700" />
        <Stat icon={Thermometer} label="Superheat time" value={alloy.superheatDuration} unit="s" tone="bg-slate-100 text-slate-700" />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <CardTitle className="text-base font-semibold text-slate-800">Operating parameters</CardTitle>
          <CardDescription>Record measured values with explicit units. Leave blank if unknown.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-teal-800">Thermal</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Casting temperature (°C)</Label>
                <Input value={alloy.meltTemp} onChange={(e) => setAlloy({ meltTemp: e.target.value })} />
                <p className="text-xs text-slate-400">Measured metal temperature immediately before casting.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Flask temperature (°C)</Label>
                <Input value={investment.flaskTemp} onChange={(e) => setInv({ flaskTemp: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Superheat duration (s)</Label>
                <Input value={alloy.superheatDuration} onChange={(e) => setAlloy({ superheatDuration: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Flask temp method</Label>
                <Input value={investment.flaskTempMethod} onChange={(e) => setInv({ flaskTempMethod: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-teal-800">Investment mixing</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Liquid-to-powder ratio</Label>
                <Input value={investment.liquidRatio} onChange={(e) => setInv({ liquidRatio: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Water temperature (°C)</Label>
                <Input value={investment.waterTemp} onChange={(e) => setInv({ waterTemp: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Mixing time (min)</Label>
                <Input value={investment.mixingTime} onChange={(e) => setInv({ mixingTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-600">Setting time (min)</Label>
                <Input value={investment.settingTime} onChange={(e) => setInv({ settingTime: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium text-slate-600">Burnout schedule</Label>
                <Input value={investment.burnoutSchedule} onChange={(e) => setInv({ burnoutSchedule: e.target.value })} />
              </div>
            </div>

            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
              <p className="text-xs font-semibold text-teal-900">Liquid split (of total liquid)</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Water fraction (%)</Label>
                  <Input value={investment.waterFraction} onChange={(e) => setInv({ waterFraction: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-600">Expansion fluid fraction (%)</Label>
                  <Input value={investment.expansionFluidFraction} onChange={(e) => setInv({ expansionFluidFraction: e.target.value })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-medium text-slate-600">Expansion fluid type</Label>
                  <Input value={investment.expansionFluidType} onChange={(e) => setInv({ expansionFluidType: e.target.value })} placeholder="e.g. colloidal silica sol" />
                </div>
              </div>
              {(investment.waterFraction || investment.expansionFluidFraction) && (
                <p className={`mt-2 text-xs font-medium ${splitValid ? "text-teal-700" : "text-rose-600"}`}>
                  {splitValid
                    ? `Split totals ${water + expansion}% of the liquid.`
                    : `Split totals ${(isNaN(water) ? 0 : water) + (isNaN(expansion) ? 0 : expansion)}% — should total 100%.`}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Measurement confidence</span>
            <Badge variant="outline" className={confidenceTone}>
              {alloy.measurementConfidence}
            </Badge>
            <span className="text-xs text-slate-400">
              {setup.tempSystem || "No temperature system recorded"}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={onNext} className="bg-teal-700 hover:bg-teal-800">
              Describe defect <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {alloy.measurementConfidence !== "validated" && (
        <Card className="border-amber-300 bg-amber-50 shadow-sm">
          <CardContent className="flex gap-3 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">Uncertain temperature measurement</p>
              <p className="mt-1 text-amber-900/80">
                Casting-temperature confidence is <strong>{alloy.measurementConfidence}</strong>. Any proposed process
                change that depends on casting or flask temperature cannot be marked approved until the measurement is
                validated.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}