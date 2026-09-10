PROJECT: MAHEI-PATHAP WEBAPP + DISCORD INTEGRATION

GOAL
----
Mahei-Pathap is an existing React/Vite web application with Appwrite as its backend/database and a Python Discord bot/server.

The long-term goal is to fully integrate the webapp with the Discord server so that activity performed in the webapp—especially Pomodoro/Focus sessions—automatically contributes to an XP system and Discord leaderboard.

IMPORTANT:
Do NOT rebuild the application from scratch.
Do NOT replace the existing Appwrite configuration.
Do NOT change existing Appwrite project IDs, database IDs, collection IDs, endpoints, permissions, authentication configuration, or environment variables unless explicitly requested.


CURRENT WEBAPP FEATURES
-----------------------
The webapp currently has these main features:

- Dashboard
- Tasks
- Assignments
- Skill Learning
- Goals
- Calendar
- Focus / Pomodoro
- Notes
- Analytics
- Daily Review
- About Me
- Donation
- Suggestions
- Announcements
- Admin Panel

TECH STACK
----------
- React
- Vite
- TypeScript/JavaScript components as already present in the project
- Appwrite backend/database
- Existing authentication
- Existing deployed webapp/Vercel setup
- Python Discord bot for the Discord server


DISCORD BOT
-----------
A Python Discord bot already exists and is working.

Existing Discord functionality includes a Study Lounge / temporary study-room system.

The bot has commands/features being developed such as:
- /limit
- /rename
- study room creation
- temporary voice/study rooms
- automatic Student role assignment when a user joins

The Discord bot should eventually integrate with the Mahei-Pathap webapp rather than operate as an independent system.


MAIN FUTURE INTEGRATION
-----------------------
Desired architecture:

Mahei-Pathap WebApp
        |
        v
     Appwrite
        |
        v
   Trusted activity/statistics
        |
        v
   Python Discord Bot
        |
        +--> Discord user stats
        +--> XP
        +--> leaderboard
        +--> monthly results


POMODORO / XP REQUIREMENT
-------------------------
When a user uses the Pomodoro/Focus feature in the webapp:

Example:
- User selects Focus 25m
- Starts a 25-minute session
- Completes the full 25 minutes

Then:
1. The completed session must be reliably saved to Appwrite.
2. The session must contribute to the user's XP.
3. The user's monthly XP/statistics must update.
4. Discord should eventually read the trusted Appwrite statistics.
5. The user should appear in the Discord leaderboard.
6. At the end of each month, the Discord bot should publish the monthly leaderboard/results.
7. A new monthly leaderboard should then begin while historical results remain available.

Example Discord leaderboard:

🏆 MAHEI PATHAP
September 2026 Results

🥇 User A       1,540 XP
🥈 User B       1,420 XP
🥉 User C       1,275 XP

🍅 Pomodoros: 1,245
⏱️ Focus time: 518 hours

The exact XP rules have NOT been finalized yet.

A proposed initial rule was:
25-minute completed focus = +10 XP

Other possible future XP sources:
- completed task
- completed assignment
- learning session
- completed goal
- daily review
- streak bonuses
- weekly milestones

Do not implement arbitrary XP rules without confirmation if the exact rules matter.


IMPORTANT SECURITY REQUIREMENT
------------------------------
Do NOT trust the frontend to simply say:
"I completed 25 minutes, give me XP."

The system should validate/record completed sessions properly so users cannot easily generate unlimited XP by manipulating frontend state.

Preferred flow:

User completes Pomodoro
        |
        v
Validated Appwrite/backend record
        |
        v
XP/statistics update
        |
        v
Discord bot reads trusted data

Appwrite should be the source of truth for webapp activity/statistics.


DISCORD USER LINKING
--------------------
Eventually, webapp users need to be linked to their Discord accounts.

Conceptually:

Mahei-Pathap user
      <-->
Discord user ID

Use Discord user ID as the stable identifier, not username.

A possible future collection/data structure:

discord_users:
- user_id
- discord_user_id
- discord_username
- linked_at

Do not create duplicate collections if equivalent existing Appwrite structures already exist. Inspect the existing database first.


FOCUS/POMODORO BUG FOUND
------------------------
The Focus/Pomodoro page already exists and visually works.

The page contains:
- Focus 25m
- Short 5m
- Long 15m
- timer
- subject field, e.g. "General Study"
- Start Focus button
- Focus History

A significant bug was identified:

There is an existing saveFocusSession() function intended to save completed focus sessions to Appwrite, but the timer completion flow was not properly calling it.

This means the UI could show a completed session in Focus History temporarily while the session was not actually persisted correctly to Appwrite.

Required behavior:

25:00 -> 00:00
       |
       v
saveFocusSession()
       |
       v
Appwrite Focus collection
       |
       v
persistent Focus History/statistics

Also verify:
- pause/resume
- completion behavior
- refresh persistence
- date handling
- statistics
- streak calculation
- localStorage/Appwrite synchronization
- prevention of easy manipulation


WATCHED VIDEO COUNT BUG
-----------------------
The Skill Learning/video functionality has a watched-video system.

The watched state/count needs fixing.

Required behavior:
- Clicking "Mark watched" increases the count immediately.
- Clicking "Unmark watched" decreases the count.
- Watched state persists after page refresh.
- Appwrite is the source of truth when the user is logged in.
- Dashboard/Analytics/Daily Review/etc. should show a consistent watched-video count.
- Adding new videos must not corrupt the count.
- User A's watched state must never mix with User B's watched state.
- Failed Appwrite saves should not leave the UI permanently showing incorrect state.

Future integration:
Watched learning activity may eventually contribute to XP.


SUGGESTION BOX BUG
------------------
There is a Suggestions feature where users submit suggestions.

The suggestion appears in the Admin Panel, BUT the actual suggestion message/content is not being displayed correctly.

Required behavior:

Admin Panel should show something similar to:

Suggestion
From: username
Date: date

"Please add a dark mode schedule."

[Mark as reviewed] [Delete]

Fix the Admin Panel so the actual submitted suggestion text/message is visible.

Do not break existing suggestion submission/storage.


MOBILE LOGOUT BUG
-----------------
The Logout button is missing from the mobile phone/mobile navigation interface.

Required:
- Add a visible Logout option to the mobile navigation/menu.
- Preserve the existing desktop logout behavior/layout.
- Do not break authentication.


OTHER BUGS
----------
The user explicitly requested:
"also check for other bugs i don't know and start fixing"

Therefore, perform a broader code review and identify obvious bugs/regressions in the existing app.

But:
- Do NOT make unnecessary architectural rewrites.
- Do NOT change Appwrite configuration.
- Do NOT change unrelated working functionality just for style/preferences.
- Prefer small, targeted fixes.
- Preserve existing UI and feature behavior unless a bug requires changing it.


APPWRITE CONFIGURATION — CRITICAL
---------------------------------
There was a previous mistake where a modified ZIP did not preserve the original .env/Appwrite configuration.

The user explicitly complained:
"you have mess up with my previous appwrite configuration"

