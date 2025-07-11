# BiteClub 🍽️

**Make healthy eating fun by competing with your friends**

## What is BiteClub?

BiteClub is a mobile app that turns eating healthy into a fun competition with your friends. Here's how it works:

1. **📸 Take a photo** of your meal
2. **🤖 Get an instant health score** (1-10) powered by AI 
3. **🏆 Compete with friends** on daily leaderboards
4. **⚡ Challenge losing friends** to eat healthier

Think of it like a fitness tracker, but for food - and way more social and fun.

## Why BiteClub?

### The Problem
- Eating healthy is boring and hard to stick with
- Diet apps are complicated and feel like work
- No social motivation to make better food choices
- Hard to know if a meal is actually healthy or not

### Our Solution
- **Instant feedback**: AI tells you how healthy your food is in seconds
- **Social pressure**: Your friends see your scores, creating natural accountability
- **Gamification**: Daily rankings and challenges make it addictive
- **Simple**: Just take a photo - no calorie counting or complicated logging

## How It Works

### For Users
1. **Sign up** with email and create a username
2. **Add friends** by searching their usernames
3. **Take photos** of every meal throughout the day
4. **Get health scores** automatically from our AI
5. **Check daily rankings** to see who's winning
6. **Send challenges** when you're losing to motivate friends

### Behind the Scenes
- **AI Vision**: Google Gemini analyzes your food photos and gives health scores (1-10) with detailed reasoning based on nutrition, portion size, and cooking methods
- **Real-time Updates**: See when friends post new meals instantly (coming soon)
- **Smart Challenges**: App suggests challenges when you're falling behind (coming soon)
- **Push Notifications**: Get notified about challenges, friend activity, and daily results (coming soon)

## What Makes It Viral?

### Psychological Hooks
- **FOMO**: See friends eating better and want to keep up
- **Competition**: Nobody wants to be last on the leaderboard  
- **Social Proof**: Healthy choices become visible and celebrated
- **Instant Gratification**: Immediate feedback on every food choice

### Sharing Mechanics
- **Challenge System**: Losing players are prompted to challenge friends
- **Daily Rankings**: Fresh competition every single day
- **Push Notifications**: Brings people back to the app constantly
- **Friend Discovery**: Easy to add friends and grow your circle

## Technical Stack

**Frontend**: React Native with Expo (works on iPhone and Android)

**Backend**: Supabase (database, authentication, file storage)

**AI**: Google Gemini Vision for food analysis

**Notifications**: Expo Push Notifications

## Current Status

### ✅ What's Working Now
- **Complete User Authentication**: Sign up, email verification, login, username creation
- **Photo Capture**: Full camera integration with image compression and permissions
- **AI Food Analysis**: Take a photo and get instant health scores (1-10) with detailed reasoning from Google Gemini
- **Cloud Storage**: Photos automatically uploaded to Supabase with retry logic
- **Real-time UI**: Score cards appear immediately after AI analysis completes
- **Database Integration**: User posts linked to profiles with health scores stored

### 🚧 Development Phases
- ✅ **Foundation**: Project setup, database, authentication
- ✅ **Auth Flow**: Sign up, login, email verification, usernames  
- ✅ **Camera**: Photo capture with compression and permissions
- ✅ **Image Upload**: Save photos to cloud storage with retry logic
- ✅ **AI Scoring**: Get health scores from food photos using Gemini AI
- ✅ **Post Creation**: Complete photo → upload → score → UI display flow
- 🚧 **Social Features**: Friends, rankings, challenges (next phase)
- 📋 **Notifications**: Push notifications for engagement
- 📋 **Polish**: UI improvements and app store launch

## Vision

**Short-term**: Make healthy eating social and fun for small groups of friends

**Long-term**: Become the go-to app that actually changes how people eat by making healthy choices the socially rewarding option

## Getting Started

### For Developers
```bash
# Clone the repository
git clone https://github.com/sivaratrisrinivas/BiteClub.git
cd BiteClub

# Install dependencies
npm install

# Start the development server
npx expo start
```

### For Users
The app will be available on iOS and Android app stores once we complete development and testing.

## Contributing

This is currently a personal project, but we're open to collaboration. Feel free to:
- Report bugs or suggest features
- Submit pull requests
- Share ideas for making healthy eating more social

## Why This Will Work

**Market Timing**: Health consciousness is at an all-time high, but existing apps are boring
**Behavioral Psychology**: Social competition is one of the strongest motivators for habit change
**Technology**: AI vision is finally good enough to analyze food photos accurately
**Simple Concept**: Easy to explain and understand - "Instagram for healthy eating with scores"

---

*BiteClub: Where healthy eating meets friendly competition* 🏆🥗 