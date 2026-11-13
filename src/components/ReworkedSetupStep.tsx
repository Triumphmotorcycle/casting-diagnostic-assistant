import { useState } from "react";
import { CastingCase, CastingMethod, MetalFamily, InvestmentFamily } from "@/types/casting";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  castingCase: CastingCase;
  update: (patch: Partial<CastingCase>) => void;
  onNext: () => void;
}

function Section({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 bg-slate-50 px-6 py-4 text-left transition-colors hover:bg-slate-100"
      >
        <div>
          <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
          <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
        </div>
        {open ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
        )}
      </button>
      {open && <CardContent className="border-t border-slate-100 p-6">{children}</CardContent>}
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  unit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-600">
        {label}
        {unit && <span className="ml-1 text-slate-400">({unit})</span>}
      </Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function ReworkedSetupStep({ castingCase, update, onNext }: Props) {
  const { setup, alloy, investment } = castingCase;
  const setSetup = (patch: Partial<CastingCase["setup"]>) => update({ setup: { ...setup, ...patch } });
  const setAlloy = (patch: Partial<CastingCase["alloy"]>) => update({ alloy: { ...alloy, ...patch } });
  const setInv = (patch: Partial<CastingCase["investment"]>) =>
    update({ investment: { ...investment, ...patch } });

  const modified = investment.formulationModified || investment.additiveUsed;
  const alloyText = alloy.composition.toLowerCase();
  const alloyConstant = alloyText.includes("ptco") ? 0.65 : alloyText.includes("white") && alloyText.includes("palladium") ? 0.52 : alloyText.includes("yellow") ? 0.50 : (alloyText.includes("9ct") || alloyText.includes("9 carat")) ? 0.42 : null;
  const ringD = Number(castingCase.tree.ringDiameter), ringT = Number(castingCase.tree.ringThickness);
  const calculatedSprue = alloyConstant !== null && ringD > 0 && ringT > 0 ? (alloyConstant * Math.sqrt(ringD * ringT)).toFixed(2) : null;

  const water = parseFloat(investment.waterFraction);
  const expansion = parseFloat(investment.expansionFluidFraction);
  const splitValid =
    !isNaN(water) && !isNaN(expansion) && Math.abs(water + expansion - 100) < 0.5;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Section title="Site & equipment" description="Machine, casting method and measurement system" defaultOpen>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Machine manufacturer" value={setup.machineMake} onChange={(v) => setSetup({ machineMake: v })} placeholder="e.g. Indutherm" />
            <Field label="Machine model" value={setup.machineModel} onChange={(v) => setSetup({ machineModel: v })} placeholder="e.g. VC-500" />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Casting method</Label>
              <Select value={setup.castingMethod} onValueChange={(v) => setSetup({ castingMethod: v as CastingMethod })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="centrifugal">Centrifugal</SelectItem>
                  <SelectItem value="induction-centrifugal">Induction centrifugal</SelectItem>
                  <SelectItem value="tilt">Tilt</SelectItem>
                  <SelectItem value="vacuum-pressure">Vacuum-pressure</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Crucible type" value={setup.crucibleType} onChange={(v) => setSetup({ crucibleType: v })} placeholder="Material / capacity" />
            <Field label="Crucible condition" value={setup.crucibleCondition} onChange={(v) => setSetup({ crucibleCondition: v })} placeholder="New / used / contaminated" />
            <Field label="Measurement method" value={setup.tempMethod} onChange={(v) => setSetup({ tempMethod: v })} placeholder="Immersion / optical" />
            <Field label="Pyrometer mode" value={setup.pyrometerMode} onChange={(v) => setSetup({ pyrometerMode: v })} placeholder="Wavelength / ratio" />
            <Field label="Emissivity setting" value={setup.emissivity} onChange={(v) => setSetup({ emissivity: v })} placeholder="e.g. 0.35" />
            <Field label="Calibration status" value={setup.calibrationStatus} onChange={(v) => setSetup({ calibrationStatus: v })} placeholder="Validated / overdue" />
            <Field label="Maintenance status" value={setup.maintenanceStatus} onChange={(v) => setSetup({ maintenanceStatus: v })} placeholder="Recent changes?" />
          </div>
        </Section>

        <Section title="Alloy & metal condition" description="Composition, charge history and casting temperature">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Metal family</Label>
              <Select value={alloy.metal} onValueChange={(v) => setAlloy({ metal: v as MetalFamily })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="palladium">Palladium</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Composition / fineness" value={alloy.composition} onChange={(v) => setAlloy({ composition: v })} placeholder="e.g. PtCo 950/50" />
            <Field label="Supplier" value={alloy.supplier} onChange={(v) => setAlloy({ supplier: v })} />
            <Field label="Batch / lot" value={alloy.batch} onChange={(v) => setAlloy({ batch: v })} />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Charge type</Label>
              <Select value={alloy.chargeType} onValueChange={(v) => setAlloy({ chargeType: v as CastingCase["alloy"]["chargeType"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New metal</SelectItem>
                  <SelectItem value="recycled">Recycled</SelectItem>
                  <SelectItem value="mixed">Mixed charge (50% fresh / 50% scrap)</SelectItem>
                  <SelectItem value="scrap-only">Scrap only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Charge mass" value={alloy.chargeMass} onChange={(v) => setAlloy({ chargeMass: v })} unit="g" />
            <Field label="Casting temperature" value={alloy.meltTemp} onChange={(v) => setAlloy({ meltTemp: v })} unit="°C" />
            <Field label="Data-sheet target temperature" value={alloy.referenceMeltTemp || ""} onChange={(v) => setAlloy({ referenceMeltTemp: v })} unit="°C" placeholder="Enter alloy data-sheet target" />
            <Field label="Time at casting temperature" value={alloy.superheatDuration} onChange={(v) => setAlloy({ superheatDuration: v })} unit="s" />
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-slate-600">Measurement confidence</Label>
              <Select value={alloy.measurementConfidence} onValueChange={(v) => setAlloy({ measurementConfidence: v as CastingCase["alloy"]["measurementConfidence"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="validated">Validated</SelectItem>
                  <SelectItem value="partial">Partially validated</SelectItem>
                  <SelectItem value="uncertain">Uncertain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-slate-600">Contamination / alloy-history concerns</Label>
              <Textarea value={alloy.contaminationConcerns} onChange={(e) => setAlloy({ contaminationConcerns: e.target.value })} rows={2} />
            </div>
          </div>
        </Section>

        <Section title="Investment" description="Formulation, liquid split, mixing, burnout and flask temperature">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Manufacturer" value={investment.manufacturer} onChange={(v) => setInv({ manufacturer: v })} />
            <Field label="Product" value={investment.product} onChange={(v) => setInv({ product: v })} />
            <Field label="Batch" value={investment.batch} onChange={(v) => setInv({ batch: v })} />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Investment family</Label>
              <Select value={investment.family} onValueChange={(v) => setInv({ family: v as InvestmentFamily })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gypsum">Gypsum-bonded</SelectItem>
                  <SelectItem value="phosphate">Phosphate-bonded</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Liquid-to-powder ratio" value={investment.liquidRatio} onChange={(v) => setInv({ liquidRatio: v })} placeholder="e.g. 22:100" />
            <Field label="Water temperature" value={investment.waterTemp} onChange={(v) => setInv({ waterTemp: v })} unit="°C" />
            <Field label="Powder temperature" value={investment.powderTemp} onChange={(v) => setInv({ powderTemp: v })} unit="°C" />
            <p className="text-xs text-slate-500 sm:col-span-2">Preferred powder temperature: 17–20°C. Above 20°C is flagged for review.</p>
            <Field label="Mixing equipment" value={investment.mixingEquipment} onChange={(v) => setInv({ mixingEquipment: v })} />
            <Field label="Mixing time" value={investment.mixingTime} onChange={(v) => setInv({ mixingTime: v })} unit="min" />
            <Field label="Vacuum procedure" value={investment.vacuumProcedure} onChange={(v) => setInv({ vacuumProcedure: v })} />
            <Field label="Setting time" value={investment.settingTime} onChange={(v) => setInv({ settingTime: v })} unit="min" />
            <Field label="Burnout schedule" value={investment.burnoutSchedule} onChange={(v) => setInv({ burnoutSchedule: v })} placeholder="e.g. 150→730°C over 6h" />
            <div className="space-y-1.5"><Label className="text-xs font-medium text-slate-600">Component / tree profile</Label><Select value={castingCase.tree.itemProfile || "unknown"} onValueChange={(v) => update({ tree: { ...castingCase.tree, itemProfile: v as CastingCase["tree"]["itemProfile"] } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cool-heavy">Cool tree — heavy plain items</SelectItem><SelectItem value="standard">Standard items</SelectItem><SelectItem value="fine">Fine items</SelectItem><SelectItem value="unknown">Not specified</SelectItem></SelectContent></Select></div>
            <Field label="Flask temperature at casting" value={investment.flaskTemp} onChange={(v) => setInv({ flaskTemp: v })} unit="°C" />
            <Field label="Flask temp measurement" value={investment.flaskTempMethod} onChange={(v) => setInv({ flaskTempMethod: v })} placeholder="Thermocouple / pyrometer" />
            <Field label="Permeability notes" value={investment.permeabilityNotes} onChange={(v) => setInv({ permeabilityNotes: v })} />
            <Field label="Strength notes" value={investment.strengthNotes} onChange={(v) => setInv({ strengthNotes: v })} />

            <div className="sm:col-span-2">
              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                <p className="text-xs font-semibold text-teal-900">Liquid split</p>
                <p className="mt-1 text-xs text-teal-900/70">
                  The liquid fraction is often split again between water and an expansion fluid such as colloidal
                  silica sol. Record the split as percentages of the total liquid.
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <Field label="Water fraction" value={investment.waterFraction} onChange={(v) => setInv({ waterFraction: v })} unit="%" />
                  <Field label="Expansion fluid fraction" value={investment.expansionFluidFraction} onChange={(v) => setInv({ expansionFluidFraction: v })} unit="%" />
                  <Field label="Expansion fluid type" value={investment.expansionFluidType} onChange={(v) => setInv({ expansionFluidType: v })} placeholder="e.g. colloidal silica sol" />
                </div>
                {(investment.waterFraction || investment.expansionFluidFraction) && (
                  <p className={cn("mt-2 text-xs font-medium", splitValid ? "text-teal-700" : "text-rose-600")}>
                    {splitValid
                      ? `Split totals ${water + expansion}% of the liquid.`
                      : `Split totals ${(isNaN(water) ? 0 : water) + (isNaN(expansion) ? 0 : expansion)}% — should total 100%.`}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-slate-600">Previous investment issues</Label>
              <Textarea value={investment.previousIssues} onChange={(e) => setInv({ previousIssues: e.target.value })} rows={2} placeholder="Cracking, mould breakdown, reaction layers, rough surfaces, distortion" />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                id="additive"
                type="checkbox"
                checked={investment.additiveUsed}
                onChange={(e) => setInv({ additiveUsed: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              <Label htmlFor="additive" className="text-sm text-slate-700">
                Colloidal silica sol or other additive introduced
              </Label>
            </div>
            {investment.additiveUsed && (
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <Field label="Additive type" value={investment.additiveType} onChange={(v) => setInv({ additiveType: v })} />
                <Field label="Additive concentration" value={investment.additiveConcentration} onChange={(v) => setInv({ additiveConcentration: v })} unit="%" />
              </div>
            )}
            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                id="modified"
                type="checkbox"
                checked={investment.formulationModified}
                onChange={(e) => setInv({ formulationModified: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              <Label htmlFor="modified" className="text-sm text-slate-700">
                Formulation has been modified from the supplier baseline
              </Label>
            </div>
          </div>
        </Section>

        <Section title="Tree information" description="Overall layout and casting load">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tree type / layout" value={castingCase.tree.treeType} onChange={(v) => update({ tree: { ...castingCase.tree, treeType: v } })} />
            <Field label="Total tree mass" value={castingCase.tree.totalMass} onChange={(v) => update({ tree: { ...castingCase.tree, totalMass: v } })} unit="g" />
            <Field label="Number of components" value={castingCase.tree.componentCount} onChange={(v) => update({ tree: { ...castingCase.tree, componentCount: v } })} />
            <Field label="Component mass" value={castingCase.tree.componentMass} onChange={(v) => update({ tree: { ...castingCase.tree, componentMass: v } })} unit="g" />
          </div>
        </Section>

        <Section title="Sprue and feeding arrangement" description="Shape, size, connections and entry into the component">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-800">What best describes the sprue shape used?</p>
              <p className="mt-1 text-xs text-slate-500">Select the closest match. Shapes can be mixed, such as flared / almond or flattened / flared.</p>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img src="/casting-diagnostic-assistant/sprue-shape-picker.svg" alt="Sprue shape diagrams and colour markers recreated from page 7 of the TJ Gold & Diamond casting guidelines" className="mx-auto max-h-[560px] w-full object-contain" />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {([
                  ["straight", "Straight"],
                  ["flared-round", "Flared / Round"],
                  ["flat-round-flare", "Flat / Round / Flare"],
                  ["square", "Square"],
                  ["acute-almond", "Acute Almond"],
                  ["tapered", "Tapered"],
                  ["combination", "Combination / other"],
                  ["unknown", "Not sure"]
                ] as const).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => update({ tree: { ...castingCase.tree, sprueShape: value } })}
                    className={cn("rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors", (castingCase.tree.sprueShape || "unknown") === value ? "border-teal-700 bg-teal-50 text-teal-900 ring-1 ring-teal-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400")}>
                    <span className="flex items-center justify-between gap-2">{label}{(castingCase.tree.sprueShape || "unknown") === value && <span className="text-xs font-semibold text-teal-800">Selected</span>}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Number of sprues" value={castingCase.tree.sprueCount} onChange={(v) => update({ tree: { ...castingCase.tree, sprueCount: v } })} placeholder="e.g. 1, 2, 3" />
              <Field label="Main sprue diameter (actual)" value={castingCase.tree.sprueDiameter} onChange={(v) => update({ tree: { ...castingCase.tree, sprueDiameter: v } })} unit="mm" />
              <Field label="Ring diameter for calculator" value={castingCase.tree.ringDiameter || ""} onChange={(v) => update({ tree: { ...castingCase.tree, ringDiameter: v } })} unit="mm" />
              <Field label="Ring thickness for calculator" value={castingCase.tree.ringThickness || ""} onChange={(v) => update({ tree: { ...castingCase.tree, ringThickness: v } })} unit="mm" /><div className="rounded-lg border border-amber-200 bg-amber-50 p-3 sm:col-span-2"><p className="text-xs font-semibold text-amber-900">Sprue diameter calculator — approximate</p><p className="mt-1 text-xs text-amber-900/80">Workshop Hub formula: k × √(ring diameter × ring thickness).</p><p className="mt-1 text-sm font-semibold text-amber-900">{calculatedSprue ? `Calculated reference: ${calculatedSprue} mm (k = ${alloyConstant})` : "Enter supported alloy composition and ring dimensions. PtRu has no defined calculator constant."}</p><p className="mt-1 text-xs text-amber-900/70">Sizing reference only; not a guarantee of adequate feeding.</p></div>
              <Field label="Sprue placement" value={castingCase.tree.spruePlacement} onChange={(v) => update({ tree: { ...castingCase.tree, spruePlacement: v } })} placeholder="e.g. single, opposed, central, side feed" />
              <Field label="Branch / feed diameter" value={castingCase.tree.branchDiameter} onChange={(v) => update({ tree: { ...castingCase.tree, branchDiameter: v } })} unit="mm" />
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-medium text-slate-600">Was the sprue reduced or restricted where it joined the component?</Label>
                <Select value={castingCase.tree.connectionRestriction || "unknown"} onValueChange={(v) => update({ tree: { ...castingCase.tree, connectionRestriction: v as CastingCase["tree"]["connectionRestriction"] } })}>
                  <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consistent">No — consistent section to the component</SelectItem>
                    <SelectItem value="narrowed">Yes — narrowed or pinched at the connection</SelectItem>
                    <SelectItem value="shaped">Yes — deliberately reduced or shaped</SelectItem>
                    <SelectItem value="unknown">Unsure / cannot tell from the available evidence</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">For example, a 5 mm sprue that has been pinched down to 3 mm at the component is not a 5 mm feed at the entry point.</p>
              </div>
              <Field label="Gate dimensions" value={castingCase.tree.gateDimensions} onChange={(v) => update({ tree: { ...castingCase.tree, gateDimensions: v } })} />
              <Field label="Gate count" value={castingCase.tree.gateCount} onChange={(v) => update({ tree: { ...castingCase.tree, gateCount: v } })} />
              <Field label="Gate position" value={castingCase.tree.gatePosition} onChange={(v) => update({ tree: { ...castingCase.tree, gatePosition: v } })} />
            </div>
          </div>
        </Section>

        <Section title="Component geometry and placement" description="Orientation, section changes and distance from the feed">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Component orientation" value={castingCase.tree.orientation} onChange={(v) => update({ tree: { ...castingCase.tree, orientation: v } })} />
            <Field label="Flow path" value={castingCase.tree.flowPath} onChange={(v) => update({ tree: { ...castingCase.tree, flowPath: v } })} placeholder="Short / long / complex" />
            <Field label="Thin-to-thick transitions" value={castingCase.tree.transitions} onChange={(v) => update({ tree: { ...castingCase.tree, transitions: v } })} />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Positioning relative to feed</Label>
              <Select value={castingCase.tree.positioning} onValueChange={(v) => update({ tree: { ...castingCase.tree, positioning: v as CastingCase["tree"]["positioning"] } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="favourable">Favourable</SelectItem>
                  <SelectItem value="unfavourable">Unfavourable</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        <Section title="Additional considerations" description="Venting and repeatable test patterns">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Venting arrangements" value={castingCase.tree.venting} onChange={(v) => update({ tree: { ...castingCase.tree, venting: v } })} />
            <div className="flex items-center gap-3">
              <input id="standard" type="checkbox" checked={castingCase.tree.standardisedPattern}
                onChange={(e) => update({ tree: { ...castingCase.tree, standardisedPattern: e.target.checked } })}
                className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600" />
              <Label htmlFor="standard" className="text-sm text-slate-700">Defect occurs on a standardised test pattern</Label>
            </div>
          </div>
        </Section>
      </div>

      <div className="space-y-4">
        <Card className="border-teal-200 bg-teal-50/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-teal-900">Diagnose before adjusting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-teal-900/80">
            <p>
              Start with the alloy, then consider the casting method, feeding arrangement and component geometry together. A sprue that works for one alloy or method is not automatically suitable for another.
            </p>
            <p>
              Record the setup accurately. The diagnostic engine interprets machine settings according to the actual
              equipment — a speed or cycle number does not mean the same thing on different machines.
            </p>
            <p>
              Investment density, permeability and strength are treated as separate properties. A denser investment is
              not automatically less permeable.
            </p>
          </CardContent>
        </Card>

        {modified && (
          <Card className="border-amber-300 bg-amber-50 shadow-sm">
            <CardContent className="flex gap-3 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">
                This investment formulation is flagged as <strong>experimental</strong> until qualified for setting,
                expansion, permeability, strength and high-temperature stability.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-800">Case progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Site & equipment", setup.machineMake && setup.machineModel],
              ["Alloy", alloy.composition],
              ["Investment", investment.product],
              ["Tree geometry", castingCase.tree.treeType],
            ].map(([label, done]) => (
              <div key={label as string} className="flex items-center justify-between">
                <span className="text-slate-600">{label}</span>
                <span className={cn("text-xs font-medium", done ? "text-teal-700" : "text-slate-400")}>
                  {done ? "Recorded" : "Pending"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button onClick={onNext} className="w-full bg-teal-700 hover:bg-teal-800">
          Continue to parameters <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}