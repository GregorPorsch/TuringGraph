import { useRef, useState } from 'react';
import { ThemeProvider, CssBaseline, Button } from '@mui/material';
import { theme } from '@theme';
import { MainHeader } from '@components/MainPage/MainHeader';
import { DashboardLayout } from '@components/MainPage/DashboardLayout';
import { RunControls } from '@components/MainPage/RunControls';
import { ComputeTreeDialog } from '@components/MainPage/ComputeTreeDialog';
import {
  FullscreenPortals,
  type FullscreenPortalConfig,
} from '@components/MainPage/FullscreenPortals';
import { AppToaster } from '@components/MainPage/AppToaster';
import { TMGraphWrapper } from '@components/TMGraph/TMGraph';
import { ConfigGraphWrapper } from '@components/ConfigGraph/ConfigGraph';
import { ComputationTreeWrapper } from '@components/ComputationTree/ComputationTree';
import SiteFooter from '@components/Footer/SiteFooter';
import { useComputationTreeDepth, useGraphZustand } from '@zustands/GraphZustand';
import { DEFAULT_TREE_DEPTH } from '@utils/constants';

export default function App() {
  // Graph Zustand state and setters
  const computationTreeDepth = useComputationTreeDepth();
  const setComputationTreeDepth = useGraphZustand((s) => s.setComputationTreeDepth);

  // Local state for dialogs and fullscreen
  const [computeOpen, setComputeOpen] = useState(false);
  const [pendingDepth, setPendingDepth] = useState<number>(DEFAULT_TREE_DEPTH);
  const [pendingCompressed, setPendingCompressed] = useState<boolean>(false);
  const [compressed, setCompressed] = useState<boolean>(false);

  // Fullscreen states
  const [tmFsOpen, setTmFsOpen] = useState(false);
  const [tmFsRender, setTmFsRender] = useState(false);

  const [configFsOpen, setConfigFsOpen] = useState(false);
  const [configFsRender, setConfigFsRender] = useState(false);

  const [treeFsOpen, setTreeFsOpen] = useState(false);
  const [treeFsRender, setTreeFsRender] = useState(false);

  // Refs for panels and fullscreen containers
  const tmPanelRef = useRef<HTMLDivElement | null>(null);
  const tmFullscreenRef = useRef<HTMLDivElement | null>(null);
  const configPanelRef = useRef<HTMLDivElement | null>(null);
  const configFullscreenRef = useRef<HTMLDivElement | null>(null);
  const treePanelRef = useRef<HTMLDivElement | null>(null);
  const treeFullscreenRef = useRef<HTMLDivElement | null>(null);

  // Handlers for opening/closing "Compute Tree" dialog
  const openCompute = () => {
    setPendingDepth(computationTreeDepth);
    setPendingCompressed(compressed);
    setComputeOpen(true);
  };
  const closeCompute = () => setComputeOpen(false);

  // Handler for computing the tree with selected options
  const handleComputeConfirm = () => {
    setComputationTreeDepth(pendingDepth);
    setCompressed(pendingCompressed);
    setComputeOpen(false);

    if (treeFsOpen) {
      setTreeFsRender(false);
      requestAnimationFrame(() => setTreeFsRender(true));
    }
  };

  const runControls = <RunControls />;
  const treeFullscreenActions = (
    <Button size="small" variant="contained" onClick={openCompute}>
      Compute Tree
    </Button>
  );

  // Configuration for all fullscreen portals
  const fullscreenConfigs: FullscreenPortalConfig[] = [
    {
      id: 'tmGraph',
      title: 'Turing Machine — Fullscreen',
      open: tmFsOpen,
      onClose: () => setTmFsOpen(false),
      render: tmFsRender,
      setRender: setTmFsRender,
      fallbackRef: tmPanelRef,
      fullscreenRef: tmFullscreenRef,
      actions: runControls,
      content: <TMGraphWrapper />,
    },
    {
      id: 'configGraph',
      title: 'Configuration Graph — Fullscreen',
      open: configFsOpen,
      onClose: () => setConfigFsOpen(false),
      render: configFsRender,
      setRender: setConfigFsRender,
      fallbackRef: configPanelRef,
      fullscreenRef: configFullscreenRef,
      actions: runControls,
      content: <ConfigGraphWrapper />,
    },
    {
      id: 'computationTree',
      title: 'Computation Tree — Fullscreen',
      open: treeFsOpen,
      onClose: () => setTreeFsOpen(false),
      render: treeFsRender,
      setRender: setTreeFsRender,
      fallbackRef: treePanelRef,
      fullscreenRef: treeFullscreenRef,
      actions: treeFullscreenActions,
      content: (
        <ComputationTreeWrapper
          depth={computationTreeDepth}
          compressing={compressed}
        />
      ),
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainHeader />

      {/* Display graph panels */}
      <DashboardLayout
        tmPanelRef={tmPanelRef}
        configPanelRef={configPanelRef}
        treePanelRef={treePanelRef}
        tmFsOpen={tmFsOpen}
        configFsOpen={configFsOpen}
        treeFsOpen={treeFsOpen}
        onOpenTmFullscreen={() => setTmFsOpen(true)}
        onOpenConfigFullscreen={() => setConfigFsOpen(true)}
        onOpenTreeFullscreen={() => setTreeFsOpen(true)}
        onOpenCompute={openCompute}
      />

      <ComputeTreeDialog
        open={computeOpen}
        depth={pendingDepth}
        compressed={pendingCompressed}
        onDepthChange={setPendingDepth}
        onCompressedChange={setPendingCompressed}
        onClose={closeCompute}
        onConfirm={handleComputeConfirm}
      />

      {/* Fullscreen portals for graphs */}
      <FullscreenPortals items={fullscreenConfigs} />

      <SiteFooter />
      <AppToaster />
    </ThemeProvider>
  );
}
