import { createStandaloneToast } from "@chakra-ui/react";
import theme from "../theme";

export const { ToastContainer, toast: toast_ } = createStandaloneToast({
  theme: theme,
});

export function toast(args: Parameters<typeof toast_>[0]) {
  const options = { position: "top", ...args } as const;
  return toast_(options);
}
