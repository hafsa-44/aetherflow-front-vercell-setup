import 'bootstrap/dist/css/bootstrap.min.css';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
//import "./app.css";
//import './index.css'
//import './theme.css';

import "./indexstyle.css";
import App from "./App";
//console.log("Main loaded");
createRoot(document.getElementById("root")).render(
    
  <StrictMode>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  </StrictMode>
);
