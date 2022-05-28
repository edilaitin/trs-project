import * as _ from "lodash";
import { Term } from "./terms";

export class RewriteRule {
    left: Term;
    right: Term;

    constructor(left: Term, right: Term) {
        this.left = left;
        this.right = right;
    }

    asLatexString() {
        return `${this.left.asLatexString()} \\rightarrow ${this.right.asLatexString()}`
    }
    
    getSize() {
        return this.left.getSize() + this.right.getSize();
    }
}
