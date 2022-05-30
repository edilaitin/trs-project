import * as _ from "lodash";
import { Ordering } from "./ordering";
import { RewriteRule } from "./rewriteRule";
import { TRS } from "./trs";
import { SetOfEquations, aslatexString, Equation } from "./unification";

export function completion(E: SetOfEquations, ordering: Ordering): { rules: TRS | 'Fail', steps: string[][] } {
    const steps: string[][] = []
    let R = new TRS();
    const isMarkedMap: Map<RewriteRule, boolean> = new Map<RewriteRule, boolean>();
    while (!E.isEmpty() || existsUnmarkedRule(isMarkedMap)) {
        const prefixNumber = `${steps.length + 1}`
        const substeps: string[] = [];                                                                                                                                                      if (!E.isEmpty()) substeps.push(`$\\textbf{Step ${prefixNumber}: } \\textrm{ Continue, E is not empty}$`); else if (existsUnmarkedRule(isMarkedMap)) substeps.push(`$\\textbf{Step ${prefixNumber}: } \\textrm{ Continue, there are still unmarked rules}$`); substeps.push(` $\\quad E = ${E.asLatexString('\\approx')} $`); substeps.push(` $\\quad R = ${R.asLatexString()} $`); if (!E.isEmpty()) substeps.push(` $\\quad \\textrm{Proceed until E is empty}$`)
        while (!E.isEmpty()) {                                                                                                                                                              substeps.push(`$\\quad \\cdot E = ${E.asLatexString('\\approx')} $`)
            const indexChosenIdentity = 0;
            const identity = E.equations[indexChosenIdentity];                                                                                                                              substeps.push(` $\\quad \\quad \\bullet \\textrm{ Choose identity: } ${aslatexString(identity)} $`)
            const [s, t] = [identity.left, identity.right];                                                                                                                                 substeps.push(` $\\quad \\quad \\bullet \\textrm{ s = } ${s.asLatexString()} \\textrm{, t = } ${t.asLatexString()} $`); substeps.push(` $\\quad \\quad \\bullet \\textrm{ Reduce s and t to normal form in regard to R } $`)
            const [sHat, tHat] = [R.toNormalForm(s, ordering), R.toNormalForm(t, ordering)];                                                                                                substeps.push(` $\\quad \\quad \\bullet \\textrm{ } \\hat{s} = ${sHat.asLatexString()} \\textrm{, } \\hat{t} = ${tHat.asLatexString()} $`)
            const order = ordering.order(sHat, tHat);
            if (order === 'EQ') {                                                                                                                                                           substeps.push(` $\\quad \\quad \\bullet \\textrm{ } \\hat{s} = \\hat{t} \\textrm{, Remove identity } ${aslatexString(identity)} \\textrm{ from E and continue } $`)
                // R remains the same
                E.removeEquation(indexChosenIdentity);
            } else if (ordering.order(sHat, tHat) === 'NGE' && ordering.order(tHat, sHat) === 'NGE') {                                                                                      substeps.push(` $\\quad \\quad \\bullet \\textrm{ } \\hat{s} \\textrm{, } \\hat{t} \\textrm{ can not be ordered, FAIL }$`); steps.push(substeps);
                return { rules: 'Fail', steps: steps};
            } else {
                const reorder = ordering.reorder(sHat, tHat);
                const [l, r] = [reorder.left, reorder.right];
                const lrRule = new RewriteRule(l, r);
                const newR = new TRS([lrRule]);
                const RwithLR = _.cloneDeep(R);
                RwithLR.addRule(lrRule);                                                                                                                                                    substeps.push(` $\\quad \\quad \\bullet \\textrm{ } \\hat{s} \\textrm{, } \\hat{t} \\textrm{ reordered into rewrite rule: } ${lrRule.asLatexString()}$`)
                E.removeEquation(indexChosenIdentity);                                                                                                                                      substeps.push(` $\\quad \\quad \\bullet \\textrm{ Remove identity: } ${aslatexString(identity)} \\textrm{ from E } $`); R.rules.length ? substeps.push(` $\\quad \\quad \\bullet \\textrm{ For each rule in R: }$`) : substeps.push(` $\\quad \\quad \\bullet \\textrm{ R is empty, continue }$`)
                _.forEach(R.rules, rule => {
                    const [g, d] = [rule.left, rule.right];                                                                                                                                 substeps.push(` $\\quad \\quad \\quad \\circ \\textrm{ Rule: } ${rule.asLatexString()} \\textrm {, let g = } ${rule.left.asLatexString()} \\textrm{ and d = } ${rule.right.asLatexString()} $`)
                    const gPrime = newR.toNormalForm(_.cloneDeep(g), ordering);                                                                                                             substeps.push(` $\\quad \\quad \\quad \\quad \\diamond \\textrm{ } g' =  ${gPrime.asLatexString()} \\textrm {, reduce g with } l \\rightarrow r $`)
                    if (g.isEqual(gPrime)) {                                                                                                                                                substeps.push(` $\\quad \\quad \\quad \\quad \\diamond \\textrm{ } g' = g  \\implies \\textrm { g cannot be reduced with } l \\rightarrow r $`)
                        const dHat = RwithLR.toNormalForm(d, ordering);                                                                                                                     substeps.push(` $\\quad \\quad \\quad \\quad \\quad $-$ \\textrm{ } \\hat{d} =  ${dHat.asLatexString()} \\textrm {, normal form of d w.r.t } R \\cup \\left\\{ l \\rightarrow r \\right\\} $`)
                        const newRule = new RewriteRule(g, dHat);                                                                                                                           substeps.push(` $\\quad \\quad \\quad \\quad \\quad $-$ \\textrm{ Add rule: } ${newRule.asLatexString()} \\textrm{ to R } $`)
                                                                                                                                            
                        newR.addRule(newRule);
                        isMarkedMap.set(newRule, isMarkedMap.get(rule)!);
                        isMarkedMap.delete(rule);
                    } else {                                                                                                             
                        const eq: Equation = { left: gPrime, right: d };                                                                                                                    substeps.push(` $\\quad \\quad \\quad \\quad \\diamond \\textrm{ } g' \\neq g  \\implies \\textrm { g can be reduced with } l \\rightarrow r $`)
                        isMarkedMap.delete(rule);
                        E.addEquation(eq);                                                                                                                                                  substeps.push(` $\\quad \\quad \\quad \\quad \\quad $-$ \\textrm{ Add equation: } ${aslatexString(eq)} \\textrm { to E }$`)
                    }
                })
                isMarkedMap.set(lrRule, false);
                R = newR;
            }                                                                                                                                                                               if (E.isEmpty()) substeps.push(` $\\quad \\textrm{E is now empty set {}}$`)
        }
        if (existsUnmarkedRule(isMarkedMap)) {
            const unmarkedRules: RewriteRule[] = getUnmarkedRules(isMarkedMap);
            const markedRules: RewriteRule[] = getMarkedRules(isMarkedMap);
            const unmarkedTRS = new TRS(unmarkedRules);
            const markedTRS = new TRS(markedRules);                                                                                                                                         substeps.push(` $\\quad \\textrm{Proceed with unmarked rules: } ${unmarkedTRS.asLatexString()}$`)

            const chosenRule = _.minBy(unmarkedRules, rule => rule.getSize())!;                                                                                                             substeps.push(` $\\quad \\quad \\bullet \\textrm{ Choose unmarked rule: } ${chosenRule.asLatexString()}$`); substeps.push(` $\\quad \\quad \\bullet \\textrm{ Compute critical pairs with itself and marked rules: } ${markedTRS.asLatexString()}$`)
            // R remains the same
            const criticalPairs = [
                ...TRS.criticalPairs([chosenRule], markedRules, ordering),
                ...TRS.criticalPairs([chosenRule], [chosenRule], ordering),
                ...TRS.criticalPairs(markedRules, [chosenRule], ordering)
            ]
            const criticalPairsGenerated = new SetOfEquations(criticalPairs);                                                                                                               substeps.push(` $\\quad \\quad \\bullet \\textrm{ Following critical pairs were generated: } ${criticalPairsGenerated.asLatexString('\\approx')}$`)
            _.forEach(criticalPairs, pair => E.addEquation(pair));                                                                                                                          substeps.push(` $\\quad \\quad \\bullet \\textrm{ Add all the generated critical pairs to E }$`)
            isMarkedMap.set(chosenRule, true);                                                                                                                                              substeps.push(` $\\quad \\quad \\bullet \\textrm{ Mark rule }$`)
        }                                                                                                                                                                                   substeps.push(`$ $`);steps.push(substeps);
    }
    return { rules: R, steps: [[`$\\textbf{Resulting Term Rewrite System } : ${R.asLatexString()} \\\\$`], ...steps] };
}

const existsUnmarkedRule = (isMarkedMap: Map<RewriteRule, boolean>) => {
    for (let value of isMarkedMap.values()) {
        if (value === false) return true;
    }
    return false;
}

const getUnmarkedRules = (isMarkedMap: Map<RewriteRule, boolean>) => {
    const unmarkedRules: RewriteRule[] = [];
    for (let value of isMarkedMap) {
        if (value[1] === false) unmarkedRules.push(value[0]);
    }
    return unmarkedRules;
}

const getMarkedRules = (isMarkedMap: Map<RewriteRule, boolean>) => {
    const unmarkedRules: RewriteRule[] = [];
    for (let value of isMarkedMap) {
        if (value[1] === true) unmarkedRules.push(value[0]);
    }
    return unmarkedRules;
}
