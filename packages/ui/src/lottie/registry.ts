import type { IconComponent } from "../contracts/icon";
import heart from "./animations/heart.json";
import store from "./animations/store.json";
import check from "./animations/check.json";
import arrowRight from "./animations/arrow-right.json";
import search from "./animations/search.json";
import star from "./animations/star.json";
import home from "./animations/home.json";
import cake from "./animations/cake.json";
import music from "./animations/music.json";
import image from "./animations/image.json";
import pin from "./animations/pin.json";
import calendar from "./animations/calendar.json";
import truck from "./animations/truck.json";
import message from "./animations/message.json";
import pencil from "./animations/pencil.json";

/** Lottie JSON animation data (Bodymovin). */
export type LottieAnimationData = object;

/**
 * Lucide displayName / name → monochrome Lottie JSON.
 * Icons from Unicorn Icons (free for personal + commercial use).
 * Closest-fit mapping for vendor categories included.
 */
const BY_NAME: Record<string, LottieAnimationData> = {
  // Core UI
  Heart: heart,
  Store: store,
  Check: check,
  ArrowRight: arrowRight,
  Search: search,
  Star: star,
  Sparkles: star,

  // Vendor categories (and aliases)
  Building2: home,
  Building: home,
  Hotel: home,
  Home: home,
  Camera: image,
  Image: image,
  Cake: cake,
  UtensilsCrossed: cake,
  Utensils: cake,
  Music: music,
  MapPin: pin,
  Car: truck,
  Bus: truck,
  Truck: truck,
  ClipboardList: calendar,
  Calendar: calendar,
  Mail: message,
  MessageCircle: message,
  MessageSquare: message,
  Pencil: pencil,
  Scissors: pencil,
  Shirt: store,
  UserRound: store,
  Gem: star,
  MoonStar: star,
  Flower2: heart,
  Stamp: check,
};

export function resolveLottieAnimation(icon: IconComponent): LottieAnimationData | undefined {
  const key = icon.displayName ?? icon.name;
  return key ? BY_NAME[key] : undefined;
}

export function listLottieIconNames(): string[] {
  return Object.keys(BY_NAME);
}
