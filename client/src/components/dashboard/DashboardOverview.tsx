import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  ShieldCheck, 
  Network, 
  ArrowUp, 
  Ban, 
  Plus 
} from "lucide-react";
import { DashboardStats } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  indicator?: React.ReactNode;
}> = ({ title, value, icon, iconBgColor, iconTextColor, indicator }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div className={`p-2 ${iconBgColor} rounded-md ${iconTextColor}`}>
            {icon}
          </div>
        </div>
        {indicator && (
          <div className="mt-4 text-sm">
            {indicator}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardOverview: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/stats'],
  });

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Error loading dashboard statistics
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 - Files */}
        {isLoading ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-full">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
              <Skeleton className="h-4 w-32 mt-4" />
            </CardContent>
          </Card>
        ) : (
          <StatCard
            title="Total Files"
            value={stats?.totalFiles || 0}
            icon={<FileText className="h-5 w-5" />}
            iconBgColor="bg-blue-50"
            iconTextColor="text-primary"
            indicator={
              <>
                <span className="text-success font-medium">
                  <ArrowUp className="h-3 w-3 inline mr-1" /> {stats?.newFilesThisWeek || 0} new
                </span>
                <span className="text-gray-500"> this week</span>
              </>
            }
          />
        )}
        
        {/* Card 2 - Access */}
        {isLoading ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-full">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
              <Skeleton className="h-4 w-32 mt-4" />
            </CardContent>
          </Card>
        ) : (
          <StatCard
            title="Access Requests"
            value={stats?.totalAccessRequests || 0}
            icon={<ShieldCheck className="h-5 w-5" />}
            iconBgColor="bg-green-50"
            iconTextColor="text-success"
            indicator={
              <>
                <span className="text-dark font-medium">
                  <Ban className="h-3 w-3 inline mr-1 text-danger" /> {stats?.deniedRequestsLast24h || 0} denied
                </span>
                <span className="text-gray-500"> in last 24h</span>
              </>
            }
          />
        )}
        
        {/* Card 3 - IPs */}
        {isLoading ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-full">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
              <Skeleton className="h-4 w-32 mt-4" />
            </CardContent>
          </Card>
        ) : (
          <StatCard
            title="Whitelisted IPs"
            value={stats?.totalWhitelistedIps || 0}
            icon={<Network className="h-5 w-5" />}
            iconBgColor="bg-amber-50"
            iconTextColor="text-warning"
            indicator={
              <>
                <span className="text-dark font-medium">
                  <Plus className="h-3 w-3 inline mr-1 text-success" /> {stats?.recentlyAddedIps || 0} added
                </span>
                <span className="text-gray-500"> recently</span>
              </>
            }
          />
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
