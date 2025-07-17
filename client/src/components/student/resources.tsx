import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Play, 
  Headphones, 
  BookOpen
} from "lucide-react";

export default function StudentResources() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: selectedType ? ["/api/resources", { type: selectedType }] : ["/api/resources"],
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
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">CBT Resources</h1>
        <p className="text-neutral-600">Access worksheets, videos, and tools for your journey</p>
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
        {resources.length > 0 ? (
          resources.map((resource: any) => (
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
                  {resource.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                    {resource.duration && ` • ${resource.duration} min`}
                  </span>
                  <Button 
                    size="sm" 
                    className="text-primary hover:text-primary/90"
                    variant="ghost"
                  >
                    {resource.type === "video" ? "Watch" : 
                     resource.type === "audio" ? "Listen" : "Access"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No resources found</h3>
            <p className="text-neutral-600">
              {selectedType 
                ? `No ${selectedType} resources are currently available.`
                : "No resources are currently available."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
