// src/components/ConfigGraph/ConfigVisualization/ConfigCard.tsx
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  useTheme,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Typography,
} from '@mui/material';
import { HourglassEmpty, AltRoute } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

import { Configuration } from '@mytypes/TMTypes';
import { useGlobalZustand } from '@zustands/GlobalZustand';
import TapeRow from './TapeRow';
import SyncedScrollbar from './SyncedScrollbar';
import { useSyncedHorizontalScroll } from './useSyncedHorizontalScroll';
import { CELL_STRIDE, CELL_WIDTH } from './constants';
import { CONFIG_CARD_WIDTH } from '../util/constants';
import { computeDeeperGraphFromState } from '@tmfunctions/ConfigGraph';

type Props = {
  config: Configuration;
  cardWidth?: number | string;
  computed?: boolean;
  showSelect?: boolean;
  onSelect?: () => void;
  pendingInteractive?: boolean;
};

/**
 * Orchestrates the configuration visualization:
 * - Header with state & reading chips
 * - N tape rows with fixed meta + per-row horizontal viewport
 * - One shared custom scrollbar controlling all viewports
 * - Initial centering to the head of the top tape (if overflow)
 */
export default function ConfigCard(data: Props) {
  const {
    config,
    cardWidth = CONFIG_CARD_WIDTH,
    computed,
    showSelect = false,
    onSelect,
    pendingInteractive = true,
  } = data;

  const theme = useTheme();

  // Global Zustand state
  const blank = useGlobalZustand((s) => s.blank);
  const stateColorMatching = useGlobalZustand((s) => s.stateColorMatching);

  // Node color point based on state
  const nodeColor = useMemo(() => {
    const key = String(config.state);
    return stateColorMatching?.get?.(key) ?? undefined;
  }, [stateColorMatching, config.state]);

  // Dialog state for computing more configurations
  const [pendingOpen, setPendingOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number>(10);
  const MAX_AMOUNT = 50;

  const openPending = useCallback(() => setPendingOpen(true), []);
  const closePending = useCallback(() => setPendingOpen(false), []);
  const confirmPending = useCallback(() => {
    const amount = Math.max(1, Math.min(pendingAmount, MAX_AMOUNT));
    computeDeeperGraphFromState(config, amount);
    setPendingOpen(false);
  }, [config, pendingAmount]);

  // Synced horizontal scrolling across all tape viewports
  const {
    setViewportRef,
    trackRef,
    thumbRef,
    hasOverflow,
    hovered,
    setHovered,
    thumb,
    onViewportScroll,
    handleTrackMouseDown,
    getMaster,
    centerAllTo,
    dragging,
  } = useSyncedHorizontalScroll({ thumbMinWidth: 24 });

  // Colors / sizing for the custom scrollbar
  const trackColor = alpha(theme.palette.border.dark, 0.55);
  const thumbColor = alpha(theme.palette.primary.main, 0.55);
  const trackPadding = 8; // px
  const trackHeight = 10; // px

  // Initial centering: center all rows so that the head of the top tape is in the middle
  const didInitialCenter = useRef(false);
  useEffect(() => {
    if (didInitialCenter.current) return;

    const tryCenter = () => {
      const master = getMaster();
      if (!master) return;

      const scrollW = master.scrollWidth;
      const clientW = master.clientWidth;
      const overflow = scrollW > clientW + 1;
      if (!overflow) return;

      const heads = config.heads ?? [];
      if (heads.length === 0) return;

      const refIdx = 0;
      const headRef = heads[refIdx];
      const refTape = config.tapes[refIdx];
      const minPosLocal = -refTape[0].length; // local start of tape 0
      const headIndex = headRef - minPosLocal;

      const target = headIndex * CELL_STRIDE - clientW / 2 + CELL_WIDTH / 2;
      const clamped = Math.max(0, Math.min(target, scrollW - clientW));

      // Double rAF ensures layout is fully settled before scrolling
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          centerAllTo(clamped);
          didInitialCenter.current = true;
        });
      });
    };

    const id = setTimeout(tryCenter, 0);
    return () => clearTimeout(id);
  }, [config.heads, config.tapes, getMaster, centerAllTo]);

  return (
    <>
      <Card
        elevation={6}
        sx={{
          width: typeof cardWidth === 'number' ? `${cardWidth}px` : cardWidth,
          maxWidth: '100%',
          borderRadius: 2,
          border: (t) => `1px solid ${alpha(t.palette.divider, 0.32)}`,
          boxShadow: `0 8px 28px ${alpha(theme.palette.common.black, 0.18)}, 0 1px 2px ${alpha(
            theme.palette.common.black,
            0.08
          )}`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <CardContent
          sx={{
            pt: 1.25,
            px: 1.25,
            pb: 0,
            position: 'relative',
            '&:last-child': { pb: 2 },
          }}
        >
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 0.75 }}
            spacing={1}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              {/* State */}
              <Chip
                size="small"
                color="primary"
                variant="filled"
                label={`${config.state}`}
                sx={{
                  transform: 'translateY(-2px)',
                  '& .MuiChip-label': {
                    py: 0,
                    px: 0.75,
                    lineHeight: 1.2,
                    fontWeight: 600,
                    letterSpacing: 0.2,
                  },
                }}
              />

              {/* Pending */}
              {!computed &&
                (pendingInteractive ? (
                  // Interactive in ConfigGraph (default)
                  <Tooltip
                    arrow
                    title="Compute more configurations from this state"
                    placement="top"
                  >
                    <Chip
                      size="small"
                      color="default"
                      variant="outlined"
                      icon={<HourglassEmpty sx={{ fontSize: 16 }} />}
                      label="Pending"
                      onClick={openPending}
                      sx={{
                        fontWeight: 500,
                        cursor: 'pointer',
                        '& .MuiChip-icon': { ml: 0.25 },
                      }}
                    />
                  </Tooltip>
                ) : (
                  // Read-only in ComputationTree
                  <Chip
                    size="small"
                    color="default"
                    variant="outlined"
                    icon={<HourglassEmpty sx={{ fontSize: 16 }} />}
                    label="Pending"
                    sx={{
                      fontWeight: 500,
                      cursor: 'default',
                      '& .MuiChip-icon': { ml: 0.25 },
                    }}
                  />
                ))}

              {/* Node color indicator */}
              {nodeColor && (
                <Tooltip
                  arrow
                  placement="top"
                  title={`Node color for "${config.state}"`}
                >
                  <Box
                    aria-label={`Node color`}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 0.5,
                      borderRadius: '999px',
                      border: `1px solid ${alpha(nodeColor, 0.6)}`,
                      bgcolor: alpha(nodeColor, 0.12),
                      transform: 'translateY(-2px)',
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: nodeColor,
                        boxShadow: `inset 0 0 0 1px ${alpha(
                          theme.palette.common.black,
                          0.25
                        )}`,
                        flex: '0 0 14px',
                      }}
                    />
                  </Box>
                </Tooltip>
              )}
            </Stack>

            {/* Select button */}
            {showSelect && (
              <Tooltip
                arrow
                placement="top"
                title="Set the Turing machine to this configuration"
              >
                <Button
                  size="small"
                  variant="contained"
                  onClick={onSelect}
                  startIcon={<AltRoute />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 1.25,
                    py: 0.25,
                    lineHeight: 1.2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    '& .MuiButton-startIcon': {
                      m: 0,
                      mr: 0.75,
                      display: 'inline-flex',
                      alignItems: 'center',
                    },
                    '& .MuiButton-startIcon > *': {
                      fontSize: 18,
                      lineHeight: 1,
                    },
                  }}
                >
                  Select
                </Button>
              </Tooltip>
            )}
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* Tape rows + overlayed shared custom scrollbar */}
          <Box
            sx={{ position: 'relative' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => !dragging && setHovered(false)}
          >
            <Stack spacing={1}>
              {config.tapes.map((tape, i) => (
                <TapeRow
                  key={i}
                  tapeIndex={i}
                  head={config.heads[i]}
                  tape={tape}
                  blank={blank}
                  setViewportRef={setViewportRef}
                  onViewportScroll={onViewportScroll}
                  isLast={i === config.tapes.length - 1}
                  bottomPaddingPx={trackHeight + 15}
                />
              ))}
            </Stack>

            {/* Overlay custom scrollbar controlling all viewports */}
            <SyncedScrollbar
              trackRef={trackRef}
              thumbRef={thumbRef}
              hasOverflow={hasOverflow}
              hovered={hovered}
              dragging={dragging}
              thumbLeftPx={thumb.left}
              thumbWidthPx={thumb.width}
              trackPadding={trackPadding}
              trackHeight={trackHeight}
              trackColor={trackColor}
              thumbColor={thumbColor}
              onTrackMouseDown={handleTrackMouseDown}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Pending-Dialog */}
      <Dialog
        open={pendingOpen}
        onClose={closePending}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 2000 }}
      >
        <DialogTitle>Compute from this configuration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Please select how many additional configurations to compute.
          </Typography>
          <Box sx={{ px: 1, pb: 1 }}>
            <Slider
              value={pendingAmount}
              min={1}
              max={MAX_AMOUNT}
              step={1}
              onChange={(_, v) => setPendingAmount(v as number)}
              valueLabelDisplay="on"
              aria-label="Number of configurations to compute"
              sx={{ mt: 4 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePending}>Cancel</Button>
          <Button variant="contained" onClick={confirmPending}>
            Compute
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
