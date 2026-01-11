/** @format */

"use client";

import { useState, useEffect } from "react";
import { useFlags } from "flagsmith/react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Zap, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";

export default function PricingPage() {
  const flags = useFlags(["pricing_view"]);
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  // Redirect if feature flag is disabled
  useEffect(() => {
    if (flags.pricing_view && !flags.pricing_view.enabled) {
      router.push("/");
    }
  }, [flags.pricing_view, router]);

  // If flag is disabled or loading (optional check), don't render content
  if (!flags.pricing_view?.enabled) {
    return null;
  }

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/forever",
      description: "Perfect for trying out Edeastorm.",
      features: [
        "1 Seat",
        "2 Boards",
        "Basic Templates",
        "Real-time Collaboration",
      ],
      cta: "Get Started",
      variant: "outline" as const,
    },
    {
      name: "Starter",
      price: billingCycle === "monthly" ? "$9" : "$7.50",
      period: "/month",
      billed:
        billingCycle === "yearly" ? "$90 billed yearly" : "billed monthly",
      description: "For small teams getting started.",
      features: [
        "5 Boards",
        "10 Collaborators",
        "Standard Templates",
        "Export to PDF",
      ],
      cta: "Start Free Trial",
      variant: "default" as const,
      popular: false,
    },
    {
      name: "Professional",
      price: billingCycle === "monthly" ? "$29" : "$24.17",
      period: "/month",
      billed:
        billingCycle === "yearly" ? "$290 billed yearly" : "billed monthly",
      description: "For growing teams and power users.",
      features: [
        "Unlimited Boards",
        "50 Collaborators",
        "Advanced Templates",
        "Priority Support",
        "Version History",
      ],
      cta: "Upgrade Now",
      variant: "default" as const,
      popular: true,
    },
    {
      name: "Enterprise",
      price: billingCycle === "monthly" ? "$99" : "$82.50",
      period: "/month",
      billed:
        billingCycle === "yearly" ? "$990 billed yearly" : "billed monthly",
      description: "For large organizations requiring control.",
      features: [
        "Unlimited Everything",
        "SSO Integration",
        "Admin Controls",
        "Dedicated Support",
        "Custom Contracts",
      ],
      cta: "Contact Sales",
      variant: "outline" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Edeastorm</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple pricing for{" "}
              <span className="gradient-text">every team</span>
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Choose the plan that fits your needs. Upgrade or downgrade at any
              time.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span
                className={`text-sm font-medium ${
                  billingCycle === "monthly" ? "text-white" : "text-zinc-500"
                }`}
              >
                Monthly
              </span>
              <button
                onClick={() =>
                  setBillingCycle(
                    billingCycle === "monthly" ? "yearly" : "monthly"
                  )
                }
                className="relative w-14 h-8 rounded-full bg-zinc-800 p-1 transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-violet-500 shadow-sm transition-transform ${
                    billingCycle === "yearly"
                      ? "translate-x-6"
                      : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  billingCycle === "yearly" ? "text-white" : "text-zinc-500"
                }`}
              >
                Yearly{" "}
                <span className="text-violet-400 text-xs ml-1">
                  (Save ~20%)
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col p-6 rounded-2xl border ${
                  plan.popular
                    ? "border-violet-500 bg-zinc-900/50 shadow-xl shadow-violet-500/10"
                    : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-violet-500 text-white text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-zinc-500">{plan.period}</span>
                  </div>
                  {plan.billed && (
                    <p className="text-xs text-zinc-500">{plan.billed}</p>
                  )}
                  <p className="text-sm text-zinc-400 mt-4">
                    {plan.description}
                  </p>
                </div>

                <div className="flex-1 mb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-zinc-300"
                      >
                        <Check className="w-5 h-5 text-violet-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant={plan.variant}
                  className={`w-full ${
                    plan.popular ? "bg-violet-600 hover:bg-violet-700" : ""
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
