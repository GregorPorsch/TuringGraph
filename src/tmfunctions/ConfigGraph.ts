// src/tmfunctions/ConfigGraph.ts
import { Configuration, Transition, hashConfig } from '@mytypes/TMTypes';
import { nextConfigurations } from '@tmfunctions/Configurations';
import { useGlobalZustand } from '@zustands/GlobalZustand';

//Graph is represented as follows: Map<string, {config: Configuration, computed: boolean, next: [Configuration, number][]}>
export type ConfigGraph = {
  startconfig: Configuration;
  startconfighash: string;
  Graph: Map<
    string,
    { config: Configuration; computed: boolean; next: [string, number][] }
  >;
};
//Here: the string is the hashed config, computed tells us if next is already computed for this config, next is the next configurations (hashed) and their transition indices in the state of the config (previous one)

//Can be used to compute more configurations in the graph, later too. Needs to be called on configs that haven't been computed yet.
//firstCall means that after everything is finished the version of the graph in the global Zustand is incremented, so that the UI can react to changes
// Updated functions in src/tmfunctions/ConfigGraph.ts

function computeDeeperGraph(
  graph: Map<
    string,
    { config: Configuration; computed: boolean; next: [string, number][] }
  >,
  startConfig: Configuration,
  targetNodes: number,
  transitions: Map<string, Transition[]>,
  numberOfTapes: number,
  blank: string,
  firstCall: boolean
) {
  const startHash = hashConfig(startConfig);

  // If the starting configuration was fully expanded earlier, no need to process it again.
  if (graph.has(startHash) && graph.get(startHash)?.computed) {
    return;
  }

  // Ensure the starting configuration is in the graph and marked as not computed (to be expanded).
  if (!graph.has(startHash)) {
    graph.set(startHash, { config: startConfig, computed: false, next: [] });
  } else {
    graph.get(startHash)!.computed = false;
  }

  // Initialize a queue for BFS with the starting configuration.
  const queue: Configuration[] = [startConfig];

  // Process the queue until we reach the target number of nodes or run out of configurations.
  while (queue.length > 0 && graph.size < targetNodes) {
    const currentConfig = queue.shift()!; // Dequeue the next configuration
    const currentHash = hashConfig(currentConfig);

    // Skip this configuration if it has already been expanded (to avoid re-processing).
    if (graph.get(currentHash)?.computed) {
      continue;
    }

    // Generate all immediate successor configurations for the current configuration.
    const transitionsForState = transitions.get(currentConfig.state);
    const nextConfigs = nextConfigurations(
      currentConfig,
      transitionsForState,
      numberOfTapes,
      blank
    );

    // Add all successors to the graph (BFS expansion).
    for (const [nextConfig, transitionIndex] of nextConfigs) {
      const nextHash = hashConfig(nextConfig);

      // If this successor configuration is new, add it to the graph and enqueue it for further expansion.
      if (!graph.has(nextHash)) {
        graph.set(nextHash, { config: nextConfig, computed: false, next: [] });
        queue.push(nextConfig);
      }

      // Record the transition edge from the current configuration to this successor if not already present.
      const nextList = graph.get(currentHash)!.next;
      if (!nextList.find(([hash, _]) => hash === nextHash)) {
        nextList.push([nextHash, transitionIndex]);
      }
    }

    // Mark the current configuration as fully computed (all its direct successors have been processed).
    graph.get(currentHash)!.computed = true;

    // If we have reached or exceeded the target number of nodes, stop further expansion.
    if (graph.size >= targetNodes) {
      break;
    }
  }

  // If this was the initial call, trigger a UI update after expansion.
  if (firstCall) {
    const zustand = useGlobalZustand.getState();
    zustand.incrementConfigGraphVersion();
  }
}

export function computeDeeperGraphFromState(
  config: Configuration,
  minNumberNodes: number
) {
  const globalZustand = useGlobalZustand.getState();
  const transitions = globalZustand.transitions;
  const numberOfTapes = globalZustand.numberOfTapes;
  const blank = globalZustand.blank;
  const graph = globalZustand.configGraph;
  if (graph === null) {
    console.error(
      'No config graph available in global Zustand state. Please compute the graph first.'
    );
    return;
  }
  // Determine the new target total nodes (current count + additional requested nodes).
  const targetNodes = graph.Graph.size + minNumberNodes;
  computeDeeperGraph(
    graph.Graph,
    config,
    targetNodes,
    transitions,
    numberOfTapes,
    blank,
    true
  );
}

export function computeConfigGraph(
  config: Configuration,
  minNumberNodes: number,
  transitions: Map<string, Transition[]>,
  numberOfTapes: number,
  blank: string
): ConfigGraph {
  const startConfigHash = hashConfig(config);
  // Initialize the graph with the starting configuration.
  const graphMap: Map<
    string,
    { config: Configuration; computed: boolean; next: [string, number][] }
  > = new Map();

  // Compute the graph using BFS until it contains at least `minNumberNodes` nodes.
  computeDeeperGraph(
    graphMap,
    config,
    minNumberNodes,
    transitions,
    numberOfTapes,
    blank,
    false
  );

  return {
    startconfig: config,
    startconfighash: startConfigHash,
    Graph: graphMap,
  };
}
