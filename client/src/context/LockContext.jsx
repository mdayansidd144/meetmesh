import { createContext, useContext } from "react";
import { useLock } from "../hooks/useLock";
import { useAuth } from "./AuthContext";

const LockContext = createContext(null);

export const LockProvider = ({ children }) => {
  const { user } = useAuth();
  const lock = useLock(user);
  return <LockContext.Provider value={lock}>{children}</LockContext.Provider>;
};

export const useLockContext = () => useContext(LockContext);