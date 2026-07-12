
import { useState } from "react";

const AVATAR_COLORS = [
  { bg: "#E6F1FB", text: "#0C447C" },
  { bg: "#FBEAF0", text: "#72243E" },
  { bg: "#E1F5EE", text: "#085041" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#F0EAFB", text: "#3B1472" },
];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function AvatarItem({ member, palette }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      title={member.name}
      style={{
        width: 24, // Sized down slightly for a perfect fit
        height: 24,
        borderRadius: "50%",
        border: "1.5px solid #fff",
        overflow: "hidden",
        flexShrink: 0,
        background: palette.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        fontWeight: 600,
        color: palette.text,
        position: "relative",
      }}
    >
      {member.profilePicture && !imgError ? (
        <img
          src={member.profilePicture}
          alt={member.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          referrerPolicy="no-referrer"   
          onError={() => setImgError(true)}
        />
      ) : (
        getInitials(member.name)
      )}
    </div>
  );
}

export default function AvatarStack({ members = [], totalCount = 0 }) {
  const MAX_SHOWN = 3; // Kept tight so it never overlaps the date column
  const shown = Array.isArray(members) ? members.slice(0, MAX_SHOWN) : [];
  const overflowN = totalCount - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((member, i) => {
        const palette = AVATAR_COLORS[i % AVATAR_COLORS.length];
        return (
          <div 
            key={member._id ?? member.id ?? i} 
            style={{ marginLeft: i === 0 ? 0 : -6, zIndex: shown.length - i }}
          >
            <AvatarItem member={member} palette={palette} />
          </div>
        );
      })}

      {overflowN > 0 && (
        <div
          title={`${overflowN} more member(s)`}
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "1.5px solid #fff",
            marginLeft: -6,
            background: "#F3F4F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 600,
            color: "#6B7280",
            flexShrink: 0,
            zIndex: 0,
          }}
        >
          +{overflowN}
        </div>
      )}
    </div>
  );
}