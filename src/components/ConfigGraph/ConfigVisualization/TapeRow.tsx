// src/components/ConfigGraph/ConfigVisualization/TapeRow.tsx
import { Box, Chip, Stack, Typography } from '@mui/material';

import TapeCells from './TapeCells';
import type { TapeContentSingleTape } from '@mytypes/TMTypes';

type Props = {
  tapeIndex: number;
  head: number;
  tape: TapeContentSingleTape;
  blank: string;
  setViewportRef: (i: number) => (el: HTMLDivElement | null) => void;
  onViewportScroll: (srcEl: HTMLDivElement | null) => void;
  isLast: boolean;
  bottomPaddingPx: number;
};

/**
 * One row: fixed meta (Tape #, Head index) + its own horizontal viewport.
 * The meta does not scroll horizontally; only the tape cells do.
 */
export default function TapeRow({
  tapeIndex,
  head,
  tape,
  blank,
  setViewportRef,
  onViewportScroll,
  isLast,
  bottomPaddingPx,
}: Props) {
  return (
    <Box>
      {/* Fixed per-tape meta (not horizontally scrollable) */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
        <Chip size="small" variant="outlined" label={`Tape #${tapeIndex + 1}`} />
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Head: {head}
        </Typography>
      </Stack>

      {/* Individual horizontally scrollable viewport per tape (kept in sync) */}
      <Box
        ref={setViewportRef(tapeIndex)}
        onScroll={(e) => onViewportScroll(e.currentTarget)}
        sx={{
          overflowX: 'auto',
          overflowY: 'hidden',
          pr: 0.5,
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { height: 0 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: 'transparent' },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          pb: isLast ? `${bottomPaddingPx}px` : 1,
        }}
      >
        <TapeCells tape={tape} head={head} blank={blank} />
      </Box>
    </Box>
  );
}
