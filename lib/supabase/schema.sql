-- Create tables for yemama pregnancy and period tracker

-- Cycle logs table
CREATE TABLE IF NOT EXISTS cycle_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  phase TEXT CHECK (phase IN ('period', 'fertile', 'ovulation', 'luteal')),
  symptoms TEXT[],
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Pregnancy data table
CREATE TABLE IF NOT EXISTS pregnancy_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  conception_date DATE NOT NULL,
  current_week INTEGER,
  baby_weight DECIMAL(5,2),
  baby_height DECIMAL(5,2),
  mother_condition TEXT,
  due_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Health metrics table
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metric_type TEXT CHECK (metric_type IN ('heart_rate', 'blood_pressure', 'glucose', 'steps', 'sleep', 'sleep_duration', 'energy_level', 'mood')),
  value DECIMAL(10,2),
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, date, metric_type)
);

-- Symptoms table
CREATE TABLE IF NOT EXISTS symptoms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  symptom_name TEXT NOT NULL,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Educational content table
CREATE TABLE IF NOT EXISTS educational_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- User profiles table extension
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  tracking_type TEXT CHECK (tracking_type IN ('period', 'pregnancy')),
  age INTEGER,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  conditions TEXT[],
  cycle_length INTEGER DEFAULT 28,
  period_length INTEGER DEFAULT 5,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE cycle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own data" ON cycle_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own data" ON cycle_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own data" ON cycle_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their pregnancy data" ON pregnancy_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert pregnancy data" ON pregnancy_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update pregnancy data" ON pregnancy_data FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their health metrics" ON health_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert health metrics" ON health_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update health metrics" ON health_metrics FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their symptoms" ON symptoms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert symptoms" ON symptoms FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Educational content is public" ON educational_content FOR SELECT USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_cycle_logs_user_date ON cycle_logs(user_id, date DESC);
CREATE INDEX idx_health_metrics_user_date ON health_metrics(user_id, date DESC);
CREATE INDEX idx_symptoms_user_date ON symptoms(user_id, date DESC);

-- Doctor directory / interactions
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  city TEXT,
  online_available BOOLEAN DEFAULT false,
  phone TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medical_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  doctor_id UUID REFERENCES doctors(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  food_name TEXT NOT NULL,
  portion TEXT,
  estimated_calories INTEGER,
  quality TEXT CHECK (quality IN ('good', 'moderate', 'needs_improvement')),
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE medical_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their medical results" ON medical_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their medical results" ON medical_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their food logs" ON food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their food logs" ON food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Emergency contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their emergency contacts" ON emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their emergency contacts" ON emergency_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their emergency contacts" ON emergency_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their emergency contacts" ON emergency_contacts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id, created_at DESC);

-- Appointments / reminders
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  reminder_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their appointments" ON appointments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_user_time ON appointments(user_id, scheduled_at ASC);
