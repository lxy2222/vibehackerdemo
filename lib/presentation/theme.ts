/** PPT visual language is independent from the workbench UI. */
export const theme = {
  ink: "161616",
  paper: "F2F0EA",
  lime: "C8F04A",
  sage: "9AA88A",
  sageDeep: "6B7658",
  stone: "C9C3B5",
  muted: "7A776E",
  body: "3A3834",
  line: "D8D4CA",
  white: "FFFFFF",
  paperAlt: "E8E6DF",
  font: "Microsoft YaHei",
  bg: "F2F0EA",
  title: "161616",
  primary: "161616",
  accent: "C8F04A",
  secondary: "9AA88A",
  cream: "E8E6DF",
  lavender: "E4E8DC",
  olive: "6B7658",
} as const;

export const pptCssVars = {
  "--ppt-ink": "#161616",
  "--ppt-paper": "#F2F0EA",
  "--ppt-lime": "#C8F04A",
  "--ppt-sage": "#9AA88A",
  "--ppt-sage-deep": "#6B7658",
  "--ppt-stone": "#C9C3B5",
  "--ppt-muted": "#7A776E",
  "--ppt-body": "#3A3834",
  "--ppt-line": "#D8D4CA",
  "--ppt-white": "#FFFFFF",
  "--ppt-paper-alt": "#E8E6DF",
} as const;

export const layout = {
  name: "LAYOUT_WIDE" as const,
  width: 13.333,
  height: 7.5,
};
