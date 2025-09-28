// src/components/ConfigGraph/edges/EdgeTooltip.tsx
import { Popper, ClickAwayListener } from '@mui/material';
import { Paper, Stack, Typography, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { VirtualElement } from '@popperjs/core';

import type { Transition, TapePatternField } from '@mytypes/TMTypes';
import { useGlobalZustand } from '@zustands/GlobalZustand';

type Props = {
  open: boolean;
  anchorEl: VirtualElement;
  transition?: Transition;
  isCompressed?: boolean;
  compressedLength?: number;
  sourceLabel?: string;
  targetLabel?: string;
  onClose: () => void;
};

/* --- Helpers for rendering transition details --- */
const isSameWrite = (val: any): boolean =>
  !!val && typeof val === 'object' && !('value' in val);

const sym = (val: TapePatternField, blank: string): string => {
  const v =
    val && typeof val === 'object' && 'value' in val ? (val as any).value : val;
  if (v === blank && blank === ' ') return '□';
  return String(v);
};

const wildcard = (val: any): boolean =>
  !(val && typeof val === 'object' && 'value' in val);

const dirSym = (d: any): string => {
  if (d == null) return '—';
  const s = String(d);
  return s;
};

// Edge tooltip: shows transition details on hover
export function EdgeTooltip({
  open,
  anchorEl,
  transition,
  isCompressed,
  compressedLength,
  sourceLabel,
  targetLabel,
  onClose,
}: Props) {
  // Global Zustand state
  const blank = useGlobalZustand((s) => s.blank);

  const hasTransition = !!transition;

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="top-start"
      modifiers={[
        { name: 'offset', options: { offset: [0, 8] } },
        { name: 'preventOverflow', options: { padding: 8 } },
      ]}
      sx={{ zIndex: (t) => t.zIndex.tooltip }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          elevation={6}
          sx={{
            p: 1.25,
            borderRadius: 2,
            pointerEvents: 'none',
            bgcolor: (t) => alpha(t.palette.background.paper, 0.95),
            backdropFilter: 'blur(6px)',
            border: (t) => `1px solid ${alpha(t.palette.divider, 0.32)}`,
            boxShadow: (t) =>
              `0 8px 28px ${alpha(t.palette.common.black, 0.18)}, 0 1px 2px ${alpha(
                t.palette.common.black,
                0.08
              )}`,
            maxWidth: 460,
          }}
        >
          {/* Header */}
          {isCompressed && !hasTransition ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.75,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, flex: '1 1 auto', minWidth: 0 }}
                title={`${sourceLabel} → ${targetLabel}`}
              >
                {sourceLabel} → {targetLabel}
              </Typography>

              {/* Blue badge for compressed edges */}
              <Box
                component="span"
                sx={(t) => ({
                  flex: '0 0 auto',
                  px: 0.8,
                  py: 0.4,
                  borderRadius: 999,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: 0.25,
                  color: '#fff',
                  backgroundColor: t.palette.primary.main,
                  lineHeight: 1.4,
                })}
              >
                Compressed
              </Box>
            </Box>
          ) : (
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              {sourceLabel} → {targetLabel}
            </Typography>
          )}

          {/*  Body  */}
          {hasTransition ? (
            // Uncompressed: full transition details
            <Box sx={{ px: 0.5, py: 0.25 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '64px 1fr 1fr 64px',
                  columnGap: 1,
                  mb: 0.25,
                  opacity: 0.7,
                }}
              >
                <Typography variant="caption">Tape</Typography>
                <Typography variant="caption">Read</Typography>
                <Typography variant="caption">Write</Typography>
                <Typography variant="caption">Move</Typography>
              </Box>

              <Stack spacing={0.15}>
                {Array.from({
                  length: Math.max(
                    transition!.tapecondition?.length ?? 0,
                    transition!.write?.length ?? 0,
                    transition!.direction?.length ?? 0
                  ),
                }).map((_, k) => {
                  const read = transition!.tapecondition?.[k];
                  const write = transition!.write?.[k];
                  const move = transition!.direction?.[k];

                  return (
                    <Box
                      key={k}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '64px 1fr 1fr 64px',
                        columnGap: 1,
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        #{k + 1}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: (t) => t.typography.fontFamilyMonospace,
                        }}
                      >
                        {wildcard(read) ? '-' : sym(read, blank)}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: (t) => t.typography.fontFamilyMonospace,
                        }}
                      >
                        {wildcard(write)
                          ? '-'
                          : isSameWrite(write)
                            ? sym(read, blank)
                            : sym(write, blank)}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: (t) => t.typography.fontFamilyMonospace,
                        }}
                      >
                        {dirSym(move)}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          ) : (
            isCompressed && (
              // Compressed: only show "X nodes compressed"
              <Stack spacing={0.5}>
                {typeof compressedLength === 'number' && (
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.9,
                      fontFamily: (t) => t.typography.fontFamily,
                    }}
                  >
                    {compressedLength} node{compressedLength === 1 ? '' : 's'}{' '}
                    compressed
                  </Typography>
                )}
              </Stack>
            )
          )}
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}
