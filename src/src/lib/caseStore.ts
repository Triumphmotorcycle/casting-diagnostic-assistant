import { CastingCase } from '@/types/casting';

export type CaseStatus = 'draft' | 'awaiting_review' | 'under_investigation' | 'closed';
export interface RegisterCase {
  id: number;
  case_ref: string;
  status: CaseStatus;
  data: CastingCase;
  created_at: string;
  updated_at: string;
  created_by: string;
  submitted_at: string | null;
  reviewer_notes: string;
  corrective_action: string;
  verification_result: string;
  closed_at: string | null;
}

export function emptyCase(caseRef = 'NEW CASE'): CastingCase {
  const today = new Date().toISOString().slice(0, 10);
  return {
    setup: { caseRef, date: today, site: '', operative: '', machineMake: '', machineModel: '', castingMethod: 'centrifugal', crucibleType: '', crucibleCondition: '', tempSystem: '', tempMethod: '', pyrometerMode: '', emissivity: '', calibrationStatus: '', maintenanceStatus: '' },
    alloy: { metal: 'platinum', composition: '', supplier: '', batch: '', chargeType: 'new', chargeMass: '', meltTemp: '', superheatDuration: '', measurementConfidence: 'uncertain', contaminationConcerns: '' },
    investment: { manufacturer: '', product: '', batch: '', family: 'phosphate', liquidRatio: '', waterTemp: '', powderTemp: '', mixingEquipment: '', mixingTime: '', vacuumProcedure: '', settingTime: '', burnoutSchedule: '', flaskTemp: '', flaskTempMethod: '', permeabilityNotes: '', strengthNotes: '', waterFraction: '', expansionFluidFraction: '', expansionFluidType: '', additiveUsed: false, additiveType: '', additiveConcentration: '', formulationModified: false, previousIssues: '' },
    tree: { treeType: '', totalMass: '', componentCount: '', componentMass: '', sprueDiameter: '', branchDiameter: '', gateDimensions: '', gateCount: '', gatePosition: '', orientation: '', flowPath: '', transitions: '', positioning: 'unknown', venting: '', standardisedPattern: false },
    defect: { types: [], location: '', morphology: 'unknown', internal: 'unknown', recurrence: '', recentChanges: '', radiographyEvidence: '' },
    trials: [],
    review: { reviewer: '', reviewedDate: '', evidenceRequired: '', nextVariable: '', recommendationStatus: 'general-guidance', approvalStatus: 'draft', comments: '' },
  };
}

// Legacy local-storage helpers are retained only for backwards compatibility. Shared cases use Supabase.
const STORAGE_KEY = 'casting-diagnostic-case';
export function saveCase(c: CastingCase): void { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch { /* storage unavailable */ } }
export function loadCase(): CastingCase | null { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as CastingCase : null; } catch { return null; } }
