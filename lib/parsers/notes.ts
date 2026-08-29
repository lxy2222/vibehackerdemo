export type NoteChunk = {
  heading: string | null;
  text: string;
  paragraph: number;
};

export function parseNotes(raw: string): NoteChunk[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) {
    return [];
  }

  const sections = text.split(/^(#{1,6}\s+.+)$/m).filter((part) => part.length > 0);
  const chunks: NoteChunk[] = [];
  let heading: string | null = null;
  let paragraph = 1;

  for (const section of sections) {
    const headingMatch = section.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      heading = headingMatch[1].trim();
      continue;
    }

    const paragraphs = section
      .split(/\n{2,}/)
      .map((item) => item.replace(/\n/g, " ").trim())
      .filter(Boolean);

    for (const body of paragraphs) {
      chunks.push({ heading, text: body, paragraph });
      paragraph += 1;
    }
  }

  return chunks;
}
