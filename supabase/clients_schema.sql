-- Supabase migration for Active Clients module
-- Table: clients
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  service text NOT NULL,
  internal_responsible text,
  status text NOT NULL,
  start_date date,
  end_date date,
  monthly_value numeric,
  total_value numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: client_contacts
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  role text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: client_interactions
CREATE TABLE IF NOT EXISTS public.client_interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text,
  description text,
  date timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Table: client_documents
CREATE TABLE IF NOT EXISTS public.client_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  url text NOT NULL,
  name text,
  uploaded_by uuid REFERENCES public.users(id),
  uploaded_at timestamp with time zone DEFAULT now()
);

-- Table: client_feedbacks
CREATE TABLE IF NOT EXISTS public.client_feedbacks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  score integer CHECK (score >= 0 AND score <= 10),
  comment text,
  author uuid REFERENCES public.users(id),
  date timestamp with time zone DEFAULT now()
);

-- Table: client_status_history
CREATE TABLE IF NOT EXISTS public.client_status_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_at timestamp with time zone DEFAULT now(),
  changed_by uuid REFERENCES public.users(id)
);
