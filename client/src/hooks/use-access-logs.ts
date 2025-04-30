import { useQuery } from "@tanstack/react-query";
import { AccessLog } from "@shared/schema";

interface AccessLogWithFilename extends AccessLog {
  filename?: string | null;
}

export function useAccessLogs(filter: string = 'all') {
  return useQuery<AccessLogWithFilename[]>({
    queryKey: ['/api/access-logs', filter],
    queryFn: async ({ queryKey }) => {
      const [url, filter] = queryKey;
      
      let apiUrl = url as string;
      
      // Add filter params if needed
      if (filter !== 'all') {
        if (filter === 'denied') {
          apiUrl += '?status=denied';
        } else if (filter === 'successful') {
          apiUrl += '?status=successful';
        } else if (filter === 'upload') {
          apiUrl += '?eventType=file_upload';
        }
      }
      
      const res = await fetch(apiUrl, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch access logs');
      }
      
      return res.json();
    },
  });
}
