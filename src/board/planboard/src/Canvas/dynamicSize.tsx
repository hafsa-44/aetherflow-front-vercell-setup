 const measureTextBlock = (text: string, font = "14px sans-serif") => {
     const canvas = document.createElement("canvas");
     const ctx = canvas.getContext("2d");
     if (!ctx) return { width: 100, height: 40 };
 
     ctx.font = font;
 
     const lines = text.split("\n");
 
     let maxWidth = 0;
     lines.forEach((line) => {
       const metrics = ctx.measureText(line);
       maxWidth = Math.max(maxWidth, metrics.width);
     });
 
     const lineHeight = 18; // 14px font → ~18px line height
     const height = lines.length * lineHeight;
 
     return { width: maxWidth, height };
   };
   const measureCanvas = document.createElement("canvas");
   const measureContext = measureCanvas.getContext("2d");
   export function getDynamicSize(text: string,
    shape: "rect" | "circle" | "diamond" | "parallelogram",
    fontSize: number = 14,
    fontFamily: string = "sans-serif",
    maxWidth: number = 260) {
    if (!measureContext) return { width: 120, height: 60 };

    measureContext.font = `${fontSize}px ${fontFamily}`;

    const lineHeight = fontSize * 1.15; // tighter than 1.2
    const paddingX = 16; // small side padding
    const paddingY = 12; // small vertical padding


    // --- Smart Word Wrapping ---
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach(word => {
      const testLine = currentLine ? currentLine + " " + word : word;
      const width = measureContext.measureText(testLine).width;

      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) lines.push(currentLine);

    const textWidth = Math.max(
      ...lines.map(line => measureContext.measureText(line).width)
    );

    let width = textWidth + paddingX;
    let height = lines.length * lineHeight + paddingY;

    // ================================
    // SHAPE-SPECIFIC FIXES
    // ================================
    if (shape === "circle") {
      // Force narrower wrapping first
      const constrainedWidth = Math.min(width, 180);
      const diameter = Math.max(constrainedWidth, height);
      return {
        width: diameter,
        height: diameter
      };
    }

    if (shape === "diamond") {

      const diagonal = (width + height) / Math.SQRT2;

      return {
        width: diagonal,
        height: diagonal
      };
    }

    if (shape === "parallelogram") {
      return {
        width: width + 10, // slight skew compensation
        height: height
      };
    }

    // rectangle default
    return {
      width,
      height
    };
  }
