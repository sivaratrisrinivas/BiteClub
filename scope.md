# BiteClub - The Real Plan (No Bullshit Version)

## What It Actually Is
Food photos + instant scoring + friend ranking. That's it. Stop making it complicated.

## Tech Stack 
- **Frontend**: React Native/Expo
- **Backend**: Supabase 
- **Auth**: Email verification
- **Images**: Supabase Storage
- **Scoring**: OpenAI GPT-4 Vision API
- **Push**: Expo Push Notifications

Cost: $0/month until 10k+ users

## The Only Features That Matter

### Core Loop (Week 1)
1. Take photo of food
2. Get score (0-10, simple algorithm)
3. See where you rank vs friends today
4. Done.

Everything else is noise until this works perfectly.

### Viral Hook (Week 2)  
When you post and you're losing to friends:
- Show "Mike beat you by 3 points" 
- One button: "Challenge Mike"
- Mike gets push notification
- That's the entire viral mechanism

Stop overthinking it.

## User Flow (Simplified)

### New User
1. Email verification (one screen)
2. Pick username (one screen)  
3. Take first photo (camera opens immediately)
4. See your score
5. Add friends by username/email search
6. Done

No 12-step onboarding bullshit. If they can't figure out "take photo, get score" they shouldn't use the app.

### Existing User
1. App opens to camera (always)
2. Take photo
3. See score + today's ranking vs friends
4. If losing: challenge prompt appears
5. Done

## Technical Implementation (Actual Code)

### Database Schema
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  image_url TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE friendships (
  user_id UUID REFERENCES profiles(id),
  friend_id UUID REFERENCES profiles(id),
  PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES profiles(id),
  challenged_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Health Scoring (LLM Implementation)
```javascript
// Supabase Edge Function: /functions/score-food/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { imageUrl, postId } = await req.json()
  
  const score = await scoreWithLLM(imageUrl)
  
  await supabase
    .from('posts')
    .update({ score })
    .eq('id', postId)
  
  return new Response(JSON.stringify({ score }))
})

async function scoreWithLLM(imageUrl) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [{
        role: "system",
        content: "Rate this food from 1-10 based on healthiness. 10 = fresh vegetables/fruits, 8-9 = lean proteins/whole grains, 5-7 = balanced meals, 3-4 = processed foods, 1-2 = junk food. Return only the number."
      }, {
        role: "user", 
        content: [{
          type: "image_url",
          image_url: { url: imageUrl }
        }]
      }]
    })
  })
  
  const result = await response.json()
  return parseInt(result.choices[0].message.content) || 5
}
```

Cost: ~$0.01 per image. Accurate from day 1.

### Real-time Updates
```javascript
// Subscribe to friend posts
supabase
  .channel('posts')
  .on('postgres_changes', { event: 'INSERT', table: 'posts' }, updateFeed)
  .subscribe()
```

## Focus
- Core problem: eating alone sucks
- Solution: instant social feedback on food choices
- Everything else is feature creep

## Development Timeline

### Week 1: MVP
- Supabase setup + auth
- Camera + photo upload
- LLM scoring via Edge Function
- Friend system + daily rankings

### Week 2: Viral mechanics
- Challenge system
- Push notifications
- Real-time updates

### Week 3: Ship it
- Test with real users
- Fix critical bugs
- Deploy to app stores

Reality: Will take 4 weeks, not 3.

## Success Metrics
- Daily posts per user: 1+
- Challenge response rate: 50%+
- Day 7 retention: 40%+

## Why It Works
- Simple core loop
- Instant gratification 
- Social pressure
- One-tap challenges

## Why It Might Fail
- Cold start problem (need friend groups)
- Users get bored after week 2-3
- Scoring feels unfair

## The Bottom Line
Social pressure makes people eat better. Either this works or it doesn't. 

Build 3 screens: camera, ranking, friends. Test with real users. If they stop using it after a week, kill it.

---

## Setup

```bash
npx create-expo-app BiteClub
cd BiteClub
npx expo install expo-camera expo-image-picker @supabase/supabase-js
```

1. Camera + upload
2. Friend system  
3. Daily rankings

Nothing else matters until these work. 