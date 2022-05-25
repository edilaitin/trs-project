import * as _ from "lodash";
import { Ordering } from "./ordering";
import { RewriteRule } from "./rewriteRule";
import { TRS } from "./trs";
import { SetOfEquations } from "./unification";

export function completion(E: SetOfEquations, ordering: Ordering): TRS | 'Fail' {
    let R = new TRS();
    const isMarkedMap: Map<RewriteRule, boolean> = new Map<RewriteRule, boolean>();
    while (!E.isEmpty() || existsUnmarkedRule(isMarkedMap)) {
        console.log(`ordering=${JSON.stringify(ordering, null, 2)}`);

        while (!E.isEmpty()) {
            const indexChosenIdentity = 0;
            const identity = E.equations[indexChosenIdentity];
            const [s, t] = [identity.left, identity.right];
            console.log(`HERE 0.1`);
            
            const [sHat, tHat] = [R.toNormalForm(s, ordering), R.toNormalForm(t, ordering)];
            console.log(`HERE 0.2`);

            const order = ordering.order(sHat, tHat);
            console.log(`HERE 1`);
            if (order === 'EQ') {
                // console.log(`HERE 2`);

                // R remains the same
                E.removeEquation(indexChosenIdentity);
            } else if (ordering.order(sHat, tHat) === 'NGE' && ordering.order(tHat, sHat) === 'NGE') {
                // console.log(`HERE 3`);

                return 'Fail';
            } else {
                const reorder = ordering.reorder(sHat, tHat);
                const [l, r] = [reorder.left, reorder.right];
                const lrRule = new RewriteRule(l, r);
                const newR = new TRS([lrRule]);
                const RwithLR = _.cloneDeep(R);
                RwithLR.addRule(lrRule);

                console.log(`HERE 4`);

                E.removeEquation(indexChosenIdentity);
                _.forEach(R.rules, rule => {
                    console.log(`HERE 5`);

                    const [g, d] = [rule.left, rule.right];
                    const gPrime = newR.rewrite(_.cloneDeep(g), ordering);
                    console.log(`HERE 6`);

                    if (gPrime === 'NORM') {
                        console.log("NOOOO");
                        console.log(d.asString);
                        
                        const dHat = RwithLR.toNormalForm(d, ordering);

                        console.log(`HERE 7`);

                        const newRule = new RewriteRule(g, dHat);
                        newR.addRule(newRule);
                        isMarkedMap.set(newRule, isMarkedMap.get(rule)!);
                        
                        console.log(`BEF_markedRules=${isMarkedMap.size}`);
                        isMarkedMap.delete(rule);
                        console.log(`AFT_markedRules=${isMarkedMap.size}`);

                    } else {
                        console.log("YESSSSSSSSSSS");
                        isMarkedMap.delete(rule);

                        E.addEquation({ left: gPrime, right: d });
                    }
                })
                isMarkedMap.set(lrRule, false);
                // console.log(`isMarkedMap=${JSON.stringify(isMarkedMap.size, null, 2)}`);

                // console.log(`newR_SIZE=${newR.rules.length}`);

                R = newR;
            }
        }
        if (existsUnmarkedRule(isMarkedMap)) {
            // console.log(`isMarkedMap=${JSON.stringify(isMarkedMap, null, 2)}`);

            // console.log(`HERE 7`);

            const unmarkedRules: RewriteRule[] = getUnmarkedRules(isMarkedMap);
            const markedRules: RewriteRule[] = getMarkedRules(isMarkedMap);
            const chosenRule = _.minBy(unmarkedRules, rule => rule.getSize())!;
            // R remains the same
            // console.log(`HERE 8`);

            // console.log(`unmarkedRules=${_.size(unmarkedRules)}`);
            // console.log(`R_SIZE=${R.rules.length}`);

            
            const criticalPairs = chosenRule.criticalPairs([...markedRules, chosenRule], ordering);
            // console.log(_.size(criticalPairs));
            
            // console.log(`HERE 9`);

            _.forEach(criticalPairs, pair => E.addEquation(pair));
            console.log(`BEF_markedRules=${isMarkedMap.size}`);
            isMarkedMap.set(chosenRule, true);
            console.log(`AFT_markedRules=${isMarkedMap.size}`);

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
