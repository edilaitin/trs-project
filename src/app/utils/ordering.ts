import * as _ from "lodash";
import { SignatureEntry } from "./types";
import { Term } from "./terms";

export class Ordering {
    signatureSymbols: string[];
    weights: number[];
    w0: number;

    constructor(signatureSymbols: string[], weights: number[], w0: number) {
        this.signatureSymbols = signatureSymbols;
        this.weights = weights;
        this.w0 = w0
    }

    // static getAllOrderings(signature: SignatureEntry[]): Ordering[] {
    //     const symbols = _.map(signature, s => s.symbol);
    //     const allPermutations = permutations(symbols);
    //     return _.map(allPermutations, perm => { return new Ordering(perm) });
    // }

    computeWeight(term: Term) {
        let sum = 0;
        _.forEach(this.signatureSymbols, (symbol, index) => {
            sum += term.nrOfOccS(symbol) * this.weights[index];
        })
        sum += term.getVariableSubtermsPositions().length * this.w0;
        return sum;
    }

    order(termL: Term, termR: Term): 'GR' | 'EQ' | 'NGE' {
        if (termL.isEqual(termR)) return 'EQ';
        const variablesL = _.uniq(termL.getVariableSubtermsPositions().map(v => v.term));
        const variablesR = _.uniq(termR.getVariableSubtermsPositions().map(v => v.term));

        const uniqVariables = _.uniqBy([...variablesL, ...variablesR], v => v.asString);
        const varGTE = _.every(uniqVariables, v => termL.nrOfOccV(v.asString) >= termR.nrOfOccV(v.asString));
        const weightL = this.computeWeight(termL);
        const weightR = this.computeWeight(termR);

        if (varGTE && weightL > weightR) return 'GR';
        else if (varGTE && weightL == weightR) {
            if (termR.isVariable() && termL.containsTerm(termR) &&
                termL.getVariableSubtermsPositions().length === 1 && _.uniq(termL.getNonVariableSubtermsPositions().map(v => v.term.asArray[0])).length === 1)
                return 'GR';

            const symbolL = termL.asArray[0];
            const symbolR = termR.asArray[0];
            const indexSymbolL = _.indexOf(this.signatureSymbols, symbolL);
            const indexSymbolR = _.indexOf(this.signatureSymbols, symbolR);
            if (!termR.isVariable() && !termL.isVariable() && indexSymbolL < indexSymbolR) return 'GR';            
            if (!termR.isVariable() && !termL.isVariable() && indexSymbolL == indexSymbolR) {
                const minSize = _.min([_.size(termL.asArray), _.size(termR.asArray)]) as number;
                for (let i = 1; i < minSize; i++) {
                    const orderSubTerms = this.order(termL.subTermAtPosition(i.toString()), termR.subTermAtPosition(i.toString()));
                    if (orderSubTerms === 'GR') return 'GR';
                    else if (orderSubTerms === 'NGE') return 'NGE';
                }
            }
            return 'NGE'
        }
        return 'NGE';
    }

    // order(termL: Term, termR: Term): 'GR' | 'EQ' | 'NGE' {
    //     if (termL.isEqual(termR)) return 'EQ';
    //     else if (termR.isVariable() && termL.containsTerm(termR)) return 'GR';
    //     else if (!termL.isVariable() && !termR.isVariable()) {
    //         const lpo2a = _.some(termL.asArray, (_t, index) => {
    //             if (index === 0) return false;
    //             else if (this.order(termL.subTermAtPosition(index.toString()), termR) === 'GR') return true;
    //             return false;
    //         });
    //         if (lpo2a) return 'GR';

    //         const symbolL = termL.asArray[0];
    //         const symbolR = termR.asArray[0];
    //         const indexSymbolL = _.indexOf(this.signatureSymbols, symbolL);
    //         const indexSymbolR = _.indexOf(this.signatureSymbols, symbolR);

    //         const lpo2b = indexSymbolL < indexSymbolR && _.every(termR.asArray, (_t, index) => {
    //             if (index === 0) return true;
    //             return this.order(termL, termR.subTermAtPosition(index.toString()));
    //         })
    //         if (lpo2b) return 'GR';

    //         // lpo2c
    //         if (indexSymbolL == indexSymbolR) {
    //             const minSize = _.min([_.size(termL.asArray), _.size(termR.asArray)]) as number;
    //             for (let i = 1; i < minSize; i++) {
    //                 const orderSubTerms = this.order(termL.subTermAtPosition(i.toString()), termR.subTermAtPosition(i.toString()));
    //                 if (orderSubTerms === 'GR') return 'GR';
    //                 else if (orderSubTerms === 'NGE') return 'NGE';
    //             }
    //         }
    //         return 'NGE';
    //     }
    //     return 'NGE';
    // }

    reorder(termL: Term, termR: Term): { left: Term, right: Term } {
        if (this.order(termL, termR) === 'GR') return { left: _.cloneDeep(termL), right: _.cloneDeep(termR) };
        else return { left: _.cloneDeep(termR), right: _.cloneDeep(termL) }
    }
}

const permutations = (xs: any[]): any[][] =>
    _.flatten(xs.map((x: any) =>
        xs.length < 2
            ? [xs]
            : permutations(_.without(xs, x)).map((perm: any) => [x, ...perm])
    ));
