import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Shield, 
  Bell, 
  Mail, 
  Database,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
  });

  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ["/api/admin/health"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      return apiRequest("/api/admin/settings", {
        method: "PATCH",
        body: settingsData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Updated",
        description: "System settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [generalSettings, setGeneralSettings] = useState({
    siteName: settings?.siteName || "Youth Empowerment Hub",
    siteDescription: settings?.siteDescription || "Supporting youth through counseling and resources",
    maintenanceMode: settings?.maintenanceMode || false,
    registrationEnabled: settings?.registrationEnabled || true,
    maxUsersPerCounsellor: settings?.maxUsersPerCounsellor || 50,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: settings?.emailNotifications || true,
    smsNotifications: settings?.smsNotifications || false,
    pushNotifications: settings?.pushNotifications || true,
    sessionReminders: settings?.sessionReminders || true,
    systemAlerts: settings?.systemAlerts || true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: settings?.sessionTimeout || 30,
    passwordMinLength: settings?.passwordMinLength || 8,
    requireTwoFactor: settings?.requireTwoFactor || false,
    loginAttemptLimit: settings?.loginAttemptLimit || 5,
    autoLockoutDuration: settings?.autoLockoutDuration || 15,
  });

  const handleSaveGeneral = () => {
    updateSettingsMutation.mutate({ category: "general", settings: generalSettings });
  };

  const handleSaveNotifications = () => {
    updateSettingsMutation.mutate({ category: "notifications", settings: notificationSettings });
  };

  const handleSaveSecurity = () => {
    updateSettingsMutation.mutate({ category: "security", settings: securitySettings });
  };

  if (settingsLoading || healthLoading) {
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">System Settings</h1>
        <p className="text-neutral-600">Configure and manage system-wide settings</p>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-green-900">Database</div>
                <div className="text-sm text-green-600">Healthy</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-green-900">API</div>
                <div className="text-sm text-green-600">Operational</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-green-900">Authentication</div>
                <div className="text-sm text-green-600">Active</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-green-900">Storage</div>
                <div className="text-sm text-green-600">85% Free</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="maxUsers">Max Users per Counsellor</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={generalSettings.maxUsersPerCounsellor}
                    onChange={(e) => setGeneralSettings({...generalSettings, maxUsersPerCounsellor: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings({...generalSettings, siteDescription: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance">Maintenance Mode</Label>
                    <p className="text-sm text-neutral-500">Temporarily disable access to the system</p>
                  </div>
                  <Switch
                    id="maintenance"
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, maintenanceMode: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="registration">Registration Enabled</Label>
                    <p className="text-sm text-neutral-500">Allow new users to register</p>
                  </div>
                  <Switch
                    id="registration"
                    checked={generalSettings.registrationEnabled}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, registrationEnabled: checked})}
                  />
                </div>
              </div>

              <Button onClick={handleSaveGeneral} disabled={updateSettingsMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateSettingsMutation.isPending ? "Saving..." : "Save General Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-neutral-500">Send notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <p className="text-sm text-neutral-500">Send notifications via SMS</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-neutral-500">Send browser push notifications</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sessionReminders">Session Reminders</Label>
                    <p className="text-sm text-neutral-500">Automatic reminders for upcoming sessions</p>
                  </div>
                  <Switch
                    id="sessionReminders"
                    checked={notificationSettings.sessionReminders}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, sessionReminders: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="systemAlerts">System Alerts</Label>
                    <p className="text-sm text-neutral-500">Critical system notifications</p>
                  </div>
                  <Switch
                    id="systemAlerts"
                    checked={notificationSettings.systemAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemAlerts: checked})}
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={updateSettingsMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Notification Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="passwordMinLength">Password Min Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loginAttemptLimit">Login Attempt Limit</Label>
                  <Input
                    id="loginAttemptLimit"
                    type="number"
                    value={securitySettings.loginAttemptLimit}
                    onChange={(e) => setSecuritySettings({...securitySettings, loginAttemptLimit: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="autoLockoutDuration">Auto Lockout Duration (minutes)</Label>
                  <Input
                    id="autoLockoutDuration"
                    type="number"
                    value={securitySettings.autoLockoutDuration}
                    onChange={(e) => setSecuritySettings({...securitySettings, autoLockoutDuration: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireTwoFactor">Require Two-Factor Authentication</Label>
                  <p className="text-sm text-neutral-500">Require 2FA for all users</p>
                </div>
                <Switch
                  id="requireTwoFactor"
                  checked={securitySettings.requireTwoFactor}
                  onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireTwoFactor: checked})}
                />
              </div>

              <Button onClick={handleSaveSecurity} disabled={updateSettingsMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Security Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}