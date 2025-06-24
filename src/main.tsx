import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import { GameProvider } from "./game/GameContext";
import theme from "./theme";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <GameProvider>
        <App />
      </GameProvider>
    </ChakraProvider>
  </React.StrictMode>
);
