import { MessageSquare, Radio, Layers, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "threads", label: "Threads", icon: MessageSquare },
  { id: "signals", label: "Signals", icon: Radio },
  { id: "clusters", label: "Clusters", icon: Layers },
  { id: "voices", label: "Voices", icon: Phone },
];

export default function BottomNav({ active, onChange, unread }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        const count = unread?.[tab.id] || 0;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn("bottom-nav-item", isActive && "active")}
            aria-label={tab.label}
          >
            <div className="bottom-nav-icon-wrap">
              <Icon
                className="w-6 h-6"
                strokeWidth={isActive ? 2.4 : 1.9}
              />
              {count > 0 && (
                <span className="bottom-nav-badge">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </div>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}