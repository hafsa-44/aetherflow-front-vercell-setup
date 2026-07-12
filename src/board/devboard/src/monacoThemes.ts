import * as monaco from "monaco-editor";

export const defineMonacoThemes = () => {
     monaco.editor.defineTheme("my-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [
               { token: "keyword", foreground: "C586C0" },
               { token: "string", foreground: "CE9178" },
               { token: "number", foreground: "B5CEA8" },
               { token: "comment", foreground: "6A9955" },
               { token: "identifier", foreground: "9CDCFE" },
          ],
          colors: {
               "editor.background": "#0f172a",
               "editorLineNumber.foreground": "#6b7280",
               "editorCursor.foreground": "#ffffff",
          },
     });

     monaco.editor.defineTheme("my-light", {
          base: "vs",
          inherit: true,
          rules: [
               { token: "keyword", foreground: "AF00DB" },
               { token: "string", foreground: "A31515" },
               { token: "number", foreground: "098658" },
               { token: "comment", foreground: "008000" },
          ],
          colors: { "editor.background": "#ffffff" },
     });
};