-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image VARCHAR(500),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index on published_at for better query performance
CREATE INDEX idx_blogs_published_at ON blogs(published_at DESC);
CREATE INDEX idx_blogs_is_active ON blogs(is_active);

-- Insert initial sample blogs
INSERT INTO blogs (title, excerpt, content, featured_image, tags, published_at, is_active, order_index) VALUES
(
  'Building Scalable React Applications',
  'Best practices and patterns for creating maintainable React apps that scale with your team.',
  'This comprehensive guide covers everything you need to know about building React applications that scale effectively. From component architecture to state management strategies, we explore the techniques that successful teams use to maintain large codebases.',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
  ARRAY['React', 'Architecture', 'Best Practices'],
  CURRENT_TIMESTAMP - INTERVAL '10 days',
  true,
  0
),
(
  'The Future of Web Development',
  'Exploring emerging technologies and trends that will shape the next decade of web development.',
  'The web development landscape continues to evolve rapidly. In this article, we explore emerging technologies, frameworks, and best practices that are shaping the future of web development. From AI integration to edge computing, discover what''s next.',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
  ARRAY['Web Development', 'Future Tech', 'Trends'],
  CURRENT_TIMESTAMP - INTERVAL '15 days',
  true,
  1
),
(
  'Mastering CSS Grid and Flexbox',
  'A comprehensive guide to modern CSS layout techniques with practical examples.',
  'CSS Grid and Flexbox have revolutionized web layout design. This guide covers everything from basic concepts to advanced techniques, with practical examples you can use in your projects. Master modern CSS layout and build responsive designs like a pro.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  ARRAY['CSS', 'Layout', 'Tutorial'],
  CURRENT_TIMESTAMP - INTERVAL '20 days',
  true,
  2
);
