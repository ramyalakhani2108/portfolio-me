# Hire View - Quick Reference Guide

## Problem ✅ FIXED
Professional summary was appearing **TWICE** in hire view due to duplicate sections in database.

## Solution Applied
1. **Database Migrations Executed**
   - Removed duplicate hero sections
   - Cleaned up all duplicate sections (skills, experience, contact, resume)
   - Database now has exactly 1 of each section type

2. **Enhanced Admin Panel**
   - New customizable fields for hero section:
     - Profile Photo URL
     - Professional Bio
     - Avatar Text (fallback)
     - Email, Phone, Location

3. **Updated Hire View**
   - Now uses `profile_photo` from hero section
   - Displays professional `bio` prominently
   - All data from single source: `hire_sections` table

## Admin Panel - How to Use

### Location
Go to Admin Dashboard → Hire View Editor → Sections Tab

### Editing Hero Section
1. Click on "Professional Summary" section
2. Edit any of these fields:
   - **Headline**: Main title (appears in large text)
   - **Tagline**: Subtitle (appears below headline)
   - **Professional Bio**: 2-3 sentence description (appears prominently)
   - **Profile Photo URL**: Link to your profile image
     - Example: `https://example.com/photo.jpg`
     - If invalid/broken, falls back to avatar text
   - **Avatar Text**: Fallback initials (e.g., "RL")
     - Shows when profile photo is not available
   - **Email**: Contact email address
   - **Phone**: Contact phone number
   - **Location**: City, Country
   - **CTA Text**: Call-to-action button text

3. Click "Save" to apply changes
4. Changes appear immediately in Hire View

### Editing Other Sections
- **Technical Skills**: Manage skills, categories, proficiency levels
- **Professional Experience**: Add work experience with achievements
- **Get In Touch**: Edit contact form fields and messages
- **Download Resume**: Manage resume download buttons

## Hire View - What Users See

When employers visit the hire view page, they see:
1. **Hero Section**
   - Profile photo (or avatar with initials)
   - Your headline
   - Your tagline
   - Your professional bio
   - Contact info (email, phone, location)
   - CTA button

2. **Technical Skills**
   - Skills organized by category
   - Proficiency levels

3. **Professional Experience**
   - Work history with achievements
   - Timeline view

4. **Contact Form**
   - Customizable form fields

5. **Resume Download**
   - Standard or AI-enhanced resume

## Common Tasks

### Update Profile Photo
1. Open Admin Dashboard
2. Go to Hire View Editor → Sections
3. Click Professional Summary
4. Enter photo URL in "Profile Photo URL"
5. Save

### Update Professional Bio
1. Go to Hire View Editor → Sections
2. Click Professional Summary
3. Edit "Professional Bio"
4. Save

### Update Contact Info
1. Go to Hire View Editor → Sections
2. Click Professional Summary
3. Update Email, Phone, Location
4. Save

## Database Structure

### hire_sections Table
```
id: UUID
section_type: hero | skills | experience | contact | resume
title: Section title
content: JSONB (contains all customizable fields)
order_index: Display order
is_active: true/false
```

### Hero Section Content (JSON)
```json
{
  "headline": "Your Name - Your Role",
  "tagline": "Your tagline",
  "bio": "Your professional bio",
  "profile_photo": "https://...",
  "avatar_text": "RL",
  "email": "your@email.com",
  "phone": "+1 (555) 000-0000",
  "location": "City, Country",
  "cta_text": "Get In Touch"
}
```

## Data Flow

```
Admin Panel (HireViewEditor)
    ↓
    Edit hero section fields
    ↓
    Save to hire_sections table
    ↓
Hire View (DynamicHireView)
    ↓
    Fetch from hire_sections
    ↓
    Display to employers
```

## Troubleshooting

### Professional Summary Shows Twice
❌ **FIXED** - Database has been cleaned. No more duplicates.

### Profile Photo Not Showing
- Check the URL is correct
- Verify image is accessible from browser
- Avatar text will show as fallback

### Changes Not Appearing
- Refresh the hire view page
- Check browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Verify save was successful in admin panel

### Admin Panel Won't Save
- Check database connection
- Verify all required fields are filled
- Check browser console for errors

## Support

All data comes from the `hire_sections` table in PostgreSQL.
Database credentials can be found in `.env` file.

### Database Connection
```
Host: VITE_DB_HOST
Port: VITE_DB_PORT
Database: VITE_DB_NAME
User: VITE_DB_USER
Password: VITE_DB_PASSWORD
```
