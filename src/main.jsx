import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppWithRecaptcha } from "./lib/recaptcha.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWithRecaptcha>
      <App />
    </AppWithRecaptcha>
  </React.StrictMode>
);
