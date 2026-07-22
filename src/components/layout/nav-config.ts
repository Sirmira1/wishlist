import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  FolderHeart,
  DoorOpen,
  BarChart3,
  Wallet,
  Cpu,
  Car,
  Activity,
  Settings,
  Upload,
  DatabaseBackup,
  Trophy,
  Map,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export type NavSection = { title: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/items", label: "All Items", icon: Package },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/activity", label: "Activity", icon: Activity },
    ],
  },
  {
    title: "Organize",
    items: [
      { href: "/collections", label: "Collections", icon: FolderHeart },
      { href: "/rooms", label: "Rooms", icon: DoorOpen },
      { href: "/pc-builds", label: "PC Builds", icon: Cpu },
      { href: "/vehicles", label: "Vehicles", icon: Car },
    ],
  },
  {
    title: "Plan",
    items: [
      { href: "/budget", label: "Budget & Goals", icon: Wallet },
      { href: "/roadmap", label: "Roadmap", icon: Map },
      { href: "/achievements", label: "Achievements", icon: Trophy },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/import", label: "Import / Export", icon: Upload, adminOnly: true },
      { href: "/backup", label: "Backup", icon: DatabaseBackup, adminOnly: true },
      { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
    ],
  },
];
