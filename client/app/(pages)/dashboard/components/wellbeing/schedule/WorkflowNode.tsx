/**
 * @file WorkflowNode Component
 * @description n8n-style custom node component for React Flow
 */

"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Edit2, Trash2, Calendar as CalendarIcon } from "lucide-react";
import type { ScheduleItem } from "@/src/shared/services/schedule.service";

// Helper function to convert hex to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper function to format time for display
const formatTimeForDisplay = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time;
  
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Helper function to calculate duration
const calculateDuration = (startTime: string, endTime?: string, durationMinutes?: number): number | null => {
  if (endTime) {
    const timeToMinutes = (time: string): number => {
      if (!time) return 0;
      const [hours, minutes] = time.split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
    };
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const duration = end - start;
    return duration > 0 ? duration : null;
  }
  return durationMinutes || null;
};

export interface WorkflowNodeData {
  item: ScheduleItem;
  onEdit: (item: ScheduleItem) => void;
  onDelete: () => void;
  connectionCount: number;
}

function WorkflowNode(props: NodeProps): React.JSX.Element {
  const { data, selected } = props;
  const nodeData = data as unknown as WorkflowNodeData;
  const { item, onEdit, onDelete, connectionCount } = nodeData;

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(item);
  }, [item, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  const duration = calculateDuration(item.startTime, item.endTime, item.durationMinutes);
  const displayDuration = duration && duration > 0
    ? (() => {
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return hours > 0 
          ? minutes > 0 
            ? `${hours}h ${minutes}m`
            : `${hours}h`
          : `${minutes}m`;
      })()
    : null;

  // Enhanced color system with gradients
  const nodeColor = item.color || "#10b981";
  const borderColor = selected ? hexToRgba(nodeColor, 0.9) : hexToRgba(nodeColor, 0.6);
  const iconBgColor = hexToRgba(nodeColor, 0.3);
  const iconBorderColor = hexToRgba(nodeColor, 0.5);
  const glowColor = hexToRgba(nodeColor, 0.3);

  // Create gradient background

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -10 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className="workflow-node-wrapper"
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="workflow-handle workflow-handle-input"
        style={{
          background: `radial-gradient(circle, ${hexToRgba(nodeColor, 0.8)} 0%, ${hexToRgba(nodeColor, 0.6)} 100%)`,
          border: `2px solid ${hexToRgba(nodeColor, 0.9)}`,
          width: '14px',
          height: '14px',
          boxShadow: `0 0 8px ${glowColor}, 0 0 4px ${hexToRgba(nodeColor, 0.5)}`,
        }}
      />

      {/* Node Content */}
      <motion.div
        className={`workflow-node ${selected ? 'workflow-node-selected' : ''}`}
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(nodeColor, 0.2)} 0%, ${hexToRgba(nodeColor, 0.08)} 50%, ${hexToRgba(nodeColor, 0.15)} 100%)`,
          borderColor: borderColor,
          borderWidth: selected ? '2px' : '1.5px',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          boxShadow: selected
            ? `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 0 40px ${glowColor}, 0 0 20px ${hexToRgba(nodeColor, 0.4)}`
            : `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08) inset, 0 0 20px ${hexToRgba(nodeColor, 0.15)}`,
        }}
        whileHover={{ 
          scale: 1.03,
          boxShadow: `0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12) inset, 0 0 50px ${glowColor}, 0 0 30px ${hexToRgba(nodeColor, 0.3)}`,
        }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Node Header */}
        <div className="flex items-center gap-3 mb-3 relative z-30">
          <motion.div 
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${iconBgColor} 0%, ${hexToRgba(nodeColor, 0.4)} 100%)`,
              borderColor: iconBorderColor,
              boxShadow: `0 4px 12px ${hexToRgba(nodeColor, 0.3)}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${hexToRgba(nodeColor, 0.6)}, transparent 70%)`,
              }}
            />
            {item.icon ? (
              <span className="text-lg leading-none relative z-10">{item.icon}</span>
            ) : (
              <CalendarIcon 
                className="w-5 h-5 relative z-10" 
                style={{ color: hexToRgba(nodeColor, 1) }}
              />
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white leading-tight truncate mb-0.5" style={{ fontSize: '15px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
              {item.title}
            </h3>
            {item.category && (
              <p className="text-slate-300 truncate leading-tight font-medium" style={{ fontSize: '11px', textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)' }}>
                {item.category}
              </p>
            )}
          </div>
          {/* Action Buttons */}
          <div className="flex gap-1.5 flex-shrink-0 z-40">
            <motion.button
              onClick={handleEdit}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all border border-white/20 hover:border-white/30 backdrop-blur-sm"
              title="Edit activity"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              onClick={handleDelete}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all border border-red-500/30 hover:border-red-500/50 backdrop-blur-sm"
              title="Delete activity"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-slate-300 mb-3 line-clamp-2 leading-relaxed font-medium" style={{ fontSize: '12px', textShadow: '0 1px 1px rgba(0, 0, 0, 0.2)' }}>
            {item.description}
          </p>
        )}

        {/* Time and Duration */}
        <div className="flex items-center justify-between pt-3 border-t relative z-30" style={{ borderColor: hexToRgba(nodeColor, 0.3) }}>
          <span className="flex items-center gap-2" style={{ fontSize: '12px' }}>
            <div 
              className="p-1 rounded-md"
              style={{
                background: hexToRgba(nodeColor, 0.2),
                border: `1px solid ${hexToRgba(nodeColor, 0.3)}`,
              }}
            >
              <CalendarIcon className="w-3 h-3 shrink-0" style={{ color: hexToRgba(nodeColor, 0.9) }} />
            </div>
            <span className="font-semibold text-slate-200">{formatTimeForDisplay(item.startTime)}</span>
            {item.endTime && (
              <>
                <span className="text-slate-500 mx-1">→</span>
                <span className="font-semibold text-slate-200">{formatTimeForDisplay(item.endTime)}</span>
              </>
            )}
          </span>
          {displayDuration && (
            <span 
              className="px-2.5 py-1 rounded-lg font-bold backdrop-blur-sm border"
              style={{ 
                fontSize: '11px',
                background: hexToRgba(nodeColor, 0.25),
                borderColor: hexToRgba(nodeColor, 0.4),
                color: hexToRgba(nodeColor, 1),
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                boxShadow: `0 2px 8px ${hexToRgba(nodeColor, 0.2)}`,
              }}
            >
              {displayDuration}
            </span>
          )}
        </div>

        {/* Connection Count Badge */}
        {connectionCount > 0 && (
          <motion.div 
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${hexToRgba(nodeColor, 0.9)} 0%, ${hexToRgba(nodeColor, 0.7)} 100%)`,
              borderColor: hexToRgba(nodeColor, 1),
              boxShadow: `0 4px 12px ${glowColor}, 0 0 0 2px rgba(0, 0, 0, 0.2)`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <span className="text-[9px] font-extrabold text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
              {connectionCount}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="workflow-handle workflow-handle-output"
        style={{
          background: `radial-gradient(circle, ${hexToRgba(nodeColor, 0.8)} 0%, ${hexToRgba(nodeColor, 0.6)} 100%)`,
          border: `2px solid ${hexToRgba(nodeColor, 0.9)}`,
          width: '14px',
          height: '14px',
          boxShadow: `0 0 8px ${glowColor}, 0 0 4px ${hexToRgba(nodeColor, 0.5)}`,
        }}
      />
    </motion.div>
  );
}

export default WorkflowNode;

