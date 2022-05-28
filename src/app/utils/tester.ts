import { completion } from "./completion";
import { Ordering } from "./ordering";
import { Term } from "./terms";
import { SignatureEntry } from "./types";
import { Equation, SetOfEquations } from "./unification";

let signature: SignatureEntry[] = [
    { symbol: '*', arity: 2 },
    { symbol: 'i', arity: 1 },
    { symbol: 'e', arity: 0 },
]
let allowedVariables: string[] = ['x', 'y', 'z'];

const equations: Equation[] = [
    {
        left: new Term(signature, allowedVariables, '*(*(x,y), z)'),
        right: new Term(signature, allowedVariables, '*(x,*(y,z))'),
    },
    {
        left: new Term(signature, allowedVariables, '*(i(x),x)'),
        right: new Term(signature, allowedVariables, 'e'),
    },
    {
        left: new Term(signature, allowedVariables, '*(e, x)'),
        right: new Term(signature, allowedVariables, 'x'),
    }
];
const eqSet = new SetOfEquations(equations);
// const orderings = Ordering.getAllOrderings(signature,);

const ordering = new Ordering(['i', '*', 'e'], [0, 0, 1], 1);
const term1 = new Term(signature, allowedVariables, '*(x16534741542551653474154317,z1653474154317)');
const term2 = new Term(signature, allowedVariables, '*(i(i(x16534741542551653474154317)),z1653474154317)');

// console.log(ordering.computeWeight(term1));
// console.log(ordering.computeWeight(term2));

// console.log(ordering.order(term2, term1));

// // for (let order of orderings) {
    const result = completion(eqSet, new Ordering(['i', '*', 'e'], [0, 0, 1], 1));
    console.log("RESULTTTTTTTTTTTTTTTT");
    console.log(result);
    if (result != 'Fail' )console.log(JSON.stringify(result.rules.rules.map(e => `${e.left.asString} = ${e.right.asString}`), null, 2));
    

    if (result !== 'Fail') process.exit(0);
// // // }
