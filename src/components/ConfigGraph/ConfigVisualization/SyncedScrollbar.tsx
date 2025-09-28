// src/components/ConfigGraph/ConfigVisualization/SyncedScrollbar.tsx
import * as React from 'react';
import { Box } from '@mui/material';

/**
 * Pure presentational custom scrollbar.
 * Logic (thumb sizing/position, events) is provided via props from the hook.
 */
type DivRef = React.RefObject<HTMLDivElement | null>;

type Props = {
  trackRef: DivRef;
  thumbRef: DivRef;
  hasOverflow: boolean;
  hovered: boolean;
  dragging: boolean;
  thumbLeftPx: number;
  thumbWidthPx: number;
  trackPadding: number;
  trackHeight: number;
  trackColor: string;
  thumbColor: string;
  onTrackMouseDown: React.MouseEventHandler<HTMLDivElement>;
};

export default function SyncedScrollbar({
  trackRef,
  thumbRef,
  hasOverflow,
  hovered,
  dragging,
  thumbLeftPx,
  thumbWidthPx,
  trackPadding,
  trackHeight,
  trackColor,
  thumbColor,
  onTrackMouseDown,
}: Props) {
  const visible = hasOverflow && (hovered || dragging);

  return (
    <Box
      ref={trackRef}
      data-ct-interactive="true"
      className="ct-scrollbar"
      onMouseDown={(e) => {
        e.stopPropagation();
        onTrackMouseDown(e);
      }}
      onWheelCapture={(e) => {
        e.stopPropagation();
      }}
      sx={{
        position: 'absolute',
        left: trackPadding,
        right: trackPadding,
        bottom: 0,
        height: trackHeight,
        borderRadius: 999,
        backgroundColor: visible ? trackColor : 'transparent',
        transition: 'background-color .15s ease, opacity .15s ease',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <Box
        ref={thumbRef}
        data-ct-interactive="true"
        className="ct-scrollbar-thumb"
        sx={{
          position: 'absolute',
          top: 2,
          bottom: 2,
          left: `${thumbLeftPx}px`,
          width: `${thumbWidthPx}px`,
          borderRadius: 999,
          backgroundColor: thumbColor,
          boxShadow: `0 1px 3px rgba(0,0,0,.25)`,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
        }}
      />
    </Box>
  );
}
