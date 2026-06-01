interface AvatarProps {
  avatar: string;
  color: string;
  size?: number;
}

export function Avatar({ avatar, color, size = 32 }: AvatarProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: color + "22",
      border: `2px solid ${color}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.33,
      fontWeight: 800,
      color,
      flexShrink: 0,
    }}>
      {avatar}
    </div>
  );
}