The correct rule going forward is:

THE EXISTING APPWRITE CONFIGURATION IS LOCKED.

Do not change:
- Appwrite endpoint
- Appwrite project ID
- Appwrite database ID
- existing collection IDs
- authentication configuration
- permissions
- environment variable names/values
- existing Appwrite setup

Unless the user explicitly asks for an Appwrite configuration change.

The original working project should be treated as the source of truth for configuration.


FILES / PROJECT VERSIONS
------------------------
Several ZIPs were uploaded during the conversation.

Relevant project versions:
1. Original/working project:
   BuddySpace(1).zip
   Local path in the conversation runtime:
   /mnt/data/BuddySpace(1).zip

2. A previous modified project:
   Mahei-Pathap-fixed.zip

3. A later restored version:
   Mahei-Pathap-fixed(1).zip
   and generated:
   Mahei-Pathap-fixed-restored.zip

There was also:
   /mnt/data/BuddySpace.zip

The project was identified as Mahei-Pathap despite some ZIP filenames being "BuddySpace".

The user wants the ORIGINAL working Appwrite configuration preserved.


PREVIOUS FIXING PASS
--------------------
A previous assistant claimed to create a fixed ZIP and reported that:
- Pomodoro save was fixed
- watched video persistence was fixed
- suggestion message display was fixed
- mobile logout was fixed
- focus date handling was improved
- duplicate authentication state update was removed
- project build succeeded

However, because of the Appwrite configuration issue, DO NOT blindly trust that previous modified ZIP.

Use the original working project/configuration as the baseline and reapply only verified fixes.


BUILD / TESTING
---------------
The project previously successfully ran:

npm run build

and produced a successful Vite build.

Every modification should ideally be build-tested before being considered complete.

Also test affected functionality where possible.


CURRENT PRIORITY ORDER
----------------------
Priority 1:
Restore/ensure original Appwrite configuration.

Priority 2:
Fix existing webapp bugs:
- Pomodoro persistence/completion
- watched video count
- suggestion message in Admin Panel
- mobile logout

Priority 3:
Scan for additional obvious bugs and fix only safe, relevant ones.

Priority 4:
Test/build the webapp.

Priority 5:
After webapp is stable, implement XP.

Priority 6:
Integrate XP/statistics with Appwrite.

Priority 7:
Connect the Python Discord bot to trusted Appwrite statistics.

Priority 8:
Implement Discord commands/stats/leaderboard.

Priority 9:
Implement monthly leaderboard reset + historical monthly results.

Priority 10:
Expand XP to other Mahei-Pathap activities if desired.


DESIRED FINAL ARCHITECTURE
--------------------------

                  MAHEI-PATHAP
                        |
              React/Vite WebApp
                        |
                        v
                    Appwrite
                        |
          +-------------+-------------+
          |             |             |
       Focus         Learning       Tasks/etc.
       Sessions       Videos          Activity
          |             |             |
          +-------------+-------------+
                        |
                    XP System
                        |
                  Monthly Stats
                        |
                        v
                Python Discord Bot
                        |
          +-------------+-------------+
          |             |             |
       /stats       /leaderboard    monthly results
          |             |             |
          +-------------+-------------+
                        |
                 Discord Server


IMPORTANT DEVELOPMENT RULES
----------------------------
1. Preserve the existing app.
2. Preserve Appwrite configuration exactly.
3. Inspect before changing.
4. Do not invent collection IDs.
5. Do not create duplicate collections when existing ones can be reused.
6. Do not expose secrets.
7. Do not include real .env credentials in public repositories.
8. Do not make unrelated UI changes.
9. Build-test after changes.
10. Make changes incrementally and explain what changed.
11. If an Appwrite schema change is required, explain it before making it.
12. XP should be based on trusted/validated activity.
13. Discord should consume trusted statistics rather than being the source of truth for webapp activity.


USER'S IMMEDIATE EXPECTATION
---------------------------
The user wants the existing Mahei-Pathap webapp fixed first.

They specifically want:
- Pomodoro functionality fixed
- watched video count fixed
- suggestion box/admin message display fixed
- mobile logout fixed
- additional unknown bugs checked and fixed

Only after the webapp is stable should the Discord XP/leaderboard integration be implemented.PROJECT: MAHEI-PATHAP WEBAPP + DISCORD INTEGRATION

GOAL
----
Mahei-Pathap is an existing React/Vite web application with Appwrite as its backend/database and a Python Discord bot/server.

The long-term goal is to fully integrate the webapp with the Discord server so that activity performed in the webapp—especially Pomodoro/Focus sessions—automatically contributes to an XP system and Discord leaderboard.

IMPORTANT:
Do NOT rebuild the application from scratch.
Do NOT replace the existing Appwrite configuration.
Do NOT change existing Appwrite project IDs, database IDs, collection IDs, endpoints, permissions, authentication configuration, or environment variables unless explicitly requested.


CURRENT WEBAPP FEATURES
-----------------------
The webapp currently has these main features:

- Dashboard
- Tasks
- Assignments
- Skill Learning
- Goals
- Calendar
- Focus / Pomodoro
- Notes
- Analytics
- Daily Review
- About Me
- Donation
- Suggestions
- Announcements
- Admin Panel

TECH STACK
----------
- React
- Vite
- TypeScript/JavaScript components as already present in the project
- Appwrite backend/database
- Existing authentication
- Existing deployed webapp/Vercel setup
- Python Discord bot for the Discord server


DISCORD BOT
-----------
A Python Discord bot already exists and is working.

Existing Discord functionality includes a Study Lounge / temporary study-room system.

The bot has commands/features being developed such as:
- /limit
- /rename
- study room creation
- temporary voice/study rooms
- automatic Student role assignment when a user joins

The Discord bot should eventually integrate with the Mahei-Pathap webapp rather than operate as an independent system.


MAIN FUTURE INTEGRATION
-----------------------
Desired architecture:

Mahei-Pathap WebApp
        |
        v
     Appwrite
        |
        v
   Trusted activity/statistics
        |
        v
   Python Discord Bot
        |
        +--> Discord user stats
        +--> XP
        +--> leaderboard
        +--> monthly results


POMODORO / XP REQUIREMENT
-------------------------
When a user uses the Pomodoro/Focus feature in the webapp:

Example:
- User selects Focus 25m
- Starts a 25-minute session
- Completes the full 25 minutes

Then:
1. The completed session must be reliably saved to Appwrite.
2. The session must contribute to the user's XP.
3. The user's monthly XP/statistics must update.
4. Discord should eventually read the trusted Appwrite statistics.
5. The user should appear in the Discord leaderboard.
6. At the end of each month, the Discord bot should publish the monthly leaderboard/results.
7. A new monthly leaderboard should then begin while historical results remain available.

Example Discord leaderboard:

🏆 MAHEI PATHAP
September 2026 Results

🥇 User A       1,540 XP
🥈 User B       1,420 XP
🥉 User C       1,275 XP

