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

const BottomDrawerContext = createContext<DrawerContextProps | null>(null);

export function BottomDrawerProvider({ children }: { children: ReactNode }) {
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
    <BottomDrawerContext.Provider value={{ openDrawer, closeDrawer, drawer }}>
      {children}
    </BottomDrawerContext.Provider>
  );
}

export const useBottomDrawer = () => {
  const ctx = useContext(BottomDrawerContext);
  if (!ctx)
    throw new Error("useBottomDrawer must be used inside <BottomDrawerProvider />");
  return ctx;
};
