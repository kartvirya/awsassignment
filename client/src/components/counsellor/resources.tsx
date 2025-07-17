import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Play, 
  Headphones, 
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search
} from "lucide-react";

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["worksheet", "video", "audio", "interactive"]),
  fileUrl: z.string().optional(),
  duration: z.number().min(1).optional(),
});

export default function CounsellorResources() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: selectedType ? ["/api/resources", { type: selectedType }] : ["/api/resources"],
  });

  const form = useForm<z.infer<typeof resourceSchema>>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "worksheet",
      fileUrl: "",
      duration: undefined,
    },
  });

  const createResourceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof resourceSchema>) => {
      await apiRequest("POST", "/api/resources", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Success",
        description: "Resource created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof resourceSchema>> }) => {
      await apiRequest("PATCH", `/api/resources/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      toast({
        title: "Success",
        description: "Resource updated successfully",
      });
      setIsDialogOpen(false);
      setEditingResource(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
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

  const resourceTypes = [
    { id: null, label: "All Resources", icon: BookOpen },
    { id: "worksheet", label: "Worksheets", icon: FileText },
    { id: "video", label: "Videos", icon: Play },
    { id: "audio", label: "Audio", icon: Headphones },
    { id: "interactive", label: "Interactive", icon: BookOpen },
  ];

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="h-6 w-6 text-secondary" />;
      case "worksheet":
        return <FileText className="h-6 w-6 text-primary" />;
      case "audio":
        return <Headphones className="h-6 w-6 text-accent" />;
      case "interactive":
        return <BookOpen className="h-6 w-6 text-purple-500" />;
      default:
        return <FileText className="h-6 w-6 text-neutral-500" />;
    }
  };

  const getResourceBadgeColor = (type: string) => {
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

  const filteredResources = resources.filter((resource: any) =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (data: z.infer<typeof resourceSchema>) => {
    if (editingResource) {
      updateResourceMutation.mutate({ id: editingResource.id, data });
    } else {
      createResourceMutation.mutate(data);
    }
  };

  const handleEdit = (resource: any) => {
    setEditingResource(resource);
    form.reset({
      title: resource.title,
      description: resource.description || "",
      type: resource.type,
      fileUrl: resource.fileUrl || "",
      duration: resource.duration || undefined,
    });
    setIsDialogOpen(true);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-neutral-200 rounded-lg"></div>
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
        <p className="text-neutral-600">Manage CBT resources and materials</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingResource(null);
                form.reset();
              }}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingResource ? "Edit Resource" : "Add New Resource"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Resource title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Resource description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="worksheet">Worksheet</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="audio">Audio</SelectItem>
                            <SelectItem value="interactive">Interactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Duration" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/file.pdf" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={createResourceMutation.isPending || updateResourceMutation.isPending}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {editingResource ? "Update Resource" : "Create Resource"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Resource Categories */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          {resourceTypes.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={selectedType === id ? "default" : "outline"}
              className={`${
                selectedType === id 
                  ? "bg-primary text-white" 
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
              onClick={() => setSelectedType(id)}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource: any) => (
            <Card key={resource.id} className="border-neutral-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-opacity-10 rounded-lg">
                    {getResourceIcon(resource.type)}
                  </div>
                  <Badge className={getResourceBadgeColor(resource.type)}>
                    {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                  {resource.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-4">
                  {resource.description || "No description"}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-neutral-500">
                    {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                    {resource.duration && ` • ${resource.duration} min`}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(resource)}
                    className="flex-1 text-primary hover:bg-primary hover:text-white"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(resource.id)}
                    className="flex-1 text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {searchTerm ? "No resources found" : "No resources yet"}
            </h3>
            <p className="text-neutral-600">
              {searchTerm 
                ? "Try adjusting your search terms."
                : "Create your first resource to get started."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
