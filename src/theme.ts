import type { MantineThemeOverride } from "@mantine/core";
import { createTheme, SegmentedControl } from "@mantine/core";

export const mantineTheme: MantineThemeOverride = createTheme({
  colors: {
    darker: [
      "#ffffff",
      "#e7e7e7",
      "#cdcdcd",
      "#b2b2b2",
      "#9a9a9a",
      "#8b8b8b",
      "#848484",
      "#717171",
      "#656565",
      "#000000"
    ]
  },
  primaryColor: "darker",
  primaryShade: 9,
  radius: {
    default: '0px',
  },

  components: {
    SegmentedControl: SegmentedControl.extend({
      styles: {
        root: {
          border: '1px dashed var(--mantine-color-text)',

          backgroundColor: "inherit",
          '&[data-disabled]': {
            border: '1px dotted var(--mantine-color-text)',
          }
        },
        indicator: {
          border: '1px solid var(--mantine-color-text)',

          boxShadow: 'none',
        }
      }
    })
  }
});