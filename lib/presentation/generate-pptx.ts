import PptxGenJS from "pptxgenjs";
import { getDemoDeck } from "@/lib/demo/hardcoded-deck";
import { renderDeck } from "@/lib/presentation/renderers";
import { layout, theme } from "@/lib/presentation/theme";
import type { DeckSpec, Fact } from "@/lib/presentation/types";

export async function generatePptxBuffer(spec: DeckSpec, facts: Fact[]): Promise<Buffer> {
  const pres = new PptxGenJS();
  pres.layout = layout.name;
  pres.title = spec.title;
  pres.author = "汇报不返工";
  pres.subject = spec.subtitle;
  pres.theme = {
    headFontFace: theme.font,
    bodyFontFace: theme.font,
  };

  pres.defineSlideMaster({
    title: "CONTENT",
    background: { color: theme.bg },
  });

  renderDeck(pres, spec, facts);

  const output = await pres.write({ outputType: "nodebuffer" });
  return Buffer.from(output as Uint8Array);
}

export async function generateDemoPptx(options?: {
  emptyDataSlides?: boolean;
}): Promise<Buffer> {
  const emptyDataSlides = options?.emptyDataSlides ?? false;
  const { spec, facts } = getDemoDeck(emptyDataSlides);
  return generatePptxBuffer(spec, facts);
}
