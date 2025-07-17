import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Save,
  RefreshCw
} from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      systemName: "Youth Empowerment Hub",
      systemDescription: "A comprehensive platform for youth violence intervention through CBT resources and counselling.",
      adminEmail: "admin@youthhub.com",
      supportEmail: "support@youthhub.com",
      enableNotifications: true,
      enableRegistration: true,
      enableMessageArchival: true,
      requireEmailVerification: false,
      sessionTimeout: 30,
      maxFileSize: 10,
      maintenanceMode: false,
    },
  });

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "system", label: "System", icon: Database },
  ];

  const onSubmit = (data: any) => {
    // In a real app, this would make an API call
    console.log("Settings updated:", data);
    toast({
      title: "Settings Updated",
      description: "Your settings have been saved successfully.",
    });
  };

  const handleBackup = () => {
    toast({
      title: "Backup Started",
      description: "System backup has been initiated.",
    });
  };

  const handleSystemReset = () => {
    if (confirm("Are you sure you want to reset system settings? This action cannot be undone.")) {
      toast({
        title: "System Reset",
        description: "System settings have been reset to defaults.",
        variant: "destructive",
      });
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="systemName">System Name</Label>
          <Input
            id="systemName"
            {...register("systemName")}
            placeholder="Youth Empowerment Hub"
          />
        </div>
        <div>
          <Label htmlFor="systemDescription">System Description</Label>
          <Textarea
            id="systemDescription"
            {...register("systemDescription")}
            placeholder="A comprehensive platform for youth violence intervention..."
            rows={3}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              {...register("adminEmail")}
              placeholder="admin@youthhub.com"
            />
          </div>
          <div>
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              {...register("supportEmail")}
              placeholder="support@youthhub.com"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">System Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable User Registration</Label>
              <p className="text-sm text-neutral-600">Allow new users to register accounts</p>
            </div>
            <Switch
              checked={watch("enableRegistration")}
              onCheckedChange={(checked) => setValue("enableRegistration", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Email Verification</Label>
              <p className="text-sm text-neutral-600">Users must verify their email before accessing the system</p>
            </div>
            <Switch
              checked={watch("requireEmailVerification")}
              onCheckedChange={(checked) => setValue("requireEmailVerification", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-neutral-600">Temporarily disable the system for maintenance</p>
            </div>
            <Switch
              checked={watch("maintenanceMode")}
              onCheckedChange={(checked) => setValue("maintenanceMode", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notification Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable System Notifications</Label>
              <p className="text-sm text-neutral-600">Send notifications for system events</p>
            </div>
            <Switch
              checked={watch("enableNotifications")}
              onCheckedChange={(checked) => setValue("enableNotifications", checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Message Archival</Label>
              <p className="text-sm text-neutral-600">Automatically archive old messages</p>
            </div>
            <Switch
              checked={watch("enableMessageArchival")}
              onCheckedChange={(checked) => setValue("enableMessageArchival", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Security Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              {...register("sessionTimeout")}
              placeholder="30"
            />
          </div>
          <div>
            <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
            <Input
              id="maxFileSize"
              type="number"
              {...register("maxFileSize")}
              placeholder="10"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Password Policy</h3>
        <div className="space-y-2 text-sm text-neutral-600">
          <p>• Minimum 8 characters</p>
          <p>• At least one uppercase letter</p>
          <p>• At least one lowercase letter</p>
          <p>• At least one number</p>
          <p>• At least one special character</p>
        </div>
        <Button variant="outline" className="w-fit">
          Update Password Policy
        </Button>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">System Maintenance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-medium">Database Backup</h4>
                <p className="text-sm text-neutral-600">Create a backup of the database</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={handleBackup}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-accent" />
              <div>
                <h4 className="font-medium">System Reset</h4>
                <p className="text-sm text-neutral-600">Reset system to default settings</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4 text-red-600 hover:bg-red-50"
              onClick={handleSystemReset}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset System
            </Button>
          </Card>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>System Version</Label>
            <p className="text-sm text-neutral-600">v1.0.0</p>
          </div>
          <div className="space-y-2">
            <Label>Last Updated</Label>
            <p className="text-sm text-neutral-600">December 15, 2024</p>
          </div>
          <div className="space-y-2">
            <Label>Database Version</Label>
            <p className="text-sm text-neutral-600">PostgreSQL 15.0</p>
          </div>
          <div className="space-y-2">
            <Label>Server Status</Label>
            <p className="text-sm text-green-600">Online</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Settings</h1>
        <p className="text-neutral-600">Manage system configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 border-neutral-200">
          <CardContent className="p-4">
            <nav className="space-y-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === id
                      ? "bg-primary text-white"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="lg:col-span-3 border-neutral-200">
          <CardHeader>
            <CardTitle className="text-lg">
              {tabs.find(tab => tab.id === activeTab)?.label} Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {activeTab === "general" && renderGeneralSettings()}
              {activeTab === "notifications" && renderNotificationSettings()}
              {activeTab === "security" && renderSecuritySettings()}
              {activeTab === "system" && renderSystemSettings()}

              {activeTab !== "system" && (
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
