import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Play, 
  Download, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  Eye,
  Volume2,
  Video,
  FileText
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const resourceTypeIcons = {
  worksheet: FileText,
  video: Video,
  audio: Volume2,
  interactive: Play,
};

const resourceTypeColors = {
  worksheet: "bg-blue-100 text-blue-800",
  video: "bg-purple-100 text-purple-800",
  audio: "bg-green-100 text-green-800",
  interactive: "bg-orange-100 text-orange-800",
};

export default function StudentResources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["/api/resources"],
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress"],
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data: { resourceId: number; progress: number }) => {
      return apiRequest("/api/progress", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      toast({
        title: "Progress Updated",
        description: "Your progress has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredResources = resources?.filter((resource: any) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || resource.type === selectedType;
    return matchesSearch && matchesType;
  }) || [];

  const getResourceProgress = (resourceId: number) => {
    const progressItem = progress?.find((p: any) => p.resourceId === resourceId);
    return progressItem?.progress || 0;
  };

  const handleResourceAccess = async (resourceId: number) => {
    const currentProgress = getResourceProgress(resourceId);
    if (currentProgress === 0) {
      updateProgressMutation.mutate({ resourceId, progress: 10 });
    }
  };

  const handleCompleteResource = async (resourceId: number) => {
    updateProgressMutation.mutate({ resourceId, progress: 100 });
  };

  if (resourcesLoading || progressLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-20 bg-neutral-200 rounded"></div>
                  <div className="h-4 bg-neutral-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">CBT Resources</h1>
        <p className="text-neutral-600">
          Access worksheets, videos, and interactive tools for your personal growth
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="worksheet">Worksheets</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="interactive">Interactive</option>
          </select>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {progress?.filter((p: any) => p.progress === 100).length || 0}
              </div>
              <p className="text-sm text-neutral-600">Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {progress?.filter((p: any) => p.progress > 0 && p.progress < 100).length || 0}
              </div>
              <p className="text-sm text-neutral-600">In Progress</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-600">
                {resources?.length || 0}
              </div>
              <p className="text-sm text-neutral-600">Total Resources</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {resources?.length ? Math.round(((progress?.filter((p: any) => p.progress === 100).length || 0) / resources.length) * 100) : 0}%
              </div>
              <p className="text-sm text-neutral-600">Overall Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource: any) => {
          const Icon = resourceTypeIcons[resource.type as keyof typeof resourceTypeIcons];
          const progressValue = getResourceProgress(resource.id);
          const isCompleted = progressValue === 100;
          const isInProgress = progressValue > 0 && progressValue < 100;

          return (
            <Card key={resource.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={resourceTypeColors[resource.type as keyof typeof resourceTypeColors]}>
                    <Icon className="h-3 w-3 mr-1" />
                    {resource.type}
                  </Badge>
                  {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                  {resource.description}
                </p>
                
                {resource.duration && (
                  <div className="flex items-center text-sm text-neutral-500 mb-3">
                    <Clock className="h-4 w-4 mr-1" />
                    {resource.duration} minutes
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-neutral-600">Progress</span>
                      <span className="font-medium">{progressValue}%</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    {!isCompleted && (
                      <Button
                        size="sm"
                        onClick={() => handleResourceAccess(resource.id)}
                        className="flex-1"
                        disabled={updateProgressMutation.isPending}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {isInProgress ? "Continue" : "Start"}
                      </Button>
                    )}
                    
                    {isInProgress && !isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompleteResource(resource.id)}
                        disabled={updateProgressMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                    )}

                    {resource.fileUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(resource.fileUrl, "_blank")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500">No resources found matching your criteria</p>
        </div>
      )}
    </div>
  );
}