import { CastingCase } from "@/types/casting";
export interface ProcessRisk { factor:string; weight:number; detail:string; }
const num=(s:string)=>Number.parseFloat(s);
export function assessProcessRisk(c:CastingCase):ProcessRisk[]{
 const {setup,alloy,investment,tree}=c; const r:ProcessRisk[]=[];
 const add=(factor:string,weight:number,detail:string)=>r.push({factor,weight:Math.max(1,Math.min(10,weight)),detail});
 if(alloy.measurementConfidence!=="validated")add("Temperature measurement confidence",8,"Measurement is not fully validated.");
 if(alloy.contaminationConcerns.trim())add("Contamination / alloy history",10,alloy.contaminationConcerns);
 if(setup.crucibleCondition.toLowerCase().includes("used"))add("Used crucible",7,"Used crucible condition requires review.");
 if(alloy.chargeType==="mixed")add("Mixed fresh / scrap charge",7,"50% fresh and 50% scrap reference weighting.");
 if(alloy.chargeType==="scrap-only")add("Scrap-only charge",10,"Scrap-only charge.");
 if(alloy.chargeType==="recycled")add("Legacy recycled charge",7,"Existing saved value retained; confirm actual scrap/fresh proportion.");
 if(alloy.metal==="platinum"&&num(alloy.chargeMass)>170)add("Platinum charge mass",8,alloy.chargeMass+" g exceeds 170 g.");
 if(alloy.metal==="platinum"&&num(tree.totalMass)>170)add("Platinum tree mass",8,tree.totalMass+" g exceeds 170 g.");
 if(alloy.metal==="platinum"&&(setup.castingMethod==="tilt"||setup.castingMethod==="vacuum-pressure"))add("Platinum casting method",10,"Recorded method differs from the specified preferred centrifugal method / equipment constraint.");
 const melt=num(alloy.meltTemp),target=num(alloy.referenceMeltTemp||"");if(Number.isFinite(melt)&&Number.isFinite(target)&&target>0){const d=Math.abs(melt-target);if(d>=50)add("Casting temperature deviation",d>100?Math.min(10,8+(d-100)/50):6+2*(d-50)/50,d.toFixed(0)+"°C from entered data-sheet target.");}
 if(num(investment.waterTemp)>20)add("Water temperature",8,investment.waterTemp+"°C is above 20°C.");
 if(num(investment.powderTemp)>20)add("Investment powder temperature",8,investment.powderTemp+"°C is above preferred 17–20°C.");
 const profile=tree.itemProfile||"unknown",comp=alloy.composition.toLowerCase();let flaskTarget:number|null=null;
 if(profile!=="unknown"){if(comp.includes("ptru"))flaskTarget=profile==="cool-heavy"?800:profile==="standard"?875:900;else if(alloy.metal==="platinum"||comp.includes("ptco")||alloy.metal==="gold")flaskTarget=profile==="cool-heavy"?500:profile==="standard"?650:725;}
 const flask=num(investment.flaskTemp);if(Number.isFinite(flask)&&flaskTarget!==null&&Math.abs(flask-flaskTarget)>=25)add("Flask temperature",10,flask+"°C recorded against "+flaskTarget+"°C profile reference.");
 if(/crumbly|weak|poor/i.test(investment.strengthNotes))add("Investment compression strength",5,investment.strengthNotes);
 if(tree.transitions.trim())add("Thin-to-thick section transition",10,tree.transitions);
 if(tree.connectionRestriction==="narrowed")add("Pinched sprue connection",8,"Local reduction at component entry can restrict feeding.");
 if(/thin/i.test(tree.spruePlacement))add("Sprue placed on thin section",8,tree.spruePlacement);
 if(/long|complex|multiple|several|angles|angled/i.test(tree.flowPath))add("Flow path complexity",8,tree.flowPath);
 if(tree.positioning==="unfavourable")add("Position relative to feed",8,"Component position recorded as unfavourable relative to main feed.");
 return r.sort((a,b)=>b.weight-a.weight);
}