🍅 Pomodoros: 1,245
⏱️ Focus time: 518 hours

The exact XP rules have NOT been finalized yet.

A proposed initial rule was:
25-minute completed focus = +10 XP

Other possible future XP sources:
- completed task
- completed assignment
- learning session
- completed goal
- daily review
- streak bonuses
- weekly milestones

Do not implement arbitrary XP rules without confirmation if the exact rules matter.


IMPORTANT SECURITY REQUIREMENT
------------------------------
Do NOT trust the frontend to simply say:
"I completed 25 minutes, give me XP."

The system should validate/record completed sessions properly so users cannot easily generate unlimited XP by manipulating frontend state.

Preferred flow:

User completes Pomodoro
        |
        v
Validated Appwrite/backend record
        |
        v
XP/statistics update
        |
        v
Discord bot reads trusted data

Appwrite should be the source of truth for webapp activity/statistics.


DISCORD USER LINKING
--------------------
Eventually, webapp users need to be linked to their Discord accounts.

Conceptually:

Mahei-Pathap user
      <-->
Discord user ID

Use Discord user ID as the stable identifier, not username.

A possible future collection/data structure:

discord_users:
- user_id
- discord_user_id
- discord_username
- linked_at

Do not create duplicate collections if equivalent existing Appwrite structures already exist. Inspect the existing database first.


FOCUS/POMODORO BUG FOUND
------------------------
The Focus/Pomodoro page already exists and visually works.

The page contains:
- Focus 25m
- Short 5m
- Long 15m
- timer
- subject field, e.g. "General Study"
- Start Focus button
- Focus History

A significant bug was identified:

There is an existing saveFocusSession() function intended to save completed focus sessions to Appwrite, but the timer completion flow was not properly calling it.

This means the UI could show a completed session in Focus History temporarily while the session was not actually persisted correctly to Appwrite.

Required behavior:

25:00 -> 00:00
       |
       v
saveFocusSession()
       |
       v
Appwrite Focus collection
       |
       v
persistent Focus History/statistics

Also verify:
- pause/resume
- completion behavior
- refresh persistence
- date handling
- statistics
- streak calculation
- localStorage/Appwrite synchronization
- prevention of easy manipulation


WATCHED VIDEO COUNT BUG
-----------------------
The Skill Learning/video functionality has a watched-video system.

The watched state/count needs fixing.

Required behavior:
- Clicking "Mark watched" increases the count immediately.
- Clicking "Unmark watched" decreases the count.
- Watched state persists after page refresh.
- Appwrite is the source of truth when the user is logged in.
- Dashboard/Analytics/Daily Review/etc. should show a consistent watched-video count.
- Adding new videos must not corrupt the count.
- User A's watched state must never mix with User B's watched state.
- Failed Appwrite saves should not leave the UI permanently showing incorrect state.

Future integration:
Watched learning activity may eventually contribute to XP.


SUGGESTION BOX BUG
------------------
There is a Suggestions feature where users submit suggestions.

The suggestion appears in the Admin Panel, BUT the actual suggestion message/content is not being displayed correctly.

Required behavior:

Admin Panel should show something similar to:

Suggestion
From: username
Date: date

"Please add a dark mode schedule."

[Mark as reviewed] [Delete]

Fix the Admin Panel so the actual submitted suggestion text/message is visible.

Do not break existing suggestion submission/storage.


MOBILE LOGOUT BUG
-----------------
The Logout button is missing from the mobile phone/mobile navigation interface.

Required:
- Add a visible Logout option to the mobile navigation/menu.
- Preserve the existing desktop logout behavior/layout.
- Do not break authentication.


OTHER BUGS
----------
The user explicitly requested:
"also check for other bugs i don't know and start fixing"

Therefore, perform a broader code review and identify obvious bugs/regressions in the existing app.

But:
- Do NOT make unnecessary architectural rewrites.
- Do NOT change Appwrite configuration.
- Do NOT change unrelated working functionality just for style/preferences.
- Prefer small, targeted fixes.
- Preserve existing UI and feature behavior unless a bug requires changing it.


APPWRITE CONFIGURATION — CRITICAL
---------------------------------
There was a previous mistake where a modified ZIP did not preserve the original .env/Appwrite configuration.

The user explicitly complained:
"you have mess up with my previous appwrite configuration"

The correct rule going forward is:

THE EXISTING APPWRITE CONFIGURATION IS LOCKED.

Do not change:
- Appwrite endpoint
- Appwrite project ID
- Appwrite database ID
- existing collection IDs
- authentication configuration
- permissions
- environment variable names/values
- existing Appwrite setup

Unless the user explicitly asks for an Appwrite configuration change.

The original working project should be treated as the source of truth for configuration.


FILES / PROJECT VERSIONS
------------------------
Several ZIPs were uploaded during the conversation.

Relevant project versions:
1. Original/working project:
   BuddySpace(1).zip
   Local path in the conversation runtime:
   /mnt/data/BuddySpace(1).zip

2. A previous modified project:
   Mahei-Pathap-fixed.zip

3. A later restored version:
   Mahei-Pathap-fixed(1).zip
   and generated:
   Mahei-Pathap-fixed-restored.zip

There was also:
   /mnt/data/BuddySpace.zip

The project was identified as Mahei-Pathap despite some ZIP filenames being "BuddySpace".

The user wants the ORIGINAL working Appwrite configuration preserved.


PREVIOUS FIXING PASS
--------------------
A previous assistant claimed to create a fixed ZIP and reported that:
- Pomodoro save was fixed
- watched video persistence was fixed
- suggestion message display was fixed
- mobile logout was fixed
- focus date handling was improved
- duplicate authentication state update was removed
- project build succeeded

However, because of the Appwrite configuration issue, DO NOT blindly trust that previous modified ZIP.

Use the original working project/configuration as the baseline and reapply only verified fixes.


BUILD / TESTING
---------------
The project previously successfully ran:

npm run build

and produced a successful Vite build.

Every modification should ideally be build-tested before being considered complete.

Also test affected functionality where possible.


CURRENT PRIORITY ORDER
----------------------
Priority 1:
Restore/ensure original Appwrite configuration.

Priority 2:
Fix existing webapp bugs:
- Pomodoro persistence/completion
- watched video count
- suggestion message in Admin Panel
- mobile logout

Priority 3:
Scan for additional obvious bugs and fix only safe, relevant ones.

Priority 4:
Test/build the webapp.

Priority 5:
After webapp is stable, implement XP.

Priority 6:
Integrate XP/statistics with Appwrite.

Priority 7:
Connect the Python Discord bot to trusted Appwrite statistics.

Priority 8:
Implement Discord commands/stats/leaderboard.

Priority 9:
Implement monthly leaderboard reset + historical monthly results.

Priority 10:
Expand XP to other Mahei-Pathap activities if desired.


