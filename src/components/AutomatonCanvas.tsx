import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Circle, Arrow, Text, Group, Line, Rect } from 'react-konva';
import { State, Transition } from '../types';
import { Maximize, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface AutomatonCanvasProps {
  states: State[];
  transitions: Transition[];
  onUpdateState: (id: string, x: number, y: number) => void;
  onSelectState: (id: string | null) => void;
  onSelectTransition: (id: string | null) => void;
  selectedId: string | null;
  activeStateIds: string[];
  activeTransitionIds: string[];
  invalidTransitionIds: string[];
}

export const AutomatonCanvas: React.FC<AutomatonCanvasProps> = ({
  states,
  transitions,
  onUpdateState,
  onSelectState,
  onSelectTransition,
  selectedId,
  activeStateIds,
  activeTransitionIds,
  invalidTransitionIds,
}) => {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();

    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Limit scale
    if (newScale < 0.2 || newScale > 3) return;

    setStageScale(newScale);
    setStagePos({
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    });
  };

  const STATE_RADIUS = 26;

  const getTransitionPoints = (from: State, to: State, isSelf: boolean) => {
    if (isSelf) {
      // Loop back to self
      return [
        from.x, from.y - STATE_RADIUS,
        from.x - 40, from.y - 80,
        from.x + 40, from.y - 80,
        from.x, from.y - STATE_RADIUS
      ];
    }

    // Calculate points between circles
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    const startX = from.x + STATE_RADIUS * Math.cos(angle);
    const startY = from.y + STATE_RADIUS * Math.sin(angle);
    const endX = to.x - STATE_RADIUS * Math.cos(angle);
    const endY = to.y - STATE_RADIUS * Math.sin(angle);

    // Check if there's a reverse transition to add curvature
    const hasReverse = transitions.some(t => t.from === to.id && t.to === from.id);
    
    if (hasReverse) {
      // Curve the line
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const offset = 30;
      const curveX = midX + offset * Math.cos(angle + Math.PI / 2);
      const curveY = midY + offset * Math.sin(angle + Math.PI / 2);
      return [startX, startY, curveX, curveY, endX, endY];
    }

    return [startX, startY, endX, endY];
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0F1117] overflow-hidden relative">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            onSelectState(null);
            onSelectTransition(null);
          }
        }}
      >
        <Layer>
          {/* Infinite Dot Grid Background */}
          {(() => {
            const gridSize = 40;
            const startX = Math.floor(-stagePos.x / stageScale / gridSize) * gridSize;
            const startY = Math.floor(-stagePos.y / stageScale / gridSize) * gridSize;
            const endX = startX + dimensions.width / stageScale + gridSize;
            const endY = startY + dimensions.height / stageScale + gridSize;
            
            const dots = [];
            for (let x = startX; x <= endX; x += gridSize) {
              for (let y = startY; y <= endY; y += gridSize) {
                dots.push(
                  <Rect
                    key={`dot-${x}-${y}`}
                    x={x}
                    y={y}
                    width={1.5 / stageScale}
                    height={1.5 / stageScale}
                    fill="#30363D"
                    listening={false}
                  />
                );
              }
            }
            return dots;
          })()}

          {/* Transitions */}
          {(() => {
            const groupedTransitions = new Map<string, Transition[]>();
            transitions.forEach(t => {
              const key = `${t.from}-${t.to}`;
              if (!groupedTransitions.has(key)) {
                groupedTransitions.set(key, []);
              }
              groupedTransitions.get(key)!.push(t);
            });

            return Array.from(groupedTransitions.values()).map((group) => {
              const first = group[0];
              const from = states.find((s) => s.id === first.from);
              const to = states.find((s) => s.id === first.to);
              if (!from || !to) return null;

              const isSelf = first.from === first.to;
              const points = getTransitionPoints(from, to, isSelf);
              
              const allSymbols = group.flatMap(t => t.symbols);
              const isActive = group.some(t => activeTransitionIds.includes(t.id));
              const isInvalid = group.some(t => invalidTransitionIds.includes(t.id));
              const selectedInGroup = group.find(t => t.id === selectedId);
              const isSelected = !!selectedInGroup;
              const hasEpsilon = allSymbols.some(s => s === 'ε' || s === 'E');

              let stroke = '#C8CDD8';
              if (isInvalid) stroke = '#F87171';
              else if (isActive) stroke = '#4F8EF7';
              else if (hasEpsilon) stroke = '#E3B341';

              // Label position
              let labelX, labelY;
              if (isSelf) {
                labelX = from.x;
                labelY = from.y - 90;
              } else if (points.length === 6) {
                labelX = points[2];
                labelY = points[3] - 15;
              } else {
                labelX = (points[0] + points[2]) / 2;
                labelY = (points[1] + points[3]) / 2 - 15;
              }

              return (
                <Group 
                  key={`${first.from}-${first.to}`} 
                  onClick={() => onSelectTransition(selectedInGroup ? selectedInGroup.id : first.id)}
                >
                  <Arrow
                    points={points}
                    stroke={stroke}
                    strokeWidth={isActive ? 3 : isSelected ? 2.5 : 2}
                    fill={stroke}
                    tension={isSelf || points.length === 6 ? 0.5 : 0}
                    pointerLength={8}
                    pointerWidth={8}
                    dash={isActive ? [10, 5] : undefined}
                    shadowBlur={isSelected ? 10 : 0}
                    shadowColor={stroke}
                  />
                  <Text
                    x={labelX - 100}
                    y={labelY}
                    text={allSymbols.join(' / ')}
                    fontSize={13}
                    fontFamily="JetBrains Mono, monospace"
                    fill={isInvalid ? '#F87171' : isActive ? '#4F8EF7' : hasEpsilon ? '#E3B341' : '#9CA3AF'}
                    align="center"
                    width={200}
                  />
                </Group>
              );
            });
          })()}

          {/* States */}
          {states.map((state) => {
            const isActive = activeStateIds.includes(state.id);
            const isSelected = selectedId === state.id;

            let stroke = '#C8CDD8';
            let fill = 'rgba(200, 205, 216, 0.15)';
            let textColor = '#FFFFFF';
            let strokeWidth = 2;

            if (state.isStart && !state.isAccepting) {
              stroke = '#4F8EF7';
              fill = '#4F8EF7';
            } else if (state.isAccepting) {
              stroke = '#4ADE80';
              fill = 'rgba(74, 222, 128, 0.15)';
              if (state.isStart) {
                // If it's both start and final, use blue stroke but keep transparent fill for double ring
                stroke = '#4F8EF7';
                fill = 'rgba(79, 142, 247, 0.15)';
              }
            }

            if (isActive) {
              stroke = '#4F8EF7';
              strokeWidth = 3;
            }

            return (
              <Group
                key={state.id}
                draggable
                x={state.x}
                y={state.y}
                onDragEnd={(e) => {
                  onUpdateState(state.id, e.target.x(), e.target.y());
                }}
                onClick={() => onSelectState(state.id)}
              >
                {/* Start Arrow */}
                {state.isStart && (
                  <Arrow
                    points={[-55, 0, -STATE_RADIUS - 5, 0]}
                    stroke="#4F8EF7"
                    fill="#4F8EF7"
                    strokeWidth={2}
                    pointerLength={6}
                    pointerWidth={6}
                  />
                )}

                {/* Main Circle */}
                <Circle
                  radius={STATE_RADIUS}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  shadowBlur={isActive ? 15 : isSelected ? 10 : 0}
                  shadowColor={stroke}
                  shadowOpacity={0.5}
                />

                {/* Inner Circle (for accepting states) */}
                {state.isAccepting && (
                  <Circle
                    radius={STATE_RADIUS - 5}
                    stroke={state.isStart ? "#4F8EF7" : "#4ADE80"}
                    strokeWidth={1.5}
                  />
                )}

                {/* State Name */}
                <Text
                  text={state.name}
                  fontSize={13}
                  fontFamily="Inter, sans-serif"
                  fontStyle="500"
                  fill={textColor}
                  align="center"
                  verticalAlign="middle"
                  width={STATE_RADIUS * 2}
                  height={STATE_RADIUS * 2}
                  offsetX={STATE_RADIUS}
                  offsetY={STATE_RADIUS}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
      
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="bg-[#161820]/80 backdrop-blur-sm p-2 rounded-lg border border-[#30363D] text-[11px] text-[#9CA3AF] font-mono shadow-xl">
          Drag to move states • Right-click/Drag stage to pan • Scroll to zoom
          {invalidTransitionIds.length > 0 && (
            <div className="text-[#F87171] mt-1 font-bold">
              ⚠️ DFA Violation: Red transitions have multiple destinations or ε
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 bg-[#161820]/80 backdrop-blur-sm p-1.5 rounded-lg border border-[#30363D] shadow-xl self-start">
          <button 
            onClick={() => {
              setStageScale(1);
              setStagePos({ x: 0, y: 0 });
            }}
            className="p-1.5 hover:bg-[#1F2230] rounded-md transition-colors text-[#9CA3AF] hover:text-[#E2E8F0]"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[#30363D] mx-1" />
          <button 
            onClick={() => setStageScale(prev => Math.min(prev * 1.2, 3))}
            className="p-1.5 hover:bg-[#1F2230] rounded-md transition-colors text-[#9CA3AF] hover:text-[#E2E8F0]"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-[#4F8EF7] min-w-[40px] text-center">
            {Math.round(stageScale * 100)}%
          </span>
          <button 
            onClick={() => setStageScale(prev => Math.max(prev / 1.2, 0.2))}
            className="p-1.5 hover:bg-[#1F2230] rounded-md transition-colors text-[#9CA3AF] hover:text-[#E2E8F0]"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
