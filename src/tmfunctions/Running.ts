// src/tmfunctions/Running.ts
import { toast } from 'sonner';

import { getCurrentConfiguration } from '@tmfunctions/Configurations';
import { printTMState } from '@utils/printTMState';
import { useGlobalZustand } from '@zustands/GlobalZustand';
import { Configuration, hashConfig } from '@mytypes/TMTypes';
import { computeDeeperGraphFromState } from '@tmfunctions/ConfigGraph';

//Returned boolean is whether everything went fine or not
export function makeStep(): boolean {
  const currentconfig = getCurrentConfiguration();
  const configgraph = useGlobalZustand.getState().configGraph;

  if (!configgraph) {
    console.error(
      'Configuration graph is not loaded. Please load the graph before running the machine.'
    );
    return false;
  }

  const graph = configgraph.Graph;

  let currentNode = graph.get(hashConfig(currentconfig));

  if (!currentNode) {
    console.error(
      'Current configuration is not in the graph. This sould never happen!'
    );
    return false;
  }

  if (!currentNode.computed) {
    computeDeeperGraphFromState(currentconfig, 10); //Compute 10 more configurations from the current configuration
    console.warn(
      'Current configuration is not computed yet. Next configurations were computed.'
    );
  }

  currentNode = graph.get(hashConfig(currentconfig))!; //Re-get the current node after computing deeper

  if (currentNode.next.length > 1) {
    console.warn(
      'There are multiple next configurations available. Please choose one from the graph.'
    );
    toast.warning(
      'Multiple next configurations available. Please choose one from the configuration graph.'
    );
    return false;
  }

  if (currentNode.next.length === 0) {
    console.warn('No next configuration available. The machine has stopped.');
    return false;
  }

  //If we are here, we can safely assume that there is exactly one next configuration available
  const nextConfig = graph.get(currentNode.next[0][0]); //Get the first next configuration

  if (!nextConfig) {
    console.error(
      'Next configuration is not found in the graph. Probably its a halting state!'
    );
    return false;
  }

  //Set the last state and last transition in the global Zustand
  useGlobalZustand.getState().setLastState(currentconfig.state);
  useGlobalZustand.getState().setLastTransition(currentNode.next[0][1]);

  //Set the new configuration in the global Zustand
  useGlobalZustand.getState().setRunning(true);
  useGlobalZustand.getState().setTapes(nextConfig.config.tapes);
  useGlobalZustand.getState().setHeads(nextConfig.config.heads);
  useGlobalZustand.getState().setCurrentState(nextConfig.config.state);

  //Trigger the update of the lastTransition to be visualized in the TMGraph
  useGlobalZustand.getState().triggerTransition();

  //set the last configuration
  useGlobalZustand.getState().setLastConfig(currentconfig);

  if (import.meta.env.DEV) {
    console.log(nextConfig.config.state);
    console.log(currentNode.next[0][1]); //This is the index of the transition that was taken to get to the next configuration
    console.log('TM State: ', printTMState());
  }

  return true;
}

export function startRunningLive(runningID: number = -1) {
  useGlobalZustand.getState().setRunningLive(true);
  let currentRunningID = useGlobalZustand.getState().runningLiveID;
  if (runningID === -1) {
    useGlobalZustand.getState().incrementRunningLiveID();
    currentRunningID += 1;
  }
  if (makeStep()) {
    setTimeout(() => {
      if (!useGlobalZustand.getState().runningLive) return;
      if (currentRunningID !== useGlobalZustand.getState().runningLiveID) return; //A new running session was started, so we stop this one
      startRunningLive(currentRunningID);
    }, 700); //700ms delay between steps
  } else {
    useGlobalZustand.getState().setRunningLive(false);
  }
}

export function stopRunningLive() {
  useGlobalZustand.getState().setRunningLive(false);
}

export function runningReset() {
  const numTapes = useGlobalZustand.getState().tapes.length;
  useGlobalZustand.getState().setRunningLive(false);
  useGlobalZustand.getState().setRunning(false);
  useGlobalZustand
    .getState()
    .setCurrentState(useGlobalZustand.getState().startState);
  useGlobalZustand.getState().setHeads(Array(numTapes).fill(0));
  useGlobalZustand
    .getState()
    .setTapes(useGlobalZustand.getState().input.map((tape) => [...tape]));
  useGlobalZustand.getState().setLastState('');
  useGlobalZustand.getState().setLastTransition(-1);
  useGlobalZustand.getState().setLastConfig(null);
}

export function setConfiguration(config: Configuration) {
  //Check if the configuration is a next configuration of the current configuration
  const currentconfig = getCurrentConfiguration();
  const currentconfighash = hashConfig(currentconfig);
  const configgraph = useGlobalZustand.getState().configGraph;
  if (!configgraph) return;
  const graph = configgraph.Graph;
  const currentNode = graph.get(hashConfig(currentconfig));
  if (!currentNode) return;
  let isNext = false;
  let transitionIndex = -1;

  for (const [nextHash, index] of currentNode.next) {
    if (nextHash === hashConfig(config)) {
      isNext = true;
      transitionIndex = index;
      break;
    }
  }

  useGlobalZustand.getState().setRunningLive(false);
  useGlobalZustand.getState().incrementRunningLiveID();

  if (!isNext) {
    useGlobalZustand.getState().setRunning(false);
    useGlobalZustand.getState().setCurrentState(config.state);
    useGlobalZustand.getState().setHeads(config.heads);
    useGlobalZustand.getState().setTapes(config.tapes);
    useGlobalZustand.getState().setLastState('');
    useGlobalZustand.getState().setLastTransition(-1);
    useGlobalZustand.getState().setLastConfig(null);
    return;
  }

  useGlobalZustand.getState().setRunning(true);
  useGlobalZustand.getState().setLastState(currentconfig.state);
  useGlobalZustand.getState().setLastTransition(transitionIndex);
  useGlobalZustand.getState().setCurrentState(config.state);
  useGlobalZustand.getState().setHeads(config.heads);
  useGlobalZustand.getState().setTapes(config.tapes);
  useGlobalZustand.getState().setLastConfig(currentconfig);

  //Trigger the update of the lastTransition to be visualized in the TMGraph
  useGlobalZustand.getState().triggerTransition();
}
