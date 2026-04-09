export enum AutomatonMode {
  DFA = 'DFA',
  NFA = 'NFA'
}

export interface State {
  id: string;
  name: string;
  x: number;
  y: number;
  isStart: boolean;
  isAccepting: boolean;
}

export interface Transition {
  id: string;
  from: string;
  to: string;
  symbols: string[]; // e.g., ['0', '1'] or ['ε']
}

export interface Automaton {
  states: State[];
  transitions: Transition[];
  mode: AutomatonMode;
  alphabet: string[];
}

export type SimulationStep = {
  activeStateIds: string[];
  symbolIndex: number;
  lastTransitionIds: string[];
  log: string;
};

export type SimulationResult = {
  accepted: boolean;
  steps: SimulationStep[];
};
