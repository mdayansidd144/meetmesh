import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        axios.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
        try {
          const { data } = await axios.get(`${API}/auth/me`);
          setUser(data);
          setToken(storedToken);
        } catch {
          localStorage.removeItem("token");
          delete axios.defaults.headers.common.Authorization;
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (username, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, {
      username,
      email,
      password,
    });
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await axios.post(`${API}/auth/google`, { credential });
    localStorage.setItem("token", data.token);
    axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
  };

  const updateProfile = async (updates) => {
    const { data } = await axios.put(`${API}/auth/me`, updates);
    setUser((prev) => ({ ...prev, ...data }));
    return data;
  };

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await axios.post(`${API}/auth/me/avatar`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setUser((prev) => ({ ...prev, ...data }));
    return data;
  };

  const generateEmojiAvatar = async () => {
    const { data } = await axios.post(`${API}/auth/me/avatar/emoji`);
    setUser((prev) => ({ ...prev, ...data }));
    return data;
  };

  const setChatTheme = async (theme) => {
    const { data } = await axios.put(`${API}/auth/me/theme`, { theme });
    setUser((prev) => (prev ? { ...prev, chatTheme: data.chatTheme } : prev));
    return data.chatTheme;
  };

  const setChatBackground = async (file) => {
    const formData = new FormData();
    formData.append("background", file);
    const { data } = await axios.post(`${API}/auth/me/background`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setUser((prev) =>
      prev ? { ...prev, chatBackground: data.chatBackground } : prev
    );
    return data.chatBackground;
  };

  const clearChatBackground = async () => {
    const { data } = await axios.delete(`${API}/auth/me/background`);
    setUser((prev) => (prev ? { ...prev, chatBackground: "" } : prev));
    return data.chatBackground;
  };

  const setRingtone = async ({ ringtone, ringtoneUrl }) => {
    const payload = { ringtone };
    if (ringtoneUrl !== undefined) payload.ringtoneUrl = ringtoneUrl;
    const { data } = await axios.put(`${API}/auth/me/ringtone`, payload);
    setUser((prev) =>
      prev
        ? { ...prev, ringtone: data.ringtone, ringtoneUrl: data.ringtoneUrl }
        : prev
    );
    return data;
  };

  const uploadRingtone = async (file) => {
    const formData = new FormData();
    formData.append("ringtone", file);
    const { data } = await axios.post(
      `${API}/auth/me/ringtone/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    setUser((prev) =>
      prev
        ? { ...prev, ringtone: data.ringtone, ringtoneUrl: data.ringtoneUrl }
        : prev
    );
    return data;
  };

  const patchSettings = async (section, payload) => {
    const { data } = await axios.put(`${API}/settings/${section}`, payload);
    setUser((prev) =>
      prev ? { ...prev, settings: { ...prev.settings, ...data } } : prev
    );
    return data;
  };

  const refreshUser = async () => {
    const { data } = await axios.get(`${API}/settings/me`);
    setUser((prev) => ({ ...prev, ...data }));
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithGoogle,
        updateProfile,
        uploadAvatar,
        generateEmojiAvatar,
        setChatTheme,
        setChatBackground,
        clearChatBackground,
        setRingtone,
        uploadRingtone,
        patchSettings,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);