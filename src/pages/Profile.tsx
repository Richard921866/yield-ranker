import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, User, Shield, Calendar, Edit2, Save, X } from "lucide-react";

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: metaError } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (metaError) throw metaError;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(profile?.display_name || "");
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const roleDisplay = profile.role === 'admin' ? 'Admin' : 'Premium';
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your account information
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your personal details and account status
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Display Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-slate-50 rounded-md text-foreground">
                      {displayName || "Not set"}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email Address
                  </Label>
                  <div className="px-3 py-2 bg-slate-50 rounded-md text-muted-foreground">
                    {user.email}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed here
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Account Type
                  </Label>
                  <div className="px-3 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-md">
                    <span className="font-semibold text-primary">{roleDisplay}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Member Since
                  </Label>
                  <div className="px-3 py-2 bg-slate-50 rounded-md text-muted-foreground">
                    {joinDate}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t">
                <h3 className="font-semibold text-foreground mb-4">Security</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Password</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="px-3 py-2 bg-slate-50 rounded-md text-muted-foreground flex-1">
                        ••••••••••••
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Password Reset",
                            description: "Check your email for password reset instructions.",
                          });
                          supabase.auth.resetPasswordForEmail(user.email || "", {
                            redirectTo: window.location.origin + "/reset-password"
                          });
                        }}
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

