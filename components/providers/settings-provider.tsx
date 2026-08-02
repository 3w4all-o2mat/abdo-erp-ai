"use client";
import * as React from "react";

type SettingsContextValue = { currency: string };

const SettingsContext = React.createContext<SettingsContextValue>({ currency: "DZD" });

/**
 * Provides app-wide settings (currently just the company currency) to client
 * components. Wrap a server-rendered tree with this provider after fetching
 * the setting from the database; nested client components can then read the
 * currency with `useSettingsCurrency()` and pass it to `formatMoney`.
 */
export function SettingsProvider({ currency, children }: { currency: string; children: React.ReactNode }) {
  const value = React.useMemo(() => ({ currency }), [currency]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsCurrency(): string {
  return React.useContext(SettingsContext).currency;
}
