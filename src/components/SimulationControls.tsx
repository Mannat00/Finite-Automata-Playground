import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, CheckCircle, XCircle, FastForward, Gauge } from 'lucide-react';
import { SimulationStep } from '../types';

interface SimulationControlsProps {
  input: string;
  setInput: (val: string) => void;
  onStart: () => void;
  onCheck: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  currentStep: SimulationStep | null;
  totalSteps: number;
  isAccepted: boolean | null;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  steps: SimulationStep[];
  currentStepIndex: number;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  input,
  setInput,
  onStart,
  onCheck,
  onReset,
  onStepForward,
  onStepBackward,
  currentStep,
  totalSteps,
  isAccepted,
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
  steps,
  currentStepIndex,
}) => {
  const stepIndex = currentStep?.symbolIndex ?? -1;

  return (
    <div className="h-72 bg-[#161820] border-t border-[#30363D] flex flex-col font-sans">
      <div className="p-4 border-b border-[#30363D] flex items-end justify-between bg-[#0F1117]">
        <div className="flex items-end gap-4 flex-1">
          <div className="space-y-1 flex-1 max-w-md">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF] flex items-center gap-1">
              <Play className="w-3 h-3" /> Input String
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter input string..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-[#1F2230] border border-[#30363D] rounded-md px-3 py-2 text-[15px] font-mono text-[#4F8EF7] focus:outline-none focus:border-[#4F8EF7] placeholder-[#6E7681]"
              />
              {isAccepted !== null && (
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold uppercase ${isAccepted ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                  {isAccepted ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Accepted
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Rejected
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCheck}
              className="px-4 py-2 bg-[#4ADE80] hover:bg-[#3fb950] text-[#0F1117] rounded-md text-[13px] font-medium transition-colors flex items-center gap-2 h-[38px]"
            >
              <CheckCircle className="w-4 h-4" />
              Check
            </button>
            <button
              onClick={onStart}
              className="px-4 py-2 bg-[#4F8EF7] hover:bg-[#3b7de5] text-white rounded-md text-[13px] font-medium transition-colors flex items-center gap-2 h-[38px]"
            >
              <Play className="w-4 h-4 fill-current" />
              Play Simulation
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="p-2 text-[#9CA3AF] hover:text-[#F87171] transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={onStepBackward}
              disabled={currentStepIndex <= 0}
              className="p-2 text-[#9CA3AF] hover:text-[#E2E8F0] disabled:opacity-30 transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (steps.length === 0) {
                  onStart();
                } else {
                  setIsPlaying(!isPlaying);
                }
              }}
              className="p-2 text-[#4F8EF7] hover:text-[#3b7de5] transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>
            <button
              onClick={onStepForward}
              disabled={currentStepIndex >= steps.length - 1}
              className="p-2 text-[#9CA3AF] hover:text-[#E2E8F0] disabled:opacity-30 transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-3 bg-[#1F2230] px-4 py-2 rounded-md border border-[#30363D]">
            <FastForward className="w-4 h-4 text-[#9CA3AF]" />
            <input
              type="range"
              min="200"
              max="2000"
              step="100"
              value={2200 - speed}
              onChange={(e) => setSpeed(2200 - parseInt(e.target.value))}
              className="w-24 h-1.5 bg-[#30363D] rounded-lg appearance-none cursor-pointer accent-[#4F8EF7]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Step Log */}
        <div className="w-1/2 border-r border-[#30363D] flex flex-col">
          <div className="px-4 py-2 bg-[#161820] border-b border-[#30363D] flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">Step Log</span>
            <span className="text-[11px] text-[#6E7681] font-mono">
              {steps.length > 0 ? `${currentStepIndex + 1} / ${steps.length}` : '0 / 0'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-[13px] space-y-1 bg-[#1A1D27]">
            {steps.map((step, idx) => {
              const isError = step.log.includes('Stuck') || step.log.includes('REJECTED');
              const isSuccess = step.log.includes('ACCEPTED');
              return (
                <div
                  key={idx}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    idx === currentStepIndex 
                      ? 'bg-[#1F2230] text-[#E2E8F0] border-l-2 border-[#4F8EF7]' 
                      : isError ? 'text-[#F87171]' : isSuccess ? 'text-[#4ADE80]' : 'text-[#9CA3AF] hover:text-[#E2E8F0]'
                  }`}
                >
                  <span className="text-[#6E7681] mr-2">[{idx}]</span>
                  {step.log}
                </div>
              );
            })}
            {steps.length === 0 && (
              <div className="h-full flex items-center justify-center text-[#6E7681] italic">
                Start simulation to see steps...
              </div>
            )}
          </div>
        </div>

        {/* Current Status */}
        <div className="w-1/2 bg-[#0F1117] p-6 flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">Current Input Processing</div>
            <div className="text-[22px] font-mono font-semibold tracking-wider flex items-center justify-center">
              {input.split('').map((char, i) => (
                <span
                  key={i}
                  className={`transition-all duration-300 ${
                    i < stepIndex ? 'text-[#4ADE80]' : 
                    i === stepIndex ? 'text-[#4F8EF7] border-b-2 border-[#4F8EF7] scale-110' : 
                    'text-[#9CA3AF]'
                  }`}
                >
                  {char}
                </span>
              ))}
              {input.length === 0 && <span className="text-[#6E7681] italic">Empty String</span>}
            </div>
          </div>

          {isAccepted !== null && currentStepIndex === steps.length - 1 && (
            <div className={`px-6 py-3 flex items-center gap-3 animate-in fade-in zoom-in duration-500 ${
              isAccepted 
              ? 'bg-[#1A1D27] border-l-4 border-[#4ADE80] text-[#4ADE80] rounded-r-lg' 
              : 'bg-[#1A1D27] border-l-4 border-[#F87171] text-[#F87171] rounded-r-lg'
            }`}>
              {isAccepted ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-lg font-bold uppercase tracking-widest">String Accepted</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6" />
                  <span className="text-lg font-bold uppercase tracking-widest">String Rejected</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
