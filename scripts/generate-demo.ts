import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateDemoPptx } from "../lib/presentation/generate-pptx";

async function main() {
  const outDir = path.join(process.cwd(), "artifacts");
  await mkdir(outDir, { recursive: true });

  const full = await generateDemoPptx();
  const empty = await generateDemoPptx({ emptyDataSlides: true });

  await writeFile(path.join(outDir, "q2-review-demo.pptx"), full);
  await writeFile(path.join(outDir, "q2-review-missing-data.pptx"), empty);

  console.log(`wrote ${full.length} bytes (demo)`);
  console.log(`wrote ${empty.length} bytes (missing-data)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
