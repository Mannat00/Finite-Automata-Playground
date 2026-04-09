import React, { useState, useEffect } from 'react';
import { State, Transition, AutomatonMode, SimulationStep } from '../types';
import { Plus, Trash2, Play, Settings2, Circle, ArrowRight, CheckCircle2, Flag, ToggleLeft, ToggleRight, Type, Gauge } from 'lucide-react';

interface SidebarProps {
  states: State[];
  transitions: Transition[];
  selectedId: string | null;
  onAddState: () => void;
  onDeleteState: (id: string) => void;
  onAddTransition: (from: string, to: string, symbols: string) => void;
  onDeleteTransition: (id: string) => void;
  onToggleStart: (id: string) => void;
  onToggleAccepting: (id: string) => void;
  onUpdateStateName: (id: string, name: string) => void;
  mode: AutomatonMode;
  setMode: (mode: AutomatonMode) => void;
  alphabet: string[];
  setAlphabet: (alphabet: string[]) => void;
  steps: SimulationStep[];
  currentStepIndex: number;
  currentStep: SimulationStep | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  states,
  transitions,
  selectedId,
  onAddState,
  onDeleteState,
  onAddTransition,
  onDeleteTransition,
  onToggleStart,
  onToggleAccepting,
  onUpdateStateName,
  mode,
  setMode,
  alphabet,
  setAlphabet,
  steps,
  currentStepIndex,
  currentStep,
  isOpen,
  setIsOpen,
}) => {
  const [newTransFrom, setNewTransFrom] = useState('');
  const [newTransTo, setNewTransTo] = useState('');
  const [newTransSymbols, setNewTransSymbols] = useState('');
  const [alphabetInput, setAlphabetInput] = useState(alphabet.join(', '));

  useEffect(() => {
    const currentAlphabet = alphabetInput.split(',').map(s => s.trim()).filter(s => s !== '');
    if (JSON.stringify(currentAlphabet) !== JSON.stringify(alphabet)) {
      setAlphabetInput(alphabet.join(', '));
    }
  }, [alphabet, alphabetInput]);

  const selectedState = states.find(s => s.id === selectedId);
  const selectedTransition = transitions.find(t => t.id === selectedId);

  const handleAlphabetChange = (val: string) => {
    setAlphabetInput(val);
    const newAlphabet = val.split(',').map(s => s.trim()).filter(s => s !== '');
    setAlphabet(newAlphabet);
  };

  return (
    <div 
      className={`h-full bg-[#161820] border-r border-[#30363D] flex flex-col overflow-hidden font-sans transition-all duration-300 relative ${
        isOpen ? 'w-[320px]' : 'w-0 border-r-0'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute top-1/2 -right-4 z-50 bg-[#1F2230] border border-[#30363D] p-1 rounded-full text-[#4F8EF7] hover:bg-[#161820] transition-all shadow-lg ${
          !isOpen ? 'right-[-40px]' : ''
        }`}
      >
        {isOpen ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
      </button>

      <div className={`${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 flex flex-col h-full`}>
        <div className="p-5 border-b border-[#30363D]">
        <h1 className="text-[18px] font-semibold text-[#E2E8F0] flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-[#4F8EF7]" />
          Automata Lab
          <span className="text-[10px] bg-[#1F2230] text-[#4F8EF7] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter border border-[#30363D]">v2.0</span>
        </h1>
        <p className="text-[11px] text-[#9CA3AF] mt-1 italic">Design & Simulate DFA/NFA</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        {/* Mode & Alphabet Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">
              Configuration
            </h2>
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-[#1F2230] rounded-md border border-[#30363D]">
            <button
              onClick={() => setMode(AutomatonMode.DFA)}
              className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                mode === AutomatonMode.DFA 
                ? 'bg-[#161820] text-[#4F8EF7] border border-[#4F8EF7]' 
                : 'text-[#9CA3AF] border border-transparent hover:text-[#E2E8F0]'
              }`}
            >
              DFA
            </button>
            <button
              onClick={() => setMode(AutomatonMode.NFA)}
              className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                mode === AutomatonMode.NFA 
                ? 'bg-[#161820] text-[#4F8EF7] border border-[#4F8EF7]' 
                : 'text-[#9CA3AF] border border-transparent hover:text-[#E2E8F0]'
              }`}
            >
              NFA
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.08em] flex items-center gap-1">
              <Type className="w-3 h-3" /> Alphabet
            </label>
            <input
              type="text"
              value={alphabetInput}
              onChange={(e) => handleAlphabetChange(e.target.value)}
              placeholder="e.g. 0, 1, a, b"
              className="w-full text-[13px] p-2 rounded-md border border-[#30363D] bg-[#1F2230] text-[#79C0FF] focus:border-[#4F8EF7] focus:outline-none font-mono"
            />
          </div>
        </section>

        {/* States Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF] flex items-center gap-2">
              <Circle className="w-3 h-3" />
              States
            </h2>
            <button
              onClick={onAddState}
              className="p-1 hover:bg-[#1F2230] rounded-md transition-colors text-[#4F8EF7]"
              title="Add State"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {states.map(state => (
              <div
                key={state.id}
                className={`p-2.5 rounded-md border transition-all ${
                  selectedId === state.id ? 'border-[#4F8EF7] bg-[#1F2230]' : 'border-[#30363D] bg-[#161820]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={state.name}
                    onChange={(e) => onUpdateStateName(state.id, e.target.value)}
                    className="bg-transparent font-medium text-[13px] text-[#E2E8F0] focus:outline-none w-20"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleStart(state.id)}
                      className={`p-1 rounded ${state.isStart ? 'text-[#4F8EF7] bg-[#1F2230]' : 'text-[#6E7681] hover:bg-[#1F2230]'}`}
                      title="Set as Start"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onToggleAccepting(state.id)}
                      className={`p-1 rounded ${state.isAccepting ? 'text-[#34D399] bg-[#1F2230]' : 'text-[#6E7681] hover:bg-[#1F2230]'}`}
                      title="Set as Accepting"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteState(state.id)}
                      className="p-1 text-[#6E7681] hover:text-[#F87171] hover:bg-[#1F2230] rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {states.length === 0 && (
              <p className="text-[11px] text-[#6E7681] text-center py-4">No states added yet.</p>
            )}
          </div>
        </section>

        {/* Transitions Section */}
        <section>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF] flex items-center gap-2 mb-4">
            <ArrowRight className="w-3 h-3" />
            Transitions
          </h2>
          
          <div className="space-y-4">
            <div className="p-3.5 bg-[#1F2230] rounded-md border border-[#30363D] space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newTransFrom}
                  onChange={(e) => setNewTransFrom(e.target.value)}
                  className="text-[11px] p-2 rounded-md border border-[#30363D] bg-[#161820] text-[#E2E8F0] focus:outline-none focus:border-[#4F8EF7]"
                >
                  <option value="">From...</option>
                  {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select
                  value={newTransTo}
                  onChange={(e) => setNewTransTo(e.target.value)}
                  className="text-[11px] p-2 rounded-md border border-[#30363D] bg-[#161820] text-[#E2E8F0] focus:outline-none focus:border-[#4F8EF7]"
                >
                  <option value="">To...</option>
                  {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <input
                type="text"
                placeholder={`Symbols (e.g. ${alphabet[0] || '0'}, ε)`}
                value={newTransSymbols}
                onChange={(e) => setNewTransSymbols(e.target.value)}
                className="w-full text-[11px] p-2 rounded-md border border-[#30363D] bg-[#161820] text-[#79C0FF] focus:outline-none focus:border-[#4F8EF7] font-mono"
              />
              <button
                onClick={() => {
                  if (newTransFrom && newTransTo && newTransSymbols) {
                    onAddTransition(newTransFrom, newTransTo, newTransSymbols);
                    setNewTransSymbols('');
                  }
                }}
                className="w-full py-2 bg-[#161820] border border-[#30363D] text-[#E2E8F0] text-[13px] font-medium rounded-md hover:bg-[#1F2230] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Transition
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {transitions.map(t => {
                const from = states.find(s => s.id === t.from)?.name;
                const to = states.find(s => s.id === t.to)?.name;
                return (
                  <div
                    key={t.id}
                    className={`p-2 rounded-md border flex items-center justify-between text-[11px] ${
                      selectedId === t.id ? 'border-[#4F8EF7] bg-[#1F2230]' : 'border-[#30363D] bg-[#161820]'
                    }`}
                  >
                    <span className="font-mono text-[#9CA3AF]">
                      {from} → {to} ({t.symbols.join(',')})
                    </span>
                    <button
                      onClick={() => onDeleteTransition(t.id)}
                      className="text-[#6E7681] hover:text-[#F87171]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <div className="p-5 border-t border-[#30363D] bg-[#1F2230] space-y-4">
        <div>
          <div className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.08em] font-medium mb-2">Simulation Mode</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${steps.length > 0 ? 'bg-[#4F8EF7] animate-pulse' : 'bg-[#4ADE80]'}`} />
            <span className="text-[11px] font-medium text-[#9CA3AF]">
              {steps.length > 0 ? 'Simulation in progress' : 'Ready to simulate'}
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
