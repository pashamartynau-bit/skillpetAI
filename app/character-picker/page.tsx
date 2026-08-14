import { CharacterPickerScreen } from "@/components/character-picker-screen";
import { getCharacterOptions } from "@/lib/character-options";

export default async function CharacterPickerPage() {
  const characterOptions = await getCharacterOptions();

  return <CharacterPickerScreen characters={characterOptions} />;
}
