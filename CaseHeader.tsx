import { CastingCase } from "@/types/casting";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Factory, Calendar, User, Hash } from "lucide-react";

interface Props {
  castingCase: CastingCase;
  update: (patch: Partial<CastingCase>) => void;
}

export function CaseHeader({ castingCase, update }: Props) {
  const { setup } = castingCase;
  const setSetup = (patch: Partial<CastingCase["setup"]>) => update({ setup: { ...setup, ...patch } });

  return (
    <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-teal-600 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-teal-100/80">
              Precious-metal casting
            </p>
            <h1 className="font-serif text-2xl font-bold text-white">Diagnostic Assistant</h1>
          </div>
          <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
            {setup.caseRef}
          </Badge>
        </div>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Factory className="h-3.5 w-3.5" /> Site / workshop
          </Label>
          <Input value={setup.site} onChange={(e) => setSetup({ site: e.target.value })} placeholder="Site identifier" />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <User className="h-3.5 w-3.5" /> Operative
          </Label>
          <Input value={setup.operative} onChange={(e) => setSetup({ operative: e.target.value })} placeholder="Name" />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Calendar className="h-3.5 w-3.5" /> Date
          </Label>
          <Input type="date" value={setup.date} onChange={(e) => setSetup({ date: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Hash className="h-3.5 w-3.5" /> Case reference
          </Label>
          <Input value={setup.caseRef} onChange={(e) => setSetup({ caseRef: e.target.value })} />
        </div>
      </div>
    </header>
  );
}