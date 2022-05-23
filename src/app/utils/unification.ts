import * as _ from "lodash";
import { Substitution, SubstitutionEntry } from "./substitutions";
import { Term } from "./terms";

export interface Equation {
    left: Term,
    right: Term
}

export class SetOfEquations {
    equations: Equation[]

    constructor(equations: Equation[] = []) {
        this.equations = equations;
    }

    addEquation(equation: Equation) {
        this.equations.push(equation);
    }

    removeEquation(index: number) {
        this.equations.splice(index, 1);
    }

    replaceEquation(index: number, newEquation: Equation) {
        _.set(this.equations, index, newEquation);
    }

    static reverseEquation(equation: Equation): Equation {
        return { left: equation.right, right: equation.left }
    }

    asLatexString(): string {
        return `\\left\\{ ${_.map(this.equations, equation => `${equation.left.asLatexString()} \\stackrel{?}{=} ${equation.right.asLatexString()}`).join(',')}\\right\\}`;
    }

    toSubstitution(): Substitution {
        const entries: SubstitutionEntry[] = _.map(this.equations, eq => ({
            from: eq.left,
            to: eq.right
        }));
        return new Substitution(entries);
    }

    isSolvedForm(): boolean {
        const leftTerms = _.map(this.equations, eq => eq.left);
        const uniqueLeftTerms = _.uniqBy(leftTerms, t => t.asString);
        if (_.some(uniqueLeftTerms, lt => !lt.isVariable())) return false;
        const rightTerms = _.map(this.equations, eq => eq.right);
        const uniqueRightTerms = _.uniqBy(rightTerms, t => t.asString);
        let isSolved = true;
        _.forEach(uniqueLeftTerms, lt => {
            if (_.some(uniqueRightTerms, rt => rt.containsTerm(lt))) isSolved = false;
        })
        return isSolved;
    }

    getMGU(): SetOfEquations | false {
        const loop = (eqSet: SetOfEquations): SetOfEquations | false => {
            if (eqSet.isSolvedForm()) return eqSet;
            else {
                for (let index = 0; index < _.size(eqSet.equations); index++) {
                    const eq = eqSet.equations[index];
                    // apply DELETE
                    if (eq.left.isEqual(eq.right)) {
                        const copy = _.cloneDeep(eqSet);
                        copy.removeEquation(index);
                        return loop(copy);
                    }
                    // apply DECOMPOSE f(t1, t2, ... tn) = f(s1, s2, ... sn)
                    else if (!eq.left.isVariable() && _.head(eq.left.asArray) === _.head(eq.right.asArray)) {
                        const copy = _.cloneDeep(eqSet);
                        copy.removeEquation(index);
                        _.forEach(eq.left.asArray, (_ti, index2) => {
                            if (index2 !== 0) {
                                copy.addEquation({
                                    left: eq.left.subTermAtPosition(index2),
                                    right: eq.right.subTermAtPosition(index2)
                                })
                            }
                        });
                        return loop(copy);
                    }
                    // apply ORIENT
                    else if (eq.right.isVariable() && !eq.left.isVariable()) {
                        const copy = _.cloneDeep(eqSet);
                        copy.removeEquation(index);
                        copy.addEquation(SetOfEquations.reverseEquation(eq));
                        return loop(copy);
                    }
                    // apply ELIMINATE
                    else if (eq.left.isVariable() && !eq.right.containsTerm(eq.left)) {
                        const otherContainsLeft = _.some(_.map(eqSet.equations, eq => eq.right), rt => rt.containsTerm(eq.left));
                        if (otherContainsLeft) {
                            const newEqSet = new SetOfEquations([_.cloneDeep(eq)]);
                            const substitution = new Substitution([{
                                from: eq.left,
                                to: eq.right
                            }])
                            _.forEach(eqSet.equations, (eqInitial, index2) => {
                                if (index !== index2) {
                                    newEqSet.addEquation({
                                        left: substitution.applyToTerm(eqInitial.left),
                                        right: substitution.applyToTerm(eqInitial.right)
                                    })
                                }
                            })
                            return loop(newEqSet);
                        }
                    }
                }
            }
            return false;
        }
        return loop(this);
    }
}