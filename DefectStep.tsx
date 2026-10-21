import { CastingCase, DefectType } from "@/types/casting";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  castingCase: CastingCase;
  update: (patch: Partial<CastingCase>) => void;
  onBack: () => void;
  onNext: () => void;
}

const SYMPTOMS: { id: DefectType; label: string }[] = [
  { id: "incomplete-filling", label: "Incomplete filling" },
  { id: "cold-shut", label: "Cold shut / lack of fusion" },
  { id: "gas-porosity", label: "Gas-like porosity" },
  { id: "shrinkage-porosity", label: "Shrinkage porosity" },
  { id: "surface-pitting", label: "Surface pitting / roughness" },
  { id: "investment-reaction", label: "Investment reaction / inclusions" },
  { id: "cracking", label: "Cracking / mould breakdown" },
  { id: "distortion", label: "Distortion / dimensional inconsistency" },
  { id: "unclassified-void", label: "Unclassified cavity or void" },
  { id: "other", label: "Other" },
];

export function DefectStep({ castingCase, update, onBack, onNext }: Props) {
  const { defect } = castingCase;
  const setDefect = (patch: Partial<CastingCase["defect"]>) =>
    update({ defect: { ...defect, ...patch } });

  const toggle = (id: DefectType) => {
    const has = defect.types.includes(id);
    setDefect({ types: has ? defect.types.filter((t) => t !== id) : [...defect.types, id] });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50">
            <CardTitle className="text-base font-semibold text-slate-800">Defect symptoms</CardTitle>
            <CardDescription>Select all that apply. Multiple symptoms are common.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 p-6 sm:grid-cols-2">
            {SYMPTOMS.map((s) => {
              const active = defect.types.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    active
                      ? "border-teal-300 bg-teal-50 text-teal-900"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      active ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300"
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50">
            <CardTitle className="text-base font-semibold text-slate-800">Defect detail</CardTitle>
            <CardDescription>Morphology and location help distinguish gas, shrinkage and cold shuts.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Location</Label>
              <Select value={defect.location} onValueChange={(v) => setDefect({ location: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sprue-junction">Sprue junction</SelectItem>
                  <SelectItem value="gate">Gate</SelectItem>
                  <SelectItem value="shank">Shank</SelectItem>
                  <SelectItem value="heavy-section">Heavy section</SelectItem>
                  <SelectItem value="extremity">Extremity</SelectItem>
                  <SelectItem value="inner-surface">Inner surface</SelectItem>
                  <SelectItem value="outer-surface">Outer surface</SelectItem>
                  <SelectItem value="centreline">Internal centreline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Cavity morphology</Label>
              <Select value={defect.morphology} onValueChange={(v) => setDefect({ morphology: v })}>
                <SelectTrigger><SelectValue placeholder="Select morphology" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="smooth-rounded">Smooth / rounded</SelectItem>
                  <SelectItem value="irregular">Irregular</SelectItem>
                  <SelectItem value="branched">Branched</SelectItem>
                  <SelectItem value="dendritic">Dendritic</SelectItem>
                  <SelectItem value="seam-like">Seam-like</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Internal or surface-breaking</Label>
              <Select value={defect.internal} onValueChange={(v) => setDefect({ internal: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="surface">Surface-breaking</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Recurrence</Label>
              <Select value={defect.recurrence} onValueChange={(v) => setDefect({ recurrence: v })}>
                <SelectTrigger><SelectValue placeholder="Select recurrence" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="intermittent">Intermittent</SelectItem>
                  <SelectItem value="persistent">Persistent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-slate-600">Recent process changes preceding the defect</Label>
              <Input value={defect.recentChanges} onChange={(e) => setDefect({ recentChanges: e.target.value })} placeholder="e.g. new investment batch, higher flask temp" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-slate-600">Radiography / CT / microscopy evidence</Label>
              <Textarea value={defect.radiographyEvidence} onChange={(e) => setDefect({ radiographyEvidence: e.target.value })} rows={2} placeholder="Describe any sectioning or imaging evidence" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-teal-200 bg-teal-50/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-teal-900">Why morphology matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-teal-900/80">
            <p>
              Smooth, rounded cavities suggest gas. Dendritic or branched cavities suggest shrinkage. Seam-like
              features suggest a cold shut.
            </p>
            <p>
              Do not assume every rounded cavity is gas porosity — shrinkage and other defects can have overlapping
              appearances.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={onNext} className="bg-teal-700 hover:bg-teal-800">
            Run diagnosis <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}