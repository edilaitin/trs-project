import { FormControl } from "@angular/forms";

export interface SignatureEntry {
    symbol: string,
    arity: number,
    weightControl: FormControl
}

// export interface Term {
//     id: string,
//     asString: string,
//     asArray: any[],
//     nodes: {
//         id: string,
//         label: string,
//         pos: string
//     }[],
//     links: {
//         id: string,
//         source: string,
//         target: string
//     }[]
// }