/**
 * @file WorkflowEdge Component
 * @description Custom animated edge component for React Flow with n8n-style design
 */

"use client";

import { memo, useState, useMemo } from "react";
import { type EdgeProps, getBezierPath, EdgeLabelRenderer, useReactFlow } from "@xyflow/react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export interface WorkflowEdgeData {
  linkId?: string;
  onDelete?: (linkId: string) => void;
  linkType?: 'sequential' | 'conditional' | 'parallel';
}

function WorkflowEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    selected,
    data,
    markerEnd,
    source,
    target,
  } = props;
  
  const edgeData = data as WorkflowEdgeData | undefined;
  const [isHovered, setIsHovered] = useState(false);
  const { linkId, onDelete, linkType = 'sequential' } = edgeData || {};
  const { getNodes } = useReactFlow();

  const [edgePath, _labelX, _labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Check which node is selected (source or target) and calculate button position
  const selectedNodeInfo = useMemo(() => {
    const nodes = getNodes();
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);
    
    const isSourceSelected = sourceNode?.selected || false;
    const isTargetSelected = targetNode?.selected || false;
    
    // Calculate direction vector for offset
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitX = length > 0 ? dx / length : 0;
    const unitY = length > 0 ? dy / length : 0;
    
    // Perpendicular offset (to show button to the side of the edge)
    const perpX = -unitY;
    const perpY = unitX;
    const offsetDistance = 30; // Distance from edge
    
    // If edge is selected, show button near the target (last node in sequence)
    if (selected) {
      // Position at 80% along the path, offset perpendicularly
      const t = 0.8;
      const x = sourceX + dx * t + perpX * offsetDistance;
      const y = sourceY + dy * t + perpY * offsetDistance;
      return { x, y };
    }
    
    // If source node is selected, show near source (20% along the path)
    if (isSourceSelected) {
      const t = 0.2;
      const x = sourceX + dx * t + perpX * offsetDistance;
      const y = sourceY + dy * t + perpY * offsetDistance;
      return { x, y };
    }
    
    // If target node is selected, show near target (80% along the path)
    if (isTargetSelected) {
      const t = 0.8;
      const x = sourceX + dx * t + perpX * offsetDistance;
      const y = sourceY + dy * t + perpY * offsetDistance;
      return { x, y };
    }
    
    return null;
  }, [source, target, sourceX, sourceY, targetX, targetY, selected, getNodes]);

  // Determine edge color based on link type
  const getEdgeColor = () => {
    switch (linkType) {
      case 'conditional':
        return '#f59e0b'; // amber
      case 'parallel':
        return '#8b5cf6'; // purple
      default:
        return '#10b981'; // emerald (sequential)
    }
  };

  const edgeColor = getEdgeColor();
  const strokeColor = selected || isHovered ? edgeColor : `${edgeColor}70`;
  const strokeWidth = selected || isHovered ? 3 : 2.5;
  const glowColor = selected || isHovered ? `${edgeColor}40` : `${edgeColor}20`;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (linkId && onDelete) {
      onDelete(linkId);
    }
  };

  return (
    <>
      {/* Glow Effect - Only show when selected or hovered */}
      {(selected || isHovered) && (
        <path
          d={edgePath}
          fill="none"
          stroke={glowColor}
          strokeWidth={strokeWidth + 8}
          style={{
            filter: `blur(8px)`,
            opacity: selected ? 0.8 : 0.4,
          }}
        />
      )}

      {/* Main Edge Path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={selected || isHovered ? "0" : "10,5"}
        style={{
          ...style,
          cursor: 'pointer',
          filter: selected || isHovered ? `drop-shadow(0 0 6px ${edgeColor})` : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        markerEnd={markerEnd}
      />

      {/* Hover Overlay for Better Interaction */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Edge Label with Delete Button - Show near selected node */}
      {selectedNodeInfo && linkId && onDelete && (
        <EdgeLabelRenderer>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1,
              scale: 1
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${selectedNodeInfo.x}px,${selectedNodeInfo.y}px)`,
              pointerEvents: 'all',
            }}
            className="workflow-edge-label"
          >
            <motion.button
              onClick={handleDelete}
              className="p-2.5 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-2 border-white/30 shadow-xl hover:shadow-2xl transition-all z-50 backdrop-blur-sm"
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 16px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset`,
              }}
              title="Delete connection"
              onMouseDown={(e) => e.stopPropagation()}
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </EdgeLabelRenderer>
      )}

      {/* Animated Flow Effect */}
      {selected && (
        <circle
          r="4"
          fill={edgeColor}
          style={{
            pointerEvents: 'none',
            filter: `drop-shadow(0 0 4px ${edgeColor})`,
          }}
        >
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}
    </>
  );
}

export default memo(WorkflowEdge);

