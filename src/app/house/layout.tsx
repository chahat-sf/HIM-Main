import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "The House — HIM",
  description: "Look through the windows and step into the rooms.",
};

export default function HouseLayout({ children }: { children: ReactNode }) {
  return children;
}
