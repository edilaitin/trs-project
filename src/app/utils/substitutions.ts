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

    containsTerm(term: Term) {
        return _.some(_.map(this.entries, entry => entry.from), fterm => fterm.containsTerm(term));
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
                const subTerm = term.subTermAtPosition(pos.toString());
                term = term.positionReplacement(this.applyToTerm(subTerm), pos.toString());
            }
            return term;
        }
    }

    composeSubstitution(otherSubstitution: Substitution) {
        const froms = _.concat(_.map(this.entries, e => e.from), _.map(otherSubstitution.entries, e => e.from));
        const uniqueFroms = _.uniqBy(froms, from => from.asString);
        const newEntries: SubstitutionEntry[] = [];
        _.forEach(uniqueFroms, fromTerm => {
            const toTerm = this.applyToTerm(otherSubstitution.applyToTerm(fromTerm))
            if (fromTerm.asString != toTerm.asString) {
                newEntries.push({
                    from: fromTerm,
                    to: toTerm
                })
            }
        })
        return new Substitution(newEntries)
    }
}