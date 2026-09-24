"use client";

import type { ComponentType } from "react";
import type { IconComponent } from "../../../contracts/icon";
import type { IconProps } from "./icon";
import { ArrowLeft } from "./arrow-left";
import { ArrowRight } from "./arrow-right";
import { BadgeCheck } from "./badge-check";
import { Bell } from "./bell";
import { Check } from "./check";
import { ChevronDown } from "./chevron-down";
import { ChevronLeft } from "./chevron-left";
import { ChevronRight } from "./chevron-right";
import { ChevronUp } from "./chevron-up";
import { CircleCheckBig } from "./circle-check-big";
import { CircleCheck } from "./circle-check";
import { ClipboardList } from "./clipboard-list";
import { Clock } from "./clock";
import { Cog } from "./cog";
import { Compass } from "./compass";
import { Copy } from "./copy";
import { Download } from "./download";
import { Heart } from "./heart";
import { Layers } from "./layers";
import { LayoutDashboard } from "./layout-dashboard";
import { Lightbulb } from "./lightbulb";
import { Link2 } from "./link-2";
import { Lock } from "./lock";
import { LogIn } from "./log-in";
import { LogOut } from "./log-out";
import { MapPin } from "./map-pin";
import { Menu } from "./menu";
import { MessageCircle } from "./message-circle";
import { MessageSquare } from "./message-square";
import { Moon } from "./moon";
import { PanelLeftClose } from "./panel-left-close";
import { PanelLeftOpen } from "./panel-left-open";
import { Paperclip } from "./paperclip";
import { PartyPopper } from "./party-popper";
import { Play } from "./play";
import { Plus } from "./plus";
import { Search } from "./search";
import { Send } from "./send";
import { Settings } from "./settings";
import { SlidersHorizontal } from "./sliders-horizontal";
import { Sparkles } from "./sparkles";
import { Star } from "./star";
import { Store } from "./store";
import { Sun } from "./sun";
import { ThumbsUp } from "./thumbs-up";
import { Trash2 } from "./trash-2";
import { Upload } from "./upload";
import { UserRound } from "./user-round";
import { Users } from "./users";
import { X } from "./x";

type AnimatedIcon = ComponentType<IconProps<string>>;

const BY_NAME = {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Check,
  CheckCircle: CircleCheck,
  CheckCircle2: CircleCheckBig,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  CircleCheckBig,
  ClipboardList,
  Clock,
  Cog,
  Compass,
  Copy,
  Download,
  Heart,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Link2,
  Lock,
  LogIn,
  LogInIcon: LogIn,
  LogOut,
  LogOutIcon: LogOut,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  PartyPopper,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  Settings2: Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Sun,
  ThumbsUp,
  Trash2,
  Upload,
  UserRound,
  Users,
  Users2: Users,
  X,
} as unknown as Record<string, AnimatedIcon>;

export function resolveAnimatedIcon(icon: IconComponent): AnimatedIcon | undefined {
  const key = icon.displayName ?? icon.name;
  return key ? BY_NAME[key] : undefined;
}

/** Icon names an admin can pick from when authoring onboarding decorations. */
export const ANIMATED_ICON_NAMES = Object.keys(BY_NAME).sort();

export function resolveAnimatedIconByName(name: string): AnimatedIcon | undefined {
  return BY_NAME[name];
}
