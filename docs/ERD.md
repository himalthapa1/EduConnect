# EduConnect - Entity Relationship Diagram (ERD)

## Database Schema Overview

This document describes the database schema for the EduConnect study group platform.

---

## Entities and Relationships

### 1. USER
**Primary Entity** - Represents registered users of the platform

**Attributes:**
- `_id` (ObjectId, PK) - Unique identifier
- `username` (String, Unique) - User's display name
- `email` (String, Unique) - User's email address
- `password` (String, Hashed) - Encrypted password
- `dateOfBirth` (Date) - User's birth date
- `collegeName` (String) - Educational institution
- `currentYear` (Enum) - Academic year (1st-4th, Other)
- `preferences` (Object)
  - `interests` (Array[String]) - Study interests
  - `skillsLevel` (Map) - Skill proficiency levels
  - `studyTimePreference` (Array[Enum]) - Preferred study times
- `onboarding.completed` (Boolean) - Onboarding status
- `joinedGroups` (Array[ObjectId]) - References to StudyGroup
- `attendedSessions` (Array[ObjectId]) - References to Session
- `activityScore` (Number) - User engagement metric
- `createdAt` (Date) - Account creation timestamp
- `updatedAt` (Date) - Last update timestamp

**Relationships:**
- Creates many StudyGroups (1:N)
- Joins many StudyGroups (M:N)
- Organizes many Sessions (1:N)
- Participates in many Sessions (M:N)
- Sends many GroupMessages (1:N)
- Creates many StudyWithMeSessions (1:N)
- Rates many StudyGroups (M:N)

---

### 2. STUDY_GROUP
**Core Entity** - Represents study groups

**Attributes:**
- `_id` (ObjectId, PK) - Unique identifier
- `name` (String) - Group name
- `description` (String) - Group description
- `subject` (String) - Main subject area
- `tags` (Object) - Semantic tags for recommendations
  - `topics` (Array[String]) - Topic tags (max 3)
  - `level` (Enum) - Skill level (beginner/intermediate/advanced)
  - `styles` (Array[Enum]) - Study styles
  - `commitment` (Array[Enum]) - Time commitment types
- `subjectTags` (Array[String]) - Legacy tags
- `difficulty` (Enum) - Difficulty level
- `creator` (ObjectId, FK) - References User
- `members` (Array[ObjectId]) - References User
- `maxMembers` (Number) - Maximum capacity
- `isPublic` (Boolean) - Visibility status
- `activityScore` (Number) - Group activity metric
- `ratings` (Array[Object]) - User ratings
  - `user` (ObjectId) - References User
  - `rating` (Number) - Rating value (1-5)
  - `ratedAt` (Date) - Rating timestamp
- `averageRating` (Number) - Calculated average
- `popularityScore` (Number) - Popularity metric
- `resources` (Array[Object]) - Embedded resources
  - `title` (String) - Resource title
  - `url` (String) - Resource URL
  - `description` (String) - Resource description
  - `type` (Enum) - resource/note
  - `creator` (ObjectId) - References User
  - `isPublic` (Boolean) - Visibility
  - `createdAt` (Date) - Creation timestamp
- `createdAt` (Date) - Group creation timestamp
- `updatedAt` (Date) - Last update timestamp

**Relationships:**
- Created by one User (N:1)
- Has many Users as members (M:N)
- Has many Sessions (1:N)
- Has many GroupMessages (1:N)
- Rated by many Users (M:N)

---

### 3. SESSION
**Event Entity** - Represents study sessions

**Attributes:**
- `_id` (ObjectId, PK) - Unique identifier
- `title` (String) - Session title
- `description` (String) - Session description
- `subject` (String) - Session subject
- `date` (Date) - Session date
- `startTime` (String) - Start time (HH:mm format)
- `endTime` (String) - End time (HH:mm format)
- `location` (String) - Session location
- `maxParticipants` (Number) - Maximum attendees
- `organizer` (ObjectId, FK) - References User
- `group` (ObjectId, FK, Optional) - References StudyGroup
- `participants` (Array[Object]) - Participant list
  - `user` (ObjectId) - References User
  - `joinedAt` (Date) - Join timestamp
- `status` (Enum) - scheduled/ongoing/completed/cancelled
- `notes` (String) - Session notes
- `resources` (Array[Object]) - Session resources
  - `title` (String) - Resource title
  - `url` (String) - Resource URL
  - `description` (String) - Resource description
  - `type` (Enum) - resource/note
  - `creator` (ObjectId) - References User
  - `createdAt` (Date) - Creation timestamp
- `completedAt` (Date) - Completion timestamp
- `isPublic` (Boolean) - Visibility status
- `createdAt` (Date) - Session creation timestamp
- `updatedAt` (Date) - Last update timestamp

**Relationships:**
- Organized by one User (N:1)
- Belongs to one StudyGroup (optional) (N:1)
- Has many Users as participants (M:N)

---

### 4. GROUP_MESSAGE
**Communication Entity** - Represents messages in study groups

**Attributes:**
- `_id` (ObjectId, PK) - Unique identifier
- `groupId` (ObjectId, FK) - References StudyGroup
- `senderId` (ObjectId, FK) - References User
- `content` (String) - Message content
- `type` (Enum) - text/voice/poll
- `audioUrl` (String, Optional) - Voice message URL
- `pollData` (Object, Optional) - Poll information
  - `question` (String) - Poll question
  - `options` (Array[Object]) - Poll options
    - `text` (String) - Option text
    - `votes` (Array[ObjectId]) - References User
