import { CastingCase } from "@/types/casting";

const STORAGE_KEY = "casting-diagnostic-case";

export function emptyCase(): CastingCase {
  const today = new Date().toISOString().slice(0, 10);
  return {
    setup: {
      caseRef: `CASE-${Date.now().toString().slice(-6)}`,
      date: today,
      site: "",
      operative: "",
      machineMake: "",
      machineModel: "",
      castingMethod: "centrifugal",
      crucibleType: "",
      crucibleCondition: "",
      tempSystem: "",
      tempMethod: "",
      pyrometerMode: "",
      emissivity: "",
      calibrationStatus: "",
      maintenanceStatus: "",
    },
    alloy: {
      metal: "platinum",
      composition: "",
      supplier: "",
      batch: "",
      chargeType: "new",
      chargeMass: "",
      meltTemp: "",
      superheatDuration: "",
      measurementConfidence: "uncertain",
      contaminationConcerns: "",
    },
    investment: {
      manufacturer: "",
      product: "",
      batch: "",
      family: "phosphate",
      liquidRatio: "",
      waterTemp: "",
      powderTemp: "",
      mixingEquipment: "",
      mixingTime: "",
      vacuumProcedure: "",
      settingTime: "",
      burnoutSchedule: "",
      flaskTemp: "",
      flaskTempMethod: "",
      permeabilityNotes: "",
      strengthNotes: "",
      waterFraction: "",
      expansionFluidFraction: "",
      expansionFluidType: "",
      additiveUsed: false,
      additiveType: "",
      additiveConcentration: "",
      formulationModified: false,
      previousIssues: "",
    },
    tree: {
      treeType: "",
      totalMass: "",
      componentCount: "",
      componentMass: "",
      sprueDiameter: "",
      branchDiameter: "",
      gateDimensions: "",
      gateCount: "",
      gatePosition: "",
      orientation: "",
      flowPath: "",
      transitions: "",
      positioning: "unknown",
      venting: "",
      standardisedPattern: false,
    },
    defect: {
      types: [],
      location: "",
      morphology: "unknown",
      internal: "unknown",
      recurrence: "",
      recentChanges: "",
      radiographyEvidence: "",
    },
    trials: [],
    review: {
      reviewer: "",
      reviewedDate: "",
      evidenceRequired: "",
      nextVariable: "",
      recommendationStatus: "general-guidance",
      approvalStatus: "draft",
      comments: "",
    },
  };
}

export function saveCase(c: CastingCase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    // storage unavailable — ignore
  }
}

export function loadCase(): CastingCase | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CastingCase;
  } catch {
    return null;
  }
}