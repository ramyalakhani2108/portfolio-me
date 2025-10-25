import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Plus,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Upload,
  Star,
  Building,
  Award,
  Users,
  Palette,
  Settings,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Project {
  id: string;
  title: string;
  description: string | null;
  long_description: string | null;
  tech_stack: string[] | null;
  github_url: string | null;
  live_url: string | null;
  image_url: string | null;
  video_url: string | null;
  featured: boolean | null;
  order_index: number | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

interface Blog {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  tags: string[] | null;
  published_at: string;
  order_index: number | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

interface HeroSettings {
  id: string;
  title: string;
  title_highlight: string | null;
  subtitle: string;
  subtitle_highlight_1: string | null;
  subtitle_highlight_2: string | null;
  description: string | null;
  hero_image_url: string | null;
  cta_button_1_text: string | null;
  cta_button_1_action: string | null;
  cta_button_2_text: string | null;
  cta_button_2_action: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type FilterType = "all" | "active" | "inactive";

export default function PortfolioCMS() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Project> | null>(null);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [editBlogFormData, setEditBlogFormData] = useState<Partial<Blog> | null>(null);
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [editHeroFormData, setEditHeroFormData] = useState<Partial<HeroSettings> | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsRes, blogsRes, heroRes] =
        await Promise.all([
          db
            .from("projects")
            .select("*")
            .order("order_index", { ascending: true }),
          db
            .from("blogs")
            .select("*")
            .order("published_at", { ascending: false }),
          db
            .from("portfolio_hero_settings")
            .select("*")
            .single(),
        ]);

      const errors = [
        projectsRes.error,
        blogsRes.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error(
          `Database errors: ${errors.map((e) => e?.message).join(", ")}`,
        );
      }

      // Add is_active field if it doesn't exist (default to true for existing records)
      setProjects(
        (projectsRes.data || []).map((p) => ({
          ...p,
          is_active: p.is_active ?? true,
        })),
      );
      setBlogs(
        (blogsRes.data || []).map((b) => ({
          ...b,
          is_active: b.is_active ?? true,
        })),
      );
      
      if (heroRes.data) {
        setHeroSettings(heroRes.data);
      }
    } catch (error: any) {
      console.error("Error fetching portfolio data:", error);
      setError(error.message || "Failed to load portfolio data");
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load portfolio data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add is_active column to tables if it doesn't exist
  const ensureActiveColumn = async (tableName: string) => {
    try {
      // Columns already exist in PostgreSQL tables, no need to add them
      // This function is kept for legacy compatibility
      console.log(`Table ${tableName} is ready`);
    } catch (error) {
      console.log(`Error with ${tableName}`);
    }
  };

  useEffect(() => {
    // Ensure all tables have is_active column
    const tables = ["projects", "skills", "experiences", "testimonials", "blogs"];
    tables.forEach((table) => ensureActiveColumn(table));
  }, []);

  const updateProjectStatus = async (projectId: string, isActive: boolean) => {
    try {
      const { error } = await db
        .from("projects")
        .update({ is_active: isActive })
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, is_active: isActive } : p,
        ),
      );

      toast({
        title: "Project Updated",
        description: `Project ${isActive ? "activated" : "deactivated"} successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update project status.",
        variant: "destructive",
      });
    }
  };

  const addProject = async () => {
    try {
      setIsSaving(true);
      const newProject = {
        title: "",
        description: "",
        long_description: "",
        tech_stack: [],
        github_url: "",
        live_url: "",
        image_url: "",
        featured: false,
        order_index: projects.length,
        is_active: true,
      };

      const { data, error } = await db
        .from("projects")
        .insert([newProject])
        .select()
        .single();

      if (error) throw error;

      setProjects((prev) => [...prev, data]);
      toast({
        title: "Project Added",
        description:
          "New blank project has been created. Please fill in the details.",
      });
    } catch (error: any) {
      toast({
        title: "Add Failed",
        description: error.message || "Failed to add new project.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await db
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast({
        title: "Project Deleted",
        description: "Project has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete project.",
        variant: "destructive",
      });
    }
  };

  const startEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditFormData({ ...project });
  };

  const cancelEditProject = () => {
    setEditingProjectId(null);
    setEditFormData(null);
  };

  const saveProjectChanges = async () => {
    if (!editFormData || !editingProjectId) return;

    try {
      setIsSaving(true);

      const { error } = await db
        .from("projects")
        .update(editFormData)
        .eq("id", editingProjectId);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProjectId ? { ...p, ...editFormData } : p,
        ),
      );

      toast({
        title: "Project Saved",
        description: "Project details have been updated successfully.",
      });

      setEditingProjectId(null);
      setEditFormData(null);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save project changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateBlogStatus = async (blogId: string, isActive: boolean) => {
    try {
      const { error } = await db
        .from("blogs")
        .update({ is_active: isActive })
        .eq("id", blogId);

      if (error) throw error;

      setBlogs((prev) =>
        prev.map((b) =>
          b.id === blogId ? { ...b, is_active: isActive } : b,
        ),
      );

      toast({
        title: "Blog Updated",
        description: `Blog ${isActive ? "activated" : "deactivated"} successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update blog status.",
        variant: "destructive",
      });
    }
  };

  const addBlog = async () => {
    try {
      setIsSaving(true);
      const newBlog = {
        title: "",
        excerpt: "",
        content: "",
        featured_image: "",
        tags: [],
        published_at: new Date().toISOString(),
        order_index: blogs.length,
        is_active: true,
      };

      const { data, error } = await db
        .from("blogs")
        .insert([newBlog])
        .select()
        .single();

      if (error) throw error;

      setBlogs((prev) => [...prev, data]);
      toast({
        title: "Blog Added",
        description: "New blank blog post has been created. Please fill in the details.",
      });
    } catch (error: any) {
      toast({
        title: "Add Failed",
        description: error.message || "Failed to add new blog.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBlog = async (blogId: string) => {
    try {
      const { error } = await db
        .from("blogs")
        .delete()
        .eq("id", blogId);

      if (error) throw error;

      setBlogs((prev) => prev.filter((b) => b.id !== blogId));
      toast({
        title: "Blog Deleted",
        description: "Blog post has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete blog.",
        variant: "destructive",
      });
    }
  };

  const startEditBlog = (blog: Blog) => {
    setEditingBlogId(blog.id);
    setEditBlogFormData({ ...blog });
  };

  const cancelEditBlog = () => {
    setEditingBlogId(null);
    setEditBlogFormData(null);
  };

  const saveBlogChanges = async () => {
    if (!editBlogFormData || !editingBlogId) return;

    try {
      setIsSaving(true);

      const { error } = await db
        .from("blogs")
        .update(editBlogFormData)
        .eq("id", editingBlogId);

      if (error) throw error;

      setBlogs((prev) =>
        prev.map((b) =>
          b.id === editingBlogId ? { ...b, ...editBlogFormData } : b,
        ),
      );

      toast({
        title: "Blog Saved",
        description: "Blog post has been updated successfully.",
      });

      setEditingBlogId(null);
      setEditBlogFormData(null);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save blog changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const startEditHero = () => {
    if (heroSettings) {
      setEditHeroFormData({ ...heroSettings });
      setIsEditingHero(true);
    }
  };

  const cancelEditHero = () => {
    setIsEditingHero(false);
    setEditHeroFormData(null);
  };

  const saveHeroChanges = async () => {
    if (!editHeroFormData || !heroSettings) return;

    try {
      setIsSaving(true);

      const { error } = await db
        .from("portfolio_hero_settings")
        .update(editHeroFormData)
        .eq("id", heroSettings.id);

      if (error) throw error;

      setHeroSettings((prev) =>
        prev ? { ...prev, ...editHeroFormData } : null,
      );

      toast({
        title: "Hero Settings Saved",
        description: "Hero section has been updated successfully.",
      });

      setIsEditingHero(false);
      setEditHeroFormData(null);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save hero settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filterItems = <
    T extends {
      is_active?: boolean;
      title?: string;
      name?: string;
      company?: string;
    },
  >(
    items: T[],
  ) => {
    let filtered = items;

    // Apply status filter
    if (filter === "active") {
      filtered = filtered.filter((item) => item.is_active === true);
    } else if (filter === "inactive") {
      filtered = filtered.filter((item) => item.is_active === false);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const searchableText = (
          (item.title || "") +
          (item.name || "") +
          (item.company || "")
        ).toLowerCase();
        return searchableText.includes(searchTerm.toLowerCase());
      });
    }

    return filtered;
  };

  const getStatusBadge = (isActive?: boolean) => {
    if (isActive === true) {
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 border-green-200"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-600 border-gray-200"
        >
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    }
  };

  const getStats = () => {
    const projectStats = {
      total: projects.length,
      active: projects.filter((p) => p.is_active).length,
      inactive: projects.filter((p) => !p.is_active).length,
    };

    const blogStats = {
      total: blogs.length,
      active: blogs.filter((b) => b.is_active).length,
      inactive: blogs.filter((b) => !b.is_active).length,
    };

    return { projectStats, blogStats };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading portfolio CMS..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <CardTitle className="text-red-900">Failed to Load CMS</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={fetchData} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio CMS</h2>
          <p className="text-gray-600">
            Manage your portfolio content with active/inactive controls
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={() => window.open("/", "_blank")}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Live Site
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Projects</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.projectStats.active}/{stats.projectStats.total}
                </p>
                <p className="text-xs text-blue-600">Active/Total</p>
              </div>
              <Settings className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Label>Filter:</Label>
                <Select
                  value={filter}
                  onValueChange={(value: FilterType) => setFilter(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Projects ({stats.projectStats.active})
          </TabsTrigger>
          <TabsTrigger value="blogs" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Blogs ({stats.blogStats.active})
          </TabsTrigger>
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Hero Settings
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Projects Management</CardTitle>
                <Button
                  onClick={addProject}
                  className="flex items-center gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Project
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {filterItems(projects).map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Project Header */}
                    <div className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => editingProjectId === project.id ? cancelEditProject() : startEditProject(project)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Edit className="w-4 h-4 text-gray-400" />
                        <div>
                          <h4 className="font-semibold">{project.title || "Untitled Project"}</h4>
                          <p className="text-sm text-gray-500">{project.description || "No description"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(project.is_active)}
                        {project.featured && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Project Edit Form */}
                    {editingProjectId === project.id && editFormData && (
                      <div className="p-6 bg-white border-t space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Project Title *</Label>
                            <Input
                              value={editFormData.title || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Enter project title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Featured</Label>
                            <Switch
                              checked={editFormData.featured || false}
                              onCheckedChange={(checked) =>
                                setEditFormData({
                                  ...editFormData,
                                  featured: checked,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Short Description *</Label>
                          <Textarea
                            value={editFormData.description || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                description: e.target.value,
                              })
                            }
                            placeholder="Brief description (shown in lists)"
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Long Description</Label>
                          <Textarea
                            value={editFormData.long_description || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                long_description: e.target.value,
                              })
                            }
                            placeholder="Detailed description (shown in project details)"
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>GitHub URL</Label>
                            <Input
                              value={editFormData.github_url || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  github_url: e.target.value,
                                })
                              }
                              placeholder="https://github.com/..."
                              type="url"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Live Demo URL</Label>
                            <Input
                              value={editFormData.live_url || ""}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  live_url: e.target.value,
                                })
                              }
                              placeholder="https://..."
                              type="url"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Image URL</Label>
                          <Input
                            value={editFormData.image_url || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                image_url: e.target.value,
                              })
                            }
                            placeholder="https://..."
                            type="url"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Video URL</Label>
                          <Input
                            value={editFormData.video_url || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                video_url: e.target.value,
                              })
                            }
                            placeholder="https://youtube.com/... or https://vimeo.com/..."
                            type="url"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tech Stack (comma-separated)</Label>
                          <Input
                            value={
                              Array.isArray(editFormData.tech_stack)
                                ? editFormData.tech_stack.join(", ")
                                : ""
                            }
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                tech_stack: e.target.value
                                  .split(",")
                                  .map((t) => t.trim())
                                  .filter((t) => t),
                              })
                            }
                            placeholder="React, Node.js, MongoDB, etc."
                          />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editFormData.is_active || false}
                              onCheckedChange={(checked) =>
                                setEditFormData({
                                  ...editFormData,
                                  is_active: checked,
                                })
                              }
                            />
                            <span className="text-sm text-gray-600">Active</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={cancelEditProject}
                              variant="outline"
                              disabled={isSaving}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={saveProjectChanges}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Save Changes
                            </Button>
                            <Button
                              onClick={() => deleteProject(project.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Project Summary (when not editing) */}
                    {editingProjectId !== project.id && (
                      <div className="p-4 bg-white space-y-3 border-t">
                        {project.tech_stack && project.tech_stack.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.tech_stack.map((tech, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              GitHub
                            </a>
                          )}
                          {project.live_url && (
                            <a
                              href={project.live_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Live Demo
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Switch
                            checked={project.is_active || false}
                            onCheckedChange={(checked) =>
                              updateProjectStatus(project.id, checked)
                            }
                          />
                          <span className="text-sm text-gray-500">Active</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {filterItems(projects).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No projects found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blogs Tab */}
        <TabsContent value="blogs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Blogs Management</CardTitle>
                <Button
                  onClick={addBlog}
                  className="flex items-center gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Blog
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {filterItems(blogs).map((blog) => (
                  <motion.div
                    key={blog.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Blog Header */}
                    <div className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => editingBlogId === blog.id ? cancelEditBlog() : startEditBlog(blog)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        <div>
                          <h4 className="font-semibold">{blog.title || "Untitled Blog"}</h4>
                          <p className="text-sm text-gray-500">{blog.excerpt || "No excerpt"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(blog.is_active)}
                      </div>
                    </div>

                    {/* Blog Edit Form */}
                    {editingBlogId === blog.id && editBlogFormData && (
                      <div className="p-6 bg-white border-t space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Blog Title *</Label>
                            <Input
                              value={editBlogFormData.title || ""}
                              onChange={(e) =>
                                setEditBlogFormData({
                                  ...editBlogFormData,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Enter blog title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Published Date</Label>
                            <Input
                              type="datetime-local"
                              value={
                                editBlogFormData.published_at
                                  ? new Date(editBlogFormData.published_at).toISOString().slice(0, 16)
                                  : ""
                              }
                              onChange={(e) =>
                                setEditBlogFormData({
                                  ...editBlogFormData,
                                  published_at: new Date(e.target.value).toISOString(),
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Excerpt *</Label>
                          <Textarea
                            value={editBlogFormData.excerpt || ""}
                            onChange={(e) =>
                              setEditBlogFormData({
                                ...editBlogFormData,
                                excerpt: e.target.value,
                              })
                            }
                            placeholder="Brief excerpt (shown in blog lists)"
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Content *</Label>
                          <Textarea
                            value={editBlogFormData.content || ""}
                            onChange={(e) =>
                              setEditBlogFormData({
                                ...editBlogFormData,
                                content: e.target.value,
                              })
                            }
                            placeholder="Full blog content (supports markdown)"
                            rows={8}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Featured Image URL</Label>
                          <Input
                            value={editBlogFormData.featured_image || ""}
                            onChange={(e) =>
                              setEditBlogFormData({
                                ...editBlogFormData,
                                featured_image: e.target.value,
                              })
                            }
                            placeholder="https://..."
                            type="url"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tags (comma-separated)</Label>
                          <Input
                            value={
                              Array.isArray(editBlogFormData.tags)
                                ? editBlogFormData.tags.join(", ")
                                : ""
                            }
                            onChange={(e) =>
                              setEditBlogFormData({
                                ...editBlogFormData,
                                tags: e.target.value
                                  .split(",")
                                  .map((t) => t.trim())
                                  .filter((t) => t),
                              })
                            }
                            placeholder="React, Web Development, etc."
                          />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={editBlogFormData.is_active || false}
                              onCheckedChange={(checked) =>
                                setEditBlogFormData({
                                  ...editBlogFormData,
                                  is_active: checked,
                                })
                              }
                            />
                            <span className="text-sm text-gray-600">Active</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={cancelEditBlog}
                              variant="outline"
                              disabled={isSaving}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={saveBlogChanges}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              Save Changes
                            </Button>
                            <Button
                              onClick={() => deleteBlog(blog.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Blog Summary (when not editing) */}
                    {editingBlogId !== blog.id && (
                      <div className="p-4 bg-white space-y-3 border-t">
                        <div className="flex flex-wrap gap-1">
                          {editBlogFormData?.tags && editBlogFormData.tags.length > 0 && (
                            editBlogFormData.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))
                          )}
                          {blog.tags && blog.tags.length > 0 && !editBlogFormData?.tags && (
                            blog.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>
                            Published: {new Date(blog.published_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Switch
                            checked={blog.is_active || false}
                            onCheckedChange={(checked) =>
                              updateBlogStatus(blog.id, checked)
                            }
                          />
                          <span className="text-sm text-gray-500">Active</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {filterItems(blogs).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No blogs found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Settings Tab */}
        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hero Section Settings</CardTitle>
                {heroSettings && !isEditingHero && (
                  <Button
                    onClick={startEditHero}
                    className="flex items-center gap-2"
                    disabled={isSaving}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Hero
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {heroSettings && !isEditingHero && (
                <div className="space-y-4">
                  {/* Hero Preview */}
                  <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <h2 className="text-4xl font-bold mb-2">
                          {heroSettings.title}
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600 ml-2">
                            {heroSettings.title_highlight}
                          </span>
                        </h2>
                        <p className="text-xl text-gray-600 mb-4 leading-relaxed">
                          {heroSettings.subtitle}
                          <br />
                          <span className="text-purple-600">{heroSettings.subtitle_highlight_1}</span>
                          {' '}with{' '}
                          <span className="text-cyan-600">{heroSettings.subtitle_highlight_2}</span>
                        </p>
                        <div className="flex gap-4 justify-center">
                          <Badge variant="outline" className="px-3 py-1">
                            {heroSettings.cta_button_1_text}
                          </Badge>
                          <Badge variant="outline" className="px-3 py-1">
                            {heroSettings.cta_button_2_text}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Title</Label>
                      <div className="p-3 bg-gray-100 rounded border text-sm">
                        {heroSettings.title}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Title Highlight</Label>
                      <div className="p-3 bg-gray-100 rounded border text-sm">
                        {heroSettings.title_highlight}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Subtitle</Label>
                    <div className="p-3 bg-gray-100 rounded border text-sm">
                      {heroSettings.subtitle}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Highlight 1 (e.g., innovation)</Label>
                      <div className="p-3 bg-gray-100 rounded border text-sm">
                        {heroSettings.subtitle_highlight_1}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Highlight 2 (e.g., functionality)</Label>
                      <div className="p-3 bg-gray-100 rounded border text-sm">
                        {heroSettings.subtitle_highlight_2}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(heroSettings.is_active)}
                    </div>
                  </div>
                </div>
              )}

              {heroSettings && isEditingHero && editHeroFormData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Main Title *</Label>
                      <Input
                        value={editHeroFormData.title || ""}
                        onChange={(e) =>
                          setEditHeroFormData({
                            ...editHeroFormData,
                            title: e.target.value,
                          })
                        }
                        placeholder="e.g., Creative"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title Highlight (Animated) *</Label>
                      <Input
                        value={editHeroFormData.title_highlight || ""}
                        onChange={(e) =>
                          setEditHeroFormData({
                            ...editHeroFormData,
                            title_highlight: e.target.value,
                          })
                        }
                        placeholder="e.g., Developer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Subtitle *</Label>
                    <Textarea
                      value={editHeroFormData.subtitle || ""}
                      onChange={(e) =>
                        setEditHeroFormData({
                          ...editHeroFormData,
                          subtitle: e.target.value,
                        })
                      }
                      placeholder="e.g., Crafting digital experiences that blend"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subtitle Highlight 1 (Colored) *</Label>
                      <Input
                        value={editHeroFormData.subtitle_highlight_1 || ""}
                        onChange={(e) =>
                          setEditHeroFormData({
                            ...editHeroFormData,
                            subtitle_highlight_1: e.target.value,
                          })
                        }
                        placeholder="e.g., innovation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle Highlight 2 (Colored) *</Label>
                      <Input
                        value={editHeroFormData.subtitle_highlight_2 || ""}
                        onChange={(e) =>
                          setEditHeroFormData({
                            ...editHeroFormData,
                            subtitle_highlight_2: e.target.value,
                          })
                        }
                        placeholder="e.g., functionality"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editHeroFormData.description || ""}
                      onChange={(e) =>
                        setEditHeroFormData({
                          ...editHeroFormData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Optional description/tagline"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hero Image URL</Label>
                    <Input
                      type="url"
                      value={editHeroFormData.hero_image_url || ""}
                      onChange={(e) =>
                        setEditHeroFormData({
                          ...editHeroFormData,
                          hero_image_url: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First CTA Button Text</Label>
                      <Input
                        value={editHeroFormData.cta_button_1_text || ""}
                        onChange={(e) =>
                          setEditHeroFormData({
                            ...editHeroFormData,
                            cta_button_1_text: e.target.value,
                          })
                        }
                        placeholder="e.g., Explore My Work"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>First CTA Button Action</Label>
                      <Input
                        value={editHeroFormData.cta_button_1_action || ""}
                        onChange={(e) =>
                          setEditHeroFormData({
                            ...editHeroFormData,
                            cta_button_1_action: e.target.value,
                          })
                        }
                        placeholder="e.g., projects"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Second CTA Button Text</Label>
                      <Input
                        value={editHeroFormData.cta_button_2_text || ""}
                        onChange={(e) =>
                          setEditHeroFormData({
                            ...editHeroFormData,
                            cta_button_2_text: e.target.value,
                          })
                        }
                        placeholder="e.g., Let's Connect"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Second CTA Button Action</Label>
                      <Input
                        value={editHeroFormData.cta_button_2_action || ""}
                        onChange={(e) =>
                          setEditHeroFormData({
                            ...editHeroFormData,
                            cta_button_2_action: e.target.value,
                          })
                        }
                        placeholder="e.g., contact"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editHeroFormData.is_active || false}
                        onCheckedChange={(checked) =>
                          setEditHeroFormData({
                            ...editHeroFormData,
                            is_active: checked,
                          })
                        }
                      />
                      <span className="text-sm text-gray-600">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={cancelEditHero}
                        variant="outline"
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveHeroChanges} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!heroSettings && (
                <div className="text-center py-8 text-gray-500">
                  <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hero settings found. Please contact administrator.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
