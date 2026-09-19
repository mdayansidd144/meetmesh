import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useLockContext } from "./context/LockContext";
import LockScreen from "./pages/LockScreen";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import AIChat from "./pages/AIChat";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import SettingsAccount from "./pages/SettingsAccount";
import SettingsPrivacy from "./pages/SettingsPrivacy";
import SettingsLists from "./pages/SettingsLists";
import SettingsChats from "./pages/SettingsChats";
import SettingsAppearance from "./pages/SettingsAppearance";
import SettingsNotifications from "./pages/SettingsNotifications";
import SettingsBroadcasts from "./pages/SettingsBroadcasts";
import SettingsStorage from "./pages/SettingsStorage";
import SettingsAccessibility from "./pages/SettingsAccessibility";
import SettingsLanguage from "./pages/SettingsLanguage";
import SettingsHelp from "./pages/SettingsHelp";
import SettingsParental from "./pages/SettingsParental";
import SettingsDevices from "./pages/SettingsDevices";
import SettingsRingtone from "./pages/SettingsRingtone";
import SettingsSecurity from "./pages/SettingsSecurity";
import Starred from "./pages/Starred";
import Broadcasts from "./pages/Broadcasts";

export default function App() {
  const { user, loading } = useAuth();
  const lock = useLockContext();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-slate-500">Loading MeetMesh</div>
      </div>
    );
  }

  if (user && lock.ready && lock.locked) {
    return <LockScreen onUnlock={lock.unlock} />;
  }

  const guard = (element) =>
    user ? element : <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route
        path="/register"
        element={user ? <Navigate to="/" /> : <Register />}
      />
      <Route path="/ai" element={guard(<AIChat />)} />
      <Route path="/profile" element={guard(<Profile />)} />
      <Route path="/settings" element={guard(<Settings />)} />
      <Route path="/settings/account" element={guard(<SettingsAccount />)} />
      <Route path="/settings/privacy" element={guard(<SettingsPrivacy />)} />
      <Route path="/settings/lists" element={guard(<SettingsLists />)} />
      <Route path="/settings/chats" element={guard(<SettingsChats />)} />
      <Route
        path="/settings/appearance"
        element={guard(<SettingsAppearance />)}
      />
      <Route
        path="/settings/notifications"
        element={guard(<SettingsNotifications />)}
      />
      <Route
        path="/settings/broadcasts"
        element={guard(<SettingsBroadcasts />)}
      />
      <Route path="/settings/storage" element={guard(<SettingsStorage />)} />
      <Route
        path="/settings/accessibility"
        element={guard(<SettingsAccessibility />)}
      />
      <Route
        path="/settings/language"
        element={guard(<SettingsLanguage />)}
      />
      <Route path="/settings/help" element={guard(<SettingsHelp />)} />
      <Route
        path="/settings/parental"
        element={guard(<SettingsParental />)}
      />
      <Route path="/settings/devices" element={guard(<SettingsDevices />)} />
      <Route
        path="/settings/ringtone"
        element={guard(<SettingsRingtone />)}
      />
      <Route
        path="/settings/security"
        element={guard(<SettingsSecurity />)}
      />
      <Route path="/settings/starred" element={guard(<Starred />)} />
      <Route path="/broadcasts" element={guard(<Broadcasts />)} />
      <Route path="/" element={guard(<Chat />)} />
    </Routes>
  );
}