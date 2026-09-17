import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Megaphone,
  Radio,
  Link2,
  Star,
  CheckCheck,
  UserPlus,
  Settings,
  Lock,
  ListChecks,
  MessageSquare,
  Palette,
  Bell,
  Database,
  Accessibility,
  Languages,
  HelpCircle,
  Shield,
  X,
} from "lucide-react";

const ITEMS = [
  { id: "new-group", label: "New group", icon: Users },
  { id: "new-community", label: "New community", icon: Megaphone },
  { id: "new-broadcast", label: "New broadcast", icon: Radio },
  { id: "linked-devices", label: "Linked devices", icon: Link2 },
  { id: "starred", label: "Starred messages", icon: Star },
  { id: "read-all", label: "Mark all as read", icon: CheckCheck },
  { divider: true },
  { id: "account", label: "Account", icon: UserPlus },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "lists", label: "Lists", icon: ListChecks },
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "storage", label: "Storage and data", icon: Database },
  { id: "parental", label: "Parental controls", icon: Shield },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "language", label: "App language", icon: Languages },
  { id: "help", label: "Help and feedback", icon: HelpCircle },
  { divider: true },
  { id: "settings", label: "All settings", icon: Settings },
];

export default function ChatMenu({ onClose, onSelect }) {
  const navigate = useNavigate();

  const routeMap = {
    "new-group": "create-room",
    "new-community": "create-room",
    "new-broadcast": "create-broadcast",
    "linked-devices": "/settings/devices",
    starred: "/settings/starred",
    "read-all": "read-all",
    account: "/settings/account",
    privacy: "/settings/privacy",
    lists: "/settings/lists",
    chats: "/settings/chats",
    appearance: "/settings/appearance",
    notifications: "/settings/notifications",
    storage: "/settings/storage",
    parental: "/settings/parental",
    accessibility: "/settings/accessibility",
    language: "/settings/language",
    help: "/settings/help",
    settings: "/settings",
  };

  const handleClick = (id) => {
    const target = routeMap[id];
    if (!target) return;
    if (target === "create-room") {
      onSelect?.({ type: "create-room", community: id === "new-community" });
      onClose();
      return;
    }
    if (target === "create-broadcast") {
      onSelect?.({ type: "create-broadcast" });
      onClose();
      return;
    }
    if (target === "read-all") {
      onSelect?.({ type: "read-all" });
      onClose();
      return;
    }
    navigate(target);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[150]"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="absolute top-16 right-4 w-72 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#0f172e",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <p className="text-sm font-bold text-white">Options</p>
          <button
            onClick={onClose}
            className="icon-btn-dark"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <div className="py-1 max-h-[70vh] overflow-y-auto scroll-thin">
          {ITEMS.map((item, i) => {
            if (item.divider) {
              return (
                <div key={`div-${i}`} className="my-1 border-t border-white/5" />
              );
            }
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors text-left"
              >
                <Icon
                  className="w-4 h-4 text-blue-200/70 flex-shrink-0"
                  strokeWidth={1.75}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}