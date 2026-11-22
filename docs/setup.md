# Project Setup Guide

This guide provides step-by-step instructions for configuring and running the **Omni AI** project locally and in production.

Omni AI integrates three primary services:
1. **InsForge**: Handles backend database, custom serverless functions, and user authentication.
2. **Sanity**: Manages courses, chapters, content blocks, learner profiles, and progress.
3. **Stripe**: Manages subscription billing (monthly/yearly plans) and payments.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js**: `v20.x` or later
- **npm** or **Yarn** or **pnpm**
- **Stripe CLI**: For local webhook forwarding ([Stripe CLI Installation Guide](https://docs.stripe.com/stripe-cli))

---

## 1. Environment Configuration

Copy the `.env.example` template to create your local `.env` file:

```bash
cp .env.example .env
```

Open the newly created `.env` file and populate it using the instructions below.

---

## 2. Setting Up Services & Generating Keys

### A. InsForge Configuration

InsForge acts as the core backend for authenticating users and making database/API queries.

1. **`NEXT_PUBLIC_INSFORGE_BASE_URL`**: 
   - This is the base URL of your InsForge project instance.
   - Example: `https://your-app.insforge.app/`
2. **`NEXT_PUBLIC_INSFORGE_ANON_KEY`**: 
   - This is an anonymous client-side JWT token generated for public/client access.
   - **How to generate**:
     - *Method 1 (Console)*: Retrieve it from your project settings in the InsForge Console under API Keys.
     - *Method 2 (MCP/CLI)*: Generate a non-expiring anonymous token by running the `get-anon-key` command/tool using your administrator API key.

---

### B. Sanity Setup

Sanity is the CMS for courses, chapters, learner profiles, and progress. The app is wired to the **Learn AI** project.

1. **`SANITY_PROJECT_ID`**: `njws1rbr`
2. **`SANITY_DATASET`**: `production`
3. **`SANITY_API_TOKEN`**:
   - A Sanity API token with Editor or Developer access to the Learn AI project.
   - Create it in [sanity.io/manage](https://www.sanity.io/manage) under the project API settings.
   - Keep this value on the server. Do not commit it or expose it with a `NEXT_PUBLIC_` name.
   - When the token is absent, sign-in stays in demo mode and course reads fail until it is set.

The document shapes are listed in [the Sanity content model](cms.md).

---

### C. Omni Guide (Grok)

The course assistant calls the xAI API from the server.

1. **`XAI_API_KEY`**: an xAI API key. Keep it in `.env.local`. Do not prefix it with `NEXT_PUBLIC_`.
2. **`XAI_MODEL`**: optional. Defaults to `grok-4.7`.

---

### D. Stripe Setup

Stripe powers the monthly and yearly subscriptions for premium courses and full access.

1. **`STRIPE_SECRET_KEY`**:
   - **How to get**:
     1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com).
     2. Toggle to **Test Mode** (highly recommended for development).
     3. Navigate to **Developers** -> **API Keys**.
     4. Copy the **Secret key** (starts with `sk_test_`).
2. **Setup Subscriptions**:
   - Create a recurring Product in Stripe (e.g., "Omni AI Premium").
   - Add two Price points:
     - **Monthly**: `$5.99/month`
     - **Yearly**: `$49.99/year`
3. **`STRIPE_WEBHOOK_SECRET`**:
   - Used to verify incoming webhook events from Stripe (like checkout completion, subscription status changes, etc.).
   - **How to generate (Local Development)**:
     1. Install the Stripe CLI.
     2. Log in using `stripe login`.
     3. Start webhook forwarding to your local Next.js API route:
        ```bash
        stripe listen --forward-to localhost:3000/api/stripe/webhooks
        ```
     4. Copy the webhook signing secret output by the terminal (starts with `whsec_`) and add it to your `.env` file.
   - **How to generate (Production)**:
     1. In the Stripe Dashboard, go to **Developers** -> **Webhooks**.
     2. Click **Add endpoint**.
     3. Set the endpoint URL to `https://your-production-url.com/api/stripe/webhooks`.
     4. Select events to listen to:
        - `checkout.session.completed`
        - `customer.subscription.created`
        - `customer.subscription.updated`
        - `customer.subscription.deleted`
        - `invoice.payment_succeeded`
        - `invoice.payment_failed`
     5. Reveal the signing secret and paste it as `STRIPE_WEBHOOK_SECRET`.

---

## 3. Launching the Project Locally

Once the `.env` file is configured:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run Stripe Webhook listener** in a separate terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhooks
   ```

3. **Run the Next.js development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.
