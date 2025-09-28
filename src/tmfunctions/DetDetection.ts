import { Transition, isTapePatternRealFieldbyField } from '@mytypes/TMTypes';


export function isDeterministic(transitions: Map<string, Transition[]>): {result: boolean, conflictingTransitions: Transition[]} {

  const conflicts : Transition[] = [];

  let found = false;

  for (const [state, transitionlist] of transitions) {
    for (let i = 0; i < transitionlist.length; i++) {
      const transition = transitionlist[i];
      for (let j = i + 1; j < transitionlist.length; j++) {

        const transition2 = transitionlist[j];

        let different = false;

        for (let i = 0; i < transition.tapecondition.length; i++) {
          const tapeField1 = transition.tapecondition[i];
          const tapeField2 = transition2.tapecondition[i];

          // If both fields are real and different, they conflict
          if (isTapePatternRealFieldbyField(tapeField1) && isTapePatternRealFieldbyField(tapeField2) && tapeField1.value != tapeField2.value) {
            different = true;
            break;
          }
        }
        if (!different) {
          conflicts.push(transition);
          conflicts.push(transition2);
          found = true;
        }
        if (found) break;
      }
      if (found) break;
    }
    if (found) break;
  }

  return {result: !found, conflictingTransitions: conflicts};
}