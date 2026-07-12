
/*import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "localhost",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("PROXY HIT:", req.url);

            // ✅ forward Authorization header
            const auth = req.headers["authorization"];
            if (auth) {
              proxyReq.setHeader("authorization", auth);
            }
          });
        },
      },
    },
  },
});*/
//new 
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "localhost",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("PROXY HIT:", req.url);
            const auth = req.headers["authorization"];
            if (auth) proxyReq.setHeader("authorization", auth);
          });
        },
      },
      // ADD THIS — Socket.IO needs its own proxy entry with ws:true
      "/socket.io": {
        target: "http://localhost:5000",
        changeOrigin: true,
        ws: true,          // ← this is what was missing
      },
    },
  },
});