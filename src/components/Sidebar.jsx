import { useEffect, useState } from "react";
import {
  MessageSquare,
  Bot,
  Shield,
  ClipboardList,
  Users,
  RefreshCw,
  MessagesSquare,
  ChevronDown,
  ChevronRight,
  PanelLeft,
  Send,
  Building2,
  LayoutDashboard,
  ScrollText,
  Wrench,
} from "lucide-react";

const ICON_STROKE = 1.75;

/** Sub-items shown under Playground (tenant product area). */
const PLAYGROUND_CHILDREN = [
  { id: "chatbots", label: "Chatbots", icon: Bot },
  { id: "guardrails", label: "Guardrails", icon: Shield },
  { id: "libraries", label: "Knowledge Base", icon: ClipboardList },
];

const STANDALONE_MAIN = [
  { id: "leads", label: "Leads", icon: Users },
  { id: "followups", label: "Follow Ups", icon: RefreshCw },
  { id: "history", label: "Conversations", icon: MessagesSquare },
];

const PLAYGROUND_SECTION_IDS = [
  "playground",
  "chatbots",
  "guardrails",
  "libraries",
];

function navButtonClasses({ active, disabled }) {
  if (disabled) {
    return "text-gray-400 bg-gray-50 cursor-not-allowed opacity-70";
  }
  if (active) {
    return "bg-brand-teal text-white shadow-sm";
  }
  return "text-gray-700 hover:bg-gray-100";
}

