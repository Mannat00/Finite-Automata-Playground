import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { AutomatonCanvas } from './components/AutomatonCanvas';
import { SimulationControls } from './components/SimulationControls';
import { State, Transition, Automaton, SimulationStep, SimulationResult, AutomatonMode } from './types';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_STATES: State[] = [
  { id: 'q0', name: 'q0', x: 400, y: 200, isStart: true, isAccepting: false },
  { id: 'q1', name: 'q1', x: 700, y: 200, isStart: false, isAccepting: true },
];

const INITIAL_TRANSITIONS: Transition[] = [
  { id: 't1', from: 'q0', to: 'q1', symbols: ['0'] },
  { id: 't2', from: 'q1', to: 'q1', symbols: ['1'] },
  { id: 't3', from: 'q1', to: 'q0', symbols: ['0'] },
];

const isEpsilon = (s: string) => s === 'ε' || s === 'E';

export default function App() {
  const [states, setStates] = useState<State[]>(INITIAL_STATES);
  const [transitions, setTransitions] = useState<Transition[]>(INITIAL_TRANSITIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputString, setInputString] = useState('01101');
  const [mode, setMode] = useState<AutomatonMode>(AutomatonMode.NFA);
  const [alphabet, setAlphabet] = useState<string[]>(['0', '1']);
  const [speed, setSpeed] = useState(800);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Simulation State
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 is initial state
  const [isPlaying, setIsPlaying] = useState(false);

  // Simulation Logic
  const runSimulation = useCallback((autoPlay = true) => {
    console.log("Starting simulation for:", inputString, "in mode:", mode);
    const startState = states.find(s => s.isStart);
    if (!startState) {
      alert("Please define a start state.");
      return;
    }

    const steps: SimulationStep[] = [];
    let currentActiveIds = [startState.id];
    
    // Initial step (before any symbols)
    // Handle epsilon closures for initial state
    const getEpsilonClosure = (stateIds: string[]): string[] => {
      const closure = new Set(stateIds);
      let changed = true;
      while (changed) {
        changed = false;
        transitions.forEach(t => {
          if (t.symbols.some(isEpsilon) && closure.has(t.from) && !closure.has(t.to)) {
            closure.add(t.to);
            changed = true;
          }
        });
      }
      return Array.from(closure);
    };

    if (mode === AutomatonMode.NFA) {
      currentActiveIds = getEpsilonClosure(currentActiveIds);
    }
    
    steps.push({ 
      activeStateIds: [...currentActiveIds], 
      symbolIndex: -1, 
      lastTransitionIds: [],
      log: `Initial state: {${currentActiveIds.map(id => states.find(s => s.id === id)?.name).join(', ')}}`
    });

    let isStuck = false;
    for (let i = 0; i < inputString.length; i++) {
      const symbol = inputString[i];
      const nextActiveIds = new Set<string>();
      const usedTransitionIds: string[] = [];

      currentActiveIds.forEach(stateId => {
        transitions.forEach(t => {
          if (t.from === stateId && t.symbols.some(s => s === symbol)) {
            nextActiveIds.add(t.to);
            usedTransitionIds.push(t.id);
          }
        });
      });

      if (mode === AutomatonMode.DFA) {
        if (nextActiveIds.size === 0) {
          isStuck = true;
          steps.push({
            activeStateIds: [],
            symbolIndex: i,
            lastTransitionIds: [],
            log: `Step ${i + 1}: Read '${symbol}' → No transition found (Stuck)`
          });
          break;
        }
        if (nextActiveIds.size > 1) {
          // This shouldn't happen if DFA is enforced, but for robustness:
          const first = Array.from(nextActiveIds)[0];
          nextActiveIds.clear();
          nextActiveIds.add(first);
        }
      }

      let closedNextIds = Array.from(nextActiveIds);
      if (mode === AutomatonMode.NFA) {
        closedNextIds = getEpsilonClosure(closedNextIds);
      }
      
      const fromNames = currentActiveIds.map(id => states.find(s => s.id === id)?.name).join(', ');
      currentActiveIds = closedNextIds;
      const toNames = currentActiveIds.map(id => states.find(s => s.id === id)?.name).join(', ');

      // Destination Step: Highlight the new states
      steps.push({
        activeStateIds: [...currentActiveIds],
        symbolIndex: i,
        lastTransitionIds: usedTransitionIds, // Highlight the transitions that led here
        log: `Step ${i + 1}: Moved from {${fromNames}} to {${toNames}} via '${symbol}'`
      });
    }

    const lastStep = steps[steps.length - 1];
    const isAccepted = !isStuck && lastStep.activeStateIds.some(id => 
      states.find(s => s.id === id)?.isAccepting
    ) && lastStep.symbolIndex === inputString.length - 1;

    // Final step to clear highlights and show final result
    steps.push({
      activeStateIds: [...currentActiveIds],
      symbolIndex: inputString.length,
      lastTransitionIds: [],
      log: `Final result: ${isAccepted ? 'ACCEPTED ✅' : 'REJECTED ❌'}`
    });

    setSimulationResult({ accepted: isAccepted, steps });
    if (autoPlay) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setCurrentStepIndex(steps.length - 1);
      setIsPlaying(false);
    }
  }, [states, transitions, inputString, mode]);

  const handleCheck = useCallback(() => {
    runSimulation(false);
  }, [runSimulation]);

  // Auto-play effect
  useEffect(() => {
    let interval: any;
    if (isPlaying && simulationResult) {
      interval = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < simulationResult.steps.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simulationResult, speed]);

  // Handle Alphabet Change Cleanup
  useEffect(() => {
    setTransitions(prev => {
      const updated = prev.map(t => ({
        ...t,
        symbols: t.symbols.filter(s => alphabet.includes(s) || isEpsilon(s))
      })).filter(t => t.symbols.length > 0);
      
      // Only update if there's a real change to avoid unnecessary re-renders
      const isDifferent = updated.length !== prev.length || 
        updated.some((t, i) => JSON.stringify(t.symbols) !== JSON.stringify(prev[i].symbols));
      
      return isDifferent ? updated : prev;
    });
  }, [alphabet]);

  // Calculate invalid transitions for DFA mode
  const invalidTransitionIds = useMemo(() => {
    if (mode === AutomatonMode.NFA) return [];

    const invalidIds = new Set<string>();

    // Map: sourceId -> symbol -> List of transitionIds
    const symbolMap = new Map<string, Map<string, string[]>>();

    transitions.forEach(t => {
      // 1. Check for epsilon in DFA
      if (t.symbols.some(isEpsilon)) {
        invalidIds.add(t.id);
      }

      // 2. Check for multiple symbols on one arrow (Strict DFA)
      if (t.symbols.length > 1) {
        invalidIds.add(t.id);
      }

      // 3. Track symbols for multi-destination check
      if (!symbolMap.has(t.from)) {
        symbolMap.set(t.from, new Map());
      }
      const stateMap = symbolMap.get(t.from)!;
      
      t.symbols.forEach(s => {
        if (!stateMap.has(s)) {
          stateMap.set(s, []);
        }
        stateMap.get(s)!.push(t.id);
      });
    });

    // 4. Identify transitions that share a symbol from the same source
    symbolMap.forEach((stateMap) => {
      stateMap.forEach((ids) => {
        if (ids.length > 1) {
          ids.forEach(id => invalidIds.add(id));
        }
      });
    });

    return Array.from(invalidIds);
  }, [transitions, mode]);

  // Handlers
  const handleAddState = () => {
    const id = `q${states.length}`;
    // Spawn in a safer, more visible area of the playground (upper middle)
    setStates([...states, {
      id,
      name: id,
      x: 200 + Math.random() * 400,
      y: 100 + Math.random() * 200,
      isStart: states.length === 0,
      isAccepting: false
    }]);
  };

  const handleDeleteState = (id: string) => {
    setStates(states.filter(s => s.id !== id));
    setTransitions(transitions.filter(t => t.from !== id && t.to !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleAddTransition = (from: string, to: string, symbols: string) => {
    const symbolList = symbols.split(',').map(s => s.trim()).filter(s => s !== '');
    
    // Alphabet Validation
    const invalidSymbols = symbolList.filter(s => !alphabet.includes(s) && !isEpsilon(s));
    if (invalidSymbols.length > 0) {
      alert(`Error: Symbols ${invalidSymbols.join(', ')} are not in the current alphabet.`);
      return;
    }

    // DFA Validation
    if (mode === AutomatonMode.DFA) {
      // Check for duplicate symbols from this state
      const existingSymbolsFromState = transitions
        .filter(t => t.from === from)
        .flatMap(t => t.symbols);
      
      const overlap = symbolList.filter(s => existingSymbolsFromState.includes(s));
      if (overlap.length > 0) {
        alert(`DFA Error: State already has transitions for symbols: ${overlap.join(', ')}`);
        return;
      }
    }

    // Add each symbol as a separate transition
    const newTransitions = symbolList.map((symbol, index) => ({
      id: `t${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      symbols: [symbol]
    }));

    setTransitions([...transitions, ...newTransitions]);
  };

  const handleDeleteTransition = (id: string) => {
    setTransitions(transitions.filter(t => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleUpdateState = (id: string, x: number, y: number) => {
    setStates(states.map(s => s.id === id ? { ...s, x, y } : s));
  };

  const handleToggleStart = (id: string) => {
    setStates(states.map(s => ({ ...s, isStart: s.id === id })));
  };

  const handleToggleAccepting = (id: string) => {
    setStates(states.map(s => s.id === id ? { ...s, isAccepting: !s.isAccepting } : s));
  };

  const handleUpdateStateName = (id: string, name: string) => {
    setStates(states.map(s => s.id === id ? { ...s, name } : s));
  };

  const currentStep = simulationResult ? simulationResult.steps[currentStepIndex] : null;

  return (
    <div className="flex h-screen w-screen bg-[#0F1117] font-sans text-[#E2E8F0] overflow-hidden">
      <Sidebar
        states={states}
        transitions={transitions}
        selectedId={selectedId}
        onAddState={handleAddState}
        onDeleteState={handleDeleteState}
        onAddTransition={handleAddTransition}
        onDeleteTransition={handleDeleteTransition}
        onToggleStart={handleToggleStart}
        onToggleAccepting={handleToggleAccepting}
        onUpdateStateName={handleUpdateStateName}
        mode={mode}
        setMode={setMode}
        alphabet={alphabet}
        setAlphabet={setAlphabet}
        steps={simulationResult?.steps || []}
        currentStepIndex={currentStepIndex}
        currentStep={currentStep}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 relative min-h-0">
          <AutomatonCanvas
            states={states}
            transitions={transitions}
            onUpdateState={handleUpdateState}
            onSelectState={(id) => setSelectedId(id)}
            onSelectTransition={(id) => setSelectedId(id)}
            selectedId={selectedId}
            activeStateIds={currentStep?.activeStateIds || []}
            activeTransitionIds={currentStep?.lastTransitionIds || []}
            invalidTransitionIds={invalidTransitionIds}
          />
        </div>

        <SimulationControls
          input={inputString}
          setInput={(val) => {
            setInputString(val);
            setSimulationResult(null);
            setCurrentStepIndex(-1);
          }}
          onStart={() => runSimulation(true)}
          onCheck={handleCheck}
          onReset={() => {
            setSimulationResult(null);
            setCurrentStepIndex(-1);
            setIsPlaying(false);
          }}
          onStepForward={() => {
            if (simulationResult && currentStepIndex < simulationResult.steps.length - 1) {
              setCurrentStepIndex(currentStepIndex + 1);
            }
          }}
          onStepBackward={() => {
            if (simulationResult && currentStepIndex > 0) {
              setCurrentStepIndex(currentStepIndex - 1);
            }
          }}
          currentStep={currentStep}
          totalSteps={inputString.length}
          isAccepted={simulationResult && currentStepIndex === simulationResult.steps.length - 1 ? simulationResult.accepted : null}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          speed={speed}
          setSpeed={setSpeed}
          steps={simulationResult?.steps || []}
          currentStepIndex={currentStepIndex}
        />
      </main>
    </div>
  );
}
