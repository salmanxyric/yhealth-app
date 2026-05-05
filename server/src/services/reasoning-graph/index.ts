/**
 * @file Reasoning Graph - Barrel Export
 * @description Knowledge Graph–driven AI Coaching Architecture services.
 */

export { featureStateService } from './feature-state.service.js';
export { graphContextService } from './graph-context.service.js';
export { graphValidationService } from './graph-validation.service.js';
export { graphEventEmitterService } from './graph-event-emitter.service.js';
export { nextBestActionService } from './next-best-action.service.js';
export { statePropagationService } from './state-propagation.service.js';

export {
  FEATURE_NODE_REGISTRY,
  STATIC_CROSS_EDGES,
  getFeatureNode,
  getFeatureNodeOrThrow,
  getAllFeatureNodeIds,
  getDirectChildrenOf,
  getAncestorChain,
  getToolGroupsForFeature,
  featureNodeForToolGroup,
  getDefaultEdges,
} from './feature-node-registry.js';
