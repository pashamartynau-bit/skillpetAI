import { readdir } from "node:fs/promises";
import path from "node:path";

export type CharacterOption = {
  fileName: string;
  name: string;
  imageSrc: string;
};

const CHARACTER_DIRECTORY = path.join(process.cwd(), "public", "characters");
const SUPPORTED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

function getCanonicalFileStem(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/_\d+$/, "");
}

function toDisplayName(fileStem: string) {
  if (!fileStem) {
    return fileStem;
  }

  return fileStem[0].toUpperCase() + fileStem.slice(1);
}

const CHARACTER_ORDER = ["pip", "kumo", "rexi", "uni", "hedge", "byte", "milo", "nimbus"];

export async function getCharacterOptions(): Promise<CharacterOption[]> {
  const fileNames = await readdir(CHARACTER_DIRECTORY);
  const sortedFileNames = [...fileNames].sort((left, right) =>
    left.localeCompare(right),
  );
  const dedupedCharacters = new Map<string, CharacterOption>();

  for (const fileName of sortedFileNames) {
    const extension = path.extname(fileName).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      continue;
    }

    const fileStem = getCanonicalFileStem(fileName);
    const name = toDisplayName(fileStem);
    const dedupeKey = name.toLowerCase();

    if (dedupedCharacters.has(dedupeKey)) {
      continue;
    }

    dedupedCharacters.set(dedupeKey, {
      fileName,
      name,
      imageSrc: `/characters/${fileName}`,
    });
  }

  const result = [...dedupedCharacters.values()];
  result.sort((a, b) => {
    const indexA = CHARACTER_ORDER.indexOf(a.name.toLowerCase());
    const indexB = CHARACTER_ORDER.indexOf(b.name.toLowerCase());
    if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return result;
}
