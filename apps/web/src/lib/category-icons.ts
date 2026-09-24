import type { IconComponent } from "@ceylonweddings/ui/components/icon";
import {
  Building2,
  Bus,
  Cake,
  Camera,
  Car,
  ClipboardList,
  Flower2,
  Gem,
  Hotel,
  Mail,
  MoonStar,
  Music,
  Scissors,
  Shirt,
  Sparkles,
  Stamp,
  Store,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, IconComponent> = {
  VENUE: Building2,
  PHOTO_VIDEO: Camera,
  BRIDAL_WEAR: Shirt,
  GROOM_WEAR: UserRound,
  JEWELLERY: Gem,
  HAIR_MAKEUP: Scissors,
  BRIDAL_DRESSER: Sparkles,
  FLORIST_DECOR: Flower2,
  CATERER: UtensilsCrossed,
  CAKE: Cake,
  ENTERTAINMENT: Music,
  PORUWA: Sparkles,
  ASTROLOGY: MoonStar,
  WEDDING_CARS: Car,
  INVITATIONS: Mail,
  PLANNER: ClipboardList,
  REGISTRAR: Stamp,
  MEHNDI: Sparkles,
  TRANSPORT: Bus,
  ACCOMMODATION: Hotel,
};

export function categoryIcon(slug: string): IconComponent {
  return CATEGORY_ICONS[slug] ?? Store;
}
