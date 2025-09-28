// src/components/ConfigGraph/util/constants.ts
export const CONFIG_NODE_DIAMETER = 64;
export const CONFIG_CARD_WIDTH = 330;

// Height of the control buttons in the Config graph
export const CONTROL_HEIGHT = 32;

// Maximum number of nodes to allow card mode
export const CARDS_LIMIT = 10000;
export const COLOR_STATE_SWITCH = 10;

export enum NodeType {
  CONFIG = 'config',
  CONFIG_CARD = 'configCard',
}

export enum EdgeType {
  FLOATING = 'floating',
  LOOP = 'loop',
}
