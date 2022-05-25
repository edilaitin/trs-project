import * as _ from "lodash";
import { Ordering } from "./ordering";
import { Substitution } from "./substitutions";
import { Term } from "./terms";
import { Equation, SetOfEquations } from "./unification";

export class RewriteRule {
    left: Term;
    right: Term;

    constructor(left: Term, right: Term) {
        this.left = left;
        this.right = right;
    }

    reduceTerm(term: Term, ordering: Ordering): Term {
        const setEq = new SetOfEquations([{ left: term, right: this.left }])
        const resultMatcher = setEq.getMatcher(ordering);
        if (resultMatcher !== false) {
            // console.log(`MATCHER = ${resultMatcher.asLatexString()}`);
            // console.log(resultMatcher.applyToTerm(subTerm.term).asString);
            // console.log(subTerm.term.asString);
            // console.log(this.left.asString);
            return term.positionReplacement((resultMatcher as Substitution).applyToTerm(this.right), 'e');
        }
        return term;
    }

    criticalPairs(rules: RewriteRule[], ordering: Ordering): Equation[] {
        const nonVariableSubterms = this.left.getNonVariableSubtermsPositions();
        return _.flatMap(rules, rule => {
            return _.compact(_.map(nonVariableSubterms, nonVariableSubterm => {
                const ruleCopy = _.cloneDeep(rule);

                const leftUnique = _.uniq(_.map(this.left.getVariableSubtermsPositions(), 'term.asString'));
                const rigthUnique = _.uniq(_.map(this.left.getVariableSubtermsPositions(), 'term.asString'));
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
                        left: subst.applyToTerm(this.right),
                        right: subst.applyToTerm(this.left).positionReplacement(subst.applyToTerm(ruleCopy.right), nonVariableSubterm.pos)
                    }
                    return eq;
                } else {
                    return undefined;
                }
            }))
        })
    }

    getSize() {
        return this.left.getSize() + this.right.getSize();
    }
}