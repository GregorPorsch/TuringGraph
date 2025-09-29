// src/components/TapeList/TapeList.tsx
import { Box, Button, ButtonGroup, Stack, useMediaQuery, useTheme } from '@mui/material';
import { PlayArrow, Stop, SkipNext, RestartAlt } from '@mui/icons-material';

import { useGlobalZustand } from '@zustands/GlobalZustand';
import {
  makeStep,
  runningReset,
  startRunningLive,
  stopRunningLive,
} from '@tmfunctions/Running';
import { Tape } from './Tape';

function TapeList() {
  const theme = useTheme();
  const numTapes = useGlobalZustand((state) => state.numberOfTapes);

  const isRunningLive = useGlobalZustand((state) => state.runningLive);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Stack spacing={1}>
      {/* Tapes */}
      <Stack spacing={0.5}>
        {Array.from({ length: numTapes }, (_, i) => (
          <Tape key={i} index={i} />
        ))}
      </Stack>

      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: isSmallScreen ? 'center' : 'flex-end',
          width: '100%',
        }}
      >
        <ButtonGroup
          size="small"
          variant="contained"
          orientation={isSmallScreen ? 'vertical' : 'horizontal'}
          fullWidth={isSmallScreen}
          sx={{
            '& .MuiButtonGroup-grouped': {
              minWidth: isSmallScreen ? '100%' : undefined,
            },
          }}
        >
          {!isRunningLive ? (
            <Button
              onClick={() => startRunningLive()}
              startIcon={
                <PlayArrow fontSize="small" sx={{ transform: 'translateY(-1px)' }} />
              }
              sx={{
                alignItems: 'center',
                backgroundColor: theme.palette.primary.main,
              }}
            >
              Start
            </Button>
          ) : (
            <Button
              onClick={() => stopRunningLive()}
              startIcon={
                <Stop fontSize="small" sx={{ transform: 'translateY(-1px)' }} />
              }
              sx={{
                alignItems: 'center',
                backgroundColor: theme.palette.error.main,
              }}
            >
              Stop
            </Button>
          )}
          <Button
            onClick={() => makeStep()}
            disabled={isRunningLive}
            startIcon={
              <SkipNext fontSize="small" sx={{ transform: 'translateY(-1px)' }} />
            }
            sx={{
              alignItems: 'center',
              backgroundColor: theme.palette.primary.dark,
            }}
          >
            Step
          </Button>
          <Button
            onClick={() => runningReset()}
            startIcon={
              <RestartAlt fontSize="small" sx={{ transform: 'translateY(-1px)' }} />
            }
            sx={{ alignItems: 'center', backgroundColor: theme.palette.accent.main }}
          >
            Reset
          </Button>
        </ButtonGroup>
      </Box>
    </Stack>
  );
}

export default TapeList;
