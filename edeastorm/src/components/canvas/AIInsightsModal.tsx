/** @format */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Sparkles,
  Lightbulb,
  TrendingUp,
  FileText,
  Target,
  Loader2,
  CheckCircle,
  XCircle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editorStore";
import toast from "react-hot-toast";

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

type AIFeature = "cluster" | "enhance" | "summarize" | "sentiment";

interface FeatureCard {
  id: AIFeature;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

const features: FeatureCard[] = [
  {
    id: "cluster",
    title: "Smart Clustering",
    description:
      "Automatically group similar ideas and create category labels like Problems, Solutions, Ideas, Action Items",
    icon: Layers,
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "enhance",
    title: "Idea Enhancement",
    description:
      "Get AI-powered suggestions to improve, expand, or create variations of your ideas",
    icon: Lightbulb,
    color: "text-yellow-500",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    id: "summarize",
    title: "Session Summary",
    description:
      "Generate comprehensive summaries with key insights, themes, and actionable next steps",
    icon: FileText,
    color: "text-green-500",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "sentiment",
    title: "Engagement Analysis",
    description:
      "Analyze team dynamics, idea momentum, and collaboration quality with sentiment insights",
    icon: TrendingUp,
    color: "text-purple-500",
    gradient: "from-purple-500 to-pink-500",
  },
];

export function AIInsightsModal({
  isOpen,
  onClose,
  boardId,
}: AIInsightsModalProps) {
  const { theme } = useEditorStore();
  const [loadingFeature, setLoadingFeature] = useState<AIFeature | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(
    null
  );

  const handleFeatureClick = async (featureId: AIFeature) => {
    setLoadingFeature(featureId);
    setSelectedFeature(featureId);

    try {
      const response = await fetch(`/api/ai/${featureId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process request");
      }

      const data = await response.json();
      setResults((prev) => ({ ...prev, [featureId]: data.data }));
      toast.success(`${features.find((f) => f.id === featureId)?.title} completed!`);
    } catch (error) {
      console.error("AI feature error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process request"
      );
      setResults((prev) => ({
        ...prev,
        [featureId]: { error: error instanceof Error ? error.message : "Unknown error" },
      }));
    } finally {
      setLoadingFeature(null);
    }
  };

  const renderResults = () => {
    if (!selectedFeature || !results[selectedFeature]) {
      return null;
    }

    const result = results[selectedFeature];

    if (result.error) {
      return (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">
                Error
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {result.error}
              </p>
            </div>
          </div>
        </div>
      );
    }

    switch (selectedFeature) {
      case "cluster":
        return (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Clustering Complete</span>
            </div>
            {result.clusters?.clusters?.map(
              (cluster: any, index: number) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-xl border",
                    theme === "dark"
                      ? "bg-zinc-800/50 border-zinc-700"
                      : "bg-white border-zinc-200"
                  )}
                >
                  <h4 className="font-semibold text-lg mb-2">
                    {cluster.label}
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    {cluster.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>{cluster.itemIds?.length || 0} items</span>
                    <span>
                      Confidence: {Math.round((cluster.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
              )
            )}
            {result.clusters?.summary && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {result.clusters.summary}
                </p>
              </div>
            )}
          </div>
        );

      case "enhance":
        return (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Enhancements Generated</span>
            </div>
            {result.enhancements?.map((enhancement: any, index: number) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-xl border",
                  theme === "dark"
                    ? "bg-zinc-800/50 border-zinc-700"
                    : "bg-white border-zinc-200"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{enhancement.title}</h4>
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                    {enhancement.type}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  {enhancement.description}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 italic">
                  {enhancement.reasoning}
                </p>
              </div>
            ))}
          </div>
        );

      case "summarize":
        const summary = result.summary;
        return (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Summary Generated</span>
            </div>

            {summary?.summary && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <h4 className="font-semibold mb-2">Overview</h4>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {summary.summary}
                </p>
              </div>
            )}

            {summary?.keyInsights && summary.keyInsights.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Insights</h4>
                <div className="space-y-2">
                  {summary.keyInsights.map((insight: any, index: number) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-lg border",
                        theme === "dark"
                          ? "bg-zinc-800/50 border-zinc-700"
                          : "bg-white border-zinc-200"
                      )}
                    >
                      <h5 className="font-medium text-sm mb-1">
                        {insight.title}
                      </h5>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {insight.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary?.actionItems && summary.actionItems.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Action Items</h4>
                <div className="space-y-2">
                  {summary.actionItems.map((item: any, index: number) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-lg border",
                        theme === "dark"
                          ? "bg-zinc-800/50 border-zinc-700"
                          : "bg-white border-zinc-200"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4" />
                        <h5 className="font-medium text-sm">{item.title}</h5>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            item.priority === "high"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                              : item.priority === "medium"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          )}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary?.nextSteps && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h4 className="font-semibold mb-2">Next Steps</h4>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {summary.nextSteps}
                </p>
              </div>
            )}
          </div>
        );

      case "sentiment":
        const sentiment = result.sentiment;
        return (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Analysis Complete</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                <h4 className="font-semibold text-sm mb-1">Overall Score</h4>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round((sentiment?.overallScore || 0) * 100)}%
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h4 className="font-semibold text-sm mb-1">Sentiment</h4>
                <p className="text-lg font-semibold capitalize text-blue-600 dark:text-blue-400">
                  {sentiment?.sentiment || "neutral"}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <h4 className="font-semibold text-sm mb-1">Engagement</h4>
                <p className="text-lg font-semibold capitalize text-green-600 dark:text-green-400">
                  {sentiment?.engagement || "medium"}
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                <h4 className="font-semibold text-sm mb-1">Momentum</h4>
                <p className="text-lg font-semibold capitalize text-orange-600 dark:text-orange-400">
                  {sentiment?.momentum || "stable"}
                </p>
              </div>
            </div>

            {sentiment?.analysis && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                <h4 className="font-semibold mb-2">Analysis</h4>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {sentiment.analysis}
                </p>
              </div>
            )}

            {sentiment?.strengths && sentiment.strengths.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {sentiment.strengths.map((strength: string, index: number) => (
                    <li
                      key={index}
                      className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sentiment?.recommendations &&
              sentiment.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {sentiment.recommendations.map(
                      (rec: string, index: number) => (
                        <li
                          key={index}
                          className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2"
                        >
                          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-4xl max-h-[80vh] overflow-y-auto",
          theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white"
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-500" />
            AI Insights
          </DialogTitle>
          <DialogDescription>
            Powered by Gemini 2.5 Flash - Analyze your ideation session with
            advanced AI
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isLoading = loadingFeature === feature.id;
            const hasResults = !!results[feature.id];

            return (
              <button
                key={feature.id}
                onClick={() => handleFeatureClick(feature.id)}
                disabled={isLoading}
                className={cn(
                  "relative p-6 rounded-2xl border-2 text-left transition-all duration-200",
                  "hover:shadow-xl hover:scale-[1.02]",
                  theme === "dark"
                    ? "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                    : "bg-white border-zinc-200 hover:bg-zinc-50",
                  isLoading && "opacity-50 cursor-not-allowed",
                  hasResults && "border-green-500"
                )}
              >
                {hasResults && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}

                <div
                  className={cn(
                    "w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br",
                    feature.gradient
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Icon className="w-6 h-6 text-white" />
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </button>
            );
          })}
        </div>

        {renderResults()}
      </DialogContent>
    </Dialog>
  );
}
