import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { StoreProvider } from "./stores/StoreContext";
import { rootStore } from "./stores/RootStore";
import App from "./components/App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <ChakraProvider>
      <StoreProvider store={rootStore}>
        <App />
      </StoreProvider>
    </ChakraProvider>
  </React.StrictMode>
);
