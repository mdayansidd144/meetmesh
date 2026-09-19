import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import SettingsHeader from "../components/SettingsHeader";
import SettingsRow from "../components/SettingsRow";
import { ShieldCheck } from "lucide-react";
import {
  KeyRound,
  Lock,
  ListChecks,
  MessageSquare,
  Palette,
  Bell,
  Music,
  Megaphone,
  Database,
  Accessibility,
  Languages,
  HelpCircle,
  Users,
  Shield,
  Link2,
  Star,
  Moon,
  Sun,
} from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initial = (name) => name?.[0]?.toUpperCase() || "?";

  return (
    <div className="settings-page">
      <SettingsHeader title="Settings" />

      <div className="settings-profile-card">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt=""
            referrerPolicy="no-referrer"
            className="settings-profile-avatar"
          />
        ) : (
          <div className="settings-profile-avatar settings-profile-fallback">
            {initial(user?.username)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="settings-profile-name">{user?.username}</p>
          <p className="settings-profile-bio">
            {user?.bio || "Tap to add a bio"}
          </p>
        </div>
      </div>

      <SettingsRow
        icon={theme === "dark" ? Moon : Sun}
        label="Light theme"
        description={
          theme === "dark"
            ? "Tap to switch to a soft grey light theme"
            : "Tap to return to the dark theme"
        }
        onClick={toggleTheme}
        right={
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
            {theme}
          </span>
        }
      />

      <SettingsRow
        icon={KeyRound}
        label="Account"
        description="Username, password, data export"
        onClick={() => navigate("/settings/account")}
      />
      <SettingsRow
        icon={Lock}
        label="Privacy"
        description="Last seen, blocked users, read receipts"
        onClick={() => navigate("/settings/privacy")}
      />
      <SettingsRow
        icon={ListChecks}
        label="Lists"
        description="Organize contacts into lists"
        onClick={() => navigate("/settings/lists")}
      />
      <SettingsRow
        icon={MessageSquare}
        label="Chats"
        description="Enter to send, media download"
        onClick={() => navigate("/settings/chats")}
      />
      <SettingsRow
        icon={Palette}
        label="Appearance"
        description="Theme, wallpaper, dark mode"
        onClick={() => navigate("/settings/appearance")}
      />
      <SettingsRow
        icon={Bell}
        label="Notifications"
        description="Messages, groups, calls"
        onClick={() => navigate("/settings/notifications")}
      />
      <SettingsRow
        icon={Music}
        label="Ringtone"
        description="Choose your incoming call sound"
        onClick={() => navigate("/settings/ringtone")}
      />
      <SettingsRow
        icon={Megaphone}
        label="Broadcasts"
        description="Who can add you to broadcast lists"
        onClick={() => navigate("/settings/broadcasts")}
      />
      <SettingsRow
        icon={Database}
        label="Storage and data"
        description="Media usage, clear cache"
        onClick={() => navigate("/settings/storage")}
      />
      <SettingsRow
        icon={ShieldCheck}
        label="Security"
        description="PIN, biometric, voice lock"
        onClick={() => navigate("/settings/security")}
      />
      <SettingsRow
        icon={Accessibility}
        label="Accessibility"
        description="Font size, contrast, motion"
        onClick={() => navigate("/settings/accessibility")}
      />
      <SettingsRow
        icon={Languages}
        label="App language"
        description="Choose your language"
        onClick={() => navigate("/settings/language")}
      />
      <SettingsRow
        icon={Link2}
        label="Linked devices"
        description="Manage active sessions"
        onClick={() => navigate("/settings/devices")}
      />
      <SettingsRow
        icon={Star}
        label="Starred messages"
        description="Your saved messages"
        onClick={() => navigate("/settings/starred")}
      />
      <SettingsRow
        icon={Users}
        label="Broadcast lists"
        description="Send one message to many"
        onClick={() => navigate("/broadcasts")}
      />
      <SettingsRow
        icon={HelpCircle}
        label="Help and feedback"
        description="FAQ, contact, report issues"
        onClick={() => navigate("/settings/help")}
      />

      <p className="settings-footer">MeetMesh v1.0</p>
    </div>
  );
}
