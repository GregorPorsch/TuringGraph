// src/components/MainPage/ComputeTreeDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Typography,
  Divider,
  Box,
  Stack,
  Checkbox,
  Chip,
} from '@mui/material';

type ComputeTreeDialogProps = {
  open: boolean;
  depth: number;
  compressed: boolean;
  onDepthChange: (value: number) => void;
  onCompressedChange: (value: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function ComputeTreeDialog({
  open,
  depth,
  compressed,
  onDepthChange,
  onCompressedChange,
  onClose,
  onConfirm,
}: ComputeTreeDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{ zIndex: 3000 }}
    >
      <DialogTitle>Compute Tree</DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" sx={{ mb: 2.5 }}>
          Please select the maximum depth for the computation tree.
        </Typography>

        <Slider
          value={depth}
          min={1}
          max={200}
          step={1}
          onChange={(_, value) => onDepthChange(value as number)}
          valueLabelDisplay="on"
          aria-label="Computation tree depth"
          sx={{ mt: 2, mb: 0 }}
        />

        <Divider sx={{ my: 1 }} />

        <Typography
          variant="overline"
          sx={{ display: 'block', mb: 0, color: 'text.secondary' }}
        >
          Further options
        </Typography>

        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox
              checked={compressed}
              onChange={(event) => onCompressedChange(event.target.checked)}
            />
            <Chip
              size="small"
              label="Compressed"
              color={compressed ? 'primary' : 'default'}
              variant={compressed ? 'filled' : 'outlined'}
            />
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: 6.5, mt: -0.5 }}
          >
            Merge linear paths into single edges
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm}>
          Compute
        </Button>
      </DialogActions>
    </Dialog>
  );
}
