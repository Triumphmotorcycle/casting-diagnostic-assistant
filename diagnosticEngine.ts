import { CastingCase, Hypothesis } from "@/types/casting";

const ALLOY_NOTES: Record<string, string> = {
  "PtCo 950/50":
    "PtCo typically offers a more forgiving filling window under suitable conditions, but complete filling does not prove freedom from internal shrinkage.",
  "PtRu 950/50":
    "PtRu may require greater superheat to achieve comparable filling and can present micro-shrinkage challenges requiring attention to feeding and solidification.",
};

export function alloyNote(composition: string): string | null {
  if (!composition) return null;
  for (const key of Object.keys(ALLOY_NOTES)) {
    if (composition.toLowerCase().includes(key.toLowerCase())) return ALLOY_NOTES[key];
  }
  return null;
}

export function runDiagnosis(c: CastingCase): Hypothesis[] {
  const { defect, alloy, investment, tree, setup } = c;
  const types = defect.types;
  const hypotheses: Hypothesis[] = [];

  const lowConfidence = alloy.measurementConfidence !== "validated";
  const modifiedInvestment = investment.formulationModified || investment.additiveUsed;
  const unfavourable = tree.positioning === "unfavourable";
  const longPath =
    tree.flowPath.toLowerCase().includes("long") || tree.flowPath.toLowerCase().includes("complex");

  if (lowConfidence) {
    hypotheses.push({
      id: "measurement",
      title: "Unreliable casting-temperature measurement",
      mechanism:
        "If the displayed casting temperature is inaccurate, every downstream thermal adjustment is built on a false baseline. Pyrometer wavelength, emissivity and calibration all affect the reading.",
      confidence: 0.55,
      confidenceReason:
        "Ranked high because measurement confidence is recorded as " +
        alloy.measurementConfidence +
        ", which undermines the reliability of every thermal input.",
      supporting: [
        "Measurement confidence is recorded as " + alloy.measurementConfidence + ".",
        setup.pyrometerMode ? `Pyrometer mode: ${setup.pyrometerMode}.` : "Pyrometer mode not recorded.",
        setup.calibrationStatus ? `Calibration: ${setup.calibrationStatus}.` : "Calibration status not recorded.",
      ],
      conflicting: ["A validated reference pyrometer would remove this concern."],
      missing: ["Cross-check with a second measurement method.", "Confirm emissivity setting for the alloy."],
      nextCheck:
        "Cross-check casting temperature with a second, independently calibrated instrument before changing any thermal setting.",
      adjustment:
        "Verify temperature measurement before any thermal adjustment. Do not change casting or flask temperature until the reading is trusted.",
      adjustmentRationale:
        "An incorrect reading can invalidate every subsequent adjustment, so measurement quality is the safest and most informative first check.",
      recommendationStatus: "general-guidance",
      trial: "Measure the same melt with two instruments and record the difference.",
      expected: "If the reading is unreliable, the two instruments will disagree by more than the stated uncertainty.",
      category: "measurement",
    });
  }

  if (types.includes("incomplete-filling") || types.includes("cold-shut")) {
    const thermalConf = 0.4 + (defect.morphology === "seam-like" ? 0.25 : 0) + (unfavourable ? 0.1 : 0);
    hypotheses.push({
      id: "thermal-reserve",
      title: "Insufficient thermal reserve / premature local freezing",
      mechanism:
        "The metal front freezes before reaching the extremity. Cold shuts and incomplete filling are the classic signature, especially with seam-like or rounded-front morphology.",
      confidence: Math.min(thermalConf, 0.9),
      confidenceReason:
        "Ranked from defect morphology (" +
        defect.morphology +
        "), component positioning (" +
        tree.positioning +
        ") and the reported filling symptoms.",
      supporting: [
        defect.morphology === "seam-like"
          ? "Seam-like morphology strongly suggests a cold shut."
          : "Incomplete filling reported.",
        unfavourable
          ? "Component is unfavourably positioned relative to available feed."
          : "Component position recorded as favourable or unknown.",
        alloy.composition.includes("PtRu")
          ? "PtRu may require greater superheat to achieve comparable filling."
          : "Alloy filling window noted.",
      ],
      conflicting: [
        "If the defect is internal and dendritic, shrinkage is more likely than a cold shut.",
        "If the defect recurs at the same tree position regardless of rotation, geometry may dominate over temperature.",
      ],
      missing: ["Confirm whether the cavity is surface-breaking or internal.", "Confirm flask temperature at casting."],
      nextCheck:
        "Verify casting and flask temperature measurement, then confirm defect location relative to the flow path.",
      adjustment:
        "Increase measured casting superheat within approved limits, or raise flask temperature — but only one at a time.",
      adjustmentRationale:
        "Thermal reserve is the priority if a cold shut is supported. Changing casting and flask temperature together makes the outcome uninterpretable.",
      recommendationStatus: "general-guidance",
      trial: "Increase measured casting superheat within approved limits only, holding flask temperature and machine settings constant.",
      expected: "If thermal reserve is the cause, filling improves and the defect moves toward the extremity or disappears.",
      category: "thermal",
    });

    if (longPath || unfavourable) {
      hypotheses.push({
        id: "flow-restriction",
        title: "Restrictive gates or long flow path",
        mechanism:
          "Restrictive gates or a long, complex flow path raise the pressure and thermal demand on the metal front, causing premature freezing independent of bulk temperature.",
        confidence: 0.5,
        confidenceReason:
          "Ranked from flow-path description (" +
          (tree.flowPath || "not recorded") +
          ") and component positioning (" +
          tree.positioning +
          ").",
        supporting: [
          longPath ? "Flow path recorded as long or complex." : "Flow path noted.",
          tree.gateDimensions ? `Gate dimensions: ${tree.gateDimensions}.` : "Gate dimensions not recorded.",
          unfavourable ? "Component orientation is unfavourable." : "Orientation recorded.",
        ],
        conflicting: ["If filling improves with superheat alone, geometry is less likely the dominant cause."],
        missing: ["Sprue and branch diameters.", "Whether the defect changes when the component is rotated."],
        nextCheck:
          "Rotate the component to a more favourable orientation on a test tree and compare defect frequency.",
        adjustment:
          "Revise gate or sprue geometry, or reorient the component, on a single test tree.",
        adjustmentRationale:
          "If the flow path is the constraint, filling improves without any temperature change — a cleaner test than adding heat.",
        recommendationStatus: "general-guidance",
        trial: "Revise gate or sprue geometry on a single test tree, holding all thermal settings constant.",
        expected: "If flow restriction dominates, filling improves without any temperature change.",
        category: "flow",
      });
    }
  }

  if (types.includes("gas-porosity") || types.includes("surface-pitting") || types.includes("unclassified-void")) {
    const gasConf =
      0.4 + (defect.morphology === "smooth-rounded" ? 0.25 : 0) + (investment.additiveUsed ? 0.05 : 0);
    hypotheses.push({
      id: "gas-evacuation",
      title: "Inadequate gas evacuation / venting",
      mechanism:
        "Displaced gases cannot escape through the investment or vent paths, producing rounded, smooth-walled cavities. Incomplete burnout or residual moisture can also generate gas.",
      confidence: Math.min(gasConf, 0.9),
      confidenceReason:
        "Ranked from cavity morphology (" +
        defect.morphology +
        "), permeability notes and the recorded venting arrangement.",
      supporting: [
        defect.morphology === "smooth-rounded"
          ? "Smooth, rounded morphology is consistent with gas porosity."
          : "Void reported.",
        investment.permeabilityNotes
          ? `Permeability notes: ${investment.permeabilityNotes}.`
          : "Permeability not documented.",
        tree.venting ? `Venting: ${tree.venting}.` : "Venting arrangement not recorded.",
      ],
      conflicting: [
        "Shrinkage can also appear rounded; morphology alone is not conclusive.",
        "If the cavity is dendritic or branched, gas is less likely.",
      ],
      missing: [
        "Burnout schedule confirmation.",
        "Investment permeability data.",
        "Whether vent paths are obstructed.",
      ],
      nextCheck:
        "Review burnout profile and venting arrangement; confirm investment permeability against the alloy and machine.",
      adjustment:
        "Investigate permeability and venting. Consider a controlled permeability trial only if the evidence supports inadequate gas evacuation.",
      adjustmentRationale:
        "Permeability must be improved without sacrificing strength and dimensional stability — the two properties are separate.",
      recommendationStatus: "general-guidance",
      trial: "Run a controlled permeability trial with a single investment variable changed, holding thermal settings constant.",
      expected: "If gas evacuation is the cause, defect frequency falls as permeability or venting improves.",
      category: "gas",
    });

    if (modifiedInvestment) {
      hypotheses.push({
        id: "investment-formulation",
        title: "Investment formulation or additive issue",
        mechanism:
          "Additives such as colloidal silica sol, or a modified liquid-to-powder ratio, alter permeability, strength and expansion together. An improvement in one property does not prove the formulation is suitable.",
        confidence: 0.45,
        confidenceReason:
          "Ranked because the formulation has been modified or an additive is in use, which changes several properties at once.",
        supporting: [
          "Investment formulation has been modified or an additive is in use.",
          investment.additiveType
            ? `Additive: ${investment.additiveType} at ${investment.additiveConcentration || "unspecified"} concentration.`
            : "Additive type not recorded.",
        ],
        conflicting: ["If the defect predates the formulation change, the additive is less likely the cause."],
        missing: [
          "Qualification data for setting, expansion, permeability, strength and high-temperature stability.",
        ],
        nextCheck:
          "Treat the modified formulation as experimental until qualified against the alloy and machine.",
        adjustment:
          "Revert to the qualified baseline formulation on a single test tree, or qualify the modified formulation before production use.",
        adjustmentRationale:
          "A formulation that improves one property may degrade another. It must be qualified as a whole, not assumed suitable.",
        recommendationStatus: "experimental",
        trial: "Revert to the qualified baseline formulation on a single test tree and compare outcomes.",
        expected: "If the formulation is the cause, reverting to the qualified baseline reduces the defect.",
        category: "investment",
      });
    }
  }

  if (types.includes("shrinkage-porosity") || defect.morphology === "dendritic" || defect.morphology === "branched") {
    const shrinkConf =
      0.45 + (defect.morphology === "dendritic" ? 0.2 : 0) + (defect.morphology === "branched" ? 0.15 : 0);
    hypotheses.push({
      id: "shrinkage-feeding",
      title: "Shrinkage porosity / loss of liquid feed",
      mechanism:
        "A contracting section loses liquid feed as a shank or gate freezes prematurely. A fully filled component can still contain significant shrinkage porosity.",
      confidence: Math.min(shrinkConf, 0.9),
      confidenceReason:
        "Ranked from cavity morphology (" +
        defect.morphology +
        ") and the reported defect location (" +
        (defect.location || "not recorded") +
        ").",
      supporting: [
        defect.morphology === "dendritic" || defect.morphology === "branched"
          ? "Dendritic or branched morphology is consistent with shrinkage."
          : "Shrinkage porosity reported.",
        tree.transitions ? `Section transitions: ${tree.transitions}.` : "Section transitions not recorded.",
        unfavourable ? "Component position is unfavourable for feeding." : "Component position recorded.",
      ],
      conflicting: [
        "If the cavity is smooth and rounded, gas porosity is more likely.",
        "If filling is incomplete, a cold shut may dominate.",
      ],
      missing: [
        "Radiography, CT or sectioning to distinguish shrinkage from incomplete fusion.",
        "Relative solidification sequence of gate and component.",
      ],
      nextCheck:
        "Examine cavity morphology and location relative to the component cross-section, gate and tree orientation.",
      adjustment:
        "Investigate feeding continuity and the relative solidification sequence before increasing temperature or rotational force.",
      adjustmentRationale:
        "Feeding defects are addressed by geometry and solidification order, not by heat alone. Increasing force can leave shrinkage unchanged.",
      recommendationStatus: "general-guidance",
      trial: "Adjust gate or feeder geometry to improve feeding continuity, holding thermal settings constant.",
      expected: "If feeding is the cause, shrinkage porosity reduces without a temperature change.",
      category: "feeding",
    });
  }

  if (types.includes("investment-reaction") || types.includes("cracking") || types.includes("distortion")) {
    hypotheses.push({
      id: "investment-breakdown",
      title: "Investment breakdown, reaction or surface defect",
      mechanism:
        "Insufficient high-temperature strength, excessive thermal exposure or unsuitable investment chemistry can cause mould breakdown, reaction layers or surface defects.",
      confidence: 0.5,
      confidenceReason:
        "Ranked from the reported defect type and the recorded investment family (" +
        investment.family +
        ") and burnout schedule.",
      supporting: [
        "Investment-related defect reported.",
        investment.burnoutSchedule
          ? `Burnout schedule: ${investment.burnoutSchedule}.`
          : "Burnout schedule not recorded.",
        investment.previousIssues
          ? `Previous issues: ${investment.previousIssues}.`
          : "No previous investment issues recorded.",
      ],
      conflicting: ["If the defect is internal and dendritic, shrinkage is more likely."],
      missing: [
        "Investment specification and batch history.",
        "Evidence of chemical or thermal reaction.",
        "High-temperature strength data.",
      ],
      nextCheck:
        "Check the investment specification, batch history, mixing records and burnout profile for evidence of reaction.",
      adjustment:
        "Review burnout profile and investment chemistry against the alloy's casting conditions. Qualify any modified formulation before production use.",
      adjustmentRationale:
        "Any modified formulation must be qualified for setting, expansion, permeability, strength and high-temperature stability. An improvement in one property is not proof of suitability.",
      recommendationStatus: "general-guidance",
      trial: "Run a controlled burnout-profile trial with a single variable changed, holding the investment formulation constant.",
      expected: "If thermal exposure is the cause, surface quality improves as the burnout profile is corrected.",
      category: "investment",
    });
  }

  if (hypotheses.length === 0) {
    hypotheses.push({
      id: "insufficient-evidence",
      title: "Insufficient evidence for a reliable diagnosis",
      mechanism:
        "The recorded symptoms and parameters do not yet support a specific mechanism. More evidence is needed before any adjustment is made.",
      confidence: 0.2,
      confidenceReason:
        "Ranked because no defect symptom or distinguishing evidence has been recorded yet.",
      supporting: ["No specific defect symptom selected."],
      conflicting: [],
      missing: [
        "Defect type and morphology.",
        "Defect location and recurrence.",
        "Casting and flask temperature.",
      ],
      nextCheck:
        "Record the defect type, morphology and location, and confirm casting and flask temperature measurement.",
      adjustment:
        "Do not adjust the process yet. Gather the missing evidence first.",
      adjustmentRationale:
        "Adjusting without a clear mechanism risks changing several variables at once and losing the ability to interpret the result.",
      recommendationStatus: "general-guidance",
      trial: "Document the defect fully before planning any trial.",
      expected: "Once the evidence is recorded, a specific mechanism can be ranked.",
      category: "measurement",
    });
  }

  return hypotheses.sort((a, b) => b.confidence - a.confidence);
}