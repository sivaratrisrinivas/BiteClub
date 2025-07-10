-- BiteClub Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  push_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Posts table (food photos + scores)
CREATE TABLE public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL, -- Storage path
  health_score INTEGER CHECK (health_score >= 1 AND health_score <= 10),
  scoring_details JSONB, -- Store AI reasoning
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Friendships table (bidirectional relationships)
CREATE TABLE public.friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 4. Challenges table (food challenges between friends)
CREATE TABLE public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenger_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenged_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Healthy Eating Challenge',
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'completed', 'rejected')) DEFAULT 'pending',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at);
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);
CREATE INDEX idx_challenges_challenger_id ON public.challenges(challenger_id);
CREATE INDEX idx_challenges_challenged_id ON public.challenges(challenged_id);
CREATE INDEX idx_challenges_status ON public.challenges(status);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Users can view posts from friends" ON public.posts
  FOR SELECT USING (
    user_id = auth.uid() OR
    user_id IN (
      SELECT friend_id FROM public.friendships 
      WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM public.friendships 
      WHERE friend_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can create friendship requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're involved in" ON public.friendships
  FOR UPDATE USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Challenges policies
CREATE POLICY "Users can view their challenges" ON public.challenges
  FOR SELECT USING (challenger_id = auth.uid() OR challenged_id = auth.uid());

CREATE POLICY "Users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update challenges they're involved in" ON public.challenges
  FOR UPDATE USING (challenger_id = auth.uid() OR challenged_id = auth.uid());

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to get daily score for a user
CREATE OR REPLACE FUNCTION get_daily_score(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(health_score) 
     FROM public.posts 
     WHERE user_id = user_uuid 
     AND DATE(created_at) = target_date),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily rankings for user and friends
CREATE OR REPLACE FUNCTION get_daily_rankings(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  daily_score INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH friend_ids AS (
    SELECT friend_id as id FROM public.friendships 
    WHERE user_id = user_uuid AND status = 'accepted'
    UNION
    SELECT user_id as id FROM public.friendships 
    WHERE friend_id = user_uuid AND status = 'accepted'
    UNION
    SELECT user_uuid as id
  ),
  daily_scores AS (
    SELECT 
      p.id,
      p.username,
      p.avatar_url,
      COALESCE(SUM(posts.health_score), 0) as score
    FROM public.profiles p
    LEFT JOIN public.posts ON p.id = posts.user_id 
      AND DATE(posts.created_at) = target_date
    WHERE p.id IN (SELECT id FROM friend_ids)
    GROUP BY p.id, p.username, p.avatar_url
  )
  SELECT 
    ds.id,
    ds.username,
    ds.avatar_url,
    ds.score::INTEGER,
    ROW_NUMBER() OVER (ORDER BY ds.score DESC)::INTEGER
  FROM daily_scores ds
  ORDER BY ds.score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 