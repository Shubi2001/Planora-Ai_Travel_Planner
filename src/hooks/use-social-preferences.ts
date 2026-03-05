"use client";

import { useState, useEffect, useCallback } from "react";

const KEY_FB_LOGIN = "planora_pref_facebook_login";
const KEY_FB_SHARE = "planora_pref_facebook_share";

function getBool(key: string, defaultVal: boolean): boolean {
  if (typeof window === "undefined") return defaultVal;
  try {
    const v = localStorage.getItem(key);
    if (v === null) return defaultVal;
    return v === "true";
  } catch {
    return defaultVal;
  }
}

function setBool(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

export function useSocialPreferences() {
  const [facebookLoginEnabled, setFacebookLoginEnabledState] = useState(true);
  const [facebookShareEnabled, setFacebookShareEnabledState] = useState(true);

  useEffect(() => {
    setFacebookLoginEnabledState(getBool(KEY_FB_LOGIN, true));
    setFacebookShareEnabledState(getBool(KEY_FB_SHARE, true));
  }, []);

  const setFacebookLoginEnabled = useCallback((v: boolean) => {
    setBool(KEY_FB_LOGIN, v);
    setFacebookLoginEnabledState(v);
  }, []);

  const setFacebookShareEnabled = useCallback((v: boolean) => {
    setBool(KEY_FB_SHARE, v);
    setFacebookShareEnabledState(v);
  }, []);

  return {
    facebookLoginEnabled,
    facebookShareEnabled,
    setFacebookLoginEnabled,
    setFacebookShareEnabled,
  };
}

export function getFacebookLoginEnabled(): boolean {
  return getBool(KEY_FB_LOGIN, true);
}

export function getFacebookShareEnabled(): boolean {
  return getBool(KEY_FB_SHARE, true);
}
