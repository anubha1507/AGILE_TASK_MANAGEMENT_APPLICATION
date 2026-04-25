# 🚀 AgileFlow - Modern Agile Project Management

AgileFlow is a high-performance, visually stunning project management platform designed for modern agile teams. Inspired by tools like Linear and Jira, it focuses on speed, clarity, and a premium user experience.

![AgileFlow Dashboard](https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&h=600&fit=crop)


video presentation link - https://drive.google.com/file/d/1imSo1Ep3cOvoMblFZw0uO-5O-kvy9u5E/view?usp=sharing
## ✨ Key Features

### 🔐 Advanced Authentication
- **Role-Based Access Control**: Separate interfaces and permissions for **Team Leaders** and **Team Members**.
- **Secure Onboarding**: Multi-step signup process with Supabase Auth integration.

### 📊 Leader Dashboard
- **Real-time Analytics**: Live tracking of project progress, team velocity, and task completion rates.
- **Project Health Monitoring**: Visual indicators for "On Track", "At Risk", and "Overdue" initiatives.
- **Workspace Momentum**: Activity trends visualized with responsive Bar Charts.

### 📋 Project Management
- **Live CRUD Operations**: Create and manage projects with real-time sync to Supabase.
- **Kanban Visualization**: Intuitive grid and list views for tracking active initiatives.
- **Dynamic Progress Tracking**: Automated progress bars that reflect real database state.

### 👥 Team Monitoring
- **Member Oversight**: Monitor individual workloads and task history.
- **Performance Metrics**: Track efficiency and active task counts for every collaborator.

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite (for lightning-fast HMR)
- **Styling**: Tailwind CSS + Framer Motion (for smooth, premium animations)
- **Backend/DB**: Supabase (PostgreSQL + Real-time subscriptions)
- **Icons**: Lucide React
- **Charts**: Recharts

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/amanyatan/TASKMANAGMENT.git
cd TASKMANAGMENT
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Supabase
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
Run the following SQL in your Supabase SQL Editor to set up the schema:
```sql
-- Create Projects Table
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'In Progress',
  progress INTEGER DEFAULT 0,
  due_date DATE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'Member',
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### 5. Run the application
```bash
npm run dev
```

## 🎨 Design Philosophy
AgileFlow follows a **Minimalist SaaS aesthetic** with:
- **8pt Spacing System** for perfect alignment.
- **Glassmorphism** and subtle backdrop blurs.
- **Harmony Palettes**: High-contrast dark mode and premium light mode.
- **Micro-animations**: Smooth transitions powered by Framer Motion.

---

Built with ❤️ for Agile Teams.
