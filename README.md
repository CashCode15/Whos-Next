# Meet Now

The important thing is to separate the system into four core layers:

Frontend — landing page, video-chat UI, chat, settings, themes.

Real-time layer — WebRTC + WebSocket signaling.

Matchmaking layer — Redis-backed waiting queues and session management.

Persistent backend — users/guests, reports, bans, sessions, analytics, moderation, etc.

1. Product concept

The basic journey should be:

                    WHO'S NEXT?

                         │

              ┌──────────┴──────────┐

              │                     │

          Enter Nickname       Continue as Guest

              │                     │

              └──────────┬──────────┘

                         ↓

                 Create / Restore

                    Session

                         ↓

                 Matching Queue

                         ↓

              ┌─────────────────────┐

              │   FINDING SOMEONE   │

              │                     │

              │   "Who's next?"     │

              └──────────┬──────────┘

                         ↓

                 WebRTC Connection

                         ↓

              ┌─────────────────────┐

              │                     │

              │     VIDEO           │

              │                     │

              │       +             │

              │     CHAT            │

              │                     │

              │                     │

              │  [Who's Next? →]    │

              └─────────────────────┘

                         │

                         ↓

                  Next person

                         │

                         └────→ Matching Queue

The important distinction is that the video itself should not go through your backend.

Use WebRTC for peer-to-peer media.

Your backend handles:

 finding users

 signaling

 session state

 moderation

 chat messages

 reports

 bans

 presence

 matchmaking

 authentication/session management

2. Recommended technology stack

I'd use something like this:

LayerTechnologyFrontendNext.js + React + TypeScriptUITailwind CSS + shadcn/uiAnimationFramer MotionVideoWebRTCSignalingWebSocket / Socket.IOBackendNode.js + NestJSDatabasePostgreSQLFast stateRedisQueueRedis Streams / sorted sets / listsTURN servercoturnReverse proxyNginxDeploymentDockerCDN/WAFCloudflareMonitoringSentry + Prometheus/GrafanaAdsGoogle AdSense initiallyAuthenticationGuest session + optional OAuth later

For an initial MVP, you don't actually need an enormous infrastructure.

I'd start with:

Next.js

   │

   ├── WebSocket

   │

   ↓

NestJS

   │

   ├──── PostgreSQL

   │

   ├──── Redis

   │

   └──── WebRTC signaling

              │

              ↓

        STUN / TURN

Then introduce additional services when traffic requires them.

3. Landing page

This is where Who’s Next? should differentiate itself.

Don't make it look like a generic login page.

Think:

WHO'S NEXT?

You never know who you'll meet.

Then:

             WHO'S NEXT?

       Meet someone unexpected.

      ┌────────────────────────┐

      │ Enter your nickname... │

      └────────────────────────┘

             [ Continue ]

                 or

          [ Continue as Guest ]

       🌎 People are online now

You can have a live counter:

12,482 people online

But don't expose the actual number unless your backend is measuring it reliably.

A subtle animated background with floating avatars, connection lines, gradients, etc. would make the product feel much more polished.

4. Guest system

I strongly recommend supporting guests.

When someone clicks:

Continue as Guest

generate something like:

guest_8f3a92c1

But don't expose that internal identifier publicly.

Instead:

Guest_4821

could be the display name.

Your backend can create:

User

├── id: UUID

├── username

├── display_name

├── is_guest

├── created_at

├── last_seen

└── status

For example:

id:

550e8400-e29b-41d4-a716-446655440000

display_name:

Guest_4821

is_guest:

true

5. Don't use the nickname as the identity

This is important.

Someone could enter:

John

and another person could also enter:

John

That's completely fine.

Your real identity should be a UUID.

user_id = UUID

nickname = user-controlled string

This prevents a huge number of identity/session problems.

6. Session architecture

When the user enters the application:

POST /api/session

Your backend creates:

session_id

user_id

anonymous/guest status

Then give the browser a secure session cookie.

For example:

HttpOnly

Secure

SameSite=Lax

Avoid storing authentication/session secrets in:

localStorage

when you can use secure cookies instead.

7. Video architecture

This is the most important technical component.

Use:

WebRTC

The connection should conceptually be:

User A

   │

   │ WebRTC

   │

   ↓

User B

rather than:

User A

   ↓

Your Server

   ↓

Your Server

   ↓

User B

The second approach becomes extremely expensive because you're transporting video through your infrastructure.

8. But WebRTC needs signaling

WebRTC doesn't magically know who the other browser is.

Your backend provides signaling.

For example:

A → Server

     "I want to call B"

Server → B

     SDP offer

B → Server

     SDP answer

Server → A

     SDP answer

A ↔ B

     ICE candidates

A ═════════════════ B

       WebRTC

The WebSocket layer handles this.

9. STUN and TURN

You should run:

STUN

to help users discover their public network addresses.

And:

TURN

as a fallback when direct peer-to-peer communication doesn't work.

A typical architecture:

             WebRTC

                │

       ┌────────┴────────┐

       │                 │

   Direct P2P         TURN Relay

       │                 │

       └────────┬────────┘

                │

             User B

Use coturn for your TURN infrastructure.

TURN is particularly important because corporate networks, restrictive NATs, mobile networks, and some firewalls can prevent direct connections.

10. The "Who's Next?" button

This is the heart of the application.

When someone clicks:

WHO'S NEXT? →

you shouldn't simply terminate everything and randomly select another user.

Do this:

Current session

      ↓

Terminate session

      ↓

Notify other user

      ↓

Close WebRTC

      ↓

Clean session

      ↓

Place requester into matchmaking queue

      ↓

Find next compatible user

      ↓

Create new session

      ↓

WebRTC negotiation

This should feel almost instantaneous.

11. Matchmaking queue

This is where your FIFO idea comes in.

A basic queue could be:

Redis List

waiting_users

[User A]

[User B]

[User C]

[User D]

When someone enters:

RPUSH waiting_users user_id

Then matchmaking:

LPOP waiting_users

But there is an important problem.

Suppose:

A enters

B enters

C enters

You want:

A ↔ B

Then:

C

waits.

That's easy.

But your actual application will eventually need:

 region preferences

 language

 age restrictions

 connection quality

 gender preferences if you choose to support them

 blocked users

 banned users

 users who recently matched

 users currently unavailable

So a single FIFO queue eventually becomes insufficient.

12. Better matchmaking algorithm

I'd use multiple queues.

For example:

matchmaking

│

├── global

│

├── region:india

│

├── region:us

│

├── region:europe

│

└── region:asia

But don't permanently partition users too aggressively because that can make queues sparse.

A better approach is:

Candidate selection

       ↓

Find users waiting longest

       ↓

Apply compatibility filters

       ↓

Exclude blocked/recent users

       ↓

Select best candidate

       ↓

Create match atomically

The key word is:

atomically

You absolutely don't want:

Server 1 → finds User B

Server 2 → finds User B

and both matching with B.

Redis atomic operations / Lua scripts or another transactional coordination mechanism can solve this.

13. Match object

When two users are matched, create something like:

Match

├── id

├── user_a

├── user_b

├── started_at

├── ended_at

├── ended_by

├── status

└── server_region

And a temporary real-time session:

Room

├── room_id

├── user_a

├── user_b

├── created_at

├── expires_at

└── status

14. Chat

Your chat should run over WebSocket.

For example:

User A

   │

   │ WebSocket

   ↓

Backend

   │

   ↓

User B

Message:

{

  "type": "chat.message",

  "roomId": "...",

  "message": "Hey!"

}

Don't trust the client.

The server should validate:

 user belongs to room

 message length

 rate limits

 spam

 prohibited content

 session still active

15. Don't persist every chat message forever by default

This is both a privacy and cost consideration.

You could keep:

active chat

in memory/Redis.

After the session ends:

delete temporary messages

unless you have a legitimate moderation/reporting reason to retain certain data.

If you do retain reported conversations, clearly establish retention rules and privacy controls.

16. Database structure

A reasonable PostgreSQL schema could begin with:

users

sessions

matches

reports

blocks

bans

moderation_events

user_preferences

Something like:

users

----------------

id

nickname

is_guest

created_at

last_seen

status

country_code

sessions

----------------

id

user_id

created_at

expires_at

last_activity

ip_hash

user_agent_hash

matches

----------------

id

user_a_id

user_b_id

started_at

ended_at

end_reason

reports

----------------

id

reporter_id

reported_user_id

match_id

reason

created_at

status

17. Block functionality is essential

I'd consider this a core feature, not an optional feature.

After meeting someone:

[ Report ]

[ Block ]

[ Next ]

If User A blocks User B:

blocks

----------------

blocker_id

blocked_id

created_at

Your matchmaking service must check this before creating a match.

And ideally:

A blocked B

A → never B

B → never A

18. Reporting

I'd make the report UI extremely easy.

For example:

Why are you reporting this person?

○ Nudity / sexual content

○ Harassment

○ Hate / abuse

○ Spam / advertising

○ Violence / threats

○ Underage user

○ Other

Then:

[ Submit Report & Next ]

That means reporting doesn't trap the user inside the session.

19. Safety needs to be built into the architecture

Random video chat has significantly higher moderation risk than an ordinary social application.

I'd therefore design:

Video session

     │

     ├── Report

     ├── Block

     ├── Leave

     └── Moderation

You should also have:

 age gating

 clear community rules

 automated spam detection

 rate limiting

 abuse detection

 ban system

 IP/device abuse signals

 moderation dashboard

 emergency/report escalation

 privacy policy

 terms of service

Especially if minors could access the service, the safety architecture needs to be considerably stronger.

20. Auto-switching

This could be a great feature.

Add:

Auto Next

[ ON ]

Then:

User connects

      ↓

Conversation starts

      ↓

Timer

      ↓

30 sec / 60 sec / custom

      ↓

"Finding someone new..."

      ↓

Next match

But I'd make it optional.

You don't want someone suddenly losing a conversation because they didn't understand that auto-next was enabled.

21. Connection quality

This is a feature I'd definitely add.

Display:

● Excellent connection

or:

● Good connection

You can estimate this from WebRTC stats:

 RTT

 packet loss

 jitter

 bitrate

 ICE state

This makes the product feel significantly more professional.

22. Camera/microphone controls

Obviously:

🎤 Mic

📹 Camera

🔊 Speaker

↗ Fullscreen

⛶

And ideally:

Flip camera

on mobile.

23. Mobile-first design

This is extremely important.

Random video-chat products are likely to have a large mobile audience.

Your layout should adapt:

Desktop

┌──────────────────────────────────────────────┐

│ Who's Next?                    Settings      │

├──────────────────────────────┬───────────────┤

│                              │               │

│                              │    CHAT       │

│          VIDEO               │               │

│                              │               │

│                              │               │

│                              │               │

├──────────────────────────────┴───────────────┤

│ Mic   Camera   Report       WHO'S NEXT →     │

└──────────────────────────────────────────────┘

Mobile

┌───────────────────┐

│                   │

│      VIDEO        │

│                   │

│                   │

│                   │

├───────────────────┤

│     CHAT          │

├───────────────────┤

│ 🎤 📹  ⚙   NEXT → │

└───────────────────┘

24. Dark/light mode

Definitely.

Store preference locally:

theme = dark

and optionally sync it to the account if the user eventually creates one.

Default:

dark mode

would probably fit the product particularly well.

25. User preferences

I'd add a small preferences panel:

Preferences

Theme

○ Dark

○ Light

○ System

Auto Next

[ ON/OFF ]

Sound

[ ON/OFF ]

Blur strangers initially

[ ON/OFF ]

Show my region

[ ON/OFF ]

Language

[ English ▼ ]

26. "Blur until connected"

A nice safety/privacy feature:

Before WebRTC is fully established:

╭─────────────────────╮

│                     │

│       ░░░░░░        │

│      Connecting     │

│                     │

╰─────────────────────╯

You can also optionally provide a blur-first experience until the user chooses to reveal the video.

27. Add interests

This is one feature I'd seriously consider.

Instead of completely random matching:

What are you interested in?

[ Gaming ]

[ Music ]

[ Movies ]

[ Technology ]

[ Travel ]

[ Sports ]

[ Just Chatting ]

Then matchmaking can prioritize:

same interests

       ↓

same language

       ↓

same/general region

       ↓

global fallback

But still preserve the random nature of the product.

For example:

Match score:

interest overlap     40%

language             25%

waiting time         20%

region                10%

connection quality     5%

You don't need this in V1.

28. Reputation without turning it into a social network

Another interesting feature:

After a conversation:

How was your conversation?

⭐ ⭐ ⭐ ⭐ ⭐

But don't expose a public "rating" that turns the application into a popularity contest.

Instead use internal reputation signals to identify:

 abusive users

 spam accounts

 repeat offenders

 bots

29. Bot detection

This will become extremely important if your app becomes popular.

Otherwise you'll eventually get:

real users

      ↓

spam bots

      ↓

advertising bots

      ↓

scammers

You can use:

 rate limits

 behavioral analysis

 CAPTCHA/challenge mechanisms when suspicious

 IP reputation

 device/browser signals

 account age

 connection patterns

 message frequency

Don't CAPTCHA every user because that destroys the magic of instant random chat.

Challenge suspicious users instead.

30. Ad blocker problem

This needs an important clarification:

You cannot reliably guarantee that AdSense ads will never be blocked by a user's ad blocker.

A browser extension that controls the user's browser can block ad requests. There isn't a legitimate frontend technique that can guarantee:

"Ad blocker installed → AdSense advertisement must display."

Trying to disguise ads, evade filtering lists, or force ad requests through deceptive techniques can violate advertising-network policies and is not a good architecture.

Instead, build monetization around multiple channels.

For example:

Revenue

│

├── AdSense/display ads

├── Sponsored placements

├── Premium subscription

├── Cosmetic features

└── Optional supporter tier

And design your application so that an ad blocker doesn't break the product.

31. Ad placement

Don't put ads over the video.

That's awful UX.

Instead:

Landing page

WHO'S NEXT?

[ nickname ]

[ Continue ]

────────────

Advertisement

────────────

Between matches

Conversation ended.

        Finding someone...

       [ advertisement ]

        Connecting...

Sidebar

On desktop:

VIDEO              CHAT

                   │

                   │

                   │

                   ├──────────

                   │ AD

                   │

But keep advertising clearly separated from controls.

32. Don't make ads interfere with the "Who's Next?" experience

Your primary loop should be:

Visit

 ↓

Match

 ↓

Talk

 ↓

Next

 ↓

Match

 ↓

Talk

Ads should be secondary.

If users feel like:

click Next

 ↓

AD

 ↓

AD

 ↓

AD

 ↓

Next

they will leave.

33. Cookies/session architecture

I'd use:

Session cookie

__Host-whosnext_session

with:

HttpOnly

Secure

SameSite=Lax

Path=/

Your server stores the session:

session_id → Redis

or uses a database-backed session.

For example:

Redis

session:<id>

{

    userId: "...",

    createdAt: "...",

    expiresAt: "...",

    lastSeen: "..."

}

Set a reasonable expiration and rotate session identifiers where appropriate.

34. Redis is going to be extremely useful

Redis can handle:

sessions

presence

matchmaking queues

rate limits

temporary chat

WebSocket coordination

locks

Your architecture becomes:

                    ┌───────────────┐

                    │  PostgreSQL   │

                    │ Permanent DB  │

                    └───────▲───────┘

                            │

                            │

Browser → API → Backend → Redis

              │       │

              │       └── matchmaking

              │

              └────────── WebSocket

                             │

                             ↓

                           WebRTC

35. Scaling horizontally

Don't design the backend as:

one Node server

Design it as:

                 Load Balancer

                       │

          ┌────────────┼────────────┐

          ↓            ↓            ↓

       API #1        API #2       API #3

          │            │            │

          └────────────┼────────────┘

                       ↓

                     Redis

                       │

                       ↓

                  PostgreSQL

Now you can add servers when traffic increases.

36. WebSocket scaling

This is a common mistake.

Suppose:

User A → Server 1

User B → Server 2

Your servers need to know about each other.

Redis Pub/Sub or a WebSocket adapter can coordinate events.

For example:

User A

   ↓

WS Server 1

   ↓

Redis Pub/Sub

   ↓

WS Server 2

   ↓

User B

37. Matchmaking state machine

I would explicitly model matchmaking as a state machine.

IDLE

 │

 ↓

SEARCHING

 │

 ↓

MATCH_FOUND

 │

 ↓

CONNECTING

 │

 ↓

CONNECTED

 │

 ├───────────────┐

 ↓               ↓

NEXT             DISCONNECTED

 │               │

 ↓               ↓

SEARCHING       SEARCHING

This will prevent a huge amount of frontend/backend synchronization bugs.

38. Matchmaking pseudologic

Conceptually:

joinQueue(user):

    if user already queued:

        return

    candidate = findCandidate(user)

    if candidate exists:

        atomically remove both from queue

        createMatch(user, candidate)

        notify(user, candidate)

    else:

        add user to queue

But the actual production implementation should use an atomic Redis operation/transaction rather than naïvely doing:

check

then remove

because multiple backend servers can race.

39. Important queue optimization

Don't keep disconnected users in the queue forever.

Use:

heartbeat

For example:

user joins queue

       ↓

heartbeat every ~10 seconds

       ↓

TTL

       ↓

no heartbeat

       ↓

remove from queue

That prevents:

dead browser tabs

dead mobile connections

network disconnects

from polluting matchmaking.

40. Abuse prevention

Every important endpoint should have rate limits.

For example:

POST /report

POST /next

POST /message

POST /session

Don't allow:

1000 "Next" requests/sec

from one client.

Redis can implement token-bucket/sliding-window rate limiting.

41. Don't expose IP addresses

Never show:

123.123.123.123

to the other user.

WebRTC itself can have privacy implications depending on configuration/browser behavior, so your WebRTC architecture and ICE handling should be designed with modern browser privacy expectations in mind.

For higher privacy, you may decide to relay more traffic through TURN, although that significantly increases bandwidth cost.

That's a tradeoff you'll need to make.

42. Analytics

You should measure the product.

Important metrics:

DAU

MAU

matches/day

average session duration

median session duration

Next clicks

connection success %

connection failure %

average queue time

report rate

block rate

return rate

ad RPM

revenue/session

One particularly important metric:

Match success rate

successful WebRTC sessions

--------------------------

match attempts

If it's 65%, you've got a technical problem.

If it's 98%, the experience feels much better.

43. Admin dashboard

You'll eventually need one.

Something like:

WHO'S NEXT? ADMIN

Users online:       12,842

Active calls:        5,821

Waiting:             1,200

Reports today:         184

Banned today:           41

--------------------------------

Reports

Users

Bans

Sessions

Analytics

System Health

And moderation tools:

User

├── View reports

├── Temporary ban

├── Permanent ban

├── Remove ban

└── View moderation history

Access must be heavily protected.

44. Suggested API structure

Something like:

/api

  /auth

    POST /guest

    POST /nickname

    POST /logout

  /user

    GET /me

    PATCH /me/preferences

  /match

    POST /join

    POST /next

    POST /leave

    GET  /current

  /report

    POST /

  /block

    POST /

    DELETE /

  /health

    GET /

WebSocket events:

match:searching

match:found

match:ended

webrtc:offer

webrtc:answer

webrtc:ice

chat:message

chat:typing

user:connected

user:disconnected

45. Suggested frontend structure

With Next.js:

app/

│

├── page.tsx

│

├── chat/

│   └── page.tsx

│

├── settings/

│   └── page.tsx

│

└── legal/

    ├── privacy/

    └── terms/

Components:

components/

│

├── landing/

│   ├── Hero

│   ├── NicknameInput

│   └── GuestButton

│

├── video/

│   ├── VideoStage

│   ├── LocalVideo

│   ├── RemoteVideo

│   └── VideoControls

│

├── chat/

│   ├── ChatPanel

│   ├── MessageList

│   └── MessageInput

│

├── matchmaking/

│   ├── Searching

│   └── MatchTransition

│

└── moderation/

    ├── ReportDialog

    └── BlockDialog

46. UI state

I'd use something like Zustand on the frontend.

For example:

connectionState

matchState

localStream

remoteStream

messages

isMuted

isCameraOff

autoNext

theme

But don't put server-authoritative state solely in Zustand.

The backend remains authoritative.

47. What I'd make the actual product loop feel like

This is where I'd make Who’s Next? different from a cheap Omegle clone.

When you enter:

Ready to see who's next?

Then:

Finding someone...

with a beautiful animated state.

Then:

Someone's next.

Video appears.

Bottom controls:

🎤     📹     ⚙     🚩     ⏭ WHO'S NEXT?

Chat opens from the side.

When someone presses Next:

Ending conversation...

then immediately:

Finding someone new...

No page reload.

No ugly loading screen.

No redirect.

That instantaneous loop is the core UX.

48. A feature I'd add: "Conversation streak"

Not a public social score.

Something like:

🔥 4 conversations today

This gives users a reason to continue without turning the application into a conventional social network.

49. Another useful feature: conversation icebreakers

A random person joining a video call often has no idea what to say.

Put:

Need an opener?

Then:

🎲 Give me a question

Examples:

What's one place you'd travel to tomorrow?

What's the best thing you've watched recently?

What game are you playing right now?

This can dramatically improve conversation quality.

50. Another feature: shared interests

When matching:

You both selected:

🎮 Gaming

🎵 Music

💻 Technology

Then the conversation immediately has something to talk about.

That's much more engaging than blindly matching two strangers.

51. MVP vs V2

Don't build everything simultaneously.

MVP

Build only:

✓ Landing page

✓ Nickname

✓ Guest login

✓ Session cookies

✓ Matchmaking

✓ Redis queue

✓ WebSocket

✓ WebRTC

✓ STUN/TURN

✓ Video

✓ Mic/camera

✓ Chat

✓ Who's Next

✓ Report

✓ Block

✓ Dark/light theme

✓ Basic moderation

✓ PostgreSQL

✓ Basic admin panel

V2

Then:

→ Interests

→ Language matching

→ Auto Next

→ Icebreakers

→ Connection quality

→ Better moderation

→ Analytics

→ Notifications

→ Accounts

→ Premium

→ Advanced monetization

52. V3 — scale

Once you have real traffic:

CDN

 ↓

WAF

 ↓

Load Balancer

 ↓

API cluster

 ↓

Redis cluster

 ↓

PostgreSQL

 ↓

Read replicas

And:

WebRTC

 ↓

TURN cluster

 ↓

Regional deployment

For example:

India

Europe

North America

Asia-Pacific

This matters because random video chat is extremely bandwidth-sensitive.

53. One major cost you need to understand

The expensive part isn't primarily your React application.

It's:

video bandwidth + TURN traffic + infrastructure + moderation.

If 10,000 simultaneous users are all exchanging video, the bandwidth requirements can become substantial.

That's why you should measure:

direct WebRTC %

TURN relay %

average bitrate

average session duration

Your goal should be to maximize successful direct connections while using TURN when necessary.

54. Security model

I'd make these non-negotiable:

HTTPS everywhere

Secure cookies

HttpOnly cookies

CSRF protection where applicable

CSP

XSS protection

Input validation

WebSocket authentication

WebSocket rate limiting

API rate limiting

SQL parameterization

Redis ACLs

TURN authentication

Admin MFA

Audit logs

Secrets outside source code

Never trust:

nickname

user ID

room ID

WebSocket event

chat message

client-side match state

Everything must be validated server-side.

55. Overall architecture I'd recommend

                         INTERNET

                             │

                             ▼

                    ┌─────────────────┐

                    │ Cloudflare/WAF  │

                    └────────┬────────┘

                             │

                             ▼

                    ┌─────────────────┐

                    │ Load Balancer   │

                    └────────┬────────┘

                             │

             ┌───────────────┼────────────────┐

             │               │                │

             ▼               ▼                ▼

        Next.js/API      WebSocket #1     WebSocket #2

             │               │                │

             └───────────────┼────────────────┘

                             │

                             ▼

                    ┌─────────────────┐

                    │      Redis      │

                    │                 │

                    │ matchmaking    │

                    │ sessions        │

                    │ presence        │

                    │ rate limits     │

                    └────────┬────────┘

                             │

                             ▼

                    ┌─────────────────┐

                    │   PostgreSQL    │

                    │                 │

                    │ users           │

                    │ matches         │

                    │ reports         │

                    │ blocks          │

                    │ bans            │

                    └─────────────────┘

          WebRTC

        ┌─────────────┐

        │             │

        ▼             ▼

     User A         User B

        │             │

        └──────┬──────┘

               │

       direct P2P where possible

               │

               ▼

          TURN fallback

56. The data structures/algorithms in one place

Your application actually gives you a nice opportunity to use several different structures for different problems:

ProblemStructure/algorithmMatchmakingFIFO queueCompatibilityCandidate filtering/scoringFast session lookupRedis HashOnline presenceRedis SetTemporary sessionRedis TTL keysRate limitingToken bucket/sliding windowBlock listPostgreSQL indexed relation / Redis SetReportsPostgreSQLPermanent usersPostgreSQLReal-time communicationWebSocketVideoWebRTCSession lifecycleFinite State MachineDistributed coordinationRedis atomic operations/LuaAnalyticsEvent stream → analytics DB later

The most important algorithmic property is:

Matchmaking should be fair but not blindly FIFO.

A strict:

A → B → C → D

queue is fair, but real users require constraints.

So I'd implement:

FIFO waiting time

        +

compatibility scoring

        +

block filtering

        +

recent-match avoidance

with waiting time becoming increasingly important the longer somebody waits.

57. What I would build first

If we're actually going to develop Who’s Next? together from scratch, I would not start by writing all the code at once.

I'd do it in this order:

Phase 1 — Foundation

Next.js

TypeScript

Tailwind

PostgreSQL

Prisma

Redis

Docker

Phase 2 — Identity

Guest creation

Nickname

Session cookie

User table

Phase 3 — Matchmaking

Redis queue

join queue

leave queue

match creation

Next button

Phase 4 — Real-time

WebSocket

signaling

WebRTC

STUN

TURN

Phase 5 — Conversation

video

audio

chat

controls

Phase 6 — Safety

block

report

rate limits

bans

moderation

Phase 7 — Polish

animations

dark mode

mobile UI

auto-next

icebreakers

interests

Phase 8 — Monetization

AdSense

ad placement

premium

analytics

revenue tracking

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f994626f-9faf-427f-ae10-16df20335d44).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