- `createdAt` (Date) - Message timestamp
- `updatedAt` (Date) - Last update timestamp

**Relationships:**
- Belongs to one StudyGroup (N:1)
- Sent by one User (N:1)
- Poll voted by many Users (M:N)

---

### 5. STUDY_WITH_ME_SESSION
**Personal Study Entity** - Represents individual study sessions

**Attributes:**
- `_id` (ObjectId, PK) - Unique identifier
- `userId` (ObjectId, FK) - References User
- `subject` (String) - Study subject
- `studyMinutes` (Number) - Planned study duration
- `breakMinutes` (Number) - Planned break duration
- `actualDuration` (Number) - Actual duration in minutes
- `startTime` (Date) - Session start time
- `endTime` (Date) - Session end time
- `notes` (String) - Study notes
- `resources` (Array[Object]) - Study resources
  - `title` (String) - Resource title
  - `resourceType` (Enum) - Resource type
  - `url` (String) - Resource URL
  - `file` (String) - File path
- `status` (Enum) - active/completed/paused
- `createdAt` (Date) - Session creation timestamp
- `updatedAt` (Date) - Last update timestamp

**Relationships:**
- Belongs to one User (N:1)

---

## Relationship Summary

### One-to-Many (1:N)
1. **User → StudyGroup** (creator)
   - One user can create many study groups
   - Each study group has one creator

2. **User → Session** (organizer)
   - One user can organize many sessions
   - Each session has one organizer

3. **StudyGroup → Session**
   - One study group can have many sessions
   - Each session belongs to one study group (optional)

4. **StudyGroup → GroupMessage**
   - One study group can have many messages
   - Each message belongs to one study group

5. **User → GroupMessage** (sender)
   - One user can send many messages
   - Each message has one sender

6. **User → StudyWithMeSession**
   - One user can have many personal study sessions
   - Each study session belongs to one user

### Many-to-Many (M:N)
1. **User ↔ StudyGroup** (members)
   - Users can join multiple study groups
   - Study groups can have multiple members
   - Stored in: User.joinedGroups[] and StudyGroup.members[]

2. **User ↔ Session** (participants)
   - Users can participate in multiple sessions
   - Sessions can have multiple participants
   - Stored in: User.attendedSessions[] and Session.participants[]

3. **User ↔ StudyGroup** (ratings)
   - Users can rate multiple study groups
   - Study groups can be rated by multiple users
   - Stored in: StudyGroup.ratings[]

4. **User ↔ GroupMessage** (poll votes)
   - Users can vote in multiple polls
   - Polls can have votes from multiple users
   - Stored in: GroupMessage.pollData.options[].votes[]

---

## Indexes

### User
- `email` (unique)
- `username` (unique)

### StudyGroup
- `creator`
- `members`
- `isPublic`

### Session
- `date, startTime` (compound)
- `organizer`
- `participants.user`

### GroupMessage
- `groupId, createdAt` (compound, descending)

### StudyWithMeSession
- `userId, createdAt` (compound, descending)
- `status, userId` (compound)

---

## Cardinality Notation

```
1:1   = One-to-One
1:N   = One-to-Many
M:N   = Many-to-Many
FK    = Foreign Key
PK    = Primary Key
```

---

## Data Flow for Recommendations

The recommendation system uses the following data:

1. **User Profile Data:**
   - `preferences.interests[]` - For content-based filtering
   - `joinedGroups[]` - To exclude already joined groups
   - `activityScore` - To determine cold start vs active user

2. **StudyGroup Data:**
   - `subjectTags[]` - For content matching
   - `members[]` - For collaborative filtering
   - `activityScore` - For popularity scoring
   - `averageRating` - For quality assessment

3. **Cross-Reference:**
   - User interests ↔ Group tags (TF-IDF + Cosine Similarity)
   - User ↔ Similar users in groups (Jaccard Similarity)
   - Group metrics → Popularity score

---

## Embedded vs Referenced Documents

### Embedded (Subdocuments)
- `User.preferences` - Tightly coupled user settings
- `User.onboarding` - User onboarding state
- `StudyGroup.tags` - Group categorization
- `StudyGroup.resources[]` - Group resources
- `StudyGroup.ratings[]` - Group ratings
- `Session.participants[]` - Session attendees
- `Session.resources[]` - Session resources
- `GroupMessage.pollData` - Poll information
- `StudyWithMeSession.resources[]` - Study resources

### Referenced (Foreign Keys)
- `StudyGroup.creator` → User
- `StudyGroup.members[]` → User
- `Session.organizer` → User
- `Session.group` → StudyGroup
- `GroupMessage.groupId` → StudyGroup
- `GroupMessage.senderId` → User
- `StudyWithMeSession.userId` → User

---

## Schema Design Decisions

1. **Embedded Resources:** Resources are embedded in StudyGroup and Session for faster access and atomic updates

2. **Referenced Members:** Members are referenced (not embedded) to avoid document size limits and enable efficient queries

3. **Denormalized Activity Scores:** Activity scores are stored directly for fast recommendation queries

4. **Hybrid Approach:** Mix of embedding and referencing based on access patterns and data size

5. **Timestamps:** All entities have createdAt/updatedAt for audit trails

---

Generated: 2024
Project: EduConnect Study Group Platform
