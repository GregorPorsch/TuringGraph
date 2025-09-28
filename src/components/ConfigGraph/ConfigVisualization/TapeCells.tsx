// src/components/ConfigGraph/ConfigVisualization/TapeCells.tsx
import { useMemo } from 'react';
import { Box, Tooltip, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { TapeContentSingleTape } from '@mytypes/TMTypes';
import { fmtSym, valueAtAbsolutePos, getLocalBounds } from './tapeUtils';
import { CELL_HEIGHT, CELL_WIDTH } from './constants';

type Props = {
  tape: TapeContentSingleTape;
  head: number;
  blank: string;
};

type Cell = {
  key: number;
  val: string;
  isHead: boolean;
  pos: number;
};

/**
 * Renders the cells for a tape.
 */
export default function TapeCells({ tape, head, blank }: Props) {
  const theme = useTheme();

  const cells = useMemo(() => {
    const out: { key: number; val: string; isHead: boolean; pos: number }[] = [];
    const { minPosLocal, maxPosLocal } = getLocalBounds(tape);
    for (let pos = minPosLocal; pos <= maxPosLocal; pos++) {
      out.push({
        key: pos,
        val: valueAtAbsolutePos(tape, pos, blank),
        isHead: pos === head,
        pos,
      });
    }
    return out;
  }, [tape, head, blank]);

  return (
    <Box sx={{ display: 'flex', gap: 0.5, width: 'max-content' }}>
      {cells.map((c: Cell) => (
        <Tooltip
          key={c.key}
          title={c.isHead ? 'Head position' : ''}
          disableHoverListener={!c.isHead}
          arrow
          placement="top"
        >
          <Box
            sx={{
              minWidth: CELL_WIDTH,
              height: CELL_HEIGHT,
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: theme.typography.fontFamily,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 0.2,
              position: 'relative',
              bgcolor: c.isHead
                ? alpha(theme.palette.primary.main, 0.08)
                : theme.palette.background.paper,
              boxShadow: c.isHead
                ? `inset 0 0 0 9999px ${alpha(theme.palette.primary.main, 0.06)}`
                : undefined,
              userSelect: 'none',
            }}
          >
            {fmtSym(c.val, blank)}
            {c.isHead && (
              <Box
                sx={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bottom: -10,
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `8px solid ${theme.palette.primary.main}`,
                }}
              />
            )}
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}
