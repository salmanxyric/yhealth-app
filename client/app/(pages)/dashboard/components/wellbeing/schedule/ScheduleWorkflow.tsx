/**
 * @file ScheduleWorkflow Component
 * @description React Flow wrapper for schedule workflow visualization
 */

"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  ConnectionLineType,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import WorkflowNode, { type WorkflowNodeData } from "./WorkflowNode";
import WorkflowEdge, { type WorkflowEdgeData } from "./WorkflowEdge";
import type { DailySchedule, ScheduleItem } from "@/src/shared/services/schedule.service";

// Helper function to convert time string to minutes
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

// Helper function to get end time of an activity
const getEndTime = (item: ScheduleItem): number => {
  const startMinutes = timeToMinutes(item.startTime);
  if (item.endTime) {
    return timeToMinutes(item.endTime);
  }
  if (item.durationMinutes) {
    return startMinutes + item.durationMinutes;
  }
  return startMinutes + 30; // Default 30 minutes
};

interface ScheduleWorkflowProps {
  schedule: DailySchedule;
  onNodeEdit: (item: ScheduleItem) => void;
  onNodeDelete: (item: ScheduleItem) => void;
  onNodeCreate?: (position: { x: number; y: number }) => Promise<void>;
  onNodePositionChange: (itemId: string, position: { x: number; y: number }) => void;
  onEdgeCreate: (sourceId: string, targetId: string) => Promise<void>;
  onEdgeDelete: (linkId: string) => Promise<void>;
  onAutoConnect?: () => Promise<void>;
}

const nodeTypes = {
  workflow: WorkflowNode as unknown,
} as NodeTypes;

const edgeTypes = {
  workflow: WorkflowEdge as unknown,
} as EdgeTypes;

