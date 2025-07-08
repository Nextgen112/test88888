import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "VIP.js file uploaded successfully!",
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    // Check if file ends with .vip.js
    if (!file.name.includes('.vip.js')) {
      toast({
        title: "Invalid File",
        description: "Please select a file with .vip.js extension (e.g., myfile.vip.js)",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    uploadMutation.mutate(formData);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload VIP.js File
        </CardTitle>
        <CardDescription>
          Upload new VIP.js files. File name must include ".vip.js" (e.g., myfile.vip.js)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* File drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-medium">Drop your VIP.js file here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
              </div>
            )}
          </div>

          {/* File input */}
          <div>
            <Label htmlFor="file-upload">Select File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".js"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="mt-1"
            />
          </div>

          {/* Upload button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload VIP.js File'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}