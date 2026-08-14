# Strapi Collections For Authentication Sync

## Collection Type: App User

- Display name: `App User`
- Singular API ID: `app-user`
- Plural API ID: `app-users`
- Draft & Publish: optional, but disabling it keeps sync simpler

| Field name | Field type | Notes |
| --- | --- | --- |
| `insforgeUserId` | Text | Required. Mark as unique. Primary external ID from InsForge. |
| `email` | Email | Required. Mark as unique. |
| `displayName` | Text | Nullable. Stores `profile.name`. |
| `avatarUrl` | Text | Nullable. Stores `profile.avatar_url`. |
| `emailVerified` | Boolean | Required. |
| `lastAuthenticatedAt` | DateTime | Required. Updated on each successful authentication. |
| `characterFileName` | Text | Nullable. Stores the selected character asset file name from `public/characters`. |
| `characterName` | Text | Nullable. Stores the selected character display name. |
| `emailRemindersEnabled` | Boolean | Required. Default `true`. Controls reminder email preference from the profile page. |
| `showOnLeaderboard` | Boolean | Required. Default `true`. Controls whether the learner is visible to others on the achievements leaderboard. |
| `gems` | Integer | Required for the learning wallet. Default `0`. |
| `hearts` | Integer | Required for the learning wallet. Default `3`. |
| `dailyStreakCount` | Integer | Required for the learning wallet. Default `0`. |
| `lastDailyStreakAwardedOn` | Date | Nullable. Stores the last day a streak increment was granted. |

## API Access Needed

- Create a Strapi API token with access to the `app-users` collection.
- Minimum permissions for this feature: `find`, `findOne`, `create`, `update`.
- The Next.js app sends all Strapi requests through `app/api/auth/sync/route.ts`.

## Sync Behavior

1. The client authenticates through InsForge.
2. After successful authentication, Next.js posts the normalized user payload to `/api/auth/sync`.
3. The route handler reads Strapi for an existing `app-users` document by `insforgeUserId`.
4. If none exists, it falls back to matching by `email`.
5. The route handler updates the existing document or creates a new one through the Strapi REST API.

## Collection Type: User Course Progress

- Display name: `User Course Progress`
- Singular API ID: `user-course-progress`
- Plural API ID: `user-course-progresses`
- Draft & Publish: disable it

| Field name | Field type | Notes |
| --- | --- | --- |
| `insforgeUserId` | Text | Required. Lookup key for the authenticated user. |
| `course` | Relation | Required. `manyToOne` to `course`. |
| `currentChapter` | Relation | Nullable. `manyToOne` to `chapter`. |
| `isEnrolled` | Boolean | Default `true`. |
| `isCompleted` | Boolean | Default `false`. |
| `progressPercent` | Integer | Default `0`. Range `0..100`. |
| `enrolledAt` | DateTime | Required by the app for enrollment timing. |
| `lastActivityAt` | DateTime | Nullable. Updated as the learner progresses. |
| `activityTimestamps` | JSON | Array of day-level activity timestamps used for streaks. |
| `chapterProgressMap` | JSON | Per-course chapter progress keyed by chapter `documentId`. |

### Chapter Progress JSON Shape

```json
{
  "chapter-document-id": {
    "activeContentIndex": 2,
    "completedAt": null,
    "earnedGemItemKeys": ["multiple-choice-block-id"],
    "incorrectAttemptItemKeys": [],
    "updatedAt": "2026-07-10T14:45:02.456Z"
  }
}
```

## API Access Needed For Learning Progress

- The Strapi API token also needs `find`, `findOne`, `create`, and `update` access to both `app-users` and `user-course-progresses`.
- The Next.js app reads and writes these collections through `app/api/learning-progress/route.ts`.
