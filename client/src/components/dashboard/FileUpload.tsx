import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Link, Trash } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFiles } from "@/hooks/use-files";
import { File } from "@shared/schema";

const FileUpload: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: files = [], isLoading } = useFiles();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const xhr = new XMLHttpRequest();
      
      // Create a promise to track the upload
      return new Promise<File>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            setUploadProgress(progress);
          }
        });
        
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed due to network error"));
        });
        
        xhr.open("POST", "/api/files/upload");
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      
      // Reset upload state
      setUploadProgress(0);
      setCurrentFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      
      // Reset upload state
      setUploadProgress(0);
      setCurrentFile(null);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const uploadFile = (file: File) => {
    // Check if the file is a .js file with .vip.js in the name
    if (!file.name.endsWith('.js') || !file.name.includes('.vip.js')) {
      toast({
        title: "Invalid file",
        description: "Only VIP.js files are allowed",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentFile(file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    
    uploadMutation.mutate(formData);
  };

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes}B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(0)}KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)}MB`;
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const copyFileUrl = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl).then(
      () => {
        toast({
          title: "URL copied",
          description: "File URL copied to clipboard",
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: "Could not copy URL to clipboard",
          variant: "destructive",
        });
      }
    );
  };

  const deleteFile = (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this file?");
    if (confirmDelete) {
      apiRequest("DELETE", `/api/files/${id}`)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/files'] });
          queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
          toast({
            title: "Success",
            description: "File deleted successfully",
          });
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to delete file",
            variant: "destructive",
          });
        });
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-200">
        <CardTitle className="font-medium text-dark">VIP File Upload</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* File Upload Area */}
        <div 
          className={`border-2 border-dashed ${isDragging ? 'border-primary bg-blue-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 text-center`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleFileDrop}
          onClick={handleSelectFile}
        >
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-50 mb-3">
            <FileUp className="text-primary h-6 w-6" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Drag and drop your VIP.js file here</p>
          <p className="text-xs text-gray-500 mb-3">or</p>
          <Button size="sm" className="rounded-md">
            Select File
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept=".js"
          />
          <p className="mt-2 text-xs text-gray-500">Maximum file size: 50MB</p>
        </div>
        
        {/* File Upload Progress */}
        {currentFile && uploadMutation.isPending && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-dark">Uploading {currentFile}</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
        
        {/* Recently Uploaded Files */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-dark mb-3">Recent Uploads</h4>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm text-center text-gray-500">
                      Loading files...
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm text-center text-gray-500">
                      No files uploaded yet
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr key={file.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <FileUp className="text-primary h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">{file.originalFilename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(file.fileSize)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{getTimeAgo(file.uploadedAt)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="p-1 text-gray-500 hover:text-primary" 
                            title="Copy URL"
                            onClick={() => copyFileUrl(file.url)}
                          >
                            <Link className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-1 text-gray-500 hover:text-danger" 
                            title="Delete"
                            onClick={() => deleteFile(file.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
