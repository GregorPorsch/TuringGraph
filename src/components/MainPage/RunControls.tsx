// src/components/MainPage/RunControl.tsx
import { ButtonGroup, Button } from '@mui/material';
import { PlayArrow, Stop, SkipNext, RestartAlt } from '@mui/icons-material';
import { useGlobalZustand } from '@zustands/GlobalZustand';
import {
  startRunningLive,
  stopRunningLive,
  makeStep,
  runningReset,
} from '@tmfunctions/Running';

const buttonAlignSx = {
  display: 'inline-flex',
  alignItems: 'center',
  lineHeight: 1.2,
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
} as const;

export function RunControls() {
  const isRunningLive = useGlobalZustand((state) => state.runningLive);

  return (
    <ButtonGroup size="small" variant="contained">
      {!isRunningLive ? (
        <Button
          onClick={() => startRunningLive()}
          startIcon={<PlayArrow fontSize="small" />}
          sx={{
            ...buttonAlignSx,
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Start
        </Button>
      ) : (
        <Button
          onClick={() => stopRunningLive()}
          startIcon={<Stop fontSize="small" />}
          sx={{
            ...buttonAlignSx,
            bgcolor: 'error.main',
            '&:hover': { bgcolor: 'error.dark' },
          }}
        >
          Stop
        </Button>
      )}

      <Button
        onClick={() => makeStep()}
        disabled={isRunningLive}
        startIcon={<SkipNext fontSize="small" />}
        sx={{
          ...buttonAlignSx,
          bgcolor: 'primary.dark',
          '&:hover': { bgcolor: 'primary.main' },
        }}
      >
        Step
      </Button>

      <Button
        onClick={() => runningReset()}
        startIcon={<RestartAlt fontSize="small" />}
        sx={(theme) => ({
          ...buttonAlignSx,
          backgroundColor: theme.palette.accent.main,
          '&:hover': { backgroundColor: theme.palette.accent.main },
        })}
      >
        Reset
      </Button>
    </ButtonGroup>
  );
}
