const S = ({ size = 18, sw = 2, children, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

export const HugLogo = ({ size = 32, heart = 'var(--accent)', className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6.5 4.5C3.6 6.6 2.6 10.7 4.4 14.2c1.7 3.3 5.7 5.2 9.6 4.4" />
    <path d="M17.5 4.5c2.9 2.1 3.9 6.2 2.1 9.7-1.7 3.3-5.7 5.2-9.6 4.4" />
    <path d="M12 15.4c-1.9-1.2-3.4-2.6-3.4-4.3a1.75 1.75 0 0 1 3.4-.6 1.75 1.75 0 0 1 3.4.6c0 1.7-1.5 3.1-3.4 4.3z" style={{ fill: heart, stroke: heart }} />
  </svg>
);

export const IconPen = (p) => <S {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></S>;
export const IconClose = (p) => <S {...p}><path d="M6 6l12 12M18 6L6 18" /></S>;
export const IconReply = (p) => <S {...p}><path d="M9 14L4 9l5-5" /><path d="M20 20v-7a4 4 0 00-4-4H4" /></S>;
export const IconBookmark = (p) => <S {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></S>;
export const IconHeart = ({ filled, ...p }) => <S {...p} fill={filled ? 'currentColor' : 'none'}><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.4 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.6 0 5.8 3.6 4.5 6.8C19.5 16.4 12 21 12 21z" /></S>;
export const IconMusic = (p) => <S {...p}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></S>;
export const IconFlip = (p) => <S {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></S>;
export const IconImage = (p) => <S {...p}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></S>;
export const IconLock = (p) => <S {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></S>;
export const IconLogout = (p) => <S {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></S>;
export const IconPalette = (p) => <S {...p}><circle cx="12" cy="12" r="9" /><circle cx="8" cy="10" r="1.3" /><circle cx="12" cy="7.5" r="1.3" /><circle cx="16" cy="10" r="1.3" /><path d="M12 21a2.5 2.5 0 0 1 0-5h2a3 3 0 0 0 3-3" /></S>;
export const IconFlag = (p) => <S {...p}><path d="M4 21V4" /><path d="M4 4h12l-2 4 2 4H4" /></S>;
export const IconEye = (p) => <S {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></S>;
export const IconArrow = ({ dir = 'right', ...p }) => <S {...p}>{dir === 'right' ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}</S>;
export const IconSpark = (p) => <S {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /><circle cx="12" cy="12" r="3" /></S>;

export const Bird = () => (
  <svg className="bird" viewBox="0 0 96 60" aria-hidden="true">
    <path className="wing" d="M44 34 C38 16 26 6 8 4 C20 14 28 26 34 36 Z" fill="currentColor" opacity=".7" />
    <path d="M24 38 C36 30 54 28 68 32 L74 36 C66 44 46 46 30 44 L16 50 L20 41 Z" fill="currentColor" />
    <circle cx="70" cy="31" r="6.5" fill="currentColor" />
    <path d="M75 29 L87 32 L75 35 Z" style={{ fill: 'var(--accent)' }} />
    <path className="wing" d="M50 32 C56 12 68 4 86 2 C74 12 64 24 58 36 Z" fill="currentColor" />
  </svg>
);
