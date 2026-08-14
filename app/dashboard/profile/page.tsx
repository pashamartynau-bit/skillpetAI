import { ProfilePageScreen } from "@/components/profile-page-screen";
import { getCharacterOptions } from "@/lib/character-options";

export default async function DashboardProfilePage() {
  const characters = await getCharacterOptions();

  return <ProfilePageScreen characters={characters} />;
}
