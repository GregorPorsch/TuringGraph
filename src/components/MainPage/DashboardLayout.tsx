// src/components/MainPage/DashboardLayout.tsx
import type { MutableRefObject } from 'react';
import { Container, Tooltip, IconButton, Button } from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { PanelCard } from '@components/MainPage/PanelCard';
import TapeList from '@components/TapeList/TapeList';
import CodeEditor from '@components/CodeEditor/CodeEditor';
import styles from '../../App.module.css';

type DashboardLayoutProps = {
  tmPanelRef: MutableRefObject<HTMLDivElement | null>;
  configPanelRef: MutableRefObject<HTMLDivElement | null>;
  treePanelRef: MutableRefObject<HTMLDivElement | null>;
  tmFsOpen: boolean;
  configFsOpen: boolean;
  treeFsOpen: boolean;
  onOpenTmFullscreen: () => void;
  onOpenConfigFullscreen: () => void;
  onOpenTreeFullscreen: () => void;
  onOpenCompute: () => void;
};

export function DashboardLayout({
  tmPanelRef,
  configPanelRef,
  treePanelRef,
  tmFsOpen,
  configFsOpen,
  treeFsOpen,
  onOpenTmFullscreen,
  onOpenConfigFullscreen,
  onOpenTreeFullscreen,
  onOpenCompute,
}: DashboardLayoutProps) {
  return (
    <Container
      maxWidth="xl"
      sx={{
        px: { xs: 1.5, sm: 2, lg: 3 },
        pt: { xs: 1.5, md: 2 },
        pb: 0,
      }}
    >
      <div className={styles.app_container}>
        <section className={styles.graph_area}>
          <PanelCard
            title="Turing Machine"
            minHeight={{ xs: 260, sm: 320, md: 460, lg: 500 }}
            actions={
              <Tooltip title="Open Fullscreen">
                <IconButton
                  size="small"
                  onClick={onOpenTmFullscreen}
                  sx={{
                    border: '1px solid',
                    borderColor: (theme) => theme.palette.divider,
                    bgcolor: (theme) => theme.palette.background.paper,
                    '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
                  }}
                >
                  <OpenInFullIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          >
            <div
              ref={tmPanelRef}
              className={`${styles.portal_mount} ${tmFsOpen ? styles.portal_hidden : ''}`}
            />
          </PanelCard>
        </section>

        <section className={styles.tape_area}>
          <PanelCard title="Tapes" denseBodyPadding>
            <TapeList />
          </PanelCard>
        </section>

        <section className={styles.editor_area}>
          <CodeEditor />
        </section>

        <section className={styles.bottom_area}>
          <div className={styles.bottom_split}>
            <PanelCard
              title="Configuration Graph"
              minHeight={{ xs: 320, sm: 380, md: 520, lg: 640 }}
              actions={
                <Tooltip title="Open Fullscreen">
                  <IconButton
                    size="small"
                    onClick={onOpenConfigFullscreen}
                    sx={{
                      border: '1px solid',
                      borderColor: (theme) => theme.palette.divider,
                      bgcolor: (theme) => theme.palette.background.paper,
                      '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
                    }}
                  >
                    <OpenInFullIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
            >
              <div
                ref={configPanelRef}
                className={`${styles.portal_mount} ${
                  configFsOpen ? styles.portal_hidden : ''
                }`}
              />
            </PanelCard>

            <PanelCard
              title="Computation Tree"
              minHeight={{ xs: 320, sm: 380, md: 520, lg: 640 }}
              actions={
                <>
                  <Button size="small" variant="contained" onClick={onOpenCompute}>
                    Compute Tree
                  </Button>
                  <Tooltip title="Open Fullscreen">
                    <IconButton
                      size="small"
                      onClick={onOpenTreeFullscreen}
                      sx={{
                        border: '1px solid',
                        borderColor: (theme) => theme.palette.divider,
                        bgcolor: (theme) => theme.palette.background.paper,
                        '&:hover': {
                          bgcolor: (theme) => theme.palette.action.hover,
                        },
                      }}
                    >
                      <OpenInFullIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              }
            >
              <div
                ref={treePanelRef}
                className={`${styles.portal_mount} ${
                  treeFsOpen ? styles.portal_hidden : ''
                }`}
              />
            </PanelCard>
          </div>
        </section>
      </div>
    </Container>
  );
}
