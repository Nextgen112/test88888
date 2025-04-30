import { useQuery } from "@tanstack/react-query";
import { IpWhitelist } from "@shared/schema";

export function useIpWhitelist() {
  return useQuery<IpWhitelist[]>({
    queryKey: ['/api/ip-whitelist'],
  });
}
