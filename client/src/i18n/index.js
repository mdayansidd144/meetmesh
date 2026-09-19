import { useEffect, useState, useCallback } from "react";
import en from "./en";
import hi from "./hi";
import es from "./es";
import fr from "./fr";
import de from "./de";

const DICTS = { en, hi, es, fr, de };
const STORAGE_KEY = "appLanguage";

let currentLang =
  (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) ||
  "en";

const listeners = new Set();

export const setLanguage = (code) => {
  if (!DICTS[code]) code = "en";
  currentLang = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {}
  listeners.forEach((fn) => fn(code));
};

export const getLanguage = () => currentLang;

export const useTranslation = () => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  const t = useCallback((key, vars) => {
    const dict = DICTS[currentLang] || DICTS.en;
    let str = dict[key] || DICTS.en[key] || key;

    if (vars && typeof vars === "object") {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }

    return str;
  }, [currentLang]);

  return { t, lang: currentLang };
};

export const t = (key, vars) => {
  const dict = DICTS[currentLang] || DICTS.en;
  let str = dict[key] || DICTS.en[key] || key;
  if (vars && typeof vars === "object") {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
  }
  return str;
};