import React, { createContext, useContext, useState, ReactNode } from "react";

interface DrawerOptions {
  title?: string;
  height?: number | string;
  content?: ReactNode;
}

interface DrawerContextProps {
  openDrawer: (options: DrawerOptions) => void;
  closeDrawer: () => void;
  drawer: DrawerOptions & { isVisible: boolean };
}

const bottom_drawerContext = createContext<DrawerContextProps | null>(null);

export function bottom_drawerProvider({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState<{
    isVisible: boolean;
    title: string;
    content: ReactNode;
    height: string;
  }>({
    isVisible: false,
    title: "",
    content: null,
    height: "35%",
  });

  const openDrawer = (options: DrawerOptions) => {
    setDrawer({
      isVisible: true,
      title: options.title ?? "",
      content: options.content ?? null,
      height: String(options.height ?? "35%"),
    });
  };

  const closeDrawer = () => {
    setDrawer((prev) => ({ ...prev, isVisible: false }));
  };

  return (
    <bottom_drawerContext.Provider value={{ openDrawer, closeDrawer, drawer }}>
      {children}
    </bottom_drawerContext.Provider>
  );
}

export const use_bottom_drawer = () => {
  const ctx = useContext(bottom_drawerContext);
  if (ctx) return ctx;

  return {
    openDrawer: () => {},
    closeDrawer: () => {},
    drawer: {
      isVisible: false,
      title: '',
      content: null,
      height: '35%',
    },
  };
};
