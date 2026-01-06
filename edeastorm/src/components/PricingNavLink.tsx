/** @format */

"use client";

import Link from "next/link";
import { useFlags } from "flagsmith/react";
import { Button } from "@/components/ui/Button";

export function PricingNavLink() {
  const flags = useFlags(["pricing_view"]);

  if (!flags.pricing_view?.enabled) {
    return null;
  }

  return (
    <Link href="/pricing">
      <Button variant="ghost">Pricing</Button>
    </Link>
  );
}