export default function Sidebar({
  activeTab,
  onNavigate,
  user,
  blockedTabs = [],
  collapsed,
  onToggleCollapsed,
}) {
  const roleName = (user?.role || "").toUpperCase();
  const isSales = roleName === "SALES";
  const isManager = roleName === "MANAGER";
  const isSuperUser = user?.role === "SUPER_USER" || user?.is_super_user;
  const isAdmin = user?.role === "ADMIN";

  const whatsappNavItem = { id: "whatsapp", label: "WhatsApp", icon: Send };

  const pmPortalBlocked =
    (isSales || isManager) && user?.pm_sales_portal_allowed === false;

  const roleAllowedTabs = pmPortalBlocked
    ? []
    : isSales
      ? ["leads", "followups", "history"]
      : isManager
        ? [
            "playground",
            "chatbots",
            "guardrails",
            "libraries",
            "leads",
            "followups",
            "history",
          ]
        : null;

  const [playgroundOpen, setPlaygroundOpen] = useState(() =>
    PLAYGROUND_SECTION_IDS.includes(activeTab),
  );

  useEffect(() => {
    if (PLAYGROUND_SECTION_IDS.includes(activeTab)) {
      setPlaygroundOpen(true);
    }
  }, [activeTab]);

  const showPlaygroundGroup =
    !isSuperUser &&
    !pmPortalBlocked &&
    (roleAllowedTabs === null ||
      roleAllowedTabs.some((id) => PLAYGROUND_SECTION_IDS.includes(id)));

  const filterByRole = (items) => {
    if (!roleAllowedTabs) return items;
    return items.filter((item) => roleAllowedTabs.includes(item.id));
  };

  const playgroundChildren = filterByRole(PLAYGROUND_CHILDREN);
  const standaloneMain = filterByRole(STANDALONE_MAIN);

  const superItems = [
    { id: "dashboards", label: "Dashboards", icon: LayoutDashboard },
    { id: "tenants", label: "Tenants", icon: Building2 },
    { id: "system-prompts", label: "Agents", icon: ScrollText },
    { id: "tool-prompts", label: "Tools", icon: Wrench },
  ];

  const isBlocked = (id) => blockedTabs.includes(id);

  const playgroundSectionActive = PLAYGROUND_SECTION_IDS.includes(activeTab);

  /** Icon-only rail when sidebar is collapsed (full playground section). */
  const renderCollapsedPlaygroundRail = () => {
    if (!collapsed || !showPlaygroundGroup) return null;
    const entries = [
      { id: "playground", label: "Playground", icon: MessageSquare },
      ...playgroundChildren,
    ];
    return (
      <div className="mb-2 flex flex-col gap-1 border-b border-gray-100 pb-2">
        {entries.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          const blocked = isBlocked(item.id);
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => {
                if (!blocked && onNavigate) onNavigate(item.id);
              }}
              disabled={blocked}
              className={`flex w-full items-center justify-center rounded-lg p-2.5 transition-colors ${
                blocked
                  ? "cursor-not-allowed text-gray-400"
                  : active
                    ? "bg-brand-teal text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={20} strokeWidth={ICON_STROKE} />
            </button>
          );
        })}
      </div>
    );
  };

  const renderSuperNav = () => (
    <>
      <p
        className={`mb-2 px-3 text-[11px] font-medium uppercase tracking-wide text-gray-400 ${collapsed ? "sr-only" : ""}`}
      >
        Features
      </p>
      <div className="space-y-1">
        {superItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          const blocked = isBlocked(item.id);
          return (
            <button
              key={item.id}
              type="button"
              title={collapsed ? item.label : undefined}
              onClick={() => {
                if (!blocked && onNavigate) onNavigate(item.id);
              }}
              disabled={blocked}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${navButtonClasses({ active, disabled: blocked })} ${
                collapsed ? "justify-center px-2" : ""
              }`}
            >
              <Icon
                size={20}
                strokeWidth={ICON_STROKE}
                className="shrink-0 opacity-95"
              />
              <span className={`truncate ${collapsed ? "sr-only" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );

  const renderPlaygroundGroup = () => {
    if (!showPlaygroundGroup) return null;

    const pgBlocked = isBlocked("playground");

    return (
      <div className="mb-1">
        <div
          className={`flex w-full items-stretch gap-0 overflow-hidden rounded-lg ${
            playgroundSectionActive
              ? "bg-brand-teal text-white shadow-sm"
              : "bg-transparent"
          }`}
        >
          <button
            type="button"
            title={collapsed ? "Playground" : undefined}
            onClick={() => {
              if (!pgBlocked && onNavigate) onNavigate("playground");
            }}
            disabled={pgBlocked}
            className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${
              playgroundSectionActive
                ? "text-white"
                : "text-gray-800 hover:bg-gray-100"
            } ${pgBlocked ? "cursor-not-allowed opacity-50" : ""} ${collapsed ? "justify-center px-2" : ""}`}
          >
            <img src="/svgs/playground/playground.svg" alt="Playground" className="w-5 h-5" />
            <span
              className={`min-w-0 flex-1 truncate ${collapsed ? "sr-only" : ""}`}
            >
              Playground
            </span>
          </button>
          {!collapsed && (
            <button
              type="button"
              className={`flex shrink-0 items-center px-2 ${
                playgroundSectionActive
                  ? "text-white/90 hover:text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              aria-expanded={playgroundOpen}
              onClick={(e) => {
                e.preventDefault();
                setPlaygroundOpen((o) => !o);
              }}
            >
              {playgroundOpen ? (
                <ChevronDown size={18} strokeWidth={ICON_STROKE} />
              ) : (
                <ChevronRight size={18} strokeWidth={ICON_STROKE} />
              )}
            </button>
          )}
        </div>

        {!collapsed && playgroundOpen && playgroundChildren.length > 0 && (
          <div className="relative mt-1 pl-5">
            <div
              className="absolute left-[15px] top-0 bottom-1 w-px bg-gray-200"
              aria-hidden
            />
            <div className="space-y-0.5 py-1">
              {playgroundChildren.map((item) => {
                const active = activeTab === item.id;
                const blocked = isBlocked(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!blocked && onNavigate) onNavigate(item.id);
                    }}
                    disabled={blocked}
                    className={`relative flex w-full items-center gap-3 rounded-lg py-2 pl-4 pr-3 text-left text-sm font-medium transition-colors ${
                      blocked
                        ? "cursor-not-allowed text-gray-400"
                        : active
                          ? "bg-cyan-50/90 text-gray-900"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <img src={`/svgs/playground/${item.id}.svg`} alt={item.label} className="w-5 h-5" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStandaloneRow = (item) => {
    const active = activeTab === item.id;
    const blocked = isBlocked(item.id);
    return (
      <button
        key={item.id}
        type="button"
        title={collapsed ? item.label : undefined}
        onClick={() => {
          if (!blocked && onNavigate) onNavigate(item.id);
        }}
        disabled={blocked}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${navButtonClasses({ active, disabled: blocked })} ${
          collapsed ? "justify-center px-2" : ""
        }`}
      >
        <img src={`/svgs/playground/${item.id}.svg`} alt={item.label} className="w-5 h-5" />
        <span className={`truncate ${collapsed ? "sr-only" : ""}`}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <div
      className={`flex h-screen flex-col border-r border-gray-100 bg-white shadow-sm transition-[width] duration-200 ease-out ${
        collapsed ? "w-[4.5rem]" : "w-64"
      }`}
    >
      <div
        className={`flex items-center gap-2 border-gray-100 py-4 ${collapsed ? "flex-col px-2" : "px-4"}`}
      >
        <div
          className={`flex min-h-[1rem] min-w-0 flex-1 items-center gap-1 ${collapsed ? "justify-center" : ""}`}
        >
          <img
            src={collapsed ? "/meichat-logo.png" : "/logo.png"}
            alt="MeiChat"
            className={`block shrink-0 object-contain ${collapsed ? "mx-auto h-10 w-10 max-h-11 object-center" : "object-left h-8 w-auto max-h-10 max-w-[min(100%,10.5rem)]"}`}
          />
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <img src="/svgs/playground/collapse.svg" alt="Sidebar Toggle" className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        {pmPortalBlocked && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Product access is disabled for your role on this tenant. Contact
            your administrator.
          </p>
        )}

        {!pmPortalBlocked && isSuperUser && renderSuperNav()}

        {!pmPortalBlocked && !isSuperUser && (
          <>
            <p
              className={`mb-2 px-3 text-[11px] font-medium uppercase tracking-wide text-gray-400 ${
                collapsed ? "sr-only" : ""
              }`}
            >
              Features
            </p>
            {collapsed ? (
              <>
                {renderCollapsedPlaygroundRail()}
                <div className="space-y-1">
                  {standaloneMain.map((item) => renderStandaloneRow(item))}
                  {isAdmin && renderStandaloneRow(whatsappNavItem)}
                </div>
              </>
            ) : (
              <div className="space-y-1">
                {renderPlaygroundGroup()}
                {standaloneMain.map((item) => renderStandaloneRow(item))}
                {isAdmin && renderStandaloneRow(whatsappNavItem)}
              </div>
            )}

          </>
        )}
      </nav>
    </div>
  );
}