DESIRED FINAL ARCHITECTURE
--------------------------

                  MAHEI-PATHAP
                        |
              React/Vite WebApp
                        |
                        v
                    Appwrite
                        |
          +-------------+-------------+
          |             |             |
       Focus         Learning       Tasks/etc.
       Sessions       Videos          Activity
          |             |             |
          +-------------+-------------+
                        |
                    XP System
                        |
                  Monthly Stats
                        |
                        v
                Python Discord Bot
                        |
          +-------------+-------------+
          |             |             |
       /stats       /leaderboard    monthly results
          |             |             |
          +-------------+-------------+
                        |
                 Discord Server


IMPORTANT DEVELOPMENT RULES
----------------------------
1. Preserve the existing app.
2. Preserve Appwrite configuration exactly.
3. Inspect before changing.
4. Do not invent collection IDs.
5. Do not create duplicate collections when existing ones can be reused.
6. Do not expose secrets.
7. Do not include real .env credentials in public repositories.
8. Do not make unrelated UI changes.
9. Build-test after changes.
10. Make changes incrementally and explain what changed.
11. If an Appwrite schema change is required, explain it before making it.
12. XP should be based on trusted/validated activity.
13. Discord should consume trusted statistics rather than being the source of truth for webapp activity.


USER'S IMMEDIATE EXPECTATION
---------------------------
The user wants the existing Mahei-Pathap webapp fixed first.

They specifically want:
- Pomodoro functionality fixed
- watched video count fixed
- suggestion box/admin message display fixed
- mobile logout fixed
- additional unknown bugs checked and fixed

Only after the webapp is stable should the Discord XP/leaderboard integration be implemented.PROJECT: MAHEI-PATHAP WEBAPP + DISCORD INTEGRATION

GOAL
----
Mahei-Pathap is an existing React/Vite web application with Appwrite as its backend/database and a Python Discord bot/server.

The long-term goal is to fully integrate the webapp with the Discord server so that activity performed in the webapp—especially Pomodoro/Focus sessions—automatically contributes to an XP system and Discord leaderboard.

IMPORTANT:
Do NOT rebuild the application from scratch.
Do NOT replace the existing Appwrite configuration.
Do NOT change existing Appwrite project IDs, database IDs, collection IDs, endpoints, permissions, authentication configuration, or environment variables unless explicitly requested.


CURRENT WEBAPP FEATURES
-----------------------
The webapp currently has these main features:

- Dashboard
- Tasks
- Assignments
- Skill Learning
- Goals
- Calendar
- Focus / Pomodoro
- Notes
- Analytics
- Daily Review
- About Me
- Donation
- Suggestions
- Announcements
- Admin Panel

TECH STACK
----------
- React
- Vite
- TypeScript/JavaScript components as already present in the project
- Appwrite backend/database
- Existing authentication
- Existing deployed webapp/Vercel setup
- Python Discord bot for the Discord server


DISCORD BOT
-----------
A Python Discord bot already exists and is working.

Existing Discord functionality includes a Study Lounge / temporary study-room system.

The bot has commands/features being developed such as:
- /limit
- /rename
- study room creation
- temporary voice/study rooms
- automatic Student role assignment when a user joins

The Discord bot should eventually integrate with the Mahei-Pathap webapp rather than operate as an independent system.


MAIN FUTURE INTEGRATION
-----------------------
Desired architecture:

Mahei-Pathap WebApp
        |
        v
     Appwrite
        |
        v
   Trusted activity/statistics
        |
        v
   Python Discord Bot
        |
        +--> Discord user stats
        +--> XP
        +--> leaderboard
        +--> monthly results


POMODORO / XP REQUIREMENT
-------------------------
When a user uses the Pomodoro/Focus feature in the webapp:

Example:
- User selects Focus 25m
- Starts a 25-minute session
- Completes the full 25 minutes

Then:
1. The completed session must be reliably saved to Appwrite.
2. The session must contribute to the user's XP.
3. The user's monthly XP/statistics must update.
4. Discord should eventually read the trusted Appwrite statistics.
5. The user should appear in the Discord leaderboard.
6. At the end of each month, the Discord bot should publish the monthly leaderboard/results.
7. A new monthly leaderboard should then begin while historical results remain available.

Example Discord leaderboard:

🏆 MAHEI PATHAP
September 2026 Results

🥇 User A       1,540 XP
🥈 User B       1,420 XP
🥉 User C       1,275 XP

🍅 Pomodoros: 1,245
⏱️ Focus time: 518 hours

The exact XP rules have NOT been finalized yet.

A proposed initial rule was:
25-minute completed focus = +10 XP

Other possible future XP sources:
- completed task
- completed assignment
- learning session
- completed goal
- daily review
- streak bonuses
- weekly milestones

Do not implement arbitrary XP rules without confirmation if the exact rules matter.


IMPORTANT SECURITY REQUIREMENT
------------------------------
Do NOT trust the frontend to simply say:
"I completed 25 minutes, give me XP."

The system should validate/record completed sessions properly so users cannot easily generate unlimited XP by manipulating frontend state.

Preferred flow:

User completes Pomodoro
        |
        v
Validated Appwrite/backend record
        |
        v
XP/statistics update
        |
        v
Discord bot reads trusted data

Appwrite should be the source of truth for webapp activity/statistics.


DISCORD USER LINKING
--------------------
Eventually, webapp users need to be linked to their Discord accounts.

Conceptually:

Mahei-Pathap user
      <-->
Discord user ID

Use Discord user ID as the stable identifier, not username.

A possible future collection/data structure:

discord_users:
- user_id
- discord_user_id
- discord_username
- linked_at

Do not create duplicate collections if equivalent existing Appwrite structures already exist. Inspect the existing database first.


FOCUS/POMODORO BUG FOUND
------------------------
The Focus/Pomodoro page already exists and visually works.

The page contains:
- Focus 25m
- Short 5m
- Long 15m
- timer
- subject field, e.g. "General Study"
- Start Focus button
- Focus History

A significant bug was identified:

There is an existing saveFocusSession() function intended to save completed focus sessions to Appwrite, but the timer completion flow was not properly calling it.

This means the UI could show a completed session in Focus History temporarily while the session was not actually persisted correctly to Appwrite.

Required behavior:

25:00 -> 00:00
       |
       v
saveFocusSession()
       |
       v
Appwrite Focus collection
       |
       v
persistent Focus History/statistics

Also verify:
- pause/resume
- completion behavior
- refresh persistence
- date handling
- statistics
- streak calculation
- localStorage/Appwrite synchronization
- prevention of easy manipulation


WATCHED VIDEO COUNT BUG
-----------------------
The Skill Learning/video functionality has a watched-video system.

The watched state/count needs fixing.

Required behavior:
- Clicking "Mark watched" increases the count immediately.
- Clicking "Unmark watched" decreases the count.
- Watched state persists after page refresh.
- Appwrite is the source of truth when the user is logged in.
- Dashboard/Analytics/Daily Review/etc. should show a consistent watched-video count.
- Adding new videos must not corrupt the count.
- User A's watched state must never mix with User B's watched state.
- Failed Appwrite saves should not leave the UI permanently showing incorrect state.

Future integration:
Watched learning activity may eventually contribute to XP.


