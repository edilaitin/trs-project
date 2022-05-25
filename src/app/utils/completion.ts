import * as _ from "lodash";
import { Ordering } from "./ordering";
import { RewriteRule } from "./rewriteRule";
import { TRS } from "./trs";
import { SetOfEquations } from "./unification";

export function completion(E: SetOfEquations, ordering: Ordering): TRS | 'Fail' {
    let R = new TRS();
    const isMarkedMap: Map<RewriteRule, boolean> = new Map<RewriteRule, boolean>();
    while (!E.isEmpty() || existsUnmarkedRule(isMarkedMap)) {
        while (!E.isEmpty()) {
            const indexChosenIdentity = 0;
            const identity = E.equations[indexChosenIdentity];
            const [s, t] = [identity.left, identity.right];            
            const [sHat, tHat] = [R.toNormalForm(s, ordering), R.toNormalForm(t, ordering)];
            const order = ordering.order(sHat, tHat);
            if (order === 'EQ') {
                // R remains the same
                E.removeEquation(indexChosenIdentity);
            } else if (ordering.order(sHat, tHat) === 'NGE' && ordering.order(tHat, sHat) === 'NGE') {
                return 'Fail';
            } else {
                const reorder = ordering.reorder(sHat, tHat);
                const [l, r] = [reorder.left, reorder.right];
                const lrRule = new RewriteRule(l, r);
                const newR = new TRS([lrRule]);
                const RwithLR = _.cloneDeep(R);
                RwithLR.addRule(lrRule);

                E.removeEquation(indexChosenIdentity);
                _.forEach(R.rules, rule => {
                    const [g, d] = [rule.left, rule.right];

                    const gPrime = newR.toNormalForm(_.cloneDeep(g), ordering);
                    if (g.isEqual(gPrime)) {
                        const dHat = RwithLR.toNormalForm(d, ordering);
                        const newRule = new RewriteRule(g, dHat);
                        newR.addRule(newRule);
                        isMarkedMap.set(newRule, isMarkedMap.get(rule)!);
                        isMarkedMap.delete(rule);
                    } else {
                        isMarkedMap.delete(rule);
                        E.addEquation({ left: gPrime, right: d });
                    }
                })
                isMarkedMap.set(lrRule, false);
                R = newR;
            }
        }
        if (existsUnmarkedRule(isMarkedMap)) {
            const unmarkedRules: RewriteRule[] = getUnmarkedRules(isMarkedMap);
            const markedRules: RewriteRule[] = getMarkedRules(isMarkedMap);
            const chosenRule = _.minBy(unmarkedRules, rule => rule.getSize())!;
            // R remains the same

            const criticalPairs = [
                ...TRS.criticalPairs([chosenRule], markedRules, ordering),
                ...TRS.criticalPairs([chosenRule], [chosenRule], ordering),
                ...TRS.criticalPairs(markedRules, [chosenRule], ordering)
            ]
            _.forEach(criticalPairs, pair => E.addEquation(pair));
            isMarkedMap.set(chosenRule, true);
        }
    }
    return R;
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
