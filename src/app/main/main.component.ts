import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MathContent } from '../math/math-content';
import { SignatureEntry } from '../types';
// const TheDAG = require('the-dag');
import * as _ from 'lodash';
import { arrayToString, Term } from '../utils/terms';
import { ChangeDetectorRef } from '@angular/core';
import { Substitution } from '../utils/substitutions';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  symbolControl = new FormControl('', [Validators.pattern(/^[^(,)]*$/), Validators.required]);
  arrityControl = new FormControl(0, [Validators.min(0), Validators.required]);
  variableControl = new FormControl('', [Validators.pattern(/^[^(,)\d]*$/), Validators.required]);
  termControl = new FormControl('', [Validators.required]);

  positionControls: FormControl[] = [];
  positionReplaceControls: FormControl[] = [];

  mathPositions: MathContent[] = [];
  mathPositionsReplace: MathContent[] = [];
  mathApplySubt: MathContent[] = [];

  redrawM: boolean[] = [];
  redrawMR: boolean[] = [];
  redrawMA: boolean[] = [];

  clusterTerms: { id: string; label: string; childNodeIds: string[]; }[][] = [];
  clusterTermsReplaceBefore: { id: string; label: string; childNodeIds: string[]; }[][] = [];
  clusterTermsReplaceAfter: { id: string; label: string; childNodeIds: string[]; }[][] = [];

  selectedTermReplace: Term[] = [];
  selectedTermApplySubst: Term[] = [];

  replacementTerms: Term[] = [];
  subsAppliedTerms: Term[] = [];

  substEntryFromControls: FormControl[] = [];
  substEntryToControls: FormControl[] = [];

  showSubstMath: boolean[] = [];

  constructor(private cd: ChangeDetectorRef) { }

  signature: SignatureEntry[] = [
    { symbol: "f", arity: 2 },
    { symbol: "i", arity: 1, },
    { symbol: "e", arity: 0 }
  ]
  allowedVariables: string[] = ["x", "y", "z"];
  terms: Term[] = [];
  substitutions: Substitution[] = []

  getSymbolErrorMessage() {
    if (this.symbolControl.hasError('required')) {
      return 'You must enter a value';
    }
    return "Must not contain (), characters";
  }

  getVariableErrorMessage() {
    if (this.variableControl.hasError('required')) {
      return 'You must enter a value';
    }
    return "Must not contain (), characters or digits";
  }

  getTermErrorMessage(control: FormControl) {
    if (control.hasError('required')) {
      return 'You must enter a value';
    }
    else return '';
  }

  addToSignature() {
    const symbol = this.symbolControl.value;
    const arrity = this.arrityControl.value;

    this.signature.push({
      symbol: symbol,
      arity: arrity
    })
    this.symbolControl.reset();
    this.arrityControl.reset();
  }

  removeFromSignature(index: number) {
    this.signature.splice(index, 1);
  }

  isValidSymbolEntry() {
    if (this.symbolControl.invalid || this.arrityControl.invalid) return false;
    const symbol = this.symbolControl.value;
    let alreadyPresent = false;
    this.allowedVariables.forEach(v => {
      if (v === symbol) alreadyPresent = true;
    })
    this.signature.forEach(entry => {
      if (entry.symbol === symbol) alreadyPresent = true;
    })
    if (alreadyPresent) return false;
    return true;
  }

  addToVariables() {
    const variable = this.variableControl.value;
    this.allowedVariables.push(variable);
    this.variableControl.reset();
  }

  removeFromVariables(index: number) {
    this.allowedVariables.splice(index, 1);
  }

  isValidVariableEntry() {
    if (this.variableControl.invalid) return false;
    const variable = this.variableControl.value;
    let alreadyPresent = false;
    this.allowedVariables.forEach(v => {
      if (v === variable) alreadyPresent = true;
    })
    this.signature.forEach(entry => {
      if (entry.symbol === variable) alreadyPresent = true;
    })
    if (alreadyPresent) return false;
    return true;
  }

  isValidTermEntry() {
    if (this.termControl.invalid) return false;
    return true;
  }

  addToTerms() {
    const inputString = this.termControl.value;
    const term = new Term(this.signature, this.allowedVariables, inputString);
    console.log(term);

    this.terms.push(term);
    this.termControl.reset();
    this.positionControls.push(new FormControl('e', [Validators.required]));
    this.positionReplaceControls.push(new FormControl('e', [Validators.required]));
    const index = _.size(this.terms);
    this.clusterTerms[index] = this.getClusterTermPos(term, index, 'position');
    this.redrawM.push(true);
    this.redrawMR.push(true);
  }

  removeFromTerms(index: number) {
    this.terms.splice(index, 1);
    this.positionControls.splice(index, 1);
    this.positionReplaceControls.splice(index, 1);
    this.redrawM.splice(index, 1);
    this.redrawMR.splice(index, 1);
    this.clusterTerms.splice(index, 1);
    this.mathPositions.splice(index, 1);
    this.mathPositionsReplace.splice(index, 1);
    // reload data
    this.terms = _.cloneDeep(this.terms);
  }

  getMathSymbol(def: SignatureEntry): MathContent {
    return {
      latex: `$\\cdot$ symbol: $${def.symbol}$, arity: $${def.arity}$`
    };
  }

  getMathVariable(variable: string): MathContent {
    return {
      latex: `$\\cdot$ $${variable}_i$, example of use: $${variable}$, $${variable}_{1}$ or $${variable}_{123}$`
    };
  }

  getMathTerm(term: Term, index: number): MathContent {
    return {
      latex: `$\\cdot$ $term_{${index}} = ${term.asLatexString()}$`
    };
  }

  getMathPosition(term: Term, index: number) {
    try {
      const position = this.positionControls[index].value;
      const result = _.join(term.positionComputationSteps(position), '=');
      return {
        latex: `$\\cdot$ $ {{${term.asLatexString()}}_{|}}_{${position}} = ${result}$`
      };
    }
    catch {
      return {}
    }

  }

  getMathPositionReplace(term: Term, index: number) {
    try {
      const replaceTerm = this.selectedTermReplace[index];
      if (_.isNil(replaceTerm)) return {};
      const position = this.positionReplaceControls[index].value;
      const result = term.positionReplacement(replaceTerm, position);
      this.replacementTerms[index] = result;
      return {
        latex: `$\\cdot$ $ {{${term.asLatexString()}}[${replaceTerm.asLatexString()}]}_{${position}} = ${result.asLatexString()}$`
      };
    }
    catch {
      return {}
    }
  }

  getMathSubstitutionApply(substitution: Substitution, index: number) {
    try {
      const applyTerm = this.selectedTermApplySubst[index];
      if (_.isNil(applyTerm)) return {
        latex: `Choose term`
      };
      const result = substitution.applyToTerm(applyTerm);
      this.subsAppliedTerms[index] = result;
      return {
        latex: `$subst_${index}(${applyTerm.asLatexString()}) = ${result.asLatexString()}$`
      };
    }
    catch {
      return {
        latex: `Error`
      }
    }
  }

  isValidPosition(term: Term, index: number, type: 'position' | 'replace') {
    const pos = type === 'position' ?
      this.positionControls[index].value : this.positionReplaceControls[index].value
    if (type === 'position') {

    } else if (type === 'replace') {
      if (!this.selectedTermReplace[index]) return false;
    }

    if (pos === 'e') return true;
    if (pos === '') return false;
    if (_.isString(_.get(term.asArray, [...pos.toString().split('').map(Number), 0]))) return true;
    return false;
  }

  redrawMath(term: Term, index: number) {
    this.mathPositions[index] = this.getMathPosition(term, index);
    this.mathPositions = _.cloneDeep(this.mathPositions);
    this.clusterTerms[index] = this.getClusterTermPos(term, index, 'position');
    this.redrawM[index] = true;
  }

  refreshMath(term: Term, index: number) {
    if (this.redrawM[index]) {
      this.redrawM[index] = false;
      return true;
    }
    if (_.isUndefined(this.clusterTerms[index])) {
      this.mathPositions[index] = this.getMathPosition(term, index);
      this.mathPositions = _.cloneDeep(this.mathPositions);
      this.clusterTerms[index] = this.getClusterTermPos(term, index, 'position');
    }
    return false;
  }

  getClusterTermPos(term: Term, index: number, type: 'position' | 'replace') {
    try {
      const pos = type === 'position' ?
        this.positionControls[index].value : this.positionReplaceControls[index].value

      if (pos === 'e') {
        return []
      } else {
        return [
          {
            id: 'cluster',
            label: _.toString(pos),
            childNodeIds: _.map(_.filter(term.nodes, node => _.startsWith(node.pos, _.toString(pos))), v => v.id)
          }
        ]
      }
    } catch {
      return []
    }

  }

  redrawMathReplace(term: Term, index: number) {
    this.mathPositionsReplace[index] = this.getMathPositionReplace(term, index);
    this.mathPositionsReplace = _.cloneDeep(this.mathPositionsReplace);
    this.clusterTermsReplaceBefore[index] = this.getClusterTermPos(term, index, 'replace');
    this.clusterTermsReplaceAfter[index] = this.getClusterTermPos(this.replacementTerms[index], index, 'replace');

    this.redrawMR[index] = true;
  }

  refreshMathReplace(term: Term, index: number) {
    if (this.redrawMR[index]) {
      this.redrawMR[index] = false;
      return true;
    }
    if (_.isUndefined(this.replacementTerms[index])) {
      this.mathPositionsReplace[index] = this.getMathPositionReplace(term, index);
      this.mathPositionsReplace = _.cloneDeep(this.mathPositionsReplace);
    }
    return false;
  }

  addToSubstitutions() {
    const substitution = new Substitution();
    this.substitutions.push(substitution);
    this.substEntryFromControls.push(new FormControl('', [Validators.required]));
    this.substEntryToControls.push(new FormControl('', [Validators.required]))
    this.showSubstMath.push(true);
    this.redrawMA.push(true);

    const index = _.size(this.mathApplySubt);
    this.mathApplySubt[index] = this.getMathSubstitutionApply(substitution, index);
  }

  removeFromSubstitutions(index: number) {
    this.substitutions.splice(index, 1);
    this.mathApplySubt.splice(index, 1);
    this.substEntryFromControls.splice(index, 1);
    this.substEntryToControls.splice(index, 1);
    this.showSubstMath.splice(index, 1);
    this.redrawMA.splice(index, 1);
  }

  getMathSubstitution(substitution: Substitution, index: number): MathContent {
    return {
      latex: `$\\cdot$ $subst_{${index}} = ${substitution.asLatexString()}$`
    };
  }

  addToSubstEntries(index: number) {
    try {
      const termFrom = new Term(this.signature, this.allowedVariables, this.substEntryFromControls[index].value);
      const termTo = new Term(this.signature, this.allowedVariables, this.substEntryToControls[index].value);
      if (!termFrom.isVariable()) return;
      this.substitutions[index].addEntry({ from: termFrom, to: termTo });
      this.substEntryFromControls[index].reset();
      this.substEntryToControls[index].reset();

      this.showSubstMath[index] = false;
      setTimeout(() => this.showSubstMath[index] = true, 100);
    }
    catch { return; }
  }

  isValidSubstitutionEntry(index: number) {
    if (this.substEntryFromControls[index].invalid || this.substEntryToControls[index].invalid) return false;
    const termFrom = new Term(this.signature, this.allowedVariables, this.substEntryFromControls[index].value);
    if (!termFrom.isVariable()) return false;
    return true;
  }

  redrawMathApplySubt(substitution: Substitution, index: number) {
    setTimeout(() => { 
      this.mathApplySubt[index] = this.getMathSubstitutionApply(substitution, index);
      this.redrawMA[index] = false;
      console.log(this.mathApplySubt);
      
      setTimeout(() => this.redrawMA[index] = true, 50);
    }, 50);
  }

  ngOnInit(): void {
  }

}
