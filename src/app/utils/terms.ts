import { SignatureEntry } from "../types";
import * as _ from 'lodash';
const { v1: uuidv1 } = require('uuid');

export class Term {
    id: string
    asString: string
    asArray: any[]
    nodes: { id: string, label: string, pos: string }[]
    links: { id: string, source: string, target: string }[]
    signature: SignatureEntry[]
    allowedVariables: string[]
    
    constructor(signature: SignatureEntry[], allowedVariables: string[], input: string, isRoot = true, parentPos = '', nth = 0) {
        this.signature = signature;
        this.allowedVariables = allowedVariables;
        let inputString = _.join(_.split(input, " "), "");
        const symbol = _.split(inputString, "(")[0];
        let openParenthesis = 0;
        const subTerms: string[] = []; let subTerm = "";
        _.forEach(inputString, char => {
            if (char === "(") {
                // do not add the first pharanthesis to the first subterm
                if (openParenthesis !== 0) subTerm += char;
                openParenthesis++;
            } else if (char === ")") {
                openParenthesis--;
                // final subTerm is found before the last closing pharantesis
                if (openParenthesis === 0) subTerms.push(subTerm)
                else subTerm += char;
            }
            // subterm iff there is only one open pharantesis
            else if (char === "," && openParenthesis === 1) {
                subTerms.push(subTerm);
                subTerm = "";
                // do not add the first function symbol to the subterm
            } else if (openParenthesis !== 0) {
                subTerm += char;
            }
        })
        if (openParenthesis !== 0) throw Error(`Invalid input term (paranthesis missmatch) in term ${inputString}`);
        const foundSymbol = _.find(signature, v => v.symbol === symbol);
        const isVariable = _.some(allowedVariables, v => {
            const regExp = new RegExp(`^${v}\\d*$`);
            return symbol.match(regExp);
        });
        const subTermsSize = _.size(subTerms);

        if (_.isUndefined(foundSymbol) && subTermsSize > 0)
            throw Error(`Unkown function symbol present in term ${inputString}`);

        if (foundSymbol && subTermsSize !== foundSymbol.arity)
            throw Error(`Non matching arity (${subTermsSize} instead of ${foundSymbol.arity}) for function symbol ${foundSymbol.symbol} in term ${inputString}`);

        if (_.isUndefined(foundSymbol) && !isVariable && subTermsSize === 0)
            throw Error(`${symbol} is neither a predefined function symbol nor a valid variable name`);

        const id = uuidv1();
        const pos = isRoot ? 'e' : parentPos == 'e' ? nth.toString() : `${parentPos}${nth.toString()}`;
        const parsedSubterms = _.map(subTerms, (subterm, index) => new Term(signature, allowedVariables, subterm, false, pos, index + 1));

        this.id = id
        this.asString = inputString
        this.asArray = [symbol, ..._.map(parsedSubterms, t => t.asArray)]
        this.nodes = [
            { id: id, label: symbol, pos: pos },
            ..._.flatMap(parsedSubterms, t => t.nodes)
        ]
        this.links = [
            ..._.map(parsedSubterms, t => {
                return {
                    id: uuidv1(),
                    source: id,
                    target: t.id
                }
            }),
            ..._.flatMap(parsedSubterms, t => t.links)
        ]
    }

    isVariable() {
        return _.size(this.asArray) === 1;
    }

    asLatexString() {
        return arrayToString(arrayToLatexArray(this.allowedVariables, this.asArray));
    }

    subTermAtPosition(pos: number): Term {
        const newTermArray = _.get(_.cloneDeep(this.asArray), pos.toString().split('').map(Number))
        return new Term(this.signature, this.allowedVariables, arrayToString(newTermArray))
    }

    positionReplacement(replaceTerm: Term, position: number | string) {
        if (position === 'e') return this;
        const newTermArray = _.set(_.cloneDeep(this.asArray), position.toString().split('').map(Number), replaceTerm.asArray)
        const newTerm = new Term(this.signature, this.allowedVariables, arrayToString(newTermArray));
        return newTerm;
    }

    positionComputationSteps(position: number | string) {
        const loop = (termArray: any[], position: number, acc: string[]): string[] => {
            const positions = position.toString().split('').map(Number)
            const firstPos = _.head(positions) as number
            const newTerm = this.subTermAtPosition(firstPos).asLatexString();
            if (_.size(positions) > 1) {
                const newAcc = [...acc, `{${newTerm}_{|}}_{${_.tail(positions).join('')}}`];
                return loop(_.get(termArray, `${firstPos}`), _.toNumber(_.tail(positions).join('')), newAcc);
            } else {
                const newAcc = [...acc,
                `{{${newTerm}}_{|}}_{e}`, newTerm
                ];
                return newAcc;
            }

        }
        const stringT = this.asLatexString();
        if (position === 'e') return [stringT]
        return loop(this.asArray, position as number, []);
    }

    // check if 2 terms are equal
    isEqual(term: Term) {
        return JSON.stringify(this.asArray) === JSON.stringify(term.asArray);
    }
}

export function arrayToLatexArray(allowedVariables: string[], termArray: any[]): any[] {
    const symbol = termArray[0];
    const isVariable = _.find(allowedVariables, v => {
        const regExp = new RegExp(`^${v}\\d*$`);
        return !_.isNil(symbol.match(regExp));
    });
    if (isVariable) {
        const regExp = new RegExp(`^${isVariable}(\\d*)$`, 'g');
        const number = _.get(regExp.exec(symbol), '1');
        if (termArray.length > 1) return [`${isVariable}_{${number}}`, arrayToLatexArray(allowedVariables, termArray[1])];
        else return [`${isVariable}_{${number}}`];
    } else {
        if (termArray.length > 1) return [termArray[0], ..._.map(_.tail(termArray), v => arrayToLatexArray(allowedVariables, v))];
        else return termArray;
    }
}

export function arrayToString(termArray: any[]): string {
    if (termArray.length == 1) return termArray[0];
    return `${termArray[0]}(${_.map(_.tail(termArray), v => arrayToString(v)).join(',')})`
}