SUGGESTION BOX BUG
------------------
There is a Suggestions feature where users submit suggestions.

The suggestion appears in the Admin Panel, BUT the actual suggestion message/content is not being displayed correctly.

Required behavior:

Admin Panel should show something similar to:

Suggestion
From: username
Date: date

"Please add a dark mode schedule."

[Mark as reviewed] [Delete]

Fix the Admin Panel so the actual submitted suggestion text/message is visible.

Do not break existing suggestion submission/storage.


MOBILE LOGOUT BUG
-----------------
The Logout button is missing from the mobile phone/mobile navigation interface.

Required:
- Add a visible Logout option to the mobile navigation/menu.
- Preserve the existing desktop logout behavior/layout.
- Do not break authentication.


OTHER BUGS
----------
The user explicitly requested:
"also check for other bugs i don't know and start fixing"

Therefore, perform a broader code review and identify obvious bugs/regressions in the existing app.

But:
- Do NOT make unnecessary architectural rewrites.
- Do NOT change Appwrite configuration.
- Do NOT change unrelated working functionality just for style/preferences.
- Prefer small, targeted fixes.
- Preserve existing UI and feature behavior unless a bug requires changing it.


APPWRITE CONFIGURATION — CRITICAL
---------------------------------
There was a previous mistake where a modified ZIP did not preserve the original .env/Appwrite configuration.

The user explicitly complained:
"you have mess up with my previous appwrite configuration"

The correct rule going forward is:

THE EXISTING APPWRITE CONFIGURATION IS LOCKED.

Do not change:
- Appwrite endpoint
- Appwrite project ID
- Appwrite database ID
- existing collection IDs
- authentication configuration
- permissions
- environment variable names/values
- existing Appwrite setup

Unless the user explicitly asks for an Appwrite configuration change.

The original working project should be treated as the source of truth for configuration.


FILES / PROJECT VERSIONS
------------------------
Several ZIPs were uploaded during the conversation.

Relevant project versions:
1. Original/working project:
   BuddySpace(1).zip
   Local path in the conversation runtime:
   /mnt/data/BuddySpace(1).zip

2. A previous modified project:
   Mahei-Pathap-fixed.zip

3. A later restored version:
   Mahei-Pathap-fixed(1).zip
   and generated:
   Mahei-Pathap-fixed-restored.zip

There was also:
   /mnt/data/BuddySpace.zip

The project was identified as Mahei-Pathap despite some ZIP filenames being "BuddySpace".

The user wants the ORIGINAL working Appwrite configuration preserved.


PREVIOUS FIXING PASS
--------------------
A previous assistant claimed to create a fixed ZIP and reported that:
- Pomodoro save was fixed
- watched video persistence was fixed
- suggestion message display was fixed
- mobile logout was fixed
- focus date handling was improved
- duplicate authentication state update was removed
- project build succeeded

However, because of the Appwrite configuration issue, DO NOT blindly trust that previous modified ZIP.

Use the original working project/configuration as the baseline and reapply only verified fixes.


BUILD / TESTING
---------------
The project previously successfully ran:

npm run build

and produced a successful Vite build.

Every modification should ideally be build-tested before being considered complete.

Also test affected functionality where possible.


CURRENT PRIORITY ORDER
----------------------
Priority 1:
Restore/ensure original Appwrite configuration.

Priority 2:
Fix existing webapp bugs:
- Pomodoro persistence/completion
- watched video count
- suggestion message in Admin Panel
- mobile logout

Priority 3:
Scan for additional obvious bugs and fix only safe, relevant ones.

Priority 4:
Test/build the webapp.

Priority 5:
After webapp is stable, implement XP.

Priority 6:
Integrate XP/statistics with Appwrite.

Priority 7:
Connect the Python Discord bot to trusted Appwrite statistics.

Priority 8:
Implement Discord commands/stats/leaderboard.

Priority 9:
Implement monthly leaderboard reset + historical monthly results.

Priority 10:
Expand XP to other Mahei-Pathap activities if desired.


DESIRED FINAL ARCHITECTURE
--------------------------

                  MAHEI-PATHAP
                        |
              React/Vite WebApp
                        |
                        v
                    Appwrite
                        |
          +-------------+-------------+
          |             |             |
       Focus         Learning       Tasks/etc.
       Sessions       Videos          Activity
          |             |             |
          +-------------+-------------+
                        |
                    XP System
                        |
                  Monthly Stats
                        |
                        v
                Python Discord Bot
                        |
          +-------------+-------------+
          |             |             |
       /stats       /leaderboard    monthly results
          |             |             |
          +-------------+-------------+
                        |
                 Discord Server


IMPORTANT DEVELOPMENT RULES
----------------------------
1. Preserve the existing app.
2. Preserve Appwrite configuration exactly.
3. Inspect before changing.
4. Do not invent collection IDs.
5. Do not create duplicate collections when existing ones can be reused.
6. Do not expose secrets.
7. Do not include real .env credentials in public repositories.
8. Do not make unrelated UI changes.
9. Build-test after changes.
10. Make changes incrementally and explain what changed.
11. If an Appwrite schema change is required, explain it before making it.
12. XP should be based on trusted/validated activity.
13. Discord should consume trusted statistics rather than being the source of truth for webapp activity.


USER'S IMMEDIATE EXPECTATION
---------------------------
The user wants the existing Mahei-Pathap webapp fixed first.

They specifically want:
- Pomodoro functionality fixed
- watched video count fixed
- suggestion box/admin message display fixed
- mobile logout fixed
- additional unknown bugs checked and fixed

Only after the webapp is stable should the Discord XP/leaderboard integration be implemented.PROJECT: MAHEI-PATHAP WEBAPP + DISCORD INTEGRATION

GOAL
----
Mahei-Pathap is an existing React/Vite web application with Appwrite as its backend/database and a Python Discord bot/server.

The long-term goal is to fully integrate the webapp with the Discord server so that activity performed in the webapp—especially Pomodoro/Focus sessions—automatically contributes to an XP system and Discord leaderboard.

IMPORTANT:
Do NOT rebuild the application from scratch.
Do NOT replace the existing Appwrite configuration.
Do NOT change existing Appwrite project IDs, database IDs, collection IDs, endpoints, permissions, authentication configuration, or environment variables unless explicitly requested.


CURRENT WEBAPP FEATURES
-----------------------
The webapp currently has these main features:

- Dashboard
- Tasks
- Assignments
- Skill Learning
- Goals
- Calendar
- Focus / Pomodoro
- Notes
- Analytics
- Daily Review
- About Me
- Donation
- Suggestions
- Announcements
- Admin Panel

TECH STACK
----------
- React
- Vite
- TypeScript/JavaScript components as already present in the project
- Appwrite backend/database
- Existing authentication
- Existing deployed webapp/Vercel setup
- Python Discord bot for the Discord server


DISCORD BOT
-----------
A Python Discord bot already exists and is working.

Existing Discord functionality includes a Study Lounge / temporary study-room system.

