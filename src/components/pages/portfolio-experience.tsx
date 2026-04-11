import { useEffect, useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Moon,
  Sun,
  Github,
  ExternalLink,
  Mail,
  Send,
  Star,
  Code,
  Palette,
  Rocket,
  Heart,
  Coffee,
  Zap,
  Target,
  CheckCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { useToast } from "@/components/ui/use-toast";
import ChatWidget from "@/components/ui/chat-widget";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { AvatarAssistant } from "@/components/ui/avatar-assistant";

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  icon_url: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  long_description: string;
  tech_stack: string[];
  github_url: string;
  live_url: string;
  image_url: string;
  video_url: string;
  featured: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  published_at: string;
  tags: string[];
  featured_image: string;
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

interface PortfolioExperienceProps {
  onBackToLanding?: () => void;
}

const ORBIT_NODES = [
  { label: "Projects",    angle: 0,   detail: "20+ shipped · React · Next.js" },
  { label: "Systems",     angle: 72,  detail: "Microservices · REST · GraphQL" },
  { label: "APIs",        angle: 144, detail: "Node.js · Express · FastAPI" },
  { label: "Performance", angle: 216, detail: "< 100ms · Edge · CDN" },
  { label: "AI/ML",       angle: 288, detail: "OpenAI · LangChain · RAG" },
];
const ORBIT_RADIUS = 220;

function MagneticButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className: string;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({ x: (e.clientX - cx) * 0.3, y: (e.clientY - cy) * 0.3 });
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`flex items-center ${className}`}
    >
      {children}
    </motion.button>
  );
}

