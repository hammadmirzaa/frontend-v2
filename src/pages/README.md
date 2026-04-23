# pages

Top-level route components rendered by the React Router configuration in `App.jsx`, covering authentication, the dashboard shell, embed widget, and subscription flow callbacks.

## Files

| File | Description |
|------|-------------|
| `Dashboard.jsx` | Authenticated dashboard shell that handles tab state, role-based access, provider-key gating, and routing for child tab and tenant pages. |
| `DashboardHome.jsx` | Switches between the dashboard tab components (playground, chatbots, leads, etc.) based on the active tab and access checks. |
| `EmbedPage.jsx` | Public embeddable chat page rendered at `/embed/:token` that talks to a tenant's chatbot via text or voice. |
| `Login.jsx` | Login page with email/password form, error surfacing for inactive tenant or user accounts, and post-auth navigation. |
| `Signup.jsx` | Signup page that creates a new account via the auth API and auto-logs the user into the dashboard. |
| `SubscriptionCancel.jsx` | Stripe cancel callback page informing the user that no charges were made and returning them to the dashboard. |
| `SubscriptionSuccess.jsx` | Stripe success callback page that polls subscription status to confirm activation after checkout. |
