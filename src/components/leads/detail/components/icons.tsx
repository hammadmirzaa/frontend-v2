"use client";

import { ImageWrapper } from "@/components/ui";

const iconProps = { xmlns: "http://www.w3.org/2000/svg", fill: "currentColor" } as const;

export function EnvelopeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <ImageWrapper src="/svgs/leads/activity-mail.svg" alt="Email" height={20} width={20} className={className} style={style} />
  );
}

export function PhoneIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <ImageWrapper
      src="/svgs/leads/activity-call.svg"
      alt="Phone"
      height={20}
      width={20}
      className={className}
      style={{ ...style, filter: "brightness(0) invert(1)" }}
    />
  );
}

export function BuildingIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" className={className} style={style} {...iconProps}>
      <path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm3-11a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-1zM7.5 9a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5V9zM7 12a.5.5 0 01.5-.5h1a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-1A.5.5 0 017 13v-1z" clipRule="evenodd" />
    </svg>
  );
}

export function PencilIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" className={className} style={style} {...iconProps}>
      <path d="M2 4.25A2.25 2.25 0 014.25 2h6.5A2.25 2.25 0 0113 4.25V5a1 1 0 001 1h1.75A2.25 2.25 0 0118 8.25v6.5A2.25 2.25 0 0115.75 17h-6.5A2.25 2.25 0 017 14.75V14a1 1 0 00-1-1H4.25A2.25 2.25 0 012 10.75v-6.5z" />
    </svg>
  );
}

export function VideoIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <ImageWrapper src="/svgs/leads/activity-meeting.svg" alt="Video" height={20} width={20} className={className} style={style} />
  );
}

export function DocumentIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <ImageWrapper src="/svgs/leads/activity-notebook.svg" alt="Document" height={20} width={20} className={className} style={style} />
  );
}

const personPath = "M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z";

export function PersonIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} {...iconProps}>
      <path fillRule="evenodd" d={personPath} clipRule="evenodd" />
    </svg>
  );
}
