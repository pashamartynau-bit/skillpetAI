# 🐾 SkillPet AI

SkillPet AI is a premium, gamified educational learning platform built with **Next.js 16**, **React 19**, **InsForge**, **Strapi Headless CMS**, and **Stripe**. 

It transforms online education by introducing virtual pets ("SkillPets") that accompany learners throughout their journey. By completing chapters, passing quizzes, and maintaining daily learning streaks, users earn gems and hearts, leveling up their chosen pet companions.

---

## ✨ Features

- **Gamified Learning Hub**: Interactive theory blocks, multiple-choice quizzes, fill-in-the-blanks, true/false questions, matching activities, and coding exercise sandboxes.
- **SkillPet Companion**: Pick and customize a companion character (from `/public/characters`) that grows as you complete courses.
- **Daily Streak Calendar**: Interactive streak system to encourage daily learning habits.
- **Stripe Subscriptions**: Seamlessly unlock premium courses with Monthly or Yearly payment plans.
- **Secure Authentication**: Power-packed auth flow via InsForge with automatic user profile synchronization to Strapi.
- **Responsive Premium Dashboard**: Beautifully designed dashboard shell with dark mode, interactive charts, and animations.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), [Base UI](https://base-ui.com/), and [Shadcn UI](https://ui.shadcn.com/)
- **BaaS (Backend & Auth)**: [@insforge/sdk](https://www.insforge.com/) (Auth, PostgreSQL DB)
- **CMS**: [Strapi Headless CMS](https://strapi.io/)
- **Payments**: [Stripe API & CLI](https://stripe.com/)

---

## 🚀 Getting Started

Follow these steps to run SkillPet AI on your local machine.

### 1. Clone & Install Dependencies

```bash
# Clone the repository
cd skillpet-ai

# Install package dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory by duplicating the example file:

```bash
cp .env.example .env
```

Populate the `.env` file with your credentials:

```ini
# Next.js Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# InsForge Keys (Authentication & PostgreSQL)
NEXT_PUBLIC_INSFORGE_BASE_URL=https://your-app.insforge.app/
NEXT_PUBLIC_INSFORGE_ANON_KEY=ik_your_anon_key_here

# Strapi CMS Settings
STRAPI_BASE_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_api_token
STRAPI_USERS_COLLECTION=app-users
STRAPI_USER_COURSE_PROGRESS_COLLECTION=user-course-progresses

# Stripe Billing Settings
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
```

> [!TIP]
> For detailed instructions on how to generate the API keys, tokens, and configure webhook forwarding for each service, read the [Detailed Project Setup Guide](file:///Users/rahulsanap/Documents/Projects/Nextjs%202026/skillpet-ai/docs/setup.md).

### 3. Start Local Services & Webhooks

To test checkout payments and subscription sync, launch the Stripe CLI webhook listener:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

### 4. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📂 Project Structure

```
├── app/                      # Next.js app router pages & API endpoints
│   ├── api/                  # API routes (sync, profile, learning-progress, stripe)
│   ├── dashboard/            # Dashboard pages
│   ├── courses/              # Course navigation and chapter learning
│   └── layout.tsx            # Global layout and context providers
├── components/               # Reusable UI component libraries
│   ├── ui/                   # Shadcn components (Button, Input, Card, etc.)
│   └── auth-screen.tsx       # Gamified sign-in/sign-up screen
├── docs/                     # Extended documentation
│   ├── setup.md              # Environment & API setup guide
│   └── strapi-collections.md # Strapi Database schema collections
├── hooks/                    # Custom React hooks
├── lib/                      # Helper libraries, API utilities, and configs
└── public/                   # Static assets (character sprites, icons, illustrations)
```

---

## 📖 Documentation Links

- 🛠️ [Detailed Project Setup Guide](file:///Users/rahulsanap/Documents/Projects/Nextjs%202026/skillpet-ai/docs/setup.md)
- 🗄️ [Strapi Collections Schema Definition](file:///Users/rahulsanap/Documents/Projects/Nextjs%202026/skillpet-ai/docs/strapi-collections.md)
