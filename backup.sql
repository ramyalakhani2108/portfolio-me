--
-- PostgreSQL database dump
--

\restrict LHtEAcDBvirjTGKRxHHK9udeKNDM0qoPjKDs97xwGE6qHvU3aqz0h4vwnQSZe4i

-- Dumped from database version 18.0 (78d4f7b)
-- Dumped by pg_dump version 18.0 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (
    id,
    user_id,
    email,
    name,
    full_name,
    avatar_url,
    token_identifier,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id::text,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
END;
$$;


--
-- Name: handle_user_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_user_update() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    name = NEW.raw_user_meta_data->>'name',
    full_name = NEW.raw_user_meta_data->>'full_name',
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NEW.updated_at
  WHERE user_id = NEW.id::text;
  RETURN NEW;
END;
$$;


--
-- Name: update_resume_data_meta(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_resume_data_meta() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at := CURRENT_TIMESTAMP;
  
  -- Ensure user_id is set (use first available user if null)
  IF NEW.user_id IS NULL THEN
    NEW.user_id := (SELECT id FROM public.auth_users LIMIT 1);
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(255) NOT NULL,
    password_hash text NOT NULL,
    email character varying(255),
    full_name character varying(255),
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE admins; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.admins IS 'Admin users table for portfolio dashboard access';


--
-- Name: COLUMN admins.password_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admins.password_hash IS 'bcrypt hashed password with salt rounds=10';


--
-- Name: auth_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: blogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blogs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    excerpt text,
    content text NOT NULL,
    featured_image character varying(500),
    tags text[] DEFAULT ARRAY[]::text[],
    published_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: contact_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text NOT NULL,
    user_flow text,
    status text DEFAULT 'unread'::text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    priority text DEFAULT 'normal'::text,
    tags text[],
    CONSTRAINT contact_submissions_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT contact_submissions_status_check CHECK ((status = ANY (ARRAY['unread'::text, 'read'::text, 'replied'::text]))),
    CONSTRAINT contact_submissions_user_flow_check CHECK ((user_flow = ANY (ARRAY['employer'::text, 'viewer'::text])))
);


--
-- Name: experiences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experiences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company text NOT NULL,
    "position" text NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date,
    is_current boolean DEFAULT false,
    location text,
    company_logo text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: hire_contact_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hire_contact_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    field_type text NOT NULL,
    label text NOT NULL,
    placeholder text,
    is_required boolean DEFAULT true,
    options text[],
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT hire_contact_fields_field_type_check CHECK ((field_type = ANY (ARRAY['text'::text, 'email'::text, 'phone'::text, 'textarea'::text, 'select'::text])))
);


--
-- Name: hire_experience; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hire_experience (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company text NOT NULL,
    "position" text NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date,
    is_current boolean DEFAULT false,
    location text,
    achievements text[],
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: hire_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hire_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_type text NOT NULL,
    title text,
    content jsonb DEFAULT '{}'::jsonb NOT NULL,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT hire_sections_section_type_check CHECK ((section_type = ANY (ARRAY['hero'::text, 'skills'::text, 'experience'::text, 'contact'::text, 'resume'::text])))
);


--
-- Name: hire_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hire_skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    proficiency integer,
    color text DEFAULT '#8b5cf6'::text,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT hire_skills_proficiency_check CHECK (((proficiency >= 1) AND (proficiency <= 100)))
);


--
-- Name: hire_view_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hire_view_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    theme text DEFAULT 'professional'::text,
    layout text DEFAULT 'standard'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: portfolio_hero_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_hero_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text DEFAULT 'Creative Developer'::text NOT NULL,
    title_highlight text DEFAULT 'Developer'::text,
    subtitle text DEFAULT 'Crafting digital experiences that blend'::text NOT NULL,
    subtitle_highlight_1 text DEFAULT 'innovation'::text,
    subtitle_highlight_2 text DEFAULT 'functionality'::text,
    description text,
    hero_image_url text,
    cta_button_1_text text DEFAULT 'Explore My Work'::text,
    cta_button_1_action text DEFAULT 'projects'::text,
    cta_button_2_text text DEFAULT 'Let''s Connect'::text,
    cta_button_2_action text DEFAULT 'contact'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    role text DEFAULT 'Full-Stack Developer'::text,
    experience text DEFAULT '1 year professional'::text,
    status text DEFAULT 'Available for freelance'::text,
    bio text,
    avatar_url text,
    is_employer_view boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true,
    gender text DEFAULT 'male'::text,
    CONSTRAINT profiles_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])))
);


--
-- Name: COLUMN profiles.gender; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.gender IS 'Gender information for pronouns usage in AI assistant (male, female, other)';


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    long_description text,
    tech_stack text[],
    github_url text,
    live_url text,
    image_url text,
    video_url text,
    featured boolean DEFAULT false,
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: resume_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resume_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    summary text,
    technical_skills jsonb DEFAULT '[]'::jsonb,
    soft_skills text[],
    certifications jsonb DEFAULT '[]'::jsonb,
    languages jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id uuid
);


--
-- Name: skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    proficiency integer,
    icon_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT skills_proficiency_check CHECK (((proficiency >= 1) AND (proficiency <= 100)))
);


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    "position" text,
    company text,
    content text NOT NULL,
    avatar_url text,
    rating integer,
    featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT testimonials_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: theme_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theme_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    primary_color text,
    secondary_color text,
    accent_color text,
    background_gradient text,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    avatar_url text,
    user_id text,
    token_identifier text NOT NULL,
    image text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone,
    email text,
    name text,
    full_name text
);


--
-- Name: visitor_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visitor_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text,
    user_flow text,
    page_path text,
    user_agent text,
    ip_address inet,
    referrer text,
    time_spent integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    country text,
    device_type text,
    CONSTRAINT visitor_analytics_user_flow_check CHECK ((user_flow = ANY (ARRAY['employer'::text, 'viewer'::text])))
);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.admins (id, username, password_hash, email, full_name, is_active, last_login, created_at, updated_at) VALUES ('bce90d74-74ea-4454-93ca-cf37099956f9', 'Art1204', '$2b$10$fOM0zrJN5C3aaT02iUJoj.w.eubS3W2l9SFxQLLrHzZbIKt2QQ8Mu', 'admin@portfolio.com', 'Portfolio Admin', true, '2025-10-25 15:19:54.589699+00', '2025-10-24 17:06:08.433136+00', '2025-10-25 15:19:54.589699+00');


