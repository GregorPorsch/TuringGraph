// src/theme/augment.d.ts
export {};

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
    border: Palette['primary'];
    node: {
      currentConfig: string;
      selectableConfig: string;
    };
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
    border?: PaletteOptions['primary'];
    node?: {
      currentConfig?: string;
      selectableConfig?: string;
    };
  }

  interface Typography {
    fontFamilyMonospace: string;
  }
  interface TypographyOptions {
    fontFamilyMonospace?: string;
  }
}

declare module '@mui/material/styles/createTypography' {
  interface FontStyle {
    fontFamilyMonospace: string;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    accent: true;
    border: true;
  }
}
