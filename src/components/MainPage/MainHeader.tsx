// src/components/MainPage/MainHeader.tsx
import { AppBar, Toolbar, Typography, Box, useTheme } from '@mui/material';
import ExampleMenu from '@components/MainPage/ExampleMenu';

export function MainHeader() {
  const theme = useTheme();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: theme.palette.primary.main,
        borderBottom: `5px solid ${theme.palette.primary.dark}`,
        color: theme.palette.primary.contrastText,
      }}
    >
      <Toolbar
        variant="dense"
        sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: { xs: 1, md: 0 } }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 500,
            fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
            lineHeight: 1.25,
          }}
        >
          Configuration Graph Visualizer
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <ExampleMenu />
      </Toolbar>
    </AppBar>
  );
}
