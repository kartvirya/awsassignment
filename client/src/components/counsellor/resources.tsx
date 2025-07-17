import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Users
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

export default function CounsellorResources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ["/api/resources"],
  });

  const { data: resourceStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/resources/stats"],
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: any) => {
      return apiRequest("/api/resources", {
        method: "POST",
        body: resourceData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Resource Created",
        description: "New resource has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, ...resourceData }: any) => {
      return apiRequest(`/api/resources/${id}`, {
        method: "PATCH",
        body: resourceData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      setIsEditModalOpen(false);
      setSelectedResource(null);
      toast({
        title: "Resource Updated",
        description: "Resource has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update resource. Please try again.",
        variant: "destructive",
      });
    },
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

  const filteredResources = resources?.filter((resource: any) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || resource.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const handleCreateResource = (resourceData: any) => {
    createResourceMutation.mutate(resourceData);
  };

  const handleUpdateResource = (resourceData: any) => {
    updateResourceMutation.mutate({ id: selectedResource.id, ...resourceData });
  };

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

  if (resourcesLoading || statsLoading) {
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
          <p className="text-neutral-600">Create and manage educational resources</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Resource</DialogTitle>
            </DialogHeader>
            <ResourceForm 
              onSubmit={handleCreateResource}
              isLoading={createResourceMutation.isPending}
            />
          </DialogContent>
        </Dialog>
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
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource: any) => {
          const IconComponent = typeIcons[resource.type as keyof typeof typeIcons];
          return (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={typeColors[resource.type as keyof typeof typeColors]}>
                    <IconComponent className="h-3 w-3 mr-1" />
                    {resource.type}
                  </Badge>
                  <div className="text-sm text-neutral-500">
                    {resource.category || "General"}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-neutral-900 mb-2">{resource.title}</h3>
                  <p className="text-sm text-neutral-600 line-clamp-3">{resource.description}</p>
                </div>
                
                {resource.tags && (
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.slice(0, 3).map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {resource.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{resource.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-neutral-500">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {resource.accessCount || 0} views
                  </div>
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    {resource.downloadCount || 0} downloads
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedResource(resource);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteResource(resource.id)}
                    disabled={deleteResourceMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500 mb-4">No resources found</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Resource
          </Button>
        </div>
      )}

      {/* Edit Resource Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          <ResourceForm 
            resource={selectedResource}
            onSubmit={handleUpdateResource}
            isLoading={updateResourceMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResourceForm({ resource, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    title: resource?.title || "",
    description: resource?.description || "",
    type: resource?.type || "worksheet",
    category: resource?.category || "",
    content: resource?.content || "",
    fileUrl: resource?.fileUrl || "",
    tags: resource?.tags?.join(", ") || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag);
    onSubmit({
      ...formData,
      tags: tagsArray,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="worksheet">Worksheet</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="interactive">Interactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            placeholder="e.g., CBT, Anxiety, Depression"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({...formData, content: e.target.value})}
          rows={4}
          placeholder="Resource content or instructions..."
        />
      </div>

      <div>
        <Label htmlFor="fileUrl">File URL (Optional)</Label>
        <Input
          id="fileUrl"
          value={formData.fileUrl}
          onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
          placeholder="https://example.com/file.pdf"
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({...formData, tags: e.target.value})}
          placeholder="CBT, anxiety, mindfulness, coping"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (resource ? "Updating..." : "Creating...") : (resource ? "Update Resource" : "Create Resource")}
      </Button>
    </form>
  );
}