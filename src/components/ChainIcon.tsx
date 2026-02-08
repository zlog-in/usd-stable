"use client";

interface ChainIconProps {
  name: string;
  color: string;
  size?: number;
}

export default function ChainIcon({ name, color, size = 32 }: ChainIconProps) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color === "#000000" ? "#333" : color,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
