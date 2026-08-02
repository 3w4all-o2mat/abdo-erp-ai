"use client";
import * as React from "react";
import {
  LayoutDashboard, Users, ShieldCheck, Package, FolderTree, Users2, Truck,
  FileText, ShoppingCart, Receipt, Warehouse, ArrowLeftRight, SlidersHorizontal,
  Wallet, ReceiptText, Settings, FileEdit, History, Building2, Info, ChevronRight, ChevronDown,
  LayoutTemplate, CircleDollarSign, UserCog, Activity, Map, Tag, Cog, Cpu, Filter, Layers,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Package,
  FolderTree,
  Users2,
  Truck,
  FileText,
  ShoppingCart,
  Receipt,
  Warehouse,
  ArrowLeftRight,
  SlidersHorizontal,
  Wallet,
  ReceiptText,
  Settings,
  FileEdit,
  History,
  Building2,
  Info,
  ChevronRight,
  ChevronDown,
  LayoutTemplate,
  CircleDollarSign,
  UserCog,
  Activity,
  Map,
  Tag,
  Cog,
  Cpu,
  Filter,
  Layers,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}
