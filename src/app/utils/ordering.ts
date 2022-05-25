import * as _ from "lodash";
import { SignatureEntry } from "../types";
import { Term } from "./terms";

export class Ordering {
    signatureSymbols: string[];

    constructor(signatureSymbols: string[]) {
        this.signatureSymbols = signatureSymbols;
    }

    static getAllOrderings(signature: SignatureEntry[]): Ordering[] {
        const symbols = _.map(signature, s => s.symbol);
        const allPermutations = permutations(symbols);
        return _.map(allPermutations, perm => { return new Ordering(perm) });
    }

    order(termL: Term, termR: Term): 'GR' | 'EQ' | 'NGE' {
        if (termL.isEqual(termR)) return 'EQ';
        else if (termR.isVariable() && termL.containsTerm(termR)) return 'GR';
        else if (!termL.isVariable() && !termR.isVariable()) {
            const lpo2a = _.some(termL.asArray, (_t, index) => {
                if (index === 0) return false;
                else if (this.order(termL.subTermAtPosition(index.toString()), termR) === 'GR') return true;
                return false;
            });
            if (lpo2a) return 'GR';

            const symbolL = termL.asArray[0];
            const symbolR = termR.asArray[0];
            const indexSymbolL = _.indexOf(this.signatureSymbols, symbolL);
            const indexSymbolR = _.indexOf(this.signatureSymbols, symbolR);

            const lpo2b = indexSymbolL > indexSymbolR && _.every(termR.asArray, (_t, index) => {
                if (index === 0) return true;
                return this.order(termL, termR.subTermAtPosition(index.toString()));
            })
            if (lpo2b) return 'GR';

            // lpo2c
            if (indexSymbolL == indexSymbolR) {
                const minSize = _.min([_.size(termL.asArray), _.size(termR.asArray)]) as number;
                for (let i = 1; i < minSize; i++) {
                    const orderSubTerms = this.order(termL.subTermAtPosition(i.toString()), termR.subTermAtPosition(i.toString()));
                    if (orderSubTerms === 'GR') return 'GR';
                    else if (orderSubTerms === 'NGE') return 'NGE';
                }
            }
            return 'NGE';
        }
        return 'NGE';
    }

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