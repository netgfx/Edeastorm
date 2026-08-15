/** @format */

"use client";

import { useState, useEffect } from "react";
import { useActivityStore } from "@/store/activityStore";
import type { ActivityLog as ActivityLogType } from "@/store/activityStore";

interface ActivityLogProps {
  organizationId?: string;
  userId?: string;
  limit?: number;
}

export function ActivityLog({
  organizationId,
  userId,
  limit = 50,
}: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const { filters, setFilters } = useActivityStore();

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, userId, limit, offset, filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (organizationId) params.append("organization_id", organizationId);
      if (userId) params.append("user_id", userId);
      if (filters.action) params.append("action", filters.action);
      if (filters.entityType)
        params.append("entity_type", filters.entityType);

      const response = await fetch(`/api/activity?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch activities");
      }

      setActivities(data.activities);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.startsWith("auth.")) return "text-blue-600 bg-blue-50";
    if (action.startsWith("org.")) return "text-purple-600 bg-purple-50";
    if (action.startsWith("board.")) return "text-green-600 bg-green-50";
    if (action.startsWith("security.")) return "text-red-600 bg-red-50";
    if (action.startsWith("user.")) return "text-indigo-600 bg-indigo-50";
    return "text-gray-600 bg-gray-50";
  };

  const getActionIcon = (action: string) => {
    if (action.includes("login")) return "🔐";
    if (action.includes("logout")) return "🚪";
    if (action.includes("signup")) return "✨";
    if (action.includes("invitation")) return "📧";
    if (action.includes("member")) return "👥";
    if (action.includes("board")) return "📋";
    if (action.includes("created")) return "➕";
    if (action.includes("deleted")) return "🗑️";
    if (action.includes("updated")) return "✏️";
    return "📝";
  };

  const formatAction = (action: string) => {
    return action
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" - ");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={fetchActivities}
          className="mt-2 text-sm text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
        <div className="text-sm text-gray-500">
          Showing {activities.length} of {total} activities
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filters.action || ""}
          onChange={(e) =>
            setFilters({ ...filters, action: e.target.value || undefined })
          }
          className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Actions</option>
          <option value="auth.login">Login</option>
          <option value="auth.logout">Logout</option>
          <option value="auth.signup">Signup</option>
          <option value="org.invitation_sent">Invitation Sent</option>
          <option value="org.invitation_accepted">Invitation Accepted</option>
          <option value="org.member_added">Member Added</option>
        </select>

        <button
          onClick={() => {
            setFilters({});
            setOffset(0);
          }}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
        >
          Clear Filters
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-2">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No activities found
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="text-2xl">{getActionIcon(activity.action)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}
                  >
                    {formatAction(activity.action)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(activity.created_at)}
                  </span>
                </div>
                {activity.user_id && (
                  <div className="text-sm text-gray-600">
                    User ID: {activity.user_id.substring(0, 8)}...
                  </div>
                )}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Details
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(activity.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between pt-4 border-t">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {Math.floor(offset / limit) + 1} of{" "}
            {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
