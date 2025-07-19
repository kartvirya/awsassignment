import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  FileText,
  Video,
  Headphones,
  Download,
  Eye,
  Users,
  BarChart3
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const typeIcons = {
  worksheet: FileText,
  video: Video,
  audio: Headphones,
  interactive: BookOpen,
};

const typeColors = {
  worksheet: "bg-blue-100 text-blue-800",
  video: "bg-red-100 text-red-800",
  audio: "bg-purple-100 text-purple-800",
  interactive: "bg-green-100 text-green-800",
};

export default function AdminResources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["/api/resources"],
  });

  const { data: resourceStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/resources/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/resources/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Resource Deleted",
        description: "Resource has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getCreatorName = (creatorId: string) => {
    const creator = users?.find((u: any) => u.id === creatorId);
    return creator ? `${creator.firstName} ${creator.lastName}` : `User ${creatorId}`;
  };

  const filteredResources = resources?.filter((resource: any) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || resource.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || resource.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  }) || [];

  const handleDeleteResource = (id: number) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      deleteResourceMutation.mutate(id);
    }
  };

  const resourceCounts = {
    total: resources?.length || 0,
    worksheet: resources?.filter((r: any) => r.type === "worksheet").length || 0,
    video: resources?.filter((r: any) => r.type === "video").length || 0,
    audio: resources?.filter((r: any) => r.type === "audio").length || 0,
    interactive: resources?.filter((r: any) => r.type === "interactive").length || 0,
  };

  const categories = [...new Set(resources?.map((r: any) => r.category).filter(Boolean))] || [];

  if (resourcesLoading || statsLoading || usersLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-neutral-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Resource Management</h1>
          <p className="text-neutral-600">Monitor and manage all educational resources</p>
        </div>
      </div>

      {/* Resource Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Total Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{resourceCounts.total}</div>
            <p className="text-sm text-neutral-500">All resources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Worksheets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{resourceCounts.worksheet}</div>
            <p className="text-sm text-neutral-500">PDF documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Video className="h-4 w-4 mr-2" />
              Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{resourceCounts.video}</div>
            <p className="text-sm text-neutral-500">Video content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Headphones className="h-4 w-4 mr-2" />
              Audio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{resourceCounts.audio}</div>
            <p className="text-sm text-neutral-500">Audio files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Interactive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resourceCounts.interactive}</div>
            <p className="text-sm text-neutral-500">Interactive tools</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-6">
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="worksheet">Worksheets</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="interactive">Interactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resources ({filteredResources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
              <p className="text-neutral-500">No resources found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Resource</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Creator</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Usage</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.map((resource: any) => {
                    const IconComponent = typeIcons[resource.type as keyof typeof typeIcons];
                    return (
                      <tr key={resource.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <IconComponent className="h-4 w-4 mr-3 text-neutral-400" />
                            <div>
                              <div className="font-medium text-neutral-900">
                                {resource.title}
                              </div>
                              <div className="text-sm text-neutral-500 line-clamp-1">
                                {resource.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={typeColors[resource.type as keyof typeof typeColors]}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {resource.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {resource.category || "General"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-neutral-600">
                            {getCreatorName(resource.creatorId)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {resource.accessCount || 0}
                            </div>
                            <div className="flex items-center">
                              <Download className="h-4 w-4 mr-1" />
                              {resource.downloadCount || 0}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteResource(resource.id)}
                              disabled={deleteResourceMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Resource Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(resources?.reduce((sum: number, r: any) => sum + (r.accessCount || 0), 0) / resources?.length || 0)}
              </div>
              <div className="text-sm text-neutral-500">Avg. Views per Resource</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(resources?.reduce((sum: number, r: any) => sum + (r.downloadCount || 0), 0) / resources?.length || 0)}
              </div>
              <div className="text-sm text-neutral-500">Avg. Downloads per Resource</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {categories.length}
              </div>
              <div className="text-sm text-neutral-500">Active Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {resourceStats?.totalUsage || 0}
              </div>
              <div className="text-sm text-neutral-500">Total Usage</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}