import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle,
  Edit2,
  Eye,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  bio: string;
  avatar_url: string;
  image_data?: string; // Base64 image data
  experience?: string;
  status?: string;
  is_active?: boolean;
}

interface ProfileFormData {
  full_name: string;
  role: string;
  bio: string;
  experience: string;
  status: string;
  avatar_url: string;
  image_data?: string; // Base64 image data
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function ProfilesManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: "",
    role: "",
    bio: "",
    experience: "",
    status: "",
    avatar_url: "",
  });

  // Fetch all profiles
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/profiles`);
      const data = await response.json();

      if (data.success !== false && Array.isArray(data.data)) {
        setProfiles(data.data);
      } else {
        setProfiles([]);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof ProfileFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.role.trim()) {
      toast({
        title: "Validation Error",
        description: "Role/Title is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.bio.trim()) {
      toast({
        title: "Validation Error",
        description: "Bio is required",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsEditing(true);

    try {
      if (editingId) {
        // Update existing profile using /api/profiles endpoint
        const response = await fetch(
          `${API_URL}/profiles/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          setProfiles((prev) =>
            prev.map((p) => (p.id === editingId ? data.data[0] : p))
          );
          toast({
            title: "Success",
            description: "Profile updated successfully",
          });
        } else if (response.ok) {
          // Refresh profiles list
          await fetchProfiles();
          toast({
            title: "Success",
            description: "Profile updated successfully",
          });
        } else {
          throw new Error(data.error || "Failed to update profile");
        }
      } else {
        // Create new profile using /api/profiles endpoint
        const response = await fetch(`${API_URL}/profiles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          setProfiles((prev) => [...prev, data.data[0]]);
          toast({
            title: "Success",
            description: "Profile created successfully",
          });
        } else if (response.ok) {
          // Refresh profiles list
          await fetchProfiles();
          toast({
            title: "Success",
            description: "Profile created successfully",
          });
        } else {
          throw new Error(data.error || "Failed to create profile");
        }
      }

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleEdit = (profile: Profile) => {
    setFormData({
      full_name: profile.full_name,
      role: profile.role,
      bio: profile.bio,
      experience: profile.experience || "",
      status: profile.status || "",
      avatar_url: profile.avatar_url || "",
      image_data: profile.image_data || "",
    });
    // Show preview from image_data (base64) or fall back to avatar_url
    setPreviewImage(profile.image_data || profile.avatar_url);
    setEditingId(profile.id);
    setShowForm(true);
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this profile?")) return;

    try {
      const response = await fetch(
        `${API_URL}/db/profiles/${profileId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success !== false) {
        setProfiles((prev) => prev.filter((p) => p.id !== profileId));
        toast({
          title: "Success",
          description: "Profile deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Upload file to backend
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formDataObj,
      });
      const data = await response.json();
      if (data.success && data.url) {
        // Show preview
        setPreviewImage(data.url);
        // Set avatar_url in form data
        setFormData((prev) => ({
          ...prev,
          avatar_url: data.url,
        }));
        toast({
          title: "Success",
          description: "Image uploaded successfully. Click Save Profile to confirm.",
        });
      } else {
        throw new Error(data.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
      setPreviewImage(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      role: "",
      bio: "",
      experience: "",
      status: "",
      avatar_url: "",
    });
    setPreviewImage(null);
    setEditingId(null);
    setShowForm(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profiles Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your portfolio profiles that appear on the landing page
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
          >
            <Plus className="w-4 h-4" />
            Add New Profile
          </Button>
        )}
      </motion.div>

      {/* Form */}
      {showForm && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Form Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingId ? "Edit Profile" : "Create New Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    placeholder="e.g., Ramya Lakhani"
                    value={formData.full_name}
                    onChange={(e) =>
                      handleInputChange("full_name", e.target.value)
                    }
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">Role/Title *</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Full-Stack Developer"
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                  />
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio/Description *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Write a compelling bio about yourself..."
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    placeholder="e.g., 5 years professional experience"
                    value={formData.experience}
                    onChange={(e) =>
                      handleInputChange("experience", e.target.value)
                    }
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    placeholder="e.g., Available for freelance"
                    value={formData.status}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isEditing}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                  >
                    {isEditing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isEditing ? "Saving..." : "Save Profile"}
                  </Button>
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Card */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Avatar Section */}
                <div className="space-y-3">
                  <div className="relative">
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-white text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm opacity-75">No image</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-image-input"
                      disabled={isUploadingImage}
                    />
                    <label
                      htmlFor="profile-image-input"
                      className={`flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                        isUploadingImage ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload Image
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Preview Details */}
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {formData.full_name || "Your Name"}
                  </h3>
                  <p className="text-sm text-cyan-600 font-medium truncate">
                    {formData.role || "Your Role"}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {formData.bio ||
                      "Your bio will appear here..."}
                  </p>
                  {formData.status && (
                    <Badge variant="outline" className="text-xs">
                      {formData.status}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Profiles Grid */}
      {!showForm && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : profiles.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="col-span-full flex items-center justify-center py-12"
            >
              <Card className="w-full max-w-sm text-center">
                <CardContent className="pt-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">
                    No profiles yet. Create one to get started!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            profiles.map((profile) => (
              <motion.div
                key={profile.id}
                variants={itemVariants}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  {/* Profile Image */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-purple-500 to-cyan-500 overflow-hidden">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white opacity-50">
                        <Upload className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900 truncate">
                        {profile.full_name}
                      </h3>
                      <p className="text-sm text-cyan-600 font-medium truncate">
                        {profile.role}
                      </p>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      {profile.bio}
                    </p>

                    {profile.experience && (
                      <div className="text-xs text-gray-500">
                        📅 {profile.experience}
                      </div>
                    )}

                    {profile.status && (
                      <Badge variant="outline" className="text-xs">
                        {profile.status}
                      </Badge>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleEdit(profile)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 text-xs"
                        onClick={() => handleDelete(profile.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}
