# Sanity content model

Omni AI stores courses, learner profiles, and course progress in the Sanity project **Learn AI** (`njws1rbr`), dataset `production`.

The server reads and writes with `SANITY_API_TOKEN`. That token stays on the server. Do not prefix it with `NEXT_PUBLIC_`.

## Learner: `appUser`

One document per signed-in learner. The app creates it during auth sync.

| Field | Type | Notes |
| --- | --- | --- |
| `insforgeUserId` | string | Required. Unique external id from InsForge. |
| `email` | string | Required. |
| `displayName` | string | Optional. |
| `avatarUrl` | string | Optional. |
| `emailVerified` | boolean | Required. |
| `lastAuthenticatedAt` | datetime | Updated on each successful sign-in. |
| `characterFileName` | string | Selected companion file in `public/characters`. |
| `characterName` | string | Companion display name. |
| `emailRemindersEnabled` | boolean | Default `true`. |
| `showOnLeaderboard` | boolean | Default `true`. |
| `gems` | number | Default `0`. |
| `hearts` | number | Default `3`. |
| `dailyStreakCount` | number | Default `0`. |
| `lastDailyStreakAwardedOn` | date | Nullable. |
| `stripeBillingPlan` | string | `monthly` or `yearly`. |
| `stripeCustomerId` | string | Stripe customer id. |
| `stripeSubscriptionId` | string | Stripe subscription id. |
| `stripeSubscriptionStatus` | string | Stripe subscription status. |
| `stripeSubscriptionCurrentPeriodEnd` | datetime | Current period end. |
| `stripeSubscriptionStartDate` | datetime | Subscription start. |
| `stripeCheckoutSessionId` | string | Latest checkout session. |
| `stripeLatestPaymentStatus` | string | Latest payment status. |

## Progress: `userCourseProgress`

One document per learner and course.

| Field | Type | Notes |
| --- | --- | --- |
| `insforgeUserId` | string | Required. |
| `courseId` | string | Sanity `_id` of the `course` document. |
| `currentChapterId` | string | Chapter `_key` inside that course. |
| `isEnrolled` | boolean | Default `true`. |
| `isCompleted` | boolean | Default `false`. |
| `progressPercent` | number | `0` through `100`. |
| `enrolledAt` | datetime | Required. |
| `lastActivityAt` | datetime | Nullable. |
| `activityTimestamps` | string array | Day-level activity timestamps. |
| `chapterProgressMap` | object | Progress keyed by chapter `_key`. |

## Course: `course`

Published courses are documents with `isPublishedInApp` set to `true`. Drafts are ignored.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. |
| `slug` | string | Required. Used in `/courses/[slug]`. |
| `shortDescription` | text | Course card copy. |
| `difficultyLevel` | string | For example `Beginner`. |
| `estimatedMinutes` | number | Optional. |
| `isFeatured` | boolean | Optional. |
| `isPublishedInApp` | boolean | Must be `true` to appear in the app. |
| `sortOrder` | number | Lower numbers appear first. |
| `accessType` | string | `free`, `freemium`, or `paid`. |
| `banner` | object | `url`, `alternativeText`, `width`, `height`. |
| `chapters` | array | Chapter objects below. |

Each chapter needs a `_key` plus `name`, `slug`, `description`, `chapterNumber`, `sortOrder`, and `emoji`.

`contentBlocks` is an array. Each block needs `_key` and `blockType`:

- `learning.theory-block` with `title` and `bodyMarkdown`
- `learning.multiple-choice-block` with `title`, `question`, `choices`, `correctFeedback`, and `incorrectFeedback`
- `learning.fill-in-the-blank-block` with `title`, `prompt`, `options`, and feedback fields
- `learning.true-false-block` with `title`, `statement`, `correctAnswer`, and feedback fields
- `learning.yes-no-block` with `title`, `question`, `correctAnswer`, and feedback fields
- `learning.matching-block` with `title`, `question`, `pairs`, and feedback fields
- `learning.code-exercise-block` with `title`, `taskPrompt`, `codeLanguage`, `codeSnippet`, `expectedAnswer`, and feedback fields

Choice objects use `id`, `label`, and `isCorrect`. Matching pairs use `id`, `left`, and `right`.
