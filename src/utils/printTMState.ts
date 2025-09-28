// src/utils/printTMState.ts
import { useGlobalZustand } from '@zustands/GlobalZustand';

export function printTMState() {
  const {
    states,
    startState,
    currentState,
    lastState,
    transitions,
    blank,
    tapes,
    numberOfTapes,
    heads,
    running,
    input,
    configGraph,
  } = useGlobalZustand.getState();

  console.log('--- Turing Machine State ---');
  console.log('All states:', Array.from(states).join(', '));
  console.log('Start state:', startState);
  console.log('Current state:', currentState);
  console.log('Last state:', lastState);
  console.log('Number of tapes:', numberOfTapes);
  console.log('Blank symbol: "', blank, '"');
  console.log('Heads:', heads);
  console.log('Running:', running);
  console.log('Input:', input);
  console.log('Tapes:');
  tapes.forEach((tape, i) => {
    const left = tape[0].map((f) => f.value).join(' ');
    const right = tape[1].map((f) => f.value).join(' ');
    console.log(`  Tape ${i + 1}: [${left}] | [${right}]`);
  });
  console.log('Transitions:', transitions);
  console.log('Configurations:', configGraph);
}
