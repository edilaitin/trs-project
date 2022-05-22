import * as _ from "lodash";
import { Term } from "./terms";

export interface SubstitutionEntry {
    from: Term,
    to: Term
}

export class Substitution {
    entries: SubstitutionEntry[]

    constructor(entries: SubstitutionEntry[] = []) {
        this.entries = entries;
    }

    addEntry(entry: SubstitutionEntry) {
        if (entry.from.isVariable()) {
            this.entries.push(entry);
        } else {
            console.log("Substitution from is not a variable!!");
        }
    }

    asLatexString() {
        return `\\left\\{ ${_.map(this.entries, entry => `${entry.from.asLatexString()} \\rightarrow ${entry.to.asLatexString()}`).join(',')}\\right\\}`;
    }

    applyToTerm(term: Term): Term {
        if (term.isVariable()) {
            const matchingEntry =_.find(this.entries, entry => {
                return entry.from.isEqual(term);
            })
            if (matchingEntry) return matchingEntry.to;
            else return term;
        } else {
            const size = _.size(term.asArray);
            for (let pos = 1; pos < size; pos++) {
                const subTerm = term.subTermAtPosition(pos);
                term = term.positionReplacement(this.applyToTerm(subTerm), pos);
            }
            return term;
        }
    }
}