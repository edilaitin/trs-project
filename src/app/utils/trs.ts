import { RewriteRule } from "./rewriteRule";
import { Term } from "./terms";
import * as _ from "lodash";
import { Ordering } from "./ordering";
import { Equation, SetOfEquations } from "./unification";

export class TRS {
    rules: RewriteRule[];

    constructor(rules: RewriteRule[] = []) {
        this.rules = rules;
    }

    addRule(rule: RewriteRule) {
        this.rules.push(rule);
    }

    removeRule(index: number) {
        this.rules.splice(index, 1);
    }

    rewrite(term: Term, ordering: Ordering): Term | 'NORM' {
        const loop = (rules: RewriteRule[], t: Term): Term | 'NORM' => {
            if (_.isEmpty(rules)) return 'NORM'
            else {
                const { left: l, right: r } = rules[0];
                const matcher = new SetOfEquations([{ left: l, right: t }]).getMatcher();
                if (matcher === false) {
                    return loop(_.tail(rules), t)
                } else return matcher.applyToTerm(r);
            } 
        }
        return loop(this.rules, term);
    }

    toNormalForm(term: Term, ordering: Ordering): Term {
        const loop = (t: Term): Term => {
            if (t.isVariable()) {
                return t;
            }
            else {
                const size = _.size(t.asArray);
                for (let i = 1; i < size; i++) {
                    t = t.positionReplacement(this.toNormalForm(t.subTermAtPosition(i.toString()), ordering), i.toString());
                }
                const rewrRes = this.rewrite(t, ordering);
                if (rewrRes === 'NORM' || rewrRes.isEqual(t)) return t;
                else return this.toNormalForm(rewrRes, ordering);
            }
        }
        return loop(term);
    }

    static criticalPairs(rules1: RewriteRule[], rules2: RewriteRule[], ordering: Ordering): Equation[] {
        return _.flatMap(rules1, rule1 => {
            const nonVariableSubterms = rule1.left.getNonVariableSubtermsPositions();
            return _.flatMap(rules2, rule2 => {
                return _.compact(_.map(nonVariableSubterms, nonVariableSubterm => {
                    const ruleCopy = _.cloneDeep(rule2);
    
                    const leftUnique = _.uniq(_.map(rule1.left.getVariableSubtermsPositions(), 'term.asString'));
                    const rigthUnique = _.uniq(_.map(rule1.left.getVariableSubtermsPositions(), 'term.asString'));
                    const concatBase = _.uniq(_.concat(leftUnique, rigthUnique));
    
                    const variableTermsRuleLeft = _.uniq(_.map(ruleCopy.left.getVariableSubtermsPositions(), 'term.asString'));
                    const variableTermsRuleRight = _.uniq(_.map(ruleCopy.right.getVariableSubtermsPositions(), 'term.asString'));
                    const concat = _.intersection(_.uniq(_.concat(variableTermsRuleLeft, variableTermsRuleRight)), concatBase);
                    
                    _.forEach(concat, v => { 
                        const rename = `${v}${Date.now()}`;
                        ruleCopy.left = ruleCopy.left.renameVariableByName(v, rename);
                        ruleCopy.right = ruleCopy.right.renameVariableByName(v, rename);
                    })
    
                    const mgu = new SetOfEquations([{ left: nonVariableSubterm.term, right: ruleCopy.left }]).getMGU();
                    if (mgu !== false) {
                        const subst = mgu.toSubstitution(ordering);
                        const eq: Equation = {
                            left: subst.applyToTerm(rule1.right),
                            right: subst.applyToTerm(rule1.left).positionReplacement(subst.applyToTerm(ruleCopy.right), nonVariableSubterm.pos)
                        }
                        return eq;
                    } else {
                        return undefined;
                    }
                }))
            })
        })
    }
}