The bot has commands/features being developed such as:
- /limit
- /rename
- study room creation
- temporary voice/study rooms
- automatic Student role assignment when a user joins

The Discord bot should eventually integrate with the Mahei-Pathap webapp rather than operate as an independent system.


MAIN FUTURE INTEGRATION
-----------------------
Desired architecture:

Mahei-Pathap WebApp
        |
        v
     Appwrite
        |
        v
   Trusted activity/statistics
        |
        v
   Python Discord Bot
        |
        +--> Discord user stats
        +--> XP
        +--> leaderboard
        +--> monthly results


POMODORO / XP REQUIREMENT
-------------------------
When a user uses the Pomodoro/Focus feature in the webapp:

Example:
- User selects Focus 25m
- Starts a 25-minute session
- Completes the full 25 minutes

Then:
1. The completed session must be reliably saved to Appwrite.
2. The session must contribute to the user's XP.
3. The user's monthly XP/statistics must update.
4. Discord should eventually read the trusted Appwrite statistics.
5. The user should appear in the Discord leaderboard.
6. At the end of each month, the Discord bot should publish the monthly leaderboard/results.
7. A new monthly leaderboard should then begin while historical results remain available.

Example Discord leaderboard:

🏆 MAHEI PATHAP
September 2026 Results

🥇 User A       1,540 XP
🥈 User B       1,420 XP
🥉 User C       1,275 XP

🍅 Pomodoros: 1,245
⏱️ Focus time: 518 hours

The exact XP rules have NOT been finalized yet.

A proposed initial rule was:
25-minute completed focus = +10 XP

Other possible future XP sources:
- completed task
- completed assignment
- learning session
- completed goal
- daily review
- streak bonuses
- weekly milestones

Do not implement arbitrary XP rules without confirmation if the exact rules matter.


IMPORTANT SECURITY REQUIREMENT
------------------------------
Do NOT trust the frontend to simply say:
"I completed 25 minutes, give me XP."

The system should validate/record completed sessions properly so users cannot easily generate unlimited XP by manipulating frontend state.

Preferred flow:

User completes Pomodoro
        |
        v
Validated Appwrite/backend record
        |
        v
XP/statistics update
        |
        v
Discord bot reads trusted data

Appwrite should be the source of truth for webapp activity/statistics.


DISCORD USER LINKING
--------------------
Eventually, webapp users need to be linked to their Discord accounts.

Conceptually:

Mahei-Pathap user
      <-->
Discord user ID

Use Discord user ID as the stable identifier, not username.

A possible future collection/data structure:

discord_users:
- user_id
- discord_user_id
- discord_username
- linked_at

Do not create duplicate collections if equivalent existing Appwrite structures already exist. Inspect the existing database first.


FOCUS/POMODORO BUG FOUND
------------------------
The Focus/Pomodoro page already exists and visually works.

The page contains:
- Focus 25m
- Short 5m
- Long 15m
- timer
- subject field, e.g. "General Study"
- Start Focus button
- Focus History

A significant bug was identified:

There is an existing saveFocusSession() function intended to save completed focus sessions to Appwrite, but the timer completion flow was not properly calling it.

This means the UI could show a completed session in Focus History temporarily while the session was not actually persisted correctly to Appwrite.

Required behavior:

25:00 -> 00:00
       |
       v
saveFocusSession()
       |
       v
Appwrite Focus collection
       |
       v
persistent Focus History/statistics

Also verify:
- pause/resume
- completion behavior
- refresh persistence
- date handling
- statistics
- streak calculation
- localStorage/Appwrite synchronization
- prevention of easy manipulation


WATCHED VIDEO COUNT BUG
-----------------------
The Skill Learning/video functionality has a watched-video system.

The watched state/count needs fixing.

Required behavior:
- Clicking "Mark watched" increases the count immediately.
- Clicking "Unmark watched" decreases the count.
- Watched state persists after page refresh.
- Appwrite is the source of truth when the user is logged in.
- Dashboard/Analytics/Daily Review/etc. should show a consistent watched-video count.
- Adding new videos must not corrupt the count.
- User A's watched state must never mix with User B's watched state.
- Failed Appwrite saves should not leave the UI permanently showing incorrect state.

Future integration:
Watched learning activity may eventually contribute to XP.


SUGGESTION BOX BUG
------------------
There is a Suggestions feature where users submit suggestions.

The suggestion appears in the Admin Panel, BUT the actual suggestion message/content is not being displayed correctly.

Required behavior:

Admin Panel should show something similar to:

Suggestion
From: username
Date: date

"Please add a dark mode schedule."

[Mark as reviewed] [Delete]

Fix the Admin Panel so the actual submitted suggestion text/message is visible.

Do not break existing suggestion submission/storage.


MOBILE LOGOUT BUG
-----------------
The Logout button is missing from the mobile phone/mobile navigation interface.

Required:
- Add a visible Logout option to the mobile navigation/menu.
- Preserve the existing desktop logout behavior/layout.
- Do not break authentication.


OTHER BUGS
----------
The user explicitly requested:
"also check for other bugs i don't know and start fixing"

Therefore, perform a broader code review and identify obvious bugs/regressions in the existing app.

But:
- Do NOT make unnecessary architectural rewrites.
- Do NOT change Appwrite configuration.
- Do NOT change unrelated working functionality just for style/preferences.
- Prefer small, targeted fixes.
- Preserve existing UI and feature behavior unless a bug requires changing it.


APPWRITE CONFIGURATION — CRITICAL
---------------------------------
There was a previous mistake where a modified ZIP did not preserve the original .env/Appwrite configuration.

The user explicitly complained:
"you have mess up with my previous appwrite configuration"

The correct rule going forward is:

THE EXISTING APPWRITE CONFIGURATION IS LOCKED.

Do not change:
- Appwrite endpoint
- Appwrite project ID
- Appwrite database ID
- existing collection IDs
- authentication configuration
- permissions
- environment variable names/values
- existing Appwrite setup

Unless the user explicitly asks for an Appwrite configuration change.

The original working project should be treated as the source of truth for configuration.


FILES / PROJECT VERSIONS
------------------------
Several ZIPs were uploaded during the conversation.

Relevant project versions:
1. Original/working project:
   BuddySpace(1).zip
   Local path in the conversation runtime:
   /mnt/data/BuddySpace(1).zip

2. A previous modified project:
   Mahei-Pathap-fixed.zip

3. A later restored version:
   Mahei-Pathap-fixed(1).zip
   and generated:
   Mahei-Pathap-fixed-restored.zip

There was also:
   /mnt/data/BuddySpace.zip

The project was identified as Mahei-Pathap despite some ZIP filenames being "BuddySpace".

The user wants the ORIGINAL working Appwrite configuration preserved.


PREVIOUS FIXING PASS
--------------------
A previous assistant claimed to create a fixed ZIP and reported that:
- Pomodoro save was fixed
- watched video persistence was fixed
- suggestion message display was fixed
- mobile logout was fixed
- focus date handling was improved
- duplicate authentication state update was removed
- project build succeeded

