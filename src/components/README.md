# components

Reusable React components for the meichat dashboard, including tab views, modals, and shared UI primitives that compose the chatbot management experience.

## Files

| File | Description |
|------|-------------|
| `AdminTab.jsx` | Admin/super-user console for searching, paginating, creating, editing, and managing tenant users. |
| `BasicUsageSummary.jsx` | Presentational summary listing AI query, document, email, SMS, and storage counters for the BASIC subscription plan. |
| `ChatbotDetailView.jsx` | Multi-step detail editor for a single chatbot covering configuration, persona, documents, guardrails, and embed code. |
| `ChatbotTab.jsx` | Standalone chat interface that lets users converse with the active chatbot using text or voice input. |
| `ChatbotsTab.jsx` | List view for active and soft-deleted chatbots with create, restore, delete, and detail-view navigation. |
| `ConversationDetailModal.jsx` | Modal that fetches and renders the full message transcript for a conversation session. |
| `DocumentsTab.jsx` | Document management tab for uploading files, ingesting URLs, listing per-library documents, and deleting items. |
| `EmbedPluginTab.jsx` | Tab for selecting a chatbot, configuring its widget appearance and system instructions, and copying the generated embed snippet. |
| `FollowUpModal.jsx` | Modal form for creating or editing email, SMS, and call follow-ups associated with a lead. |
| `FollowUpsTab.jsx` | Lists scheduled and completed follow-ups with status/type filters, statistics, and modal-driven editing. |
| `GuardrailsTab.jsx` | Tab for managing guardrails including allowed/denied topics, content restrictions, and chatbot assignment. |
| `HistoryTab.jsx` | Paginated, filterable conversation history view that opens individual sessions in a detail modal. |
| `LeadDetailModal.jsx` | Modal showing a single lead's profile, message transcript, status, and editable internal notes. |
| `LeadsTab.jsx` | Lists leads with status filtering and CSV/export options, opening a detail modal on row selection. |
| `LibrariesTab.jsx` | CRUD tab for document libraries that group documents and link them to chatbots. |
| `Modal.jsx` | Generic centered modal shell with backdrop, title bar, optional close button, and slot for children. |
| `PlaygroundTab.jsx` | Interactive chatbot playground that streams responses, supports voice mode, and surfaces query-limit popups. |
| `QueryLimitModal.jsx` | Modal displayed when tenant query limits are reached, prompting either an upgrade or a contact-admin message. |
| `Sidebar.jsx` | Left navigation sidebar that builds role-aware menu items and triggers tab navigation and logout. |
| `Spinner.jsx` | Lightweight SVG spinner with size variants used for loading states. |
| `SubscriptionTab.jsx` | Super-admin embedded subscription console that exposes plans, usage, limits, invoices, add-ons, and custom bills for a tenant. |
| `TenantSubscriptionTab.jsx` | Tenant-facing subscription tab for viewing plan, usage, invoices, add-ons, and editing provider keys. |
| `Toast.jsx` | Standalone toast notification component with success, error, warning, and info variants and auto-dismiss behavior. |
| `VoiceSettings.jsx` | Modal for searching, filtering, previewing, and selecting browser speech-synthesis voices. |
| `WhatsAppTab.jsx` | Tab for configuring tenant WhatsApp IVR menus, status, and chatbot routing with super-user tenant selection. |
| `new.jsx` | Experimental/draft variant of the generic `Modal` component. |
