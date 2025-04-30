import { useQuery } from "@tanstack/react-query";
import { File } from "@shared/schema";
import { FileWithUrl } from "@/lib/types";

interface FileResponse extends File {
  url: string;
}

export function useFiles() {
  return useQuery<FileResponse[]>({
    queryKey: ['/api/files'],
  });
}