However, because of the Appwrite configuration issue, DO NOT blindly trust that previous modified ZIP.

Use the original working project/configuration as the baseline and reapply only verified fixes.


BUILD / TESTING
---------------
The project previously successfully ran:

npm run build

and produced a successful Vite build.

Every modification should ideally be build-tested before being considered complete.

Also test affected functionality where possible.


CURRENT PRIORITY ORDER
----------------------
Priority 1:
Restore/ensure original Appwrite configuration.

Priority 2:
Fix existing webapp bugs:
- Pomodoro persistence/completion
- watched video count
- suggestion message in Admin Panel
- mobile logout

Priority 3:
Scan for additional obvious bugs and fix only safe, relevant ones.

Priority 4:
Test/build the webapp.

Priority 5:
After webapp is stable, implement XP.

Priority 6:
Integrate XP/statistics with Appwrite.

Priority 7:
Connect the Python Discord bot to trusted Appwrite statistics.

Priority 8:
Implement Discord commands/stats/leaderboard.

Priority 9:
Implement monthly leaderboard reset + historical monthly results.

Priority 10:
Expand XP to other Mahei-Pathap activities if desired.


DESIRED FINAL ARCHITECTURE
--------------------------

                  MAHEI-PATHAP
                        |
              React/Vite WebApp
                        |
                        v
                    Appwrite
                        |
          +-------------+-------------+
          |             |             |
       Focus         Learning       Tasks/etc.
       Sessions       Videos          Activity
          |             |             |
          +-------------+-------------+
                        |
                    XP System
                        |
                  Monthly Stats
                        |
                        v
                Python Discord Bot
                        |
          +-------------+-------------+
          |             |             |
       /stats       /leaderboard    monthly results
          |             |             |
          +-------------+-------------+
                        |
                 Discord Server


IMPORTANT DEVELOPMENT RULES
----------------------------
1. Preserve the existing app.
2. Preserve Appwrite configuration exactly.
3. Inspect before changing.
4. Do not invent collection IDs.
5. Do not create duplicate collections when existing ones can be reused.
6. Do not expose secrets.
7. Do not include real .env credentials in public repositories.
8. Do not make unrelated UI changes.
9. Build-test after changes.
10. Make changes incrementally and explain what changed.
11. If an Appwrite schema change is required, explain it before making it.
12. XP should be based on trusted/validated activity.
13. Discord should consume trusted statistics rather than being the source of truth for webapp activity.


USER'S IMMEDIATE EXPECTATION
---------------------------
The user wants the existing Mahei-Pathap webapp fixed first.

They specifically want:
- Pomodoro functionality fixed
- watched video count fixed
- suggestion box/admin message display fixed
- mobile logout fixed
- additional unknown bugs checked and fixed

Only after the webapp is stable should the Discord XP/leaderboard integration be implemented.PROJECT: MAHEI-PATHAP WEBAPP + DISCORD INTEGRATION

GOAL
----
Mahei-Pathap is an existing React/Vite web application with Appwrite as its backend/database and a Python Discord bot/server.

The long-term goal is to fully integrate the webapp with the Discord server so that activity performed in the webapp—especially Pomodoro/Focus sessions—automatically contributes to an XP system and Discord leaderboard.

IMPORTANT:
Do NOT rebuild the application from scratch.
Do NOT replace the existing Appwrite configuration.
Do NOT change existing Appwrite project IDs, database IDs, collection IDs, endpoints, permissions, authentication configuration, or environment variables unless explicitly requested.


CURRENT WEBAPP FEATURES
-----------------------
The webapp currently has these main features:

- Dashboard
- Tasks
- Assignments
- Skill Learning
- Goals
- Calendar
- Focus / Pomodoro
- Notes
- Analytics
- Daily Review
- About Me
- Donation
- Suggestions
- Announcements
- Admin Panel

TECH STACK
----------
- React
- Vite
- TypeScript/JavaScript components as already present in the project
- Appwrite backend/database
- Existing authentication
- Existing deployed webapp/Vercel setup
- Python Discord bot for the Discord server


DISCORD BOT
-----------
A Python Discord bot already exists and is working.

Existing Discord functionality includes a Study Lounge / temporary study-room system.

The bot has commands/features being developed such as:
- /limit
- /rename
- study room creation
- temporary voice/study rooms
- automatic Student role assignment when a user joins

The Discord bot should eventually integrate with the Mahei-Pathap webapp rather than operate as an independent system.


MAIN FUTURE INTEGRATION
-----------------------
Desired architecture:

Mahei-Pathap WebApp
        |
        v
     Appwrite
        |
        v
   Trusted activity/statistics
        |
        v
   Python Discord Bot
        |
        +--> Discord user stats
        +--> XP
        +--> leaderboard
        +--> monthly results


POMODORO / XP REQUIREMENT
-------------------------
When a user uses the Pomodoro/Focus feature in the webapp:

Example:
- User selects Focus 25m
- Starts a 25-minute session
- Completes the full 25 minutes

Then:
1. The completed session must be reliably saved to Appwrite.
2. The session must contribute to the user's XP.
3. The user's monthly XP/statistics must update.
4. Discord should eventually read the trusted Appwrite statistics.
5. The user should appear in the Discord leaderboard.
6. At the end of each month, the Discord bot should publish the monthly leaderboard/results.
7. A new monthly leaderboard should then begin while historical results remain available.

Example Discord leaderboard:

🏆 MAHEI PATHAP
September 2026 Results

🥇 User A       1,540 XP
🥈 User B       1,420 XP
🥉 User C       1,275 XP

🍅 Pomodoros: 1,245
⏱️ Focus time: 518 hours

The exact XP rules have NOT been finalized yet.

A proposed initial rule was:
25-minute completed focus = +10 XP

Other possible future XP sources:
- completed task
- completed assignment
- learning session
- completed goal
- daily review
- streak bonuses
- weekly milestones

Do not implement arbitrary XP rules without confirmation if the exact rules matter.


IMPORTANT SECURITY REQUIREMENT
------------------------------
Do NOT trust the frontend to simply say:
"I completed 25 minutes, give me XP."

The system should validate/record completed sessions properly so users cannot easily generate unlimited XP by manipulating frontend state.

Preferred flow:

User completes Pomodoro
        |
        v
Validated Appwrite/backend record
        |
        v
XP/statistics update
        |
        v
Discord bot reads trusted data

Appwrite should be the source of truth for webapp activity/statistics.


DISCORD USER LINKING
--------------------
Eventually, webapp users need to be linked to their Discord accounts.

Conceptually:

Mahei-Pathap user
      <-->
Discord user ID

Use Discord user ID as the stable identifier, not username.

A possible future collection/data structure:

discord_users:
- user_id
- discord_user_id
- discord_username
- linked_at

Do not create duplicate collections if equivalent existing Appwrite structures already exist. Inspect the existing database first.


FOCUS/POMODORO BUG FOUND
------------------------
The Focus/Pomodoro page already exists and visually works.