function ScheduleWorkflowContent({
  schedule,
  onNodeEdit,
  onNodeDelete,
  onNodeCreate,
  onNodePositionChange,
  onEdgeCreate,
  onEdgeDelete,
  onAutoConnect,
}: ScheduleWorkflowProps) {
  // Calculate time-based positions for nodes
  // ALWAYS prioritize saved positions from metadata
  const calculateTimeBasedPosition = useCallback((item: ScheduleItem): { x: number; y: number } => {
    // ALWAYS check metadata first - this is the saved position
    const metadata = item.metadata as { x?: number; y?: number } | undefined;
    if (metadata && typeof metadata.x === 'number' && typeof metadata.y === 'number') {
      // Validate positions are reasonable (not NaN, not Infinity)
      if (isFinite(metadata.x) && isFinite(metadata.y) && metadata.x >= 0 && metadata.y >= 0) {
        return {
          x: metadata.x,
          y: metadata.y,
        };
      }
    }

    // Calculate position based on time
    const allTimes = schedule.items.flatMap((i) => {
      const start = timeToMinutes(i.startTime);
      const end = getEndTime(i);
      return [start, end];
    });
    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    const timeRange = maxTime - minTime || 1;

    // Calculate X position based on start time (time flows left to right)
    const startMinutes = timeToMinutes(item.startTime);
    const timeProgress = (startMinutes - minTime) / timeRange;
    const canvasWidth = 1400;
    const x = 150 + timeProgress * canvasWidth;

    // Group overlapping items vertically
    const overlappingGroups: ScheduleItem[][] = [];
    const processed = new Set<string>();

    schedule.items.forEach((currentItem) => {
      if (processed.has(currentItem.id)) return;

      const currentStart = timeToMinutes(currentItem.startTime);
      const currentEnd = getEndTime(currentItem);
      const group = [currentItem];
      processed.add(currentItem.id);

      schedule.items.forEach((otherItem) => {
        if (processed.has(otherItem.id)) return;

        const otherStart = timeToMinutes(otherItem.startTime);
        const otherEnd = getEndTime(otherItem);

        // Check if items overlap in time
        if (
          (otherStart >= currentStart && otherStart < currentEnd) ||
          (otherEnd > currentStart && otherEnd <= currentEnd) ||
          (otherStart <= currentStart && otherEnd >= currentEnd)
        ) {
          group.push(otherItem);
          processed.add(otherItem.id);
        }
      });

      overlappingGroups.push(group);
    });

    // Find which group this item belongs to
    const itemGroup = overlappingGroups.find((group) =>
      group.some((i) => i.id === item.id)
    );
    const groupIndex = overlappingGroups.indexOf(itemGroup || []);
    const itemIndexInGroup = itemGroup?.findIndex((i) => i.id === item.id) || 0;

    // Position items in the same time group vertically
    const ySpacing = 200;
    const y = 150 + groupIndex * ySpacing + itemIndexInGroup * 180;

    return { x, y };
  }, [schedule]);

  // Node defaults for React Flow
  const nodeDefaults = {
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  };

  // Convert ScheduleItem[] to React Flow nodes
   
  const initialNodes = useMemo(() => {
    return schedule.items.map((item) => {
      const position = calculateTimeBasedPosition(item);
      const connectionCount = schedule.links.filter(
        (link) => link.sourceItemId === item.id || link.targetItemId === item.id
      ).length;

      return {
        id: item.id,
        type: 'workflow',
        position,
        ...nodeDefaults,
        data: {
          item,
          onEdit: onNodeEdit,
          onDelete: () => onNodeDelete(item),
          connectionCount,
        },
      } as Node;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule.items, schedule.links, calculateTimeBasedPosition, onNodeEdit, onNodeDelete]);

  // Convert ScheduleLink[] to React Flow edges
  const initialEdges = useMemo(() => {
    return schedule.links.map((link) => ({
      id: link.id,
      source: link.sourceItemId,
      target: link.targetItemId,
      type: 'workflow',
      animated: true,
      style: {
        strokeDasharray: '8,4',
      },
      data: {
        linkId: link.id,
        onDelete: async (linkId: string) => {
          await onEdgeDelete(linkId);
        },
        linkType: link.linkType,
      },
    })) as Edge[];
  }, [schedule.links, onEdgeDelete]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when schedule changes
  useEffect(() => {
    const itemIds = new Set(schedule.items.map((i) => i.id));
    
    setNodes((currentNodes) => {
      // First, remove nodes that no longer exist in schedule (deleted items)
      const nodesToKeep = currentNodes.filter((node) => itemIds.has(node.id));
      
      // Then, update or add nodes for current items
      const updatedNodes = schedule.items.map((item) => {
        const existingNode = nodesToKeep.find((n) => n.id === item.id);
        // ALWAYS prioritize saved position from metadata, then existing node position, then calculate
        const savedPosition = calculateTimeBasedPosition(item);
        const position = savedPosition || existingNode?.position || { x: 100, y: 100 };
        const connectionCount = schedule.links.filter(
          (link) => link.sourceItemId === item.id || link.targetItemId === item.id
        ).length;

        return {
          id: item.id,
          type: 'workflow',
          position,
          ...nodeDefaults,
          data: {
            item,
            onEdit: onNodeEdit,
            onDelete: () => onNodeDelete(item),
            connectionCount,
          },
        } as Node;
      });

      return updatedNodes;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule.items, schedule.links, calculateTimeBasedPosition, onNodeEdit, onNodeDelete, setNodes]);

  // Update edges when schedule changes
  useEffect(() => {
    const itemIds = new Set(schedule.items.map((i) => i.id));
    
    // Filter out edges that reference deleted items
    const validLinks = schedule.links.filter(
      (link) => itemIds.has(link.sourceItemId) && itemIds.has(link.targetItemId)
    );
    
    const newEdges = validLinks.map((link) => ({
      id: link.id,
      source: link.sourceItemId,
      target: link.targetItemId,
      type: 'workflow',
      animated: true,
      style: {
        strokeDasharray: '8,4',
      },
      data: {
        linkId: link.id,
        onDelete: async (linkId: string) => {
          await onEdgeDelete(linkId);
        },
        linkType: link.linkType,
      },
    })) as Edge[];

    setEdges(newEdges);
  }, [schedule.items, schedule.links, onEdgeDelete, setEdges]);

  // Handle node drag end - save position to database
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodePositionChange(node.id, { x: node.position.x, y: node.position.y });
    },
    [onNodePositionChange]
  );

  // Handle new connection creation
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;
      
      // Check if edge already exists
      const edgeExists = edges.some(
        (e) => e.source === params.source && e.target === params.target
      );
      if (edgeExists) return;

      // Create edge in React Flow
      setEdges((eds) => addEdge(params, eds));

      // Create link in database
      await onEdgeCreate(params.source, params.target);
    },
    [edges, setEdges, onEdgeCreate]
  );

  // Handle node deletion (when user deletes nodes via Delete key or delete button) - n8n style
  const onNodesDelete = useCallback(
    async (deletedNodes: Node[]) => {
      for (const node of deletedNodes) {
        const nodeData = node.data as unknown as WorkflowNodeData | undefined;
        if (nodeData?.item && nodeData?.onDelete) {
          // Call the delete handler which will show confirmation and delete from database
          nodeData.onDelete();
        }
      }
    },
    []
  );

  // Handle edge deletion (when user deletes edges via Delete key or edge delete button)
  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        const edgeData = edge.data as WorkflowEdgeData | undefined;
        if (edgeData?.linkId && edgeData?.onDelete) {
          await edgeData.onDelete(edgeData.linkId);
        }
      }
    },
    []
  );

  // Handle pane click to create new node (double-click)
  const onPaneClick = useCallback(
    async (event: React.MouseEvent) => {
      // Only create on double-click to avoid accidental creation
      if (event.detail === 2 && onNodeCreate) {
        const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };
        await onNodeCreate(position);
      }
    },
    [onNodeCreate]
  );

  // Track if auto-connect has already run to prevent continuous re-renders
  const autoConnectRanRef = useRef(false);
  const lastScheduleDateRef = useRef(schedule.scheduleDate);

  // Reset auto-connect flag when schedule date changes (new day loaded)
  useEffect(() => {
    if (schedule.scheduleDate !== lastScheduleDateRef.current) {
      autoConnectRanRef.current = false;
      lastScheduleDateRef.current = schedule.scheduleDate;
    }
  }, [schedule.scheduleDate]);

  // Auto-connect ONLY on initial mount (not on every items change)
  // This prevents continuous re-renders when auto-connect updates the schedule
  useEffect(() => {
    if (onAutoConnect && !autoConnectRanRef.current && schedule.items.length > 0) {
      autoConnectRanRef.current = true;
      onAutoConnect();
    }
  }, [onAutoConnect, schedule.items.length]);

  return (
    <div className="w-full h-[700px] rounded-2xl overflow-hidden border border-slate-700/50 relative" 
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 0 1px rgba(16, 185, 129, 0.1)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: true,
          selectable: true,
          style: { 
            strokeWidth: 3,
            stroke: '#10b981',
            filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))',
          },
        }}
        connectionLineStyle={{ 
          stroke: '#10b981', 
          strokeWidth: 3.5, 
          strokeDasharray: '12,6',
          filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6)) drop-shadow(0 0 2px rgba(16, 185, 129, 0.8))',
        }}
        connectionLineType={ConnectionLineType.Bezier}
        snapToGrid={true}
        snapGrid={[20, 20]}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={32} 
          size={2} 
          color="#64748b"
          style={{ opacity: 0.25 }}
        />
        {/* Additional grid overlay for n8n-like appearance */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        <Controls 
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '14px',
            padding: '10px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            const item = (node.data as { item: ScheduleItem })?.item;
            return item?.color || '#10b981';
          }}
          maskColor="rgba(0, 0, 0, 0.75)"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

export default function ScheduleWorkflow(props: ScheduleWorkflowProps) {
  return (
    <ReactFlowProvider>
      <ScheduleWorkflowContent {...props} />
    </ReactFlowProvider>
  );
}

