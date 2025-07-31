// src/components/BackgroundEffect.jsx
import React from "react";

const BackgroundEffect = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `
            repeating-radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 2px),
            repeating-linear-gradient(45deg, rgba(255,255,0,0.05) 1px, transparent 20px),
            repeating-linear-gradient(-45deg, rgba(0,255,255,0.05) 1px, transparent 20px)
          `,
          backgroundBlendMode: "overlay",
          backgroundSize: "cover",
        }}
      />
    </div>
  );
};

export default BackgroundEffect;
