// src/tmfunctions/Configuration.ts
import {
  Configuration,
  getTapeField,
  isTapePatternAllFieldbyField,
  isTapePatternRealFieldbyField,
  Transition,
  TapePatternRealField,
  deepCopyTapeContent,
  isTapeWriteSameFieldbyField,
  isTapeWriteRealFieldbyField,
  TapeWriteRealField,
} from '@mytypes/TMTypes';
import { useGlobalZustand } from '@zustands/GlobalZustand';

export function getCurrentConfiguration(): Configuration {
  const globalZustand = useGlobalZustand.getState();
  const currentState = globalZustand.currentState;
  const currentTapes = globalZustand.tapes;
  const currentHeads = globalZustand.heads;
  return {
    state: currentState,
    tapes: currentTapes,
    heads: currentHeads,
  };
}

export function getStartConfiguration(): Configuration {
  const globalZustand = useGlobalZustand.getState();
  const startState = globalZustand.startState;
  const startTapes = globalZustand.input;
  const startHeads = Array(globalZustand.numberOfTapes).fill(0);
  return {
    state: startState,
    tapes: startTapes,
    heads: startHeads,
  };
}

export function nextConfigurationsFromStateTotal() {
  //This function is used to get the next configurations from the global zustand state, without providing a specific configuration
  const config = getCurrentConfiguration();
  return nextConfigurationsFromState(config);
}

export function nextConfigurationsFromState(config: Configuration) {
  const globalZustand = useGlobalZustand.getState();
  const transitions = globalZustand.transitions;
  const numberOfTapes = globalZustand.numberOfTapes;
  const blank = globalZustand.blank;
  return nextConfigurations(
    config,
    transitions.get(config.state),
    numberOfTapes,
    blank
  );
}

//The number is the index of the transition in the global zustand transitions array of the state "from"
// If you want to use the function with given transitions and numberOfTapes, set fromState to true and provide the transitions, numberOfTapes, blank. Otherwise: globalZustand us used
export function nextConfigurations(
  config: Configuration,
  transitions: Transition[] | undefined,
  numberOfTapes: number,
  blank: string
): [Configuration, number][] {
  if (transitions === undefined) {
    console.error(
      `No transitions provided in nextConfigurations. Something bad happened!`
    );
    return []; //No transitions available for this state
  }

  //The number is the index of the transition in the global zustand transitions array of the state "from"
  const validTransitions: [Transition, number][] = [];

  //Check which transitions are valid for the current configuration
  for (const [index, transition] of transitions.entries()) {
    let valid = true;

    for (let i = 0; i < numberOfTapes; i++) {
      const tapeField = getTapeField(config.tapes, i, config.heads[i]);
      const tapeCondition = transition.tapecondition[i];
      if (isTapePatternAllFieldbyField(tapeCondition)) {
        continue;
      }
      if (isTapePatternRealFieldbyField(tapeCondition)) {
        if (tapeField.value !== (tapeCondition as TapePatternRealField).value) {
          valid = false;
          break;
        }
      }
    }
    if (valid) {
      validTransitions.push([transition, index]);
    }
  }

  //Now in validTransitions we have all the transitions that are valid for the current configuration

  const nextConfigs: [Configuration, number][] = [];

  for (const [transition, index] of validTransitions) {
    const newTapes = deepCopyTapeContent(config.tapes);
    const newHeads = [...config.heads];
    const newState = transition.to;

    //Write the symbols on the tapes
    for (let i = 0; i < numberOfTapes; i++) {
      const tapeWrite = transition.write[i];
      if (isTapeWriteSameFieldbyField(tapeWrite)) {
        continue;
      }
      if (isTapeWriteRealFieldbyField(tapeWrite)) {
        const tapeField = getTapeField(newTapes, i, newHeads[i]);
        tapeField.value = (tapeWrite as TapeWriteRealField).value;
      }
    }

    //Now update the heads
    for (let j = 0; j < newHeads.length; j++) {
      const direction = transition.direction[j];
      if (direction === 'R') {
        newHeads[j] += 1; //Move right
      } else if (direction === 'L') {
        newHeads[j] -= 1; //Move left
      }
    }

    //Now check if heads are out of bounds --> blank symbol if that's the case
    for (let i = 0; i < newHeads.length; i++) {
      const newHead = newHeads[i];

      //First case: newHead is positive and ouf of bounds
      if (newHead >= 0 && newHead >= newTapes[i][1].length) {
        //Set the tape field to the blank symbol
        newTapes[i][1].push({ value: blank });
      }
      //Second case: newHead is negative and out of bounds
      if (newHead < 0 && -1 * newHead > newTapes[i][0].length) {
        //Set the tape field to the blank symbol
        newTapes[i][0].push({ value: blank });
      }
    }

    //Now create the new configuration
    const newConfig: Configuration = {
      state: newState,
      tapes: newTapes,
      heads: newHeads,
    };
    nextConfigs.push([newConfig, index]);
  }
  return nextConfigs;
}
