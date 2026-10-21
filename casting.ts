export type MetalFamily = "platinum" | "palladium" | "gold" | "other";
export type CastingMethod =
  | "centrifugal"
  | "induction-centrifugal"
  | "tilt"
  | "vacuum-pressure"
  | "other";
export type InvestmentFamily = "gypsum" | "phosphate" | "other";
export type MeasurementConfidence = "validated" | "partial" | "uncertain";
export type RecommendationStatus =
  | "published-research"
  | "general-guidance"
  | "experimental"
  | "site-validated";

export type DefectType =
  | "incomplete-filling"
  | "cold-shut"
  | "gas-porosity"
  | "shrinkage-porosity"
  | "surface-pitting"
  | "investment-reaction"
  | "cracking"
  | "distortion"
  | "unclassified-void"
  | "other";

export interface Setup {
  caseRef: string;
  date: string;
  site: string;
  operative: string;
  machineMake: string;
  machineModel: string;
  castingMethod: CastingMethod;
  crucibleType: string;
  crucibleCondition: string;
  tempSystem: string;
  tempMethod: string;
  pyrometerMode: string;
  emissivity: string;
  calibrationStatus: string;
  maintenanceStatus: string;
}

export interface Alloy {
  metal: MetalFamily;
  composition: string;
  supplier: string;
  batch: string;
  chargeType: "new" | "recycled" | "mixed";
  chargeMass: string;
  meltTemp: string;
  superheatDuration: string;
  measurementConfidence: MeasurementConfidence;
  contaminationConcerns: string;
}

export interface Investment {
  manufacturer: string;
  product: string;
  batch: string;
  family: InvestmentFamily;
  liquidRatio: string;
  waterTemp: string;
  powderTemp: string;
  mixingEquipment: string;
  mixingTime: string;
  vacuumProcedure: string;
  settingTime: string;
  burnoutSchedule: string;
  flaskTemp: string;
  flaskTempMethod: string;
  permeabilityNotes: string;
  strengthNotes: string;
  waterFraction: string;
  expansionFluidFraction: string;
  expansionFluidType: string;
  additiveUsed: boolean;
  additiveType: string;
  additiveConcentration: string;
  formulationModified: boolean;
  previousIssues: string;
}

export interface Tree {
  treeType: string;
  totalMass: string;
  componentCount: string;
  componentMass: string;
  sprueDiameter: string;
  branchDiameter: string;
  gateDimensions: string;
  gateCount: string;
  gatePosition: string;
  orientation: string;
  flowPath: string;
  transitions: string;
  positioning: "favourable" | "unfavourable" | "unknown";
  venting: string;
  standardisedPattern: boolean;
}

export interface Defect {
  types: DefectType[];
  location: string;
  morphology: string;
  internal: string;
  recurrence: string;
  recentChanges: string;
  radiographyEvidence: string;
}

export interface TrialPlan {
  hypothesis: string;
  baseline: string;
  primaryVariable: string;
  constants: string;
  adjustmentRange: string;
  expectedResult: string;
  observedResult: string;
  outcome: "pending" | "improved" | "worsened" | "moved" | "unchanged";
  nextStep: string;
}

export interface Review {
  reviewer: string;
  reviewedDate: string;
  evidenceRequired: string;
  nextVariable: string;
  recommendationStatus: RecommendationStatus;
  approvalStatus: "draft" | "submitted" | "approved" | "revision-requested";
  comments: string;
}

export interface CastingCase {
  setup: Setup;
  alloy: Alloy;
  investment: Investment;
  tree: Tree;
  defect: Defect;
  trials: TrialPlan[];
  review: Review;
}

export interface Hypothesis {
  id: string;
  title: string;
  mechanism: string;
  confidence: number;
  confidenceReason: string;
  supporting: string[];
  conflicting: string[];
  missing: string[];
  nextCheck: string;
  adjustment: string;
  adjustmentRationale: string;
  recommendationStatus: RecommendationStatus;
  trial: string;
  expected: string;
  category: "thermal" | "flow" | "gas" | "feeding" | "investment" | "measurement";
}