export default function PortfolioExperience({
  onBackToLanding,
}: PortfolioExperienceProps = {}) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("portfolioTheme");
    if (saved === null) return true; // default dark
    return saved === "dark";
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "200%"]);

  // New state
  const [navVisible, setNavVisible] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState("Frontend");
  const [activeProjectTab, setActiveProjectTab] = useState<Record<string, string>>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  const roles = ["Developer", "Engineer", "Architect", "Problem Solver"];
  const [roleIndex, setRoleIndex] = useState(0);
  const [heroReady, setHeroReady] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [chatInitialOpen, setChatInitialOpen] = useState(false);
  const [speakGreeting, setSpeakGreeting] = useState(false);
  const [avatarDismissed, setAvatarDismissed] = useState(false);
  const buildPhrases = ["Scalable Systems", "High-performance Apps", "Intelligent Interfaces", "Full Stack Products"];

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % roles.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchData();
    fetchProfileData();
    localStorage.setItem("portfolioTheme", isDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const fetchProfileData = async () => {
    const fallbackAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80";
    try {
      const { data, error } = await db
        .from("profiles")
        .select("*")
        .single();

      if (data && !error) {
        setProfile({
          ...data,
          // Prioritise base64 image_data, then avatar_url, then fallback — same as home view
          avatar_url: data.image_data || data.avatar_url || fallbackAvatar,
        });
      } else {
        setProfile({
          full_name: "Ramya Lakhani",
          bio: "Full-stack developer passionate about creating amazing digital experiences",
          role: "Full-Stack Developer",
          avatar_url: fallbackAvatar,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile({
        full_name: "Ramya Lakhani",
        bio: "Full-stack developer passionate about creating amazing digital experiences",
        role: "Full-Stack Developer",
        avatar_url: fallbackAvatar,
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "hero",
        "about",
        "skills",
        "projects",
        "blog",
        "contact",
      ];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleScrollNav = () => {
      setNavVisible(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", handleScrollNav);
    return () => window.removeEventListener("scroll", handleScrollNav);
  }, []);

  const fetchData = async () => {
    try {
      const [skillsRes, projectsRes, blogsRes, heroRes] = await Promise.all([
        db
          .from("skills")
          .select("*")
          .order("proficiency", { ascending: false }),
        db
          .from("projects")
          .select("*")
          .order("order_index", { ascending: true }),
        db
          .from("blogs")
          .select("*")
          .eq("is_active", true)
          .order("published_at", { ascending: false })
          .limit(3),
        db
          .from("portfolio_hero_settings")
          .select("*")
          .single(),
      ]);

      if (skillsRes.data) setSkills(skillsRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (blogsRes.data && blogsRes.data.length > 0) {
        setBlogPosts(blogsRes.data);
      }
      if (heroRes.data) {
        setHeroSettings(heroRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await db.from("contact_submissions").insert({
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message,
        user_flow: "viewer",
      });

      if (error) throw error;

      setIsSubmitted(true);
      setContactForm({ name: "", email: "", subject: "", message: "" });
      toast({
        title: "Message sent successfully!",
        description: "Thanks for reaching out! I'll get back to you soon.",
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error sending message",
        description: "Please try again or contact me directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Animation variants — 2026: spring physics + modern easing
  const textReveal = {
    hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  };

  const cardEntrance = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 80, damping: 14 },
    },
  };

  const skillCategories = {
    Frontend: { icon: Code, color: "from-[#C6A86B] to-[#D4B87A]" },
    Backend: { icon: Zap, color: "from-[#9CA3AF] to-[#6B7280]" },
    Database: { icon: Target, color: "from-[#C6A86B]/70 to-[#C6A86B]/50" },
    Tools: { icon: Palette, color: "from-[#C6A86B]/60 to-[#9CA3AF]" },
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen transition-colors duration-500 ${
        isDarkMode
          ? "bg-[#0B0B0C] text-[#F5F1E8]"
          : "bg-gradient-to-br from-white via-gray-50 to-gray-100 text-[#0B0B0C]"
      }`}
    >
      {/* Floating Pill Navigation */}
      <AnimatePresence>
        {navVisible && (
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl rounded-full px-4 sm:px-6 py-3
              flex items-center gap-3 sm:gap-6 shadow-2xl border
              ${isDarkMode
                ? "bg-[#111111]/90 border-[#222222]"
                : "bg-white/90 border-gray-200"
              }`}
          >
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 text-[#C6A86B] hover:text-[#D4B87A] transition-colors mr-1 sm:mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </button>

            {["About", "Skills", "Projects", "Blog", "Contact"].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className={`relative text-xs sm:text-sm font-medium transition-colors hidden sm:flex items-center gap-1.5
                  ${activeSection === item.toLowerCase()
                    ? "text-[#C6A86B]"
                    : isDarkMode
                      ? "text-[#9CA3AF] hover:text-[#F5F1E8]"
                      : "text-gray-600 hover:text-[#0B0B0C]"
                  }`}
              >
                {activeSection === item.toLowerCase() && (
                  <motion.span
                    layoutId="nav-dot"
                    className="w-1.5 h-1.5 rounded-full bg-[#C6A86B]"
                  />
                )}
                {item}
              </button>
            ))}

            {/* Mobile: show only active section label */}
            <span className="sm:hidden text-xs font-medium text-[#C6A86B] capitalize">{activeSection}</span>

            <div className={`flex items-center gap-2 ml-1 sm:ml-2 pl-2 border-l ${isDarkMode ? "border-[#222222]" : "border-gray-200"}`}>
              <Sun className={`w-3.5 h-3.5 ${isDarkMode ? "text-[#9CA3AF]" : "text-yellow-500"}`} />
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                className="data-[state=checked]:bg-[#C6A86B] scale-75"
              />
              <Moon className={`w-3.5 h-3.5 ${isDarkMode ? "text-[#C6A86B]" : "text-gray-400"}`} />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Hero Section — OS Interface */}
      <section
        id="hero"
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Grid mesh background */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(198,168,107,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(198,168,107,0.03) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Radial depth vignette */}
        {isDarkMode && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(11,11,12,0.7) 100%)" }}
          />
        )}

        {/* Drifting gradient orb */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none z-0"
          style={{ background: "radial-gradient(circle, rgba(198,168,107,0.04) 0%, transparent 70%)" }}
          animate={{ x: ["-10%", "10%", "-10%"], y: ["-5%", "5%", "-5%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Cursor glow blob — upgraded */}
        <motion.div
          className="pointer-events-none absolute w-[500px] h-[500px] rounded-full bg-[#C6A86B]/[0.06] blur-[120px] z-0"
          animate={{ left: mousePos.x - 250, top: mousePos.y - 250 }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        />

        {/* Main content — centered column */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-8 pb-4 flex flex-col items-center">

          {/* Top status bar */}
          <motion.div
            className="flex items-center justify-center gap-3 sm:gap-6 mb-6 text-[10px] sm:text-xs font-mono flex-wrap"
            initial={{ opacity: 0, y: -10 }}
            animate={heroReady ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <span className={isDarkMode ? "text-[#F5F1E8]/60" : "text-gray-500"}>{profile?.full_name || "Ramya Lakhani"}</span>
            <span className={isDarkMode ? "text-[#222222]" : "text-gray-300"}>·</span>
            <span className="text-[#C6A86B]">Full Stack Engineer</span>
            <span className={isDarkMode ? "text-[#222222]" : "text-gray-300"}>·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className={isDarkMode ? "text-[#9CA3AF]" : "text-gray-500"}>Available</span>
            </span>
          </motion.div>

          {/* "I build" + cycling headline */}
          <motion.div
            className="text-center mb-10 z-20"
            initial={{ opacity: 0, y: 16 }}
            animate={heroReady ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 2.0, duration: 0.5 }}
          >
            <p className={`text-sm tracking-widest font-mono mb-3 uppercase ${isDarkMode ? "text-[#9CA3AF]" : "text-gray-500"}`}>
              I build
            </p>
            <AnimatePresence mode="wait">
              <motion.h1
                key={roleIndex}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-3xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#C6A86B] via-[#D4B87A] to-[#C6A86B] bg-clip-text text-transparent"
              >
                {buildPhrases[roleIndex]}
              </motion.h1>
            </AnimatePresence>
          </motion.div>

          {/* Mobile orbit nodes — simple grid for small screens */}
          <div className="flex sm:hidden flex-wrap justify-center gap-2 mb-6">
            {ORBIT_NODES.map((node) => (
              <div
                key={node.label}
                className={`rounded-xl px-3 py-2 text-xs font-mono border
                  ${isDarkMode ? "bg-[#111111] border-[#222222] text-[#9CA3AF]" : "bg-white border-gray-200 text-gray-500"}`}
              >
                <span className="text-[#C6A86B] font-medium">{node.label}</span>
                <p className="text-[10px] mt-0.5 opacity-70">{node.detail}</p>
              </div>
            ))}
          </div>

          {/* System Core — rings + avatar + orbit nodes (desktop only) */}
          <div
            className="relative hidden sm:flex items-center justify-center"
            style={{ width: 480, height: 480, overflow: "visible" }}
            onMouseEnter={() => setIsPanelHovered(true)}
            onMouseLeave={() => setIsPanelHovered(false)}
          >
            {/* Gold seed dot — cinematic entry */}
            <motion.div
              className="absolute w-1 h-1 rounded-full bg-[#C6A86B] z-30"
              style={{ top: "50%", left: "50%", marginTop: -2, marginLeft: -2 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={heroReady ? { scale: [0, 1, 0], opacity: [0, 1, 0] } : {}}
              transition={{ times: [0, 0.3, 0.8], duration: 0.8 }}
            />

            {/* Core glow */}
            <motion.div
              className="absolute rounded-full bg-[#C6A86B]/[0.08] blur-3xl pointer-events-none"
              style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
              initial={{ width: 60, height: 60, opacity: 0 }}
              animate={heroReady ? { width: 200, height: 200, opacity: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.4 }}
            />

            {/* Ring 1 — d=280px */}
            <motion.div
              className="absolute rounded-full border border-[#C6A86B]/30"
              style={{ width: 280, height: 280, top: "50%", left: "50%", marginTop: -140, marginLeft: -140 }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={heroReady ? { opacity: 1, scale: 1, rotate: 360 } : {}}
              transition={{
                opacity: { delay: 0.8, duration: 0.4 },
                scale: { delay: 0.8, duration: 0.4 },
                rotate: { delay: 0.8, duration: 8, repeat: Infinity, ease: "linear", repeatType: "loop" },
              }}
            >
              <motion.div
                className="absolute rounded-full bg-[#C6A86B]"
                style={{ width: 8, height: 8, top: -4, left: "50%", marginLeft: -4, boxShadow: "0 0 8px rgba(198,168,107,1)" }}
                animate={heroReady ? { rotate: -360 } : {}}
                transition={{ delay: 0.8, duration: 8, repeat: Infinity, ease: "linear", repeatType: "loop" }}
              />
            </motion.div>

            {/* Ring 2 — d=360px — dots at absolute top/bottom, no CSS transform conflict */}
            <motion.div
              className="absolute rounded-full border border-[#C6A86B]/15"
              style={{ width: 360, height: 360, top: "50%", left: "50%", marginTop: -180, marginLeft: -180 }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={heroReady ? { opacity: 1, scale: 1, rotate: -360 } : {}}
              transition={{
                opacity: { delay: 1.0, duration: 0.4 },
                scale: { delay: 1.0, duration: 0.4 },
                rotate: { delay: 1.0, duration: 12, repeat: Infinity, ease: "linear", repeatType: "loop" },
              }}
            >
              {/* Top dot */}
              <div className="absolute w-1.5 h-1.5 rounded-full bg-[#C6A86B]/60" style={{ top: -3, left: "50%", marginLeft: -3 }} />
              {/* Bottom dot */}
              <div className="absolute w-1.5 h-1.5 rounded-full bg-[#9CA3AF]/40" style={{ bottom: -3, left: "50%", marginLeft: -3 }} />
            </motion.div>

            {/* Ring 3 — d=440px — pills at calculated absolute positions + counter-rotation wrapper */}
            <motion.div
              className="absolute rounded-full border border-[#C6A86B]/[0.08]"
              style={{ width: 440, height: 440, top: "50%", left: "50%", marginTop: -220, marginLeft: -220 }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={heroReady ? { opacity: 1, scale: 1, rotate: 360 } : {}}
              transition={{
                opacity: { delay: 1.2, duration: 0.4 },
                scale: { delay: 1.2, duration: 0.4 },
                rotate: { delay: 1.2, duration: 18, repeat: Infinity, ease: "linear", repeatType: "loop" },
              }}
            >
              {/* Ring 3 is purely decorative — no children */}
            </motion.div>

            {/* Tech pills — orbiting wrapper rotates, children counter-rotate to stay upright */}
            <motion.div
              className="absolute"
              style={{ top: "50%", left: "50%", width: 0, height: 0 }}
              animate={heroReady ? { rotate: -360 } : {}}
              transition={{ delay: 1.4, duration: 18, repeat: Infinity, ease: "linear", repeatType: "loop" }}
            >
              {(["React", "Node.js", "PostgreSQL"] as const).map((label, i) => {
                const rad = ((i * 120) - 90) * (Math.PI / 180);
                const px = 230 * Math.cos(rad);
                const py = 230 * Math.sin(rad);
                return (
                  <motion.div
                    key={label}
                    className="absolute pointer-events-none"
                    style={{ left: px, top: py, x: "-50%", y: "-50%" }}
                    initial={{ opacity: 0 }}
                    animate={heroReady ? { opacity: 1, rotate: 360 } : {}}
                    transition={{
                      opacity: { delay: 1.4 + i * 0.15, duration: 0.4 },
                      rotate: { delay: 1.4, duration: 18, repeat: Infinity, ease: "linear", repeatType: "loop" },
                    }}
                  >
                    <div className={`px-2 py-0.5 rounded-full border text-[10px] font-mono whitespace-nowrap
                      ${isDarkMode ? "border-[#C6A86B]/20 text-[#C6A86B]/60 bg-[#111111]/80" : "border-[#C6A86B]/30 text-[#C6A86B] bg-white/80"}`}>
                      {label}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Avatar — center: plain div handles centering, inner motion.div handles animation */}
            <div className="absolute z-20" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={heroReady ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="w-40 h-40 rounded-full overflow-hidden border-2 border-[#C6A86B]/30"
                style={{ boxShadow: "0 0 40px rgba(198,168,107,0.15), 0 0 80px rgba(198,168,107,0.06)" }}
              >
                <img
                  src={
                    profile?.avatar_url && profile.avatar_url.startsWith("http")
                      ? profile.avatar_url
                      : "https://api.dicebear.com/7.x/avataaars/png?seed=ramyalakhani&skinColor=brown&top=shortHairShortFlat&topChance=100&facialHair=beardLight&facialHairChance=60&facialHairColor=2c1b18&eyes=default&eyebrow=defaultNatural&mouth=smile&accessories=prescription01&accessoriesChance=55&size=200"
                  }
                  alt={profile?.full_name || "Profile"}
                  className="w-full h-full object-cover bg-[#1A1A1A]"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80";
                  }}
                />
              </div>
            </motion.div>
            </div>{/* end avatar centering wrapper */}

            {/* Orbit interactive nodes — wrapper rotates, children counter-rotate to stay upright */}
            <motion.div
              className="absolute"
              style={{ top: "50%", left: "50%", width: 0, height: 0 }}
              animate={heroReady ? { rotate: 360 } : {}}
              transition={{ delay: 1.4, duration: 25, repeat: Infinity, ease: "linear", repeatType: "loop" }}
            >
              {ORBIT_NODES.map((node, i) => {
                const rad = (node.angle - 90) * (Math.PI / 180);
                const nx = ORBIT_RADIUS * Math.cos(rad);
                const ny = ORBIT_RADIUS * Math.sin(rad);

                return (
                  <motion.div
                    key={node.label}
                    className="absolute z-30"
                    style={{ left: nx, top: ny, x: "-50%", y: "-50%" }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={heroReady ? { opacity: 1, scale: 1, rotate: -360 } : {}}
                    transition={{
                      opacity: { delay: 1.4 + i * 0.1, duration: 0.4 },
                      scale: { delay: 1.4 + i * 0.1, duration: 0.4 },
                      rotate: { delay: 1.4, duration: 25, repeat: Infinity, ease: "linear", repeatType: "loop" },
                    }}
                    onHoverStart={() => setHoveredNode(i)}
                    onHoverEnd={() => setHoveredNode(null)}
                  >
                    <motion.div
                      className={`rounded-xl px-3 py-1.5 text-xs font-mono cursor-default select-none border transition-colors duration-200
                        ${hoveredNode === i
                          ? "bg-[#1A1A1A] border-[#C6A86B]/50 text-[#C6A86B]"
                          : isDarkMode
                            ? "bg-[#111111] border-[#222222] text-[#9CA3AF]"
                            : "bg-white border-gray-200 text-gray-500"
                        }`}
                    >
                      {node.label}
                      <AnimatePresence>
                        {hoveredNode === i && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-[#9CA3AF] font-mono overflow-hidden whitespace-nowrap"
                          >
                            {node.detail}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* CTA row */}
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-6 sm:mt-10 z-20 w-full sm:w-auto px-4 sm:px-0"
            initial={{ opacity: 0, y: 20 }}
            animate={heroReady ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 2.5, duration: 0.5 }}
          >
            <MagneticButton
              onClick={() => scrollToSection(heroSettings?.cta_button_1_action || "projects")}
              className="relative overflow-hidden px-6 py-3 rounded-full bg-[#C6A86B] text-[#0B0B0C] font-semibold text-sm"
            >
              <motion.span
                className="flex items-center"
                whileHover={{ scale: 1.05 }}
              >
                {heroSettings?.cta_button_1_text || "View Work"} →
              </motion.span>
            </MagneticButton>
            <MagneticButton
              onClick={() => scrollToSection(heroSettings?.cta_button_2_action || "contact")}
              className={`px-6 py-3 rounded-full border font-semibold text-sm backdrop-blur-sm
                ${isDarkMode ? "border-[#C6A86B]/40 text-[#C6A86B]" : "border-[#C6A86B]/40 text-[#C6A86B]"}`}
            >
              {heroSettings?.cta_button_2_text || "Let's Connect"}
            </MagneticButton>
          </motion.div>
        </div>

        {/* Floating glass panels */}
        <motion.div
          className="absolute bottom-12 left-8 bg-[#111111]/60 backdrop-blur-md border border-[#C6A86B]/10 rounded-xl px-4 py-3 text-xs font-mono pointer-events-none z-10 hidden md:block"
          initial={{ opacity: 0, x: -30 }}
          animate={heroReady ? { opacity: 1, x: 0, y: [0, -8, 0] } : {}}
          transition={{
            opacity: { delay: 2.7, duration: 0.6 },
            x: { delay: 2.7, duration: 0.6 },
            y: { delay: 3.0, duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <p className="text-[#C6A86B] text-base font-bold">3+ yrs</p>
          <p className="text-[#9CA3AF]">Experience</p>
        </motion.div>

        <motion.div
          className="absolute bottom-12 right-8 bg-[#111111]/60 backdrop-blur-md border border-[#C6A86B]/10 rounded-xl px-4 py-3 text-xs font-mono pointer-events-none z-10 hidden md:block"
          initial={{ opacity: 0, x: 30 }}
          animate={heroReady ? { opacity: 1, x: 0, y: [0, -8, 0] } : {}}
          transition={{
            opacity: { delay: 2.7, duration: 0.6 },
            x: { delay: 2.7, duration: 0.6 },
            y: { delay: 3.2, duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <p className="text-[#C6A86B] text-base font-bold">20+</p>
          <p className="text-[#9CA3AF]">Projects</p>
        </motion.div>

        <motion.div
          className="absolute top-24 left-8 bg-[#111111]/60 backdrop-blur-md border border-[#C6A86B]/10 rounded-xl px-4 py-3 text-xs font-mono pointer-events-none z-10 hidden md:block"
          initial={{ opacity: 0, x: -30 }}
          animate={heroReady ? { opacity: 1, x: 0, y: [0, -8, 0] } : {}}
          transition={{
            opacity: { delay: 2.7, duration: 0.6 },
            x: { delay: 2.7, duration: 0.6 },
            y: { delay: 3.4, duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <p className={`text-[10px] ${isDarkMode ? "text-[#9CA3AF]" : "text-gray-500"}`}>Stack</p>
          <p className="text-[#C6A86B]">Node.js · React · PostgreSQL</p>
        </motion.div>

        <motion.div
          className="absolute top-24 right-8 bg-[#111111]/60 backdrop-blur-md border border-[#C6A86B]/10 rounded-xl px-4 py-3 text-xs font-mono pointer-events-none z-10 hidden md:block"
          initial={{ opacity: 0, x: 30 }}
          animate={heroReady ? { opacity: 1, x: 0, y: [0, -8, 0] } : {}}
          transition={{
            opacity: { delay: 2.7, duration: 0.6 },
            x: { delay: 2.7, duration: 0.6 },
            y: { delay: 3.6, duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[#9CA3AF]">Open to roles</span>
          </span>
        </motion.div>
      </section>

      {/* How I Think Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-16"
          >
            <motion.p
              variants={textReveal}
              className="text-[#C6A86B] text-sm font-mono tracking-widest uppercase mb-3"
            >
              Philosophy
            </motion.p>
            <motion.h2 variants={textReveal} className="text-4xl md:text-5xl font-bold">
              How I Think
            </motion.h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                number: "01",
                title: "Systems First",
                desc: "Think about scale before writing the first line. Architecture decisions made early compound — either toward clarity or chaos.",
              },
              {
                number: "02",
                title: "Ship, Then Refine",
                desc: "A working product in users' hands beats perfect architecture in a PR. Ship, measure, iterate with real signal.",
              },
              {
                number: "03",
                title: "Depth Over Breadth",
                desc: "Master three things deeply rather than skimming ten. Expertise compounds; shallow knowledge doesn't.",
              },
            ].map((card, index) => (
              <motion.div
                key={index}
                variants={cardEntrance}
                transition={{ delay: index * 0.15 }}
                whileHover={{
                  boxShadow:
                    "0 0 30px rgba(198,168,107,0.15), 0 0 0 1px rgba(198,168,107,0.2)",
                }}
                className={`group relative p-8 rounded-2xl border-l-4 border-[#C6A86B] transition-all duration-300
                  ${isDarkMode
                    ? "bg-[#1A1A1A] border-r border-t border-b border-r-[#222222] border-t-[#222222] border-b-[#222222]"
                    : "bg-white border-r border-t border-b border-r-gray-200 border-t-gray-200 border-b-gray-200"
                  } shadow-lg`}
              >
                <span
                  className={`text-6xl font-bold absolute top-4 right-6 select-none ${
                    isDarkMode ? "text-[#222222]" : "text-gray-100"
                  }`}
                >
                  {card.number}
                </span>
                <h3 className="text-xl font-semibold mb-3 relative z-10">{card.title}</h3>
                <p
                  className={`text-sm leading-relaxed relative z-10 ${
                    isDarkMode ? "text-[#9CA3AF]" : "text-gray-600"
                  }`}
                >
                  {card.desc}
                </p>
                <div className="mt-4 h-px bg-[#C6A86B]/0 group-hover:bg-[#C6A86B]/40 transition-all duration-300 w-0 group-hover:w-full" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-12"
          >
            <motion.p
              variants={textReveal}
              className="text-[#C6A86B] text-sm font-mono tracking-widest uppercase mb-3"
            >
              Stack
            </motion.p>
            <motion.h2 variants={textReveal} className="text-4xl md:text-5xl font-bold mb-2">
              Skills
            </motion.h2>
            <motion.p
              variants={textReveal}
              className={`text-lg ${isDarkMode ? "text-[#9CA3AF]" : "text-gray-600"}`}
            >
              Technologies I work with to bring ideas to life
            </motion.p>
          </motion.div>

          {/* Category tabs */}
          <div
            className={`flex items-center gap-2 mb-10 border-b overflow-x-auto ${
              isDarkMode ? "border-[#222222]" : "border-gray-200"
            } pb-0`}
          >
            {Object.keys(skillCategories).map((cat) => {
              const count = skills.filter((s) => s.category === cat).length;
              const isActive = activeSkillTab === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveSkillTab(cat)}
                  className={`relative px-4 pb-3 text-sm font-medium flex items-center gap-2 transition-colors
                    ${isActive
                      ? "text-[#C6A86B]"
                      : isDarkMode
                        ? "text-[#9CA3AF] hover:text-[#F5F1E8]"
                        : "text-gray-500 hover:text-[#0B0B0C]"
                    }`}
                >
                  {cat}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full
                      ${isActive
                        ? "bg-[#C6A86B] text-[#0B0B0C]"
                        : isDarkMode
                          ? "bg-[#222222] text-[#9CA3AF]"
                          : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {count}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="skill-tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C6A86B]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Skill pills */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSkillTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-wrap gap-3"
            >
              {skills
                .filter((s) => s.category === activeSkillTab)
                .map((skill) => (
                  <motion.div
                    key={skill.id}
                    whileHover={{
                      boxShadow:
                        "0 0 20px rgba(198,168,107,0.2), 0 0 0 1px rgba(198,168,107,0.4)",
                      borderColor: "#C6A86B",
                    }}
                    className={`flex flex-col gap-1.5 px-4 py-3 rounded-full border cursor-default transition-colors
                      ${isDarkMode ? "bg-[#1A1A1A] border-[#222222]" : "bg-white border-gray-200"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{skill.name}</span>
                      <span className={`text-xs ${isDarkMode ? "text-[#9CA3AF]" : "text-gray-500"}`}>
                        {skill.proficiency}%
                      </span>
                    </div>
                    <div
                      className={`w-full h-px ${isDarkMode ? "bg-[#222222]" : "bg-gray-100"} rounded-full overflow-hidden`}
                    >
                      <motion.div
                        className="h-full bg-[#C6A86B] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.proficiency}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                  </motion.div>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-16"
          >
            <motion.p
              variants={textReveal}
              className="text-[#C6A86B] text-sm font-mono tracking-widest uppercase mb-3"
            >
              Work
            </motion.p>
            <motion.h2 variants={textReveal} className="text-4xl md:text-5xl font-bold">
              Featured Projects
            </motion.h2>
          </motion.div>

          <div className="space-y-6">
            {projects.map((project, index) => {
              const tab = activeProjectTab[project.id] ?? "Preview";
              const projectNum = `#${String(index + 1).padStart(2, "0")}`;
              return (
                <motion.div
                  key={project.id}
                  variants={cardEntrance}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{
                    boxShadow:
                      "0 0 30px rgba(198,168,107,0.15), 0 0 0 1px rgba(198,168,107,0.2)",
                  }}
                  className={`group relative rounded-2xl overflow-hidden border-l-4 border-[#C6A86B]
                    ${isDarkMode
                      ? "bg-[#111111] border-r border-t border-b border-r-[#222222] border-t-[#222222] border-b-[#222222]"
                      : "bg-white border-r border-t border-b border-r-gray-200 border-t-gray-200 border-b-gray-200"
                    } shadow-lg`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px]">
                    {/* LEFT: Project info */}
                    <div className="relative p-6 sm:p-10 flex flex-col justify-between min-h-[250px] sm:min-h-[300px]">
                      {/* Large background number */}
                      <span
                        className="absolute top-6 right-8 text-8xl font-bold select-none pointer-events-none"
                        style={{
                          color: isDarkMode
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(0,0,0,0.04)",
                        }}
                      >
                        {projectNum}
                      </span>

                      <div>
                        <p className="text-[#C6A86B] text-xs font-mono tracking-widest mb-3">
                          {projectNum}
                        </p>
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                          {project.title}
                        </h3>
                        <p
                          className={`text-sm leading-relaxed mb-6 max-w-lg ${
                            isDarkMode ? "text-[#9CA3AF]" : "text-gray-600"
                          }`}
                        >
                          {project.long_description || project.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {project.tech_stack.map((tech) => (
                            <Badge
                              key={tech}
                              variant="secondary"
                              className={`text-xs ${
                                isDarkMode
                                  ? "bg-[#1A1A1A] text-[#9CA3AF] border border-[#222222] hover:bg-[#222222]"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Tab switcher */}
                      <div>
                        <div className="flex items-center gap-1 mb-4">
                          {["Preview", "Tech Stack", "Impact"].map((t) => (
                            <button
                              key={t}
                              onClick={() =>
                                setActiveProjectTab((prev) => ({
                                  ...prev,
                                  [project.id]: t,
                                }))
                              }
                              className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200
                                ${tab === t
                                  ? "bg-[#C6A86B] text-[#0B0B0C] font-semibold"
                                  : isDarkMode
                                    ? "text-[#9CA3AF] hover:text-[#F5F1E8] border border-[#222222]"
                                    : "text-gray-500 hover:text-[#0B0B0C] border border-gray-200"
                                }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        {/* Links */}
                        <div className="flex gap-4">
                          <a
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm font-medium text-[#C6A86B] hover:text-[#D4B87A] transition-colors"
                          >
                            <Github className="w-4 h-4" /> Code
                          </a>
                          <a
                            href={project.live_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                              isDarkMode
                                ? "text-[#9CA3AF] hover:text-[#F5F1E8]"
                                : "text-gray-600 hover:text-[#0B0B0C]"
                            }`}
                          >
                            <ExternalLink className="w-4 h-4" /> Live Demo
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Dynamic panel */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={tab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative overflow-hidden min-h-[300px]"
                      >
                        {tab === "Preview" && (
                          <img
                            src={project.image_url}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        {tab === "Tech Stack" && (
                          <div
                            className={`p-8 h-full flex flex-wrap gap-3 content-start ${
                              isDarkMode ? "bg-[#0B0B0C]" : "bg-gray-50"
                            }`}
                          >
                            {project.tech_stack.map((tech) => (
                              <span
                                key={tech}
                                className="px-3 py-2 rounded-lg text-sm font-mono border border-[#C6A86B]/30 text-[#C6A86B]"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        {tab === "Impact" && (
                          <div
                            className={`p-8 h-full flex flex-col justify-center ${
                              isDarkMode ? "bg-[#0B0B0C]" : "bg-gray-50"
                            }`}
                          >
                            <p
                              className={`text-sm leading-relaxed ${
                                isDarkMode ? "text-[#9CA3AF]" : "text-gray-600"
                              }`}
                            >
                              {project.long_description || project.description}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-16"
          >
            <motion.p
              variants={textReveal}
              className="text-[#C6A86B] text-sm font-mono tracking-widest uppercase mb-3"
            >
              Writing
            </motion.p>
            <motion.h2 variants={textReveal} className="text-4xl md:text-5xl font-bold">
              Latest Insights
            </motion.h2>
          </motion.div>

          <div className="space-y-4">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.id}
                variants={cardEntrance}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  y: -4,
                  boxShadow:
                    "0 0 30px rgba(198,168,107,0.15), 0 0 0 1px rgba(198,168,107,0.2)",
                }}
                className={`group relative grid grid-cols-1 md:grid-cols-[280px_1fr] rounded-2xl overflow-hidden border-l-4 border-transparent hover:border-[#C6A86B] transition-all duration-300
                  ${isDarkMode
                    ? "bg-[#111111] border-r border-t border-b border-[#222222]"
                    : "bg-white border-r border-t border-b border-gray-200"
                  } shadow-lg cursor-pointer`}
              >
                {/* Date watermark */}
                <span
                  className="absolute top-2 right-4 text-6xl font-bold select-none pointer-events-none"
                  style={{
                    color: isDarkMode
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.03)",
                  }}
                >
                  {new Date(post.published_at).getFullYear()}
                </span>

                {/* Left: Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-48 md:h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Right: Content */}
                <div className="p-6 flex flex-col justify-between relative z-10">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs border-[#C6A86B]/40 text-[#C6A86B]"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-[#C6A86B] transition-colors">
                      {post.title}
                    </h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        isDarkMode ? "text-[#9CA3AF]" : "text-gray-600"
                      }`}
                    >
                      {post.excerpt}
                    </p>
                  </div>
                  <div
                    className={`mt-4 text-xs ${
                      isDarkMode ? "text-[#9CA3AF]" : "text-gray-500"
                    }`}
                  >
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* LEFT: Headline + availability + socials */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.p
                variants={textReveal}
                className="text-[#C6A86B] text-sm font-mono tracking-widest uppercase mb-4"
              >
                Contact
              </motion.p>
              <motion.h2
                variants={textReveal}
                className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
              >
                Let's Build<br />Together
              </motion.h2>
              <motion.div
                variants={textReveal}
                className="flex items-center gap-2 mb-8"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className={`text-sm ${isDarkMode ? "text-[#9CA3AF]" : "text-gray-600"}`}>
                  Available for projects
                </span>
              </motion.div>
              <motion.p
                variants={textReveal}
                className={`text-lg leading-relaxed mb-10 ${
                  isDarkMode ? "text-[#9CA3AF]" : "text-gray-600"
                }`}
              >
                Have a project in mind? Let's discuss how we can bring your vision to life.
              </motion.p>
              <motion.div variants={textReveal} className="flex items-center gap-4">
                <a
                  href="mailto:hello@example.com"
                  className="flex items-center gap-2 text-sm font-medium transition-colors text-[#C6A86B] hover:text-[#D4B87A]"
                >
                  <Mail className="w-5 h-5" /> Email
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isDarkMode
                      ? "text-[#9CA3AF] hover:text-[#F5F1E8]"
                      : "text-gray-600 hover:text-[#0B0B0C]"
                  }`}
                >
                  <Github className="w-5 h-5" /> GitHub
                </a>
              </motion.div>
            </motion.div>

            {/* RIGHT: Contact form */}
            <motion.div
              variants={cardEntrance}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-4"
                >
                  <CheckCircle
                    className={`w-20 h-20 mx-auto ${
                      isDarkMode ? "text-green-400" : "text-green-500"
                    }`}
                  />
                  <h3 className="text-2xl font-semibold">Message Sent!</h3>
                  <p className={isDarkMode ? "text-[#9CA3AF]" : "text-gray-600"}>
                    Thanks for reaching out! I'll get back to you soon with some creative ideas.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Name *", key: "name" as const, type: "text" },
                      { label: "Email *", key: "email" as const, type: "email" },
                    ].map(({ label, key, type }) => (
                      <div key={key} className="space-y-1">
                        <label
                          className={`text-xs font-medium tracking-widest uppercase ${
                            isDarkMode ? "text-[#9CA3AF]" : "text-gray-500"
                          }`}
                        >
                          {label}
                        </label>
                        <input
                          type={type}
                          required
                          value={contactForm[key]}
                          onChange={(e) =>
                            setContactForm({ ...contactForm, [key]: e.target.value })
                          }
                          className={`w-full bg-transparent border-0 border-b pb-2 text-sm focus:outline-none transition-colors
                            ${isDarkMode
                              ? "border-[#222222] focus:border-[#C6A86B] text-[#F5F1E8]"
                              : "border-gray-300 focus:border-[#C6A86B] text-[#0B0B0C]"
                            }`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-medium tracking-widest uppercase ${
                        isDarkMode ? "text-[#9CA3AF]" : "text-gray-500"
                      }`}
                    >
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.subject}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, subject: e.target.value })
                      }
                      placeholder="e.g., Project Collaboration, Freelance Opportunity"
                      className={`w-full bg-transparent border-0 border-b pb-2 text-sm focus:outline-none transition-colors
                        ${isDarkMode
                          ? "border-[#222222] focus:border-[#C6A86B] text-[#F5F1E8] placeholder:text-[#444]"
                          : "border-gray-300 focus:border-[#C6A86B] placeholder:text-gray-400"
                        }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-medium tracking-widest uppercase ${
                        isDarkMode ? "text-[#9CA3AF]" : "text-gray-500"
                      }`}
                    >
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, message: e.target.value })
                      }
                      placeholder="Tell me about your project or idea..."
                      className={`w-full bg-transparent border-0 border-b pb-2 text-sm focus:outline-none resize-none transition-colors
                        ${isDarkMode
                          ? "border-[#222222] focus:border-[#C6A86B] text-[#F5F1E8] placeholder:text-[#444]"
                          : "border-gray-300 focus:border-[#C6A86B] placeholder:text-gray-400"
                        }`}
                    />
                  </div>

                  <div className="relative inline-block w-full">
                    <div className="absolute -inset-1 rounded-full bg-[#C6A86B]/20 blur-md pointer-events-none" />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`relative w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold
                        transition-all duration-300 shadow-lg hover:shadow-xl
                        ${isDarkMode
                          ? "bg-[#C6A86B] text-[#0B0B0C] hover:bg-[#D4B87A]"
                          : "bg-[#C6A86B] text-[#0B0B0C] hover:bg-[#D4B87A]"
                        }`}
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`py-8 px-6 border-t ${
          isDarkMode ? "border-[#222222]" : "border-gray-200"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className={`text-sm ${isDarkMode ? "text-[#9CA3AF]" : "text-gray-600"}`}>
            © {new Date().getFullYear()} {profile?.full_name || "Developer"} — Available for exciting new projects
          </p>
        </div>
      </footer>

      {/* Custom Premium Cursor */}
      <CustomCursor />

      {/* Avatar Assistant + Chat Widget */}
      {profile && (
        <>
          {!avatarDismissed && (
            <AvatarAssistant
              onAccept={() => {
                setAvatarDismissed(true);
                setChatInitialOpen(true);
                setSpeakGreeting(true);
              }}
              onDecline={() => setAvatarDismissed(true)}
            />
          )}
          <ChatWidget
            profile={profile}
            initialOpen={chatInitialOpen}
            speakGreeting={speakGreeting}
            onSpeakGreetingDone={() => setSpeakGreeting(false)}
          />
        </>
      )}
    </div>
  );
}
