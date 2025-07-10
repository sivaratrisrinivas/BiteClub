# BiteClub MVP - Task Breakdown

## Foundation (Week 1, Days 1-2)

### Task 1: Project Setup ✅ COMPLETED
- [x] Create Expo project with TypeScript
- [x] Set up Git repository
- [x] Install dependencies: expo-camera, expo-image-picker, @supabase/supabase-js
- [x] Configure app.json with camera permissions
- [x] Push to GitHub repository
- **Deliverable**: Expo app that builds and runs ✅

### Task 2: Supabase Backend Setup ✅ COMPLETED
- [x] Create Supabase project
- [x] Enable email authentication
- [x] Test connection from app
- [x] Create database tables (profiles, posts, friendships, challenges)
- [x] Set up Storage bucket for images
- **Deliverable**: Working Supabase backend with auth ✅

### Task 3: Basic Auth Flow 🔄 IN PROGRESS
- [ ] Email/password signup screen
- [ ] Email verification handling
- [ ] Username creation screen
- [ ] Login screen
- [ ] Auth state management
- **Deliverable**: User can create account and log in

## Core Features (Week 1, Days 3-7)

### Task 4: Camera Integration
**Depends on**: Task 1
- [ ] Camera screen with preview
- [ ] Photo capture functionality
- [ ] Image compression (max 800px width)
- [ ] Handle iOS/Android differences
- **Deliverable**: Can take photos

### Task 5: Image Upload
**Depends on**: Task 2, Task 4
- [ ] Upload captured photo to Supabase Storage
- [ ] Generate unique filenames
- [ ] Handle upload errors/retry
- [ ] Loading states during upload
- **Deliverable**: Photos saved to cloud storage

### Task 6: Health Scoring System
**Depends on**: Task 2, Task 5
- [ ] Create Edge Function for scoring
- [ ] Integrate OpenAI GPT-4 Vision API
- [ ] Write scoring system prompt
- [ ] Handle API errors/fallbacks
- [ ] Update post record with score
- **Deliverable**: Photos get health scores 1-10

### Task 7: Basic Post Creation
**Depends on**: Task 5, Task 6
- [ ] Create post record in database
- [ ] Link post to user
- [ ] Trigger scoring after upload
- [ ] Show score to user
- **Deliverable**: Complete photo → score flow

### Task 8: Friend System
**Depends on**: Task 3
- [ ] Friend search by username
- [ ] Send friend requests
- [ ] Accept/decline friend requests
- [ ] Friend list display
- **Deliverable**: Users can add friends

### Task 9: Daily Rankings
**Depends on**: Task 7, Task 8
- [ ] Query today's posts for user + friends
- [ ] Calculate daily scores (sum of post scores)
- [ ] Sort and rank users
- [ ] Display ranking screen
- **Deliverable**: Daily leaderboard working

## Viral Mechanics (Week 2)

### Task 10: Challenge System Core
**Depends on**: Task 8, Task 9
- [ ] Create challenge record in database
- [ ] Challenge creation UI (when user is losing)
- [ ] Challenge acceptance UI
- [ ] Challenge state management
- **Deliverable**: Users can send/accept challenges

### Task 11: Push Notifications Setup
**Depends on**: Task 3
- [ ] Configure Expo Push Notifications
- [ ] Store push tokens in user profiles
- [ ] Test notification delivery
- [ ] Handle permission requests
- **Deliverable**: App can send push notifications

### Task 12: Challenge Notifications
**Depends on**: Task 10, Task 11
- [ ] Send push when challenge received
- [ ] Send push when challenge accepted
- [ ] Send push when challenge completed
- [ ] Handle notification tapping
- **Deliverable**: Challenge flow with notifications

### Task 13: Real-time Feed Updates
**Depends on**: Task 7, Task 8
- [ ] Set up Supabase real-time subscriptions
- [ ] Listen for new posts from friends
- [ ] Update UI when friends post
- [ ] Handle connection states
- **Deliverable**: Live feed updates

### Task 14: Auto-Challenge Prompts
**Depends on**: Task 9, Task 10
- [ ] Detect when user is losing to friends
- [ ] Show challenge prompt after posting
- [ ] Pre-written challenge messages
- [ ] One-tap challenge sending
- **Deliverable**: Automatic challenge suggestions

## Polish & Shipping (Week 3)

### Task 15: Error Handling
**Depends on**: All core tasks
- [ ] Network error handling
- [ ] Camera permission denied
- [ ] Upload failures
- [ ] API rate limiting
- [ ] Offline state handling
- **Deliverable**: App doesn't crash on errors

### Task 16: UI Polish
**Depends on**: All core tasks
- [ ] Loading states for all actions
- [ ] Empty states (no friends, no posts)
- [ ] Basic styling that doesn't suck
- [ ] Consistent navigation
- **Deliverable**: App looks decent

### Task 17: Performance Optimization
**Depends on**: All core tasks
- [ ] Image caching
- [ ] Database query optimization
- [ ] Reduce unnecessary re-renders
- [ ] Memory leak fixes
- **Deliverable**: App runs smoothly

### Task 18: Testing & Bug Fixes
**Depends on**: Task 17
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Fix critical bugs
- [ ] Test with multiple users
- **Deliverable**: App works on real devices

### Task 19: App Store Deployment
**Depends on**: Task 18
- [ ] Build production bundles
- [ ] App store metadata/screenshots
- [ ] TestFlight/Play Console upload
- [ ] Beta user recruitment
- **Deliverable**: App in app stores

## Critical Dependencies

**Sequential (must be done in order):**
1. Task 1 → Task 4 → Task 5 → Task 6 → Task 7
2. Task 2 → Task 3 → Task 8 → Task 9
3. Task 8 → Task 10 → Task 12
4. All core tasks → Task 15 → Task 16 → Task 17 → Task 18 → Task 19

**Parallel opportunities:**
- Task 3 can be done parallel with Task 4-5
- Task 8 can be done parallel with Task 6-7
- Task 11 can be done parallel with Task 10
- Task 13 can be done parallel with Task 12

## Definition of Done for Each Task

**Every task must have:**
- [ ] Code written and tested
- [ ] Works on both iOS and Android
- [ ] No console errors or warnings
- [ ] Handles basic error cases
- [ ] Git commit with clear message

**No task is "done" until it works end-to-end.**

## Time Estimates (Reality Check)

- Foundation tasks: 2-3 days
- Core features: 5-7 days  
- Viral mechanics: 4-5 days
- Polish & shipping: 3-5 days

**Total: 14-20 days of actual work**

Add 50% buffer for unexpected bullshit = 21-30 calendar days.

## The Truth About Project Management

- These estimates are optimistic
- You'll discover 5 tasks you didn't know existed
- iOS and Android will behave differently in ways you don't expect
- Third-party APIs will fail when you least expect it
- Plan for 4 weeks, celebrate if you ship in 3

**Most important rule:** Don't move to the next task until the current one actually works. "90% done" tasks will kill your project. 