The page contains:
- Focus 25m
- Short 5m
- Long 15m
- timer
- subject field, e.g. "General Study"
- Start Focus button
- Focus History

A significant bug was identified:

There is an existing saveFocusSession() function intended to save completed focus sessions to Appwrite, but the timer completion flow was not properly calling it.

This means the UI could show a completed session in Focus History temporarily while the session was not actually persisted correctly to Appwrite.

Required behavior:

25:00 -> 00:00
       |
       v
saveFocusSession()
       |
       v
Appwrite Focus collection
       |
       v
persistent Focus History/statistics

Also verify:
- pause/resume
- completion behavior
- refresh persistence
- date handling
- statistics
- streak calculation
- localStorage/Appwrite synchronization
- prevention of easy manipulation


WATCHED VIDEO COUNT BUG
-----------------------
The Skill Learning/video functionality has a watched-video system.

The watched state/count needs fixing.

Required behavior:
- Clicking "Mark watched" increases the count immediately.
- Clicking "Unmark watched" decreases the count.
- Watched state persists after page refresh.
- Appwrite is the source of truth when the user is logged in.
- Dashboard/Analytics/Daily Review/etc. should show a consistent watched-video count.
- Adding new videos must not corrupt the count.
- User A's watched state must never mix with User B's watched state.
- Failed Appwrite saves should not leave the UI permanently showing incorrect state.

Future integration:
Watched learning activity may eventually contribute to XP.


SUGGESTION BOX BUG
------------------
There is a Suggestions feature where users submit suggestions.

The suggestion appears in the Admin Panel, BUT the actual suggestion message/content is not being displayed correctly.

Required behavior:

Admin Panel should show something similar to:

Suggestion
From: username
Date: date

"Please add a dark mode schedule."

[Mark as reviewed] [Delete]

Fix the Admin Panel so the actual submitted suggestion text/message is visible.

Do not break existing suggestion submission/storage.


MOBILE LOGOUT BUG
-----------------
The Logout button is missing from the mobile phone/mobile navigation interface.

Required:
- Add a visible Logout option to the mobile navigation/menu.
- Preserve the existing desktop logout behavior/layout.
- Do not break authentication.


OTHER BUGS
----------
The user explicitly requested:
"also check for other bugs i don't know and start fixing"

Therefore, perform a broader code review and identify obvious bugs/regressions in the existing app.

But:
- Do NOT make unnecessary architectural rewrites.
- Do NOT change Appwrite configuration.
- Do NOT change unrelated working functionality just for style/preferences.
- Prefer small, targeted fixes.
- Preserve existing UI and feature behavior unless a bug requires changing it.


APPWRITE CONFIGURATION — CRITICAL
---------------------------------
There was a previous mistake where a modified ZIP did not preserve the original .env/Appwrite configuration.

The user explicitly complained:
"you have mess up with my previous appwrite configuration"

The correct rule going forward is:

THE EXISTING APPWRITE CONFIGURATION IS LOCKED.

Do not change:
- Appwrite endpoint
- Appwrite project ID
- Appwrite database ID
- existing collection IDs
- authentication configuration
- permissions
- environment variable names/values
- existing Appwrite setup

Unless the user explicitly asks for an Appwrite configuration change.

The original working project should be treated as the source of truth for configuration.


FILES / PROJECT VERSIONS
------------------------
Several ZIPs were uploaded during the conversation.

Relevant project versions:
1. Original/working project:
   BuddySpace(1).zip
   Local path in the conversation runtime:
   /mnt/data/BuddySpace(1).zip

2. A previous modified project:
   Mahei-Pathap-fixed.zip

3. A later restored version:
   Mahei-Pathap-fixed(1).zip
   and generated:
   Mahei-Pathap-fixed-restored.zip

There was also:
   /mnt/data/BuddySpace.zip

The project was identified as Mahei-Pathap despite some ZIP filenames being "BuddySpace".

The user wants the ORIGINAL working Appwrite configuration preserved.


PREVIOUS FIXING PASS
--------------------
A previous assistant claimed to create a fixed ZIP and reported that:
- Pomodoro save was fixed
- watched video persistence was fixed
- suggestion message display was fixed
- mobile logout was fixed
- focus date handling was improved
- duplicate authentication state update was removed
- project build succeeded

However, because of the Appwrite configuration issue, DO NOT blindly trust that previous modified ZIP.

Use the original working project/configuration as the baseline and reapply only verified fixes.


BUILD / TESTING
---------------
The project previously successfully ran:

npm run build

and produced a successful Vite build.

Every modification should ideally be build-tested before being considered complete.

Also test affected functionality where possible.


CURRENT PRIORITY ORDER
----------------------
Priority 1:
Restore/ensure original Appwrite configuration.

Priority 2:
Fix existing webapp bugs:
- Pomodoro persistence/completion
- watched video count
- suggestion message in Admin Panel
- mobile logout

Priority 3:
Scan for additional obvious bugs and fix only safe, relevant ones.

Priority 4:
Test/build the webapp.

Priority 5:
After webapp is stable, implement XP.

Priority 6:
Integrate XP/statistics with Appwrite.

Priority 7:
Connect the Python Discord bot to trusted Appwrite statistics.

Priority 8:
Implement Discord commands/stats/leaderboard.

Priority 9:
Implement monthly leaderboard reset + historical monthly results.

Priority 10:
Expand XP to other Mahei-Pathap activities if desired.


DESIRED FINAL ARCHITECTURE
--------------------------

                  MAHEI-PATHAP
                        |
              React/Vite WebApp
                        |
                        v
                    Appwrite
                        |
          +-------------+-------------+
          |             |             |
       Focus         Learning       Tasks/etc.
       Sessions       Videos          Activity
          |             |             |
          +-------------+-------------+
                        |
                    XP System
                        |
                  Monthly Stats
                        |
                        v
                Python Discord Bot
                        |
          +-------------+-------------+
          |             |             |
       /stats       /leaderboard    monthly results
          |             |             |
          +-------------+-------------+
                        |
                 Discord Server


IMPORTANT DEVELOPMENT RULES
----------------------------
1. Preserve the existing app.
2. Preserve Appwrite configuration exactly.
3. Inspect before changing.
4. Do not invent collection IDs.
5. Do not create duplicate collections when existing ones can be reused.
6. Do not expose secrets.
7. Do not include real .env credentials in public repositories.
8. Do not make unrelated UI changes.
9. Build-test after changes.
10. Make changes incrementally and explain what changed.
11. If an Appwrite schema change is required, explain it before making it.
12. XP should be based on trusted/validated activity.
13. Discord should consume trusted statistics rather than being the source of truth for webapp activity.


USER'S IMMEDIATE EXPECTATION
---------------------------
The user wants the existing Mahei-Pathap webapp fixed first.

They specifically want:
- Pomodoro functionality fixed
- watched video count fixed
- suggestion box/admin message display fixed
- mobile logout fixed
- additional unknown bugs checked and fixed

Only after the webapp is stable should the Discord XP/leaderboard integration be implemented.
