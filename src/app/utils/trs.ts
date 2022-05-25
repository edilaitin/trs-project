import { RewriteRule } from "./rewriteRule";
import { Term } from "./terms";
import * as _ from "lodash";
import { Ordering } from "./ordering";
import { SetOfEquations } from "./unification";

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
                const matcher = new SetOfEquations([{ left: l, right: t }]).getMatcher(ordering);
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
                console.log(`Variable:${t.asString}`);
                return t;
            }
            else {
                const size = _.size(t.asArray);
                for (let i = 1; i < size; i++) {
                    t = t.positionReplacement(this.toNormalForm(t.subTermAtPosition(i.toString()), ordering), i.toString());
                }
                console.log(`Initial:${t.asString}`);

                const rewrRes = this.rewrite(t, ordering);

                if (rewrRes !== 'NORM') console.log(`After:${rewrRes.asString}`);
                else console.log('NORM');
                
                if (rewrRes === 'NORM' || rewrRes.isEqual(t)) return t;
                else return this.toNormalForm(rewrRes, ordering);
            }
        }
        return loop(term);
    }
}
