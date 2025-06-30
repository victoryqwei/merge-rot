import { useMemo } from "react";
import { Capacitor } from "@capacitor/core";

export const usePlatformInfo = () => {
  const isIOS = useMemo(() => {
    return Capacitor.getPlatform() === "ios";
  }, []);

  return { isIOS };
};
