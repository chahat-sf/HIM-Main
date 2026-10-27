import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type SiteShellProps = {
  children: ReactNode;
  /** Hide footer on routes that render their own (rare). */
  showFooter?: boolean;
};

/** Shared commerce chrome: Navbar + page body + Footer. */
export default function SiteShell({
  children,
  showFooter = true,
}: SiteShellProps) {
  return (
    <>
      <Navbar />
      {children}
      {showFooter ? <Footer /> : null}
    </>
  );
}