--
-- Data for Name: auth_users; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: blogs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.blogs (id, title, excerpt, content, featured_image, tags, published_at, is_active, order_index, created_at, updated_at) VALUES ('8ff8ba79-567e-4136-8a8b-e91c598718ab', 'Mastering CSS Grid and Flexbox', 'A comprehensive guide to modern CSS layout techniques with practical examples.', 'CSS Grid and Flexbox have revolutionized web layout design. This guide covers everything from basic concepts to advanced techniques, with practical examples you can use in your projects. Master modern CSS layout and build responsive designs like a pro.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', '{CSS,Layout,Tutorial}', '2025-10-05 13:58:31.806305+00', true, 2, '2025-10-25 13:58:31.806305+00', '2025-10-25 13:58:31.806305+00');
INSERT INTO public.blogs (id, title, excerpt, content, featured_image, tags, published_at, is_active, order_index, created_at, updated_at) VALUES ('3d9d2a0e-5ce2-4528-8222-4a42654c160b', 'Building Scalable React Applications', 'Best practices and patterns for creating maintainable React apps that scale with your team.', 'This comprehensive guide covers everything you need to know about building React applications that scale effectively. From component architecture to state management strategies, we explore the techniques that successful teams use to maintain large codebases.', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80', '{React,Architecture,"Best Practices"}', '2025-10-15 14:05:38.766798+00', true, 0, '2025-10-25 14:05:38.766798+00', '2025-10-25 14:05:38.766798+00');
INSERT INTO public.blogs (id, title, excerpt, content, featured_image, tags, published_at, is_active, order_index, created_at, updated_at) VALUES ('d46e3d6e-218a-40b2-b899-6c3292966ac7', 'The Future of Web Development', 'Exploring emerging technologies and trends that will shape the next decade of web development.', 'The web development landscape continues to evolve rapidly. In this article, we explore emerging technologies, frameworks, and best practices that are shaping the future of web development. From AI integration to edge computing, discover what''s next.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', '{"Web Development","Future Tech",Trends}', '2025-10-10 13:58:31.806+00', true, 1, '2025-10-25 13:58:31.806+00', '2025-10-25 13:58:31.806+00');


--
-- Data for Name: contact_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.contact_submissions (id, name, email, subject, message, user_flow, status, created_at, priority, tags) VALUES ('2d5b941b-a892-482d-be2a-695cf2a0ab35', 'John Doe', 'john@example.com', 'Hiring Inquiry', 'I would like to discuss a potential full-time opportunity for a senior developer role.', 'employer', 'unread', '2025-10-24 17:06:30.556923+00', 'high', '{hiring,full-time}');
INSERT INTO public.contact_submissions (id, name, email, subject, message, user_flow, status, created_at, priority, tags) VALUES ('1974d40e-d59e-4b6e-bc56-cfc39c4ac418', 'Jane Smith', 'jane@example.com', 'Project Collaboration', 'Interested in collaborating on a React project.', 'viewer', 'read', '2025-10-24 17:06:30.556923+00', 'normal', '{collaboration,react}');
INSERT INTO public.contact_submissions (id, name, email, subject, message, user_flow, status, created_at, priority, tags) VALUES ('c2dbf0d2-e7f3-4d54-883e-2b57e6e1a5a6', 'Mike Johnson', 'mike@startup.com', 'Freelance Work', 'Looking for a freelance developer for a 3-month project.', 'employer', 'unread', '2025-10-24 17:06:30.556923+00', 'normal', '{freelance,short-term}');
INSERT INTO public.contact_submissions (id, name, email, subject, message, user_flow, status, created_at, priority, tags) VALUES ('39c30dc3-93a6-42ca-8414-3e91db196a8c', 'Sarah Wilson', 'sarah@agency.com', 'Partnership Opportunity', 'Would like to discuss a potential partnership.', 'viewer', 'replied', '2025-10-24 17:06:30.556923+00', 'low', '{partnership,business}');
INSERT INTO public.contact_submissions (id, name, email, subject, message, user_flow, status, created_at, priority, tags) VALUES ('07db7265-9114-45be-b717-27c1e069e144', 'Someone', 'someone@gmail.com', 'I want you to work for me for this project', 'cna you please connect me?', 'viewer', 'unread', '2025-10-25 14:26:39.599023+00', 'normal', NULL);


--
-- Data for Name: experiences; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.experiences (id, company, "position", description, start_date, end_date, is_current, location, company_logo, order_index, is_active, created_at) VALUES ('f8351813-5c45-4490-93e6-653f540b99df', 'Tech Startup Inc.', 'Full-Stack Developer', 'Developed and maintained web applications using React, Node.js, and PostgreSQL. Collaborated with cross-functional teams to deliver high-quality software solutions. Implemented CI/CD pipelines and improved application performance by 40%.', '2023-01-01', NULL, true, 'Remote', NULL, 1, true, '2025-10-24 17:06:00.187168+00');
INSERT INTO public.experiences (id, company, "position", description, start_date, end_date, is_current, location, company_logo, order_index, is_active, created_at) VALUES ('7073d898-001b-4e54-bfc0-ad46e459f6e7', 'Digital Agency', 'Frontend Developer', 'Created responsive web interfaces for various clients using React and Vue.js. Worked closely with designers to implement pixel-perfect designs and ensure optimal user experience across all devices.', '2022-06-01', '2022-12-31', false, 'New York, NY', NULL, 2, true, '2025-10-24 17:06:00.187168+00');
INSERT INTO public.experiences (id, company, "position", description, start_date, end_date, is_current, location, company_logo, order_index, is_active, created_at) VALUES ('87b0d94b-bda2-4a5b-a170-1b8f63665341', 'Freelance', 'Web Developer', 'Provided web development services to small businesses and startups. Built custom websites and web applications using modern technologies. Managed client relationships and project timelines effectively.', '2021-08-01', '2022-05-31', false, 'Remote', NULL, 3, true, '2025-10-24 17:06:00.187168+00');


--
-- Data for Name: hire_contact_fields; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.hire_contact_fields (id, field_type, label, placeholder, is_required, options, order_index, is_active, created_at, updated_at) VALUES ('e4a34917-dbb8-4ca6-b0d4-2bb7dbebc080', 'text', 'Full Name', 'Enter your full name', true, NULL, 1, true, '2025-10-24 17:06:40.759645+00', '2025-10-24 17:06:40.759645+00');
INSERT INTO public.hire_contact_fields (id, field_type, label, placeholder, is_required, options, order_index, is_active, created_at, updated_at) VALUES ('4cb2b2d5-0412-4802-ad0e-0ea7c66d8fa1', 'email', 'Email Address', 'your.email@company.com', true, NULL, 2, true, '2025-10-24 17:06:40.759645+00', '2025-10-24 17:06:40.759645+00');
INSERT INTO public.hire_contact_fields (id, field_type, label, placeholder, is_required, options, order_index, is_active, created_at, updated_at) VALUES ('4f5a0449-ce66-49e2-80ab-8f867355b9ce', 'text', 'Company', 'Your company name', false, NULL, 3, true, '2025-10-24 17:06:40.759645+00', '2025-10-24 17:06:40.759645+00');
INSERT INTO public.hire_contact_fields (id, field_type, label, placeholder, is_required, options, order_index, is_active, created_at, updated_at) VALUES ('b4a87238-38ec-4259-a4d4-e24747e05ae3', 'text', 'Subject', 'Brief subject line', true, NULL, 4, true, '2025-10-24 17:06:40.759645+00', '2025-10-24 17:06:40.759645+00');
INSERT INTO public.hire_contact_fields (id, field_type, label, placeholder, is_required, options, order_index, is_active, created_at, updated_at) VALUES ('639ebc37-ecba-4f69-bf77-182cb84f6880', 'textarea', 'Message', 'Tell me about your project or opportunity...', true, NULL, 5, true, '2025-10-24 17:06:40.759645+00', '2025-10-24 17:06:40.759645+00');


--
-- Data for Name: hire_experience; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.hire_experience (id, company, "position", description, start_date, end_date, is_current, location, achievements, order_index, is_active, created_at, updated_at) VALUES ('67f22ddd-b854-4f12-bbc4-064abab4503c', 'Cipher Craft Pvt. Ltd.', 'Web Developer', 'Developed enterprise modules for PerfexCRM, serving 1,000+ clients. Built robust APIs and webhooks using PHP, Node.js, and NestJS. Engineered scalable database structures with MySQL and PostgreSQL. Created developer productivity tools, like Chrome/VS Code extensions and Discord bots. Integrated MCP servers to enable AI-driven workflows. Delivered customer-facing and admin modules using PHP, Node.js, and React.js. Collaborated in Agile teams and mentored junior developers.', '2024-06-20', NULL, true, 'On - Site', '{"Reduced module delivery time by 25% through creation of reusable backend components","Designed and deployed APIs serving 1,000+ clients with 99.9% uptime","Built and published Chrome and VS Code extensions to speed up developer workflows","Integrated MCP servers for automated AI-powered features within PerfexCRM","Optimized front-end performance in React.js modules, improving load times by 30%","Mentored and onboarded junior developers in Agile teams","Successfully implemented third-party service integrations with minimal downtime"}', 1, true, '2025-10-24 17:06:38.679273+00', '2025-10-25 12:46:22.566547+00');
INSERT INTO public.hire_experience (id, company, "position", description, start_date, end_date, is_current, location, achievements, order_index, is_active, created_at, updated_at) VALUES ('2a7ba074-737e-40f0-9d63-10e163281b34', 'Freelance', 'Freelancer', 'Developed AI-enabled document verification systems and managed backend projects for servers, browser extensions, and web tools. Provided end-to-end solutions for diverse freelance clients, focusing on reliability and performance', '2025-10-03', '2025-10-25', false, 'Remote', '{"Delivered projects 20% faster than average freelance timelines","Managed 5+ successful backend projects for clients and agencies","Built custom AI-powered solutions for document verification","Streamlined deployment workflows to enhance delivery speed","Consistently earned positive client feedback and repeat business"}', 1, true, '2025-10-25 12:56:48.13849+00', '2025-10-25 12:57:38.435638+00');


--
-- Data for Name: hire_sections; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.hire_sections (id, section_type, title, content, order_index, is_active, created_at, updated_at) VALUES ('0ea66805-437c-4987-be6b-f64cb0134c31', 'skills', 'Technical Skills', '{"layout": "grid", "description": "Comprehensive skill set across the full development stack", "show_proficiency": true}', 2, true, '2025-10-24 17:06:35.214331+00', '2025-10-24 17:06:35.214331+00');
INSERT INTO public.hire_sections (id, section_type, title, content, order_index, is_active, created_at, updated_at) VALUES ('723a0b5c-e10b-41ce-8893-1829cc0d1458', 'experience', 'Professional Experience', '{"description": "Career progression and key achievements", "show_timeline": true, "show_achievements": true}', 3, true, '2025-10-24 17:06:35.214331+00', '2025-10-24 17:06:35.214331+00');
INSERT INTO public.hire_sections (id, section_type, title, content, order_index, is_active, created_at, updated_at) VALUES ('b606307c-68ac-4ba3-8eca-bc49c2b05cb0', 'contact', 'Get In Touch', '{"description": "Ready to discuss your next project", "submit_text": "Send Message", "success_message": "Thank you for your message! I''ll get back to you within 24 hours."}', 4, true, '2025-10-24 17:06:35.214331+00', '2025-10-24 17:06:35.214331+00');
INSERT INTO public.hire_sections (id, section_type, title, content, order_index, is_active, created_at, updated_at) VALUES ('b45c7ad9-b5a4-4c3b-8e88-2a2513585279', 'resume', 'Download Resume', '{"version": "1.0", "file_url": "", "button_text": "Download PDF Resume", "last_updated": "2024-03-15"}', 5, true, '2025-10-24 17:06:35.214331+00', '2025-10-24 17:06:35.214331+00');
INSERT INTO public.hire_sections (id, section_type, title, content, order_index, is_active, created_at, updated_at) VALUES ('acc0c582-45cd-48bc-ad91-13785fa7399a', 'hero', 'Professional Summary', '{"bio": "Passionate developer creating amazing digital experiences with modern technologies", "email": "lakhani.ramya.u@gmail.co", "phone": "+91 7202800803", "tagline": "Building scalable web applications with modern technologies", "cta_text": "Let''s Work Together", "headline": "Ramya Lakhani - Full-Stack Developer", "location": "India", "avatar_text": "RL", "show_avatar": true, "profile_photo": "https://i.postimg.cc/L8rDsbrj/Gemini-Generated-Image-d17q61d17q61d17q-1.png", "background_image": ""}', 1, true, '2025-10-24 17:06:35.214331+00', '2025-10-24 18:26:14.464041+00');


--
-- Data for Name: hire_skills; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.hire_skills (id, name, category, proficiency, color, order_index, is_active, created_at, updated_at) VALUES ('0eb75958-8fa1-4b3c-b277-cdd14d15eff8', 'React', 'Frontend', 90, '#61dafb', 1, true, '2025-10-24 17:06:36.980837+00', '2025-10-24 17:06:36.980837+00');
INSERT INTO public.hire_skills (id, name, category, proficiency, color, order_index, is_active, created_at, updated_at) VALUES ('398aae4f-fa66-41d2-88a6-1c6b4113a611', 'TypeScript', 'Language', 88, '#3178c6', 2, true, '2025-10-24 17:06:36.980837+00', '2025-10-24 17:06:36.980837+00');
INSERT INTO public.hire_skills (id, name, category, proficiency, color, order_index, is_active, created_at, updated_at) VALUES ('60d8b2b2-098f-431f-bd80-7730b16f4d04', 'Node.js', 'Backend', 85, '#339933', 3, true, '2025-10-24 17:06:36.980837+00', '2025-10-24 17:06:36.980837+00');
INSERT INTO public.hire_skills (id, name, category, proficiency, color, order_index, is_active, created_at, updated_at) VALUES ('b1bb163d-0085-415a-b91a-e2564720f898', 'Python', 'Language', 82, '#3776ab', 4, true, '2025-10-24 17:06:36.980837+00', '2025-10-24 17:06:36.980837+00');
INSERT INTO public.hire_skills (id, name, category, proficiency, color, order_index, is_active, created_at, updated_at) VALUES ('446e8d3f-e0c8-4287-b6b6-09a6fa72074d', 'PostgreSQL', 'Database', 80, '#336791', 5, true, '2025-10-24 17:06:36.980837+00', '2025-10-24 17:06:36.980837+00');
INSERT INTO public.hire_skills (id, name, category, proficiency, color, order_index, is_active, created_at, updated_at) VALUES ('7bdc9bf6-9b49-4c92-bdd1-e8884e2d1102', 'AWS', 'Cloud', 75, '#ff9900', 6, true, '2025-10-24 17:06:36.980837+00', '2025-10-24 17:06:36.980837+00');
INSERT INTO public.hire_skills (id, name, category, proficiency, color, order_index, is_active, created_at, updated_at) VALUES ('2ce309df-ff45-418d-8ee1-b4c4b136a7c8', 'Docker', 'DevOps', 78, '#2496ed', 7, true, '2025-10-24 17:06:36.980837+00', '2025-10-24 17:06:36.980837+00');
INSERT INTO public.hire_skills (id, name, category, proficiency, color, order_index, is_active, created_at, updated_at) VALUES ('0898e5df-5638-4d51-92fb-2eba061b45e4', 'GraphQL', 'API', 85, '#e10098', 8, true, '2025-10-24 17:06:36.980837+00', '2025-10-24 17:06:36.980837+00');
INSERT INTO public.hire_skills (id, name, category, proficiency, color, order_index, is_active, created_at, updated_at) VALUES ('0504c436-72ec-4530-833f-ff9f056927f7', 'Php', 'Language', 80, '#8b5cf6', 8, true, '2025-10-25 13:13:46.102748+00', '2025-10-25 13:15:46.005452+00');
INSERT INTO public.hire_skills (id, name, category, proficiency, color, order_index, is_active, created_at, updated_at) VALUES ('34cddfc2-cf7b-44fd-9d5a-168397ed2b98', 'NextJS', 'Frontend', 80, '#8b5cf6', 9, true, '2025-10-25 13:21:01.380597+00', '2025-10-25 13:25:22.990838+00');
INSERT INTO public.hire_skills (id, name, category, proficiency, color, order_index, is_active, created_at, updated_at) VALUES ('5366fd2f-f01d-439e-89a0-3cae21e7f84c', 'Laravel', 'Backend', 80, '#5f99f7', 10, true, '2025-10-25 13:25:36.916388+00', '2025-10-25 13:27:04.155016+00');


--
-- Data for Name: hire_view_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.hire_view_settings (id, theme, layout, is_active, created_at, updated_at) VALUES ('0403c63a-6645-4ddb-baeb-6e18a75efa14', 'professional', 'standard', true, '2025-10-24 17:06:01.092095+00', '2025-10-24 17:06:01.092095+00');


--
-- Data for Name: portfolio_hero_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.portfolio_hero_settings (id, title, title_highlight, subtitle, subtitle_highlight_1, subtitle_highlight_2, description, hero_image_url, cta_button_1_text, cta_button_1_action, cta_button_2_text, cta_button_2_action, is_active, created_at, updated_at) VALUES ('4444e5d8-5905-48f9-bfe8-7dfad36eacfb', 'Full Stack', 'Developer', 'Crafting digital experiences that blend', 'innovation', 'functionality', 'Full-Stack Developer', 'https://i.postimg.cc/L8rDsbrj/Gemini-Generated-Image-d17q61d17q61d17q-1.png', 'Explore My Work', 'projects', 'Let''s Connect', 'contact', true, '2025-10-25 14:24:57.986+00', '2025-10-25 14:24:57.986+00');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.profiles (id, full_name, role, experience, status, bio, avatar_url, is_employer_view, created_at, updated_at, is_active, gender) VALUES ('076ffded-1b1a-44ac-9b95-f12d382cf7f4', 'Ramya lakhani', 'Full Stack Web Developer', '2', 'Available For Freelance', 'Bio', '/profile-images/7ca0e11f-3114-4b10-ac66-0087797e3b25.png', false, '2025-10-24 17:26:57.703267+00', '2025-10-24 18:23:24.259668+00', true, 'male');


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.projects (id, title, description, long_description, tech_stack, github_url, live_url, image_url, video_url, featured, order_index, is_active, created_at, updated_at) VALUES ('fcca23e7-26aa-478b-a965-eed62475ce94', 'Local Network CLI Chat', 'A beautiful peer-to-peer terminal chat app with auto-discovery, real-time messaging, and hidden Google Sheets logging
', 'A sophisticated CLI-based chat application built with Node.js featuring automatic network discovery via mDNS/Bonjour, real-time P2P communication using Socket.io, and stealth Google Sheets logging. Users on the same WiFi network can instantly discover and chat with each other through an intuitive terminal interface with zero configuration. The application includes silent background logging to Google Sheets, making it perfect for office communication, classroom collaboration, and meeting notes without requiring any database setup.
', '{Node.js,Socket.io,Bonjour,Inquirer.js,Chalk,"Google Sheets API",mDNS,JavaScript,Express}', 'https://github.com/ramyalakhani2108/node-cli-chat', '', 'https://i.postimg.cc/wjj3Q3pQ/generated-image-5.jpg', NULL, true, 1, true, '2025-10-24 17:06:00.067+00', '2025-10-25 15:24:34.509786+00');
INSERT INTO public.projects (id, title, description, long_description, tech_stack, github_url, live_url, image_url, video_url, featured, order_index, is_active, created_at, updated_at) VALUES ('aff3d28b-0d10-4c02-9bb1-cd39263d06f9', 'AI Postman Extension', 'Chrome extension with AI-powered API testing, smart form detection, and OpenAI integration for intelligent request generation
', 'A powerful Chrome extension that brings AI-powered API testing capabilities directly to your browser. Built with React and integrated with OpenAI, it features smart form detection that automatically analyzes webpages and generates API requests from forms. Includes a complete REST API testing suite with request history, response analysis, and intelligent page analysis. The extension uses Chrome''s Side Panel API for a modern interface and handles cross-origin requests through background scripts, making it perfect for developers, QA teams, and DevOps professionals.
', '{React,JavaScript,"Chrome Extension APIs","OpenAI API",Webpack,CSS,"Chrome Side Panel API","Chrome Storage API"}', 'https://github.com/ramyalakhani2108/postext', '', 'https://i.postimg.cc/FHV8Nsd2/generated-image-6.png', NULL, true, 2, true, '2025-10-24 17:06:00.067+00', '2025-10-25 15:32:26.164082+00');
INSERT INTO public.projects (id, title, description, long_description, tech_stack, github_url, live_url, image_url, video_url, featured, order_index, is_active, created_at, updated_at) VALUES ('79ac267b-92bc-400b-8924-efbb2fa89daa', 'Notes App', 'Minimal notes management app with instant updates. Built with React, TypeScript, and Vite.

', 'A modern notes application designed for quick note-taking and easy management. This app uses React with TypeScript bundled by Vite, featuring fast hot module replacement and robust ESLint rules. Expandable for production with advanced linting and styling options. Core features include CRUD operations for notes, real-time refresh, and a clean UI optimized for productivity.

', '{React,TypeScript,Vite,ESLint,"Tailwind CSS",Supabase}', 'https://github.com/coder-avec-weyn/notes-app', '', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80', NULL, false, 3, true, '2025-10-24 17:06:00.067+00', '2025-10-25 15:58:49.194978+00');
INSERT INTO public.projects (id, title, description, long_description, tech_stack, github_url, live_url, image_url, video_url, featured, order_index, is_active, created_at, updated_at) VALUES ('a695392c-a8a5-414c-b190-cb6b9b14082b', 'Portfolio Website', 'Personal portfolio with dual user flows - employer and general views', 'A modern, full-stack portfolio website featuring dual user experiences optimized for employers and general visitors. Built with React, TypeScript, and PostgreSQL, it includes a comprehensive admin CMS for content management, custom authentication with bcrypt, dynamic hire view sections, contact form management, visitor analytics, and responsive design. Features glass morphism design, particle animations, and seamless navigation across all devices.', '{React,TypeScript,Vite,PostgreSQL,"Tailwind CSS","Framer Motion","Radix UI",bcryptjs,JWT}', 'https://github.com/example/portfolio', 'https://portfolio-demo.vercel.app', 'https://i.postimg.cc/tJMswjyD/Screenshot-2025-10-25-at-9-32-37-pm.png', NULL, true, 4, true, '2025-10-24 17:06:00.067+00', '2025-10-25 16:03:15.904988+00');


--
-- Data for Name: resume_data; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.skills (id, name, category, proficiency, icon_url, is_active, created_at) VALUES ('ff1a7c4d-4984-425f-9379-52010a75aabd', 'React', 'Frontend', 90, 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', true, '2025-10-24 17:05:59.957188+00');
INSERT INTO public.skills (id, name, category, proficiency, icon_url, is_active, created_at) VALUES ('8a2640cc-3873-48d0-8968-55cd40c54e08', 'Node.js', 'Backend', 85, 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', true, '2025-10-24 17:05:59.957188+00');
INSERT INTO public.skills (id, name, category, proficiency, icon_url, is_active, created_at) VALUES ('34786e7a-f560-4a29-be40-f11b9e167a35', 'TypeScript', 'Language', 88, 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg', true, '2025-10-24 17:05:59.957188+00');
INSERT INTO public.skills (id, name, category, proficiency, icon_url, is_active, created_at) VALUES ('1809bc2d-75b3-4ab9-9412-d461067dfbf0', 'Supabase', 'Database', 80, 'https://supabase.com/favicon.ico', true, '2025-10-24 17:05:59.957188+00');
INSERT INTO public.skills (id, name, category, proficiency, icon_url, is_active, created_at) VALUES ('c825cdc6-8ff0-46ab-8f86-9a57bd67d845', 'Tailwind CSS', 'Styling', 92, 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg', true, '2025-10-24 17:05:59.957188+00');
INSERT INTO public.skills (id, name, category, proficiency, icon_url, is_active, created_at) VALUES ('17180826-f4bc-4d07-9d78-493e6e121b78', 'Next.js', 'Framework', 87, 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg', true, '2025-10-24 17:05:59.957188+00');


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.testimonials (id, name, "position", company, content, avatar_url, rating, featured, is_active, created_at) VALUES ('1793c554-a91b-4057-bce9-5d2a3b4b9b9d', 'Sarah Johnson', 'Product Manager', 'Tech Startup Inc.', 'Working with Ramya has been an absolute pleasure. Her attention to detail and ability to deliver high-quality code on time is exceptional. She brings creative solutions to complex problems.', NULL, 5, true, true, '2025-10-24 17:06:00.307274+00');
INSERT INTO public.testimonials (id, name, "position", company, content, avatar_url, rating, featured, is_active, created_at) VALUES ('6e1aef38-440c-4eb3-b6da-ab28af78b17e', 'Mike Chen', 'CEO', 'Digital Agency', 'One of the most talented developers I have worked with. Ramya''s technical skills combined with excellent communication make her a valuable team member. Highly recommended!', NULL, 5, true, true, '2025-10-24 17:06:00.307274+00');
INSERT INTO public.testimonials (id, name, "position", company, content, avatar_url, rating, featured, is_active, created_at) VALUES ('25f1c29a-9311-4ccd-a294-ab1613dc491e', 'Emily Rodriguez', 'Startup Founder', 'InnovateCorp', 'Ramya helped us build our MVP from scratch and guided us through the entire development process. The final product exceeded our expectations and launched successfully.', NULL, 5, false, true, '2025-10-24 17:06:00.307274+00');


--
-- Data for Name: theme_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.theme_settings (id, name, primary_color, secondary_color, accent_color, background_gradient, is_active, created_at) VALUES ('1527aaa1-f2e4-4661-a0f3-426d29d9771e', 'Professional Blue', '#1e40af', '#3b82f6', '#06b6d4', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', true, '2025-10-24 17:06:00.461158+00');
INSERT INTO public.theme_settings (id, name, primary_color, secondary_color, accent_color, background_gradient, is_active, created_at) VALUES ('6d1ed888-0d0d-43a5-8445-5b3a83e5b26e', 'Creative Purple', '#7c3aed', '#a855f7', '#ec4899', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', false, '2025-10-24 17:06:00.461158+00');
INSERT INTO public.theme_settings (id, name, primary_color, secondary_color, accent_color, background_gradient, is_active, created_at) VALUES ('f2ac7738-6b10-41b8-9a1f-d0d723727839', 'Elegant Dark', '#1f2937', '#374151', '#10b981', 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', false, '2025-10-24 17:06:00.461158+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: visitor_analytics; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('f407a93a-cc76-4076-bfc0-b172cf8e42c5', 'test-session-1', 'employer', '/hire-flow', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '192.168.1.1', 'https://google.com', 0, '2025-10-24 17:06:30.436891+00', 'United States', 'desktop');
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d36c4d7b-c620-4f28-b75d-91e991fe823f', 'test-session-2', 'viewer', '/portfolio-flow', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', '192.168.1.2', 'https://linkedin.com', 0, '2025-10-24 17:06:30.436891+00', 'Canada', 'mobile');
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('08c670eb-0d6b-4787-a226-952f7720c328', 'test-session-3', 'employer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '192.168.1.3', 'direct', 0, '2025-10-24 17:06:30.436891+00', 'United Kingdom', 'desktop');
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('8e7c1301-89e0-4595-b010-8f3366a3e790', 'test-session-4', 'viewer', '/portfolio-flow', 'Mozilla/5.0 (Android 11; Mobile)', '192.168.1.4', 'https://twitter.com', 0, '2025-10-24 17:06:30.436891+00', 'Australia', 'mobile');
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b7196fad-9ca9-4014-a519-3f9f2b16b221', 'test-session-5', 'employer', '/hire-flow', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '192.168.1.5', 'https://github.com', 0, '2025-10-24 17:06:30.436891+00', 'Germany', 'desktop');
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('2ac7ade5-78d4-48ea-90e7-bee593c54061', 'oyf0y', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-24 17:18:57.67352+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('f662f347-58b6-4742-949c-0e21e84fe0bf', 'oyf0y', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-24 17:18:57.674694+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('7c2f0e13-ae6e-44c5-b0d9-1eb094715cc9', 'oyf0y', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-24 17:18:58.37952+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('be3d1aef-b09e-4b26-bc5a-d356dd5f05b0', 'dkkz2d', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-24 17:32:53.383435+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('9be123e2-c1f2-452e-901c-afc05e00f2f1', '4bmxju', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/admin', 0, '2025-10-24 17:33:42.297971+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d60992a6-d0db-424a-8846-b07a37a53080', '4bmxju', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/admin', 0, '2025-10-24 17:33:42.311704+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('6a9e3d45-8e8c-4ebf-aa0e-4a4775009872', 'snjbj', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/admin', 0, '2025-10-24 17:34:35.027315+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('f600102c-06a6-47da-aa25-b5885a9a44bf', 'snjbj', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/admin', 0, '2025-10-24 17:34:35.07725+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d38fec62-999c-4827-892a-c5ee64bdc87a', 'wkl81', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/admin', 0, '2025-10-24 17:34:35.561923+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('649bcb28-834a-4b78-aecc-02db1be09145', 'wkl81', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/admin', 0, '2025-10-24 17:34:35.562284+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('fa1de0ea-d1aa-494c-95b9-301b75708d1f', 'k6k0n', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/admin', 0, '2025-10-24 17:34:35.761223+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('e244d83f-a37e-4cd3-8fe6-61bb1a53ffa8', 'k6k0n', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/admin', 0, '2025-10-24 17:34:35.766887+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('ead19b81-4ef7-4889-b606-cd5dedf43235', '6iafnd', 'viewer', '/', 'vercel-screenshot/1.0', NULL, '', 0, '2025-10-24 18:21:46.736797+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b7a2d8b6-ace5-412d-83b4-4021cb680935', 'pig5p', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-24 18:22:33.980576+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('479d24f5-3084-4ce5-aa07-24ee94d8f498', 'oxoenj', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-24 18:24:07.067596+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('1076956c-de8d-429c-8ffb-7def9aa2be46', 'zw0ca8', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-24 18:24:12.957848+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('dbd5669b-edca-4228-a4d7-00161eb5192b', 'zw0ca8', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-24 18:24:16.388234+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('fecac509-fa01-4f78-814c-0921e36466b5', 'v96bff', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-24 18:24:23.4148+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('c84b79b8-ce6d-40fa-98c7-3ef0a41b619c', 'v96bff', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-24 18:24:25.021013+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('c016ab03-6d7a-4c70-8d37-7a1e814b2bfe', 'yihin', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-24 18:25:41.234957+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('8e0fb19f-ce1d-4e91-8aea-814c81d5cd2f', 'yihin', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-24 18:25:42.545007+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('fcdc7b3d-be56-4f90-8f60-7cc51a2dbd6a', 'yihin', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-24 18:25:43.198063+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('1f165c94-9ccc-4901-b307-158d70a057d0', 'eziw0h', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-24 18:26:51.748523+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('f19086f6-58f9-4d9b-b3ee-02b81e89305b', 'eziw0h', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-24 18:26:51.785251+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('5a30be0f-429b-49be-bf49-3b4772b91bf3', '8m74e', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-24 18:27:34.203755+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('e9d99da1-7db1-4ac4-b51f-8ea408b1dc45', '8m74e', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-24 18:27:34.206278+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('51d0c1da-b13e-4390-a0dc-8e246f778749', '8m74e', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-24 18:27:34.885906+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('7e529d6a-c5bc-4cee-a5d7-59533607f811', '56ke7e', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-25 12:38:43.762288+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('db22ab4a-05c3-493d-85f1-d4de67e7ea97', '2iutmn', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 12:38:46.394043+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b09045e0-fe4e-4225-8e47-10a8124d56af', '2iutmn', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 12:38:46.441142+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('4301bad6-2ebd-4cd9-960f-e754bf06b59a', '2iutmn', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 12:38:47.991876+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('16631cd8-ae09-4302-a6f5-c2de50bea4fa', '8xc9jo', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-25 12:41:06.038762+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('5ac80704-0c35-445e-9d6b-721475b88150', 'yvvpai', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-25 12:41:07.004956+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b9ea695e-901c-4c08-a9f5-82a42ec2d5e4', 'my2nkk', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-25 12:41:07.823255+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d9579c32-0a12-4a24-9cdc-58b3835fdf96', '8z244', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 12:42:53.039625+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('15b44630-c722-4c06-a01b-0688b43de8b3', '8z244', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 12:42:53.06613+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('a32a296f-64c6-47fa-9b29-4237321e0dcb', '8z244', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 12:42:54.219247+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('8cc368b9-1fa9-4559-a84d-93645cfa0510', 'cvfwn', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 12:43:21.740963+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('afdd9633-4a73-48f8-acc9-e1b644fba10b', 'cvfwn', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 12:43:21.759989+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('7ec1d5b6-a60f-48f6-8b32-dad0985a1775', 'cvfwn', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 12:43:45.575364+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b07be71a-7934-4881-b78d-25923c2c210e', 'vthb8', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 13:08:34.068037+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d59d16f7-f625-4b8e-b02e-3bc76f48a4d4', 'vthb8', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 13:08:34.083208+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('ae10d710-1655-4a27-912f-20f2f0082e38', 'vthb8', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 13:08:35.063828+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('731369df-7e54-4070-a348-8baa68683738', 'yrfzyj', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:13:51.154715+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('55db6d84-9db1-4055-b515-4fbab2c220ff', 'yrfzyj', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:13:51.978719+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('37476225-0baa-41c1-b01c-8200640041af', 'yrfzyj', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:13:52.50437+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('290a5228-48ef-4dae-8152-9a432bce85dc', 'ierpwu', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:35:41.354638+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('449667fa-cc0f-411c-8a17-7e29c186c962', 'ierpwu', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:35:41.366103+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('83fed057-b50d-4604-9a87-a552904fd068', 'ierpwu', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:35:42.014535+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('ef652cae-8037-4a6c-b9ec-a7d4c930116d', 'sv0qz', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:41:31.534191+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('7ae00998-e09a-4787-bae2-c435b12e1d56', 'sv0qz', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:41:32.80879+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('90ee4666-57f2-42a6-bf92-b8b4e8342e88', 'sv0qz', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:41:32.811039+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('81ecd055-b996-473e-ae28-32fad05a22d2', 'e0cqh9', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:42:38.827341+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('c6f82f1f-3383-445e-a222-3de948787d8c', 'e0cqh9', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:42:38.844898+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('4f98b86a-580e-4d3c-907f-14f229620e4a', 'e0cqh9', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:42:40.233171+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('41e43a5a-326e-4cd5-8356-a622fe9a5a3b', 'w7hkrp', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:42:49.435026+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('02cfcdaf-4d74-407c-8f84-2c4498f3aa65', 'w7hkrp', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:42:49.43588+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('3f5d8617-006e-47fc-8ddf-08d8a219ce24', 'w7hkrp', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:42:50.400353+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('889b09a5-026a-4c0b-ab8f-a1e760333290', 'yz03z', 'viewer', '/', 'vercel-screenshot/1.0', NULL, '', 0, '2025-10-25 13:44:41.574061+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('8eeda0ac-7a20-4a90-aac4-e776def4ea98', 'n2omp', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://ramya-portfolio-69zzin506-ramya-lakhani.vercel.app/', 0, '2025-10-25 13:45:02.351556+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('7f1b77ce-b85f-468f-a20e-51b4ad812fe3', 'n2omp', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://ramya-portfolio-69zzin506-ramya-lakhani.vercel.app/', 0, '2025-10-25 13:45:02.763477+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('a11274f1-fa61-42d2-9a0e-1b8edf6abd9e', '9sdvqj', 'viewer', '/', 'vercel-screenshot/1.0', NULL, '', 0, '2025-10-25 13:45:17.548327+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('780e7b2b-b40b-4c29-8388-7628df112b3c', 'xc13gf', 'viewer', '/', 'vercel-screenshot/1.0', NULL, '', 0, '2025-10-25 13:45:18.267677+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('eab84ee4-b55c-496a-9880-a371a6f16161', '3dqxl', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:54:16.568212+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('2e32aa20-aedb-4b53-96f8-1657dc08062c', '3dqxl', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 13:54:16.609853+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('62d58f9a-e260-43e7-8669-53a0aeb9ff08', 'zqfelb', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 14:03:09.003915+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('43459091-50a6-471a-9e2e-e076fb9b64f7', 'zqfelb', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 14:03:09.035965+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('5856ac94-16ab-4324-b9bc-82132d834a2a', 'zqfelb', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 14:03:11.739461+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('e715f7b9-2c10-4706-ab5f-56d5739eeabb', 'gcwryd', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 14:05:49.202483+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('c01ff648-6a46-4933-8b60-08fc273a4c1c', 'gcwryd', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 14:05:49.229478+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('6a838134-ee10-4bcc-9aff-475913f1e4ee', 'gcwryd', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 14:05:50.214992+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d3a8e24d-962c-4b9f-811e-b7ce338f6390', 'gdq28a', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 14:18:02.913912+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('f8a96512-a979-4d08-bf04-13323e426b75', 'gdq28a', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 14:18:02.938598+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('ac3c94ad-45e5-4665-b5b4-75f5e9f98947', 'gdq28a', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 14:18:04.481643+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('056f773c-dfb6-4b80-8392-7712e14e6154', 'mskvv', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 14:25:43.647322+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('4861142c-f5c5-4741-9fc4-4cf6c0f88b11', 'mskvv', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 14:25:43.66059+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d801bcee-b419-42b1-8f5f-b3bca26b6faf', 'mskvv', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 14:25:45.614613+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('fe7098b9-830f-4732-8e95-a79d3ce620b8', 'px7fxj', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:22:58.188654+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('443a086e-7b7d-4391-8453-60ddb13514d3', 'px7fxj', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:22:59.594852+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('cc6ee251-8b65-4f0f-b093-353dab4bf32b', 'px7fxj', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:23:00.382672+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('31b8f5a5-9533-4ec1-8410-fd8db75a7840', 'n6n8ja', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 15:24:21.882803+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('5a57e747-0c97-405c-b149-d050ea92d500', 'n6n8ja', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 15:24:23.380442+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('10c18359-12dc-4607-906e-3547a5fd31f1', 'lnwa', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:24:37.925346+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('79400fd4-a80f-4ed7-9939-db5e6b100d94', 'lnwa', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:24:38.701715+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('8f9dd02a-d65a-490e-afdf-96ca892cd419', 'lnwa', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:24:39.334477+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b85743a7-d26b-4804-ae53-b63228b5f098', 'lnwa', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:32:34.459759+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('f74b55c6-3c22-475b-9a77-317b75ad584c', 'rfwsc8', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:55:27.883921+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('44a2a843-36ee-424f-a0e4-fda98c0a2e60', 'rfwsc8', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:55:27.904777+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('511a0bae-8f7e-4c1c-9bc0-a666fd584fa8', 'a3usyo', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:57:04.13514+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('6e25f9a2-92da-4dab-9c25-6db408a7512b', 'a3usyo', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:57:05.527174+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('0b43d2a7-6d5f-412a-954e-ac8e0f3c5ad4', 'a3usyo', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:57:06.694605+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b096ed85-1592-47d6-b258-a66f4342556f', 'no77mn', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:58:59.47178+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('7d046ca4-c953-4f2a-8f37-7532aa7ff6aa', 'no77mn', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 15:59:01.093694+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('17deb6bf-0903-4c13-ba59-1737e33414b5', 'no77mn', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:03:25.665141+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('c663daf3-cd0a-4359-a0fb-787e8ec164ca', 'g7ij2g', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:08:49.820032+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('1e53ca0c-3fd8-4a95-b621-2179e8003c60', 'g7ij2g', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:08:49.884859+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('0dd62279-6508-4031-8d61-8c462594e7ea', 'g7ij2g', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:08:51.115285+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('ff6c21a1-471f-4d1f-865f-d6093909b316', 'tdr7oe', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:14:09.297647+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b168c08e-7dec-4ae6-8687-e709e4f15e0d', 'tdr7oe', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:14:10.718271+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('34efa94b-eb39-488d-acda-7ad561209ba8', 'tdr7oe', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:14:11.480394+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('491a07fa-af03-4500-8964-6b2012590169', 'iutcnn', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:15:31.40594+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('9766c837-0065-457b-bf2d-92a66e9dc92f', 'iutcnn', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:15:32.809041+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('13561537-52e6-430f-8682-f1eebed1bb68', 'iutcnn', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:15:33.610976+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('dc3cc132-3828-4e62-9821-276b328f98e1', 'd6rdd', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:16:17.550298+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('f3d5c3bc-dc4c-4f3a-8ca4-2b9b1d254f3c', 'd6rdd', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:16:18.524075+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('2d6ab5a3-241d-44cd-bcb1-b904b4e2d60f', 'd6rdd', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:16:18.996199+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('4702031c-b01b-42d1-a169-666a8c528327', 'wqc4je', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:17:41.031303+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('58e41933-78d2-47db-905c-8f17b41f7dac', 'wqc4je', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:17:42.460502+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b508f7a1-7bc6-4de3-b308-798c32a2bc7c', 'wqc4je', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/', 0, '2025-10-25 16:17:43.915128+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('0646f5d3-e0d4-4693-9541-57e5ceea5680', 'a3qjr', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 16:21:36.15893+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('ec0fdced-342c-4d7f-b9ab-e2596cbad4a4', 'a3qjr', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 16:21:36.270701+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('f3b2cffc-786a-4ddb-9d68-ebcec0d119e7', 'nomnn', 'viewer', '/', 'vercel-screenshot/1.0', NULL, '', 0, '2025-10-25 16:27:44.447055+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('f8e93c4c-1218-4fc6-bb69-68094f61977c', 'a3qjr', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 16:28:31.837984+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('a3f7e521-27d7-4b7a-9742-239d635fecad', 'bfdsli', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 16:28:52.731675+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('0ba7e54b-f23d-4c9d-a575-cf2db0baf1c4', 'bfdsli', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 16:28:52.748547+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('9d13ffb9-5196-4c51-b053-cf49433b66d5', 'bfdsli', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 16:28:53.313349+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('cfe44be7-91a4-47e1-a265-7049359982c4', '2tv98', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 16:29:43.571676+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('08318cdc-3dea-48ea-b73e-956cfeef9853', '2tv98', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 16:29:43.579402+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('23ccd6d6-9c49-47c1-b769-11c332432bcc', '2tv98', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 16:29:44.58038+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('1ae83bb2-15ab-465c-ad1b-6f9ac2385619', 'lxev7v', 'viewer', '/', 'vercel-screenshot/1.0', NULL, '', 0, '2025-10-25 16:33:05.01517+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('4f1ecc7a-fa04-4d84-8f5e-d3f53740425d', 'n8tuhq', 'viewer', '/', 'vercel-screenshot/1.0', NULL, '', 0, '2025-10-25 16:33:05.073049+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('18247bb3-ab30-4b8d-b2a1-c48a202aa282', 's18na', 'viewer', '/', 'vercel-screenshot/1.0', NULL, '', 0, '2025-10-25 16:33:43.120232+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('bcbb482c-ace7-4ffe-9466-ce3520150e09', '7d2nvk', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://ramya-portfolio-9w1sk3y74-ramya-lakhani.vercel.app/', 0, '2025-10-25 16:34:28.826009+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d24891b7-b6f9-4cbe-bc2d-a4d405569c00', 'b10dhm', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-25 16:34:44.939529+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('ab711d6b-c1ab-4ac0-8ad3-e0f511c4355a', 'zwc6e', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 16:34:50.401406+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('90c1755a-2e7e-44c0-836a-37daf4b775d3', 'zwc6e', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-25 16:34:51.886788+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('8f31e44f-d122-42ec-a643-df807c614527', 'cnajh', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-25 16:38:51.87926+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b1646220-637e-4c60-b8d5-e3a930b4a03e', 'wq46kl', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-25 16:38:58.722898+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d180c59b-4701-452d-9800-723408a5edbd', 'wq46kl', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-25 16:39:00.693559+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('335f0049-83f8-4dcb-b85d-4872cc2393f4', 'wq46kl', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-25 16:39:20.392275+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('e31f2dc0-9dad-4399-b9da-be58e56c5a1b', 'hkffc', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-25 16:39:27.444734+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('93a82b5d-07e6-447e-84ef-881ab72e8192', '3qryhw', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.97 Mobile Safari/537.36', NULL, '', 0, '2025-10-25 16:39:39.178383+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('e15ba75a-9461-4876-aec9-4df602160b3e', 'kt9gm', 'viewer', '/', 'Mozilla/5.0 (X11; Linux aarch64 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.97 Safari/537.36', NULL, '', 0, '2025-10-25 16:39:48.751082+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('01b2d849-f4f6-4368-80bd-8010499e6d24', 'kt9gm', 'viewer', '/viewer-flow', 'Mozilla/5.0 (X11; Linux aarch64 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7390.97 Safari/537.36', NULL, '', 0, '2025-10-25 16:39:50.672646+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('a1b29938-773e-44e9-9ba6-45a24580617f', 'o0mz6', 'viewer', '/', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.96 Mobile/15E148 Safari/604.1', NULL, '', 0, '2025-10-26 01:32:44.265251+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('40dcbd43-513c-4863-87cc-04f4adbb402b', 'ap2clf', 'viewer', '/', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.96 Mobile/15E148 Safari/604.1', NULL, '', 0, '2025-10-26 01:32:45.155351+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('3419169b-e7b2-4a27-8e57-9224fbd395bb', 'ap2clf', 'employer', '/employer-flow', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.96 Mobile/15E148 Safari/604.1', NULL, '', 0, '2025-10-26 01:33:36.742637+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('da02d417-d0c5-484a-8a95-23c8cb179b68', 'mex7hf', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-26 13:34:18.193437+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b1147994-8a01-435b-a308-9c0052d50ae7', '9ir15i', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-26 13:36:26.948048+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('0c7a9055-b70a-41a0-8ae6-ed94ed73570f', 'cildxb', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-26 13:36:33.62853+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('fca71a6c-2bff-4813-844b-aa0e35f96bd2', 'cildxb', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-26 13:36:33.669846+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('662dd144-6e25-45ff-a103-c72b6e440ebf', 'cildxb', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:36:38.402817+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('977d2bbe-c3c7-45e8-ad4b-21ddbf79bdd9', 'cildxb', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:36:48.133641+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b3e7bacb-6ea0-486f-a049-03f769b83f22', 'cildxb', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:37:11.982742+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('ceafa039-2851-4ccf-80ee-257558f53188', 'cildxb', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:37:18.53657+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('bc26a64f-f890-48eb-96ba-f54e314b4a08', 'cildxb', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:37:26.830952+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('dca4360f-e6f3-4f2f-9c42-addbc1648e7c', 'cildxb', 'employer', '/employer-flow', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:37:37.498652+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('e19543ce-9514-44b9-8cb8-3b26df804b56', 'cildxb', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:37:58.559344+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b22bc6cf-5749-422a-83d8-bf9d61e36928', 'cildxb', 'employer', '/employer-flow', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:40:00.371962+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('aaecd76c-5deb-460c-9321-266efa0474d3', 'nfbkh2', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:43:01.247485+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('3f9668cf-a901-4778-9604-ef179fd39441', 'nfbkh2', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:43:01.339968+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('ba668e76-92f3-408c-a10b-dc50cce10e8f', 'nfbkh2', 'viewer', '/viewer-flow', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:43:04.936209+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('ddfc0826-2c9f-4eb9-b7c9-f5edd6464406', 'nfbkh2', 'employer', '/employer-flow', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, '', 0, '2025-10-26 13:44:03.457429+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d8a9d5ba-10e0-428b-b2a2-bca12b37acbd', 'jgvgsx', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-26 13:45:29.383656+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('da826942-8580-447c-a692-e695b32b51ad', 'jgvgsx', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-26 13:45:29.387983+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('8002f2e7-71eb-4c2b-9efa-e9c649c79fba', 'jgvgsx', 'employer', '/employer-flow', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-26 13:45:30.443691+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('55c24621-ab7d-41c5-9a75-474d0523292c', 'u4fozb', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-26 13:50:29.326866+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d9c11a7c-99e8-4b2f-aea0-568acd78b607', 'u4fozb', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-26 13:50:30.63249+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('af1771da-e169-44e9-a46f-b3266338406c', 'c0wc9f', 'viewer', '/', 'vercel-screenshot/1.0', NULL, '', 0, '2025-10-26 14:03:26.146978+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d1a8be8d-2911-4ae2-854b-e606c573cd79', 'pu7f2i', 'viewer', '/', 'vercel-screenshot/1.0', NULL, '', 0, '2025-10-26 14:04:56.971952+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('146b6709-eb48-4484-94d5-4b4e62c835ec', 'u6024b9', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-26 14:06:24.240868+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('c7bbc90c-c102-45b9-b7bf-7ea064e42679', 'jq3t86', 'viewer', '/', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-26 14:06:24.905124+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('d9b01c27-9234-48d7-8318-b5c4b71afce7', 'jq3t86', 'employer', '/employer-flow', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', NULL, 'https://vercel.com/', 0, '2025-10-26 14:06:46.302316+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('42daddc2-b172-4905-829e-ecf0d6003e47', '95pjs', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-26 14:07:57.163167+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('eb8a78b6-d845-43f2-8d80-83fb38926a43', '95pjs', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, '', 0, '2025-10-26 14:07:58.512169+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('8bee35a2-cfc5-4fcd-820a-84afcbedff4a', 'x22lum', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'https://ramya-portfolio-9w1sk3y74-ramya-lakhani.vercel.app/', 0, '2025-10-26 14:08:15.758746+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('7dba8637-04cb-4e77-949f-64e25b7be0f6', '7mesuf', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/admin', 0, '2025-10-26 14:10:30.497081+00', NULL, NULL);
INSERT INTO public.visitor_analytics (id, session_id, user_flow, page_path, user_agent, ip_address, referrer, time_spent, created_at, country, device_type) VALUES ('b8c33c37-9e25-478b-b730-74f1c0a2398d', '7mesuf', 'viewer', '/', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', NULL, 'http://localhost:5173/admin', 0, '2025-10-26 14:10:30.511105+00', NULL, NULL);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: auth_users auth_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_email_key UNIQUE (email);


--
-- Name: auth_users auth_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_pkey PRIMARY KEY (id);


--
-- Name: blogs blogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blogs
    ADD CONSTRAINT blogs_pkey PRIMARY KEY (id);


--
-- Name: contact_submissions contact_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);


--
-- Name: experiences experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT experiences_pkey PRIMARY KEY (id);


--
-- Name: hire_contact_fields hire_contact_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hire_contact_fields
    ADD CONSTRAINT hire_contact_fields_pkey PRIMARY KEY (id);


--
-- Name: hire_experience hire_experience_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hire_experience
    ADD CONSTRAINT hire_experience_pkey PRIMARY KEY (id);


--
-- Name: hire_sections hire_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hire_sections
    ADD CONSTRAINT hire_sections_pkey PRIMARY KEY (id);


--
-- Name: hire_skills hire_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hire_skills
    ADD CONSTRAINT hire_skills_pkey PRIMARY KEY (id);


--
-- Name: hire_view_settings hire_view_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hire_view_settings
    ADD CONSTRAINT hire_view_settings_pkey PRIMARY KEY (id);


--
-- Name: portfolio_hero_settings portfolio_hero_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_hero_settings
    ADD CONSTRAINT portfolio_hero_settings_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: resume_data resume_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_data
    ADD CONSTRAINT resume_data_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: theme_settings theme_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_settings
    ADD CONSTRAINT theme_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_id_key UNIQUE (user_id);


--
-- Name: visitor_analytics visitor_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visitor_analytics
    ADD CONSTRAINT visitor_analytics_pkey PRIMARY KEY (id);


--
-- Name: idx_admins_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admins_active ON public.admins USING btree (is_active);


--
-- Name: idx_admins_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admins_email ON public.admins USING btree (email);


--
-- Name: idx_admins_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admins_username ON public.admins USING btree (username);


--
-- Name: idx_auth_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_users_email ON public.auth_users USING btree (email);


--
-- Name: idx_blogs_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blogs_is_active ON public.blogs USING btree (is_active);


--
-- Name: idx_blogs_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blogs_published_at ON public.blogs USING btree (published_at DESC);


--
-- Name: idx_contact_submissions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions USING btree (created_at DESC);


--
-- Name: idx_contact_submissions_flow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_submissions_flow ON public.contact_submissions USING btree (user_flow);


--
-- Name: idx_contact_submissions_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_submissions_priority ON public.contact_submissions USING btree (priority);


--
-- Name: idx_contact_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_submissions_status ON public.contact_submissions USING btree (status);


--
-- Name: idx_contact_submissions_user_flow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contact_submissions_user_flow ON public.contact_submissions USING btree (user_flow);


--
-- Name: idx_experiences_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_experiences_active ON public.experiences USING btree (is_active);


--
-- Name: idx_experiences_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_experiences_current ON public.experiences USING btree (is_current);


--
-- Name: idx_experiences_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_experiences_order ON public.experiences USING btree (order_index);


--
-- Name: idx_hire_contact_fields_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_contact_fields_active ON public.hire_contact_fields USING btree (is_active);


--
-- Name: idx_hire_contact_fields_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_contact_fields_order ON public.hire_contact_fields USING btree (order_index);


--
-- Name: idx_hire_contact_fields_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_contact_fields_updated ON public.hire_contact_fields USING btree (created_at DESC);


--
-- Name: idx_hire_experience_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_experience_active ON public.hire_experience USING btree (is_active);


--
-- Name: idx_hire_experience_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_experience_current ON public.hire_experience USING btree (is_current);


--
-- Name: idx_hire_experience_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_experience_order ON public.hire_experience USING btree (order_index);


--
-- Name: idx_hire_experience_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_experience_updated ON public.hire_experience USING btree (created_at DESC);


--
-- Name: idx_hire_sections_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_sections_active ON public.hire_sections USING btree (is_active);


--
-- Name: idx_hire_sections_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_sections_order ON public.hire_sections USING btree (order_index);


--
-- Name: idx_hire_sections_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_sections_type ON public.hire_sections USING btree (section_type);


--
-- Name: idx_hire_sections_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_sections_updated_at ON public.hire_sections USING btree (updated_at DESC);


--
-- Name: idx_hire_skills_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_skills_active ON public.hire_skills USING btree (is_active);


--
-- Name: idx_hire_skills_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_skills_category ON public.hire_skills USING btree (category);


--
-- Name: idx_hire_skills_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_skills_order ON public.hire_skills USING btree (order_index);


--
-- Name: idx_hire_skills_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hire_skills_updated ON public.hire_skills USING btree (created_at DESC);


--
-- Name: idx_profiles_avatar_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_avatar_url ON public.profiles USING btree (avatar_url);


--
-- Name: idx_profiles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);


--
-- Name: idx_projects_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_active ON public.projects USING btree (is_active);


--
-- Name: idx_projects_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_featured ON public.projects USING btree (featured);


--
-- Name: idx_projects_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_order ON public.projects USING btree (order_index);


--
-- Name: idx_resume_data_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resume_data_updated_at ON public.resume_data USING btree (updated_at DESC);


--
-- Name: idx_resume_data_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resume_data_user_id ON public.resume_data USING btree (user_id);


--
-- Name: idx_skills_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skills_active ON public.skills USING btree (is_active);


--
-- Name: idx_skills_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_skills_category ON public.skills USING btree (category);


--
-- Name: idx_testimonials_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_testimonials_active ON public.testimonials USING btree (is_active);


--
-- Name: idx_testimonials_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_testimonials_featured ON public.testimonials USING btree (featured);


--
-- Name: idx_visitor_analytics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitor_analytics_created_at ON public.visitor_analytics USING btree (created_at DESC);


--
-- Name: idx_visitor_analytics_flow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitor_analytics_flow ON public.visitor_analytics USING btree (user_flow);


--
-- Name: idx_visitor_analytics_page_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitor_analytics_page_path ON public.visitor_analytics USING btree (page_path);


--
-- Name: idx_visitor_analytics_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitor_analytics_session ON public.visitor_analytics USING btree (session_id);


--
-- Name: idx_visitor_analytics_user_flow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visitor_analytics_user_flow ON public.visitor_analytics USING btree (user_flow);


--
-- Name: resume_data set_resume_data_meta; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_resume_data_meta BEFORE INSERT OR UPDATE ON public.resume_data FOR EACH ROW EXECUTE FUNCTION public.update_resume_data_meta();


--
-- Name: admins update_admins_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: auth_users update_auth_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_auth_users_updated_at BEFORE UPDATE ON public.auth_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hire_contact_fields update_hire_contact_fields_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_hire_contact_fields_updated_at BEFORE UPDATE ON public.hire_contact_fields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hire_experience update_hire_experience_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_hire_experience_updated_at BEFORE UPDATE ON public.hire_experience FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hire_sections update_hire_sections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_hire_sections_updated_at BEFORE UPDATE ON public.hire_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hire_skills update_hire_skills_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_hire_skills_updated_at BEFORE UPDATE ON public.hire_skills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: hire_view_settings update_hire_view_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_hire_view_settings_updated_at BEFORE UPDATE ON public.hire_view_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: resume_data update_resume_data_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_resume_data_updated_at BEFORE UPDATE ON public.resume_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: resume_data resume_data_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_data
    ADD CONSTRAINT resume_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: portfolio_hero_settings Allow public to read hero settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public to read hero settings" ON public.portfolio_hero_settings FOR SELECT USING (true);


--
-- Name: portfolio_hero_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portfolio_hero_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict LHtEAcDBvirjTGKRxHHK9udeKNDM0qoPjKDs97xwGE6qHvU3aqz0h4vwnQSZe4i

