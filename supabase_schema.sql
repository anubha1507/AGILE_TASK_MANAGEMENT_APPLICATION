-- =========================================================
-- ULTIMATE ROLE-BASED AGILE MANAGEMENT SYSTEM SCHEMA
-- =========================================================

-- 1. PROFILES (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  role text DEFAULT 'Member' CHECK (role IN ('Manager', 'HR', 'Team Leader', 'Member')),
  created_at timestamptz DEFAULT now()
);

-- 2. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  status text DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Done', 'On Hold', 'Archived')),
  progress int DEFAULT 0,
  due_date date,
  start_date date,
  owner_id uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. PROJECT MEMBERS (Assignments)
CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES public.profiles(id),
  role_in_project text DEFAULT 'Member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 4. PROJECT LISTS (Kanban Columns)
CREATE TABLE IF NOT EXISTS public.project_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  list_id uuid REFERENCES public.project_lists(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status text DEFAULT 'todo',
  due_date date,
  assignee_id uuid REFERENCES public.profiles(id),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 6. MANUAL MEMBERS (Created by Team Leader — no auth account needed)
CREATE TABLE IF NOT EXISTS public.manual_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  work text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 7. TASK ACTIVITY LOG (For Reporting/Graphs)
CREATE TABLE IF NOT EXISTS public.task_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL, -- 'created', 'moved', 'completed'
  old_status text,
  new_status text,
  created_at timestamptz DEFAULT now()
);

-- =========================================================
-- TRIGGERS & FUNCTIONS (AUTOMATION)
-- =========================================================

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'Member'),
    'https://ui-avatars.com/api/?name=' || COALESCE(NEW.raw_user_meta_data->>'full_name', 'U') || '&background=random'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- AUTO-CREATE DEFAULT KANBAN LISTS (To Do, In Progress, Done)
CREATE OR REPLACE FUNCTION public.create_default_project_lists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_lists (project_id, name, position)
  VALUES 
    (NEW.id, 'To Do', 0),
    (NEW.id, 'In Progress', 1),
    (NEW.id, 'Done', 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.create_default_project_lists();

-- LOG ACTIVITY WHEN TASK IS CREATED OR MOVED
CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.task_activity (task_id, project_id, user_id, action)
    VALUES (NEW.id, NEW.project_id, COALESCE(NEW.created_by, NEW.assignee_id), 'created');
  ELSIF (TG_OP = 'UPDATE' AND OLD.list_id IS DISTINCT FROM NEW.list_id) THEN
    INSERT INTO public.task_activity (task_id, project_id, user_id, action)
    VALUES (NEW.id, NEW.project_id, auth.uid(), 'moved');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_changed ON public.tasks;
CREATE TRIGGER on_task_changed
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_activity();

-- =========================================================
-- SECURITY (DISABLE RLS FOR DEV)
-- =========================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_members DISABLE ROW LEVEL SECURITY;

-- =========================================================
-- STORAGE
-- =========================================================
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true) 
on conflict (id) do nothing;
