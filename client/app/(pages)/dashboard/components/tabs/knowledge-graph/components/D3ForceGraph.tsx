'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationLinkDatum,
} from 'd3-force';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';
import { drag as d3Drag } from 'd3-drag';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import type { KnowledgeGraphData } from '@shared/types/domain/knowledge-graph';
import { buildD3Graph, type D3Node, type D3Link, type D3GraphData } from '../utils/graph-builder';

export type GraphMode = 'data' | 'architecture';

interface D3ForceGraphProps {
  data: KnowledgeGraphData;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string, node: D3Node) => void;
  onNodeHover: (nodeId: string | null, position?: { x: number; y: number }, node?: D3Node) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  mode?: GraphMode;
  reasoningGraphData?: D3GraphData | null;
}

export function D3ForceGraph({
  data,
  selectedNodeId: _selectedNodeId,
  onNodeClick,
  onNodeHover,
  isFullscreen,
  onToggleFullscreen,
  mode = 'data',
  reasoningGraphData,
}: D3ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<D3Node>> | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build and render
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const isArchitecture = mode === 'architecture';
    if (!isArchitecture && !data.nodes.length) return;
    if (isArchitecture && (!reasoningGraphData || !reasoningGraphData.nodes.length)) return;

    const { width, height } = dimensions;
    const isMobile = width < 640;
    const radiusScale = isMobile ? 0.7 : 1;
    const built = isArchitecture ? reasoningGraphData! : buildD3Graph(data);

    // Scale radii for mobile (create new objects to avoid mutating state)
    const nodes = built.nodes.map((n) => ({ ...n, r: Math.round(n.r * radiusScale) }));
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = built.links
      .map((l) => ({ ...l }))
      .filter((l) => {
        const sId = typeof l.source === 'string' ? l.source : (l.source as D3Node)?.id;
        const tId = typeof l.target === 'string' ? l.target : (l.target as D3Node)?.id;
        return sId && tId && nodeIds.has(sId) && nodeIds.has(tId);
      });

    // Clear previous (including dynamic gradients to prevent defs accumulation)
    const root = select(svg);
    root.selectAll('g.graph-root').remove();
    root.select('defs').selectAll('radialGradient').remove();
    if (simulationRef.current) simulationRef.current.stop();

    const g = root.append('g').attr('class', 'graph-root');

    // Zoom
    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 6])
      .on('zoom', (event) => { g.attr('transform', event.transform.toString()); });
    root.call(zoomBehavior);
    root.call(
      zoomBehavior.transform,
      zoomIdentity.translate(width / 2, height / 2).scale(isMobile ? 0.45 : 0.65).translate(-width / 2, -height / 2)
    );

    // Store reset function on the SVG element for external access
    (svg as SVGSVGElement & { __resetZoom?: () => void }).__resetZoom = () => {
      root.transition().duration(600).call(
        zoomBehavior.transform,
        zoomIdentity.translate(width / 2, height / 2).scale(isMobile ? 0.45 : 0.65).translate(-width / 2, -height / 2)
      );
    };

    // Simulation — architecture mode uses wider spacing
    const chargeStrength = isArchitecture ? -40 : (isMobile ? -12 : -18);
    const linkDistMult = isArchitecture ? 2.5 : 1.8;
    const linkDistBase = isArchitecture ? 60 : 30;
    type ResolvedLink = SimulationLinkDatum<D3Node> & D3Link;
    const sim = forceSimulation<D3Node>(nodes)
      .force('link', forceLink<D3Node, ResolvedLink>(links as ResolvedLink[])
        .id((d) => (d as D3Node).id)
        .distance((d) => {
          const link = d as ResolvedLink;
          const s = nodes.find((n) => n.id === ((link.source as D3Node).id || link.source));
          const t = nodes.find((n) => n.id === ((link.target as D3Node).id || link.target));
          return ((s?.r || 10) + (t?.r || 10)) * linkDistMult + linkDistBase;
        })
        .strength((d) => (d as ResolvedLink).value * 0.06)
      )
      .force('charge', forceManyBody<D3Node>().strength((d) => d.r * chargeStrength))
      .force('center', forceCenter(width / 2, height / 2).strength(0.05))
      .force('collide', forceCollide<D3Node>((d) => d.r + (isArchitecture ? 14 : 8)).iterations(2))
      .alphaDecay(0.015);

    simulationRef.current = sim;

    // ── RENDER LINKS ──
    const linkGroup = g.append('g').attr('class', 'links');

    // Link lines
    const link = linkGroup.selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => d.color)
      .attr('stroke-opacity', 0.12)
      .attr('stroke-width', (d) => Math.max(1, d.value * 1.5));

    // Edge labels (on hover only for performance — shown via CSS class)
    const edgeLabel = linkGroup.selectAll<SVGTextElement, D3Link>('text.edge-label')
      .data(links.filter((l) => l.label))
      .join('text')
      .attr('class', 'edge-label')
      .text((d) => d.label || '')
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.35)')
      .attr('font-size', 8)
      .attr('font-family', "'Inter', system-ui, sans-serif")
      .attr('pointer-events', 'none')
      .attr('opacity', 0);

    // ── RENDER NODES ──
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, D3Node>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer');

    // Drag
    const dragBehavior = d3Drag<SVGGElement, D3Node>()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    node.call(dragBehavior);

    // Outer glow halo (hub + special nodes)
    node.filter((d) => d.nodeKind === 'hub' || d.nodeKind === 'special')
      .append('circle')
      .attr('r', (d) => d.r + 12)
      .attr('fill', 'none')
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.15)
      .attr('filter', 'url(#glow-strong)');

    // Main circle with radial gradient for 3D sphere effect
    node.each(function (d) {
      const el = select(this);
      const gradId = `grad-${d.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Create per-node radial gradient
      root.select('defs').append('radialGradient')
        .attr('id', gradId)
        .attr('cx', '35%').attr('cy', '30%').attr('r', '65%')
        .selectAll('stop')
        .data([
          { offset: '0%', color: lightenColor(d.color, 60), opacity: 1 },
          { offset: '50%', color: d.color, opacity: 0.95 },
          { offset: '100%', color: darkenColor(d.color, 40), opacity: 0.9 },
        ])
        .join('stop')
        .attr('offset', (s) => s.offset)
        .attr('stop-color', (s) => s.color)
        .attr('stop-opacity', (s) => s.opacity);

      el.append('circle')
        .attr('r', d.r)
        .attr('fill', `url(#${gradId})`)
        .attr('stroke', d.color)
        .attr('stroke-width', d.nodeKind === 'hub' ? 2 : 1)
        .attr('stroke-opacity', 0.4)
        .attr('filter', d.nodeKind === 'hub' ? 'url(#glow-strong)' : 'url(#glow)');
    });

    // Inner highlight (specular) — small bright dot on hub nodes
    node.filter((d) => d.nodeKind === 'hub')
      .append('circle')
      .attr('r', (d) => d.r * 0.2)
      .attr('cx', (d) => -d.r * 0.2)
      .attr('cy', (d) => -d.r * 0.25)
      .attr('fill', 'rgba(255,255,255,0.35)')
      .attr('pointer-events', 'none');

    // Architecture mode overlays
    if (isArchitecture) {
      // Health score arc ring
      node.filter((d) => d.healthScore !== undefined && !d.isBrain)
        .append('circle')
        .attr('r', (d) => d.r + 4)
        .attr('fill', 'none')
        .attr('stroke', (d) => {
          const hs = d.healthScore || 0;
          if (hs >= 70) return '#22C55E';
          if (hs >= 40) return '#EAB308';
          return '#EF4444';
        })
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', (d) => {
          const circ = 2 * Math.PI * (d.r + 4);
          const filled = circ * ((d.healthScore || 0) / 100);
          return `${filled} ${circ - filled}`;
        })
        .attr('stroke-dashoffset', (d) => 2 * Math.PI * (d.r + 4) * 0.25)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.8)
        .attr('pointer-events', 'none');

      // Dormant overlay
      node.filter((d) => d.status === 'dormant')
        .append('circle')
        .attr('r', (d) => d.r)
        .attr('fill', 'rgba(15,23,42,0.55)')
        .attr('stroke', '#64748B')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4 3')
        .attr('pointer-events', 'none');

      // Never-used overlay
      node.filter((d) => d.status === 'never_used')
        .append('circle')
        .attr('r', (d) => d.r)
        .attr('fill', 'rgba(15,23,42,0.8)')
        .attr('stroke', '#334155')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2 4')
        .attr('pointer-events', 'none');

      // Brain pulse glow
      node.filter((d) => d.isBrain === true)
        .append('circle')
        .attr('class', 'brain-pulse')
        .attr('r', (d) => d.r + 16)
        .attr('fill', 'none')
        .attr('stroke', '#F59E0B')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.4)
        .attr('pointer-events', 'none');

      // Health score text
      node.filter((d) => d.healthScore !== undefined && d.healthScore > 0 && !d.isBrain)
        .append('text')
        .text((d) => `${d.healthScore}`)
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.1em')
        .attr('fill', 'rgba(255,255,255,0.7)')
        .attr('font-size', (d) => Math.max(8, d.r * 0.35))
        .attr('font-family', "'Inter', system-ui, sans-serif")
        .attr('font-weight', '600')
        .attr('pointer-events', 'none');
    }

    // Labels — always visible on hubs, visible on daily with enough room
    node.append('text')
      .text((d) => d.nodeKind === 'hub' ? d.label : (d.r >= 8 ? d.label : ''))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.nodeKind === 'hub' ? '0.35em' : d.r + 14)
      .attr('fill', (d) => d.nodeKind === 'hub' ? '#fff' : 'rgba(255,255,255,0.6)')
      .attr('font-size', (d) => {
        if (d.nodeKind === 'hub') return Math.max(10, d.r * 0.32);
        return 8;
      })
      .attr('font-family', "'Inter', system-ui, sans-serif")
      .attr('font-weight', (d) => d.nodeKind === 'hub' ? '700' : '500')
      .attr('pointer-events', 'none')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'rgba(0,0,0,0.6)')
      .attr('stroke-width', (d) => d.nodeKind === 'hub' ? 3 : 2)
      .attr('opacity', (d) => d.forceLabel ? 1 : (d.r >= 8 ? 0.8 : 0));

    // ── INTERACTIONS ──
    node.on('mouseenter', function (event, d) {
      const connected = new Set<string>();
      links.forEach((l) => {
        const sId = typeof l.source === 'string' ? l.source : (l.source as D3Node).id;
        const tId = typeof l.target === 'string' ? l.target : (l.target as D3Node).id;
        if (sId === d.id) connected.add(tId);
        if (tId === d.id) connected.add(sId);
      });
      connected.add(d.id);

      // Highlight connected, dim rest
      node.transition().duration(150)
        .attr('opacity', (n: D3Node) => connected.has(n.id) ? 1 : 0.08);
      node.select('text')
        .transition().duration(150)
        .attr('opacity', (n: D3Node) => connected.has(n.id) ? 1 : 0.04);
      link.transition().duration(150)
        .attr('stroke-opacity', (l: ResolvedLink) => {
          const sId = typeof l.source === 'string' ? l.source : (l.source as D3Node).id;
          const tId = typeof l.target === 'string' ? l.target : (l.target as D3Node).id;
          return (sId === d.id || tId === d.id) ? 0.6 : 0.02;
        })
        .attr('stroke-width', (l: ResolvedLink) => {
          const sId = typeof l.source === 'string' ? l.source : (l.source as D3Node).id;
          const tId = typeof l.target === 'string' ? l.target : (l.target as D3Node).id;
          return (sId === d.id || tId === d.id) ? Math.max(2, l.value * 2) : Math.max(0.5, l.value);
        });

      // Show edge labels for connected links
      edgeLabel.transition().duration(200)
        .attr('opacity', (l: ResolvedLink) => {
          const sId = typeof l.source === 'string' ? l.source : (l.source as D3Node).id;
          const tId = typeof l.target === 'string' ? l.target : (l.target as D3Node).id;
          return (sId === d.id || tId === d.id) ? 0.7 : 0;
        });

      hoveredIdRef.current = d.id;
      const rect = svg.getBoundingClientRect();
      onNodeHover(d.id, { x: event.clientX - rect.left, y: event.clientY - rect.top }, d);
    })
    .on('mousemove', function (event, d) {
      const rect = svg.getBoundingClientRect();
      onNodeHover(d.id, { x: event.clientX - rect.left, y: event.clientY - rect.top }, d);
    })
    .on('mouseleave', function () {
      node.transition().duration(250)
        .attr('opacity', 1);
      node.select('text')
        .transition().duration(250)
        .attr('opacity', (d: D3Node) => d.forceLabel ? 1 : (d.r >= 8 ? 0.8 : 0));
      link.transition().duration(250)
        .attr('stroke-opacity', 0.12)
        .attr('stroke-width', (d: ResolvedLink) => Math.max(1, d.value * 1.5));
      edgeLabel.transition().duration(200).attr('opacity', 0);

      hoveredIdRef.current = null;
      onNodeHover(null);
    })
    .on('click', function (event, d) {
      event.stopPropagation();
      onNodeClick(d.id, d);
    });

    // Tick
    sim.on('tick', () => {
      link
        .attr('x1', (d: ResolvedLink) => (d.source as D3Node).x!)
        .attr('y1', (d: ResolvedLink) => (d.source as D3Node).y!)
        .attr('x2', (d: ResolvedLink) => (d.target as D3Node).x!)
        .attr('y2', (d: ResolvedLink) => (d.target as D3Node).y!);

      edgeLabel
        .attr('x', (d: ResolvedLink) => ((d.source as D3Node).x! + (d.target as D3Node).x!) / 2)
        .attr('y', (d: ResolvedLink) => ((d.source as D3Node).y! + (d.target as D3Node).y!) / 2)
        .attr('transform', (d: ResolvedLink) => {
          const dx = (d.target as D3Node).x! - (d.source as D3Node).x!;
          const dy = (d.target as D3Node).y! - (d.source as D3Node).y!;
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          if (angle > 90 || angle < -90) angle += 180;
          const mx = ((d.source as D3Node).x! + (d.target as D3Node).x!) / 2;
          const my = ((d.source as D3Node).y! + (d.target as D3Node).y!) / 2;
          return `rotate(${angle}, ${mx}, ${my})`;
        });

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => { sim.stop(); };
  }, [data, dimensions, onNodeClick, onNodeHover, mode, reasoningGraphData]);

  const handleReset = useCallback(() => {
    const svg = svgRef.current as (SVGSVGElement & { __resetZoom?: () => void }) | null;
    if (svg && svg.__resetZoom) svg.__resetZoom();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: 'radial-gradient(ellipse at 50% 40%, #141632 0%, #0a0b1a 50%, #06060f 100%)' }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block"
      >
        <defs>
          <style>{`
            .brain-pulse {
              animation: brainPulse 2s ease-in-out infinite;
              transform-origin: center;
            }
            @keyframes brainPulse {
              0%, 100% { stroke-opacity: 0.2; transform: scale(1); }
              50% { stroke-opacity: 0.6; transform: scale(1.15); }
            }
          `}</style>
          {/* Subtle glow for daily nodes */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Strong glow for hub nodes */}
          <filter id="glow-strong">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="blur" in2="SourceGraphic" operator="over" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <button
          onClick={handleReset}
          className="p-2 rounded-lg bg-black/50 border border-white/10 text-slate-400 hover:text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg bg-black/50 border border-white/10 text-slate-400 hover:text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Color utilities for gradient sphere effect ──

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * percent / 100));
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * percent / 100));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * percent / 100));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * percent / 100));
  return `rgb(${r},${g},${b})`;
}
