import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Play, 
  Headphones, 
  BookOpen,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  User
} from "lucide-react";

export default function AdminResources() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["/api/resources"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredResources = resources.filter((resource: any) => {
    const matchesSearch = 
      resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || resource.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="h-5 w-5 text-secondary" />;
      case "worksheet":
        return <FileText className="h-5 w-5 text-primary" />;
      case "audio":
        return <Headphones className="h-5 w-5 text-accent" />;
      case "interactive":
        return <BookOpen className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-neutral-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-secondary/10 text-secondary";
      case "worksheet":
        return "bg-primary/10 text-primary";
      case "audio":
        return "bg-accent/10 text-accent";
      case "interactive":
        return "bg-purple-500/10 text-purple-500";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Unknown User";
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      deleteResourceMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-neutral-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Resources</h1>
        <p className="text-neutral-600">Manage all CBT resources and materials</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
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

      {/* Resources List */}
      <Card className="border-neutral-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredResources.map((resource: any) => (
                  <tr key={resource.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-neutral-100 rounded-lg mr-3">
                          {getResourceIcon(resource.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">
                            {resource.title}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {resource.description || "No description"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getTypeColor(resource.type)}>
                        {resource.type?.charAt(0).toUpperCase() + resource.type?.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-neutral-400" />
                        <span className="text-sm text-neutral-900">
                          {getUserName(resource.uploadedBy)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {resource.duration ? `${resource.duration} min` : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/90"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {resource.fileUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-secondary hover:text-secondary/90"
                            onClick={() => window.open(resource.fileUrl, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(resource.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {searchTerm || typeFilter !== "all" ? "No resources found" : "No resources yet"}
              </h3>
              <p className="text-neutral-600">
                {searchTerm || typeFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Resources will appear here once counsellors upload them."
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredResources.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-neutral-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button variant="outline" size="sm">
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-neutral-700">
                    Showing <span className="font-medium">1</span> to{" "}
                    <span className="font-medium">{Math.min(10, filteredResources.length)}</span> of{" "}
                    <span className="font-medium">{filteredResources.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" className="bg-primary text-white">
                      1
                    </Button>
                    <Button variant="outline" size="sm">
                      2
                    </Button>
                    <Button variant="outline" size="sm">
                      3
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
