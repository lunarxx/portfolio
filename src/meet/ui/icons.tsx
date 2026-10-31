// the few line icons the meeting uses
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
export const Mic = () => <svg viewBox="0 0 24 24" {...P}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
export const Cam = () => <svg viewBox="0 0 24 24" {...P}><rect x="3" y="7" width="13" height="10" rx="2" /><path d="M16 11l5-3v8l-5-3" /></svg>
export const Sound = ({ on }: { on: boolean }) => <svg viewBox="0 0 24 24" {...P}><path d="M4 9v6h4l5 4V5L8 9z" />{on && <path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />}</svg>
export const Skip = () => <svg viewBox="0 0 24 24" {...P}><path d="M5 5l9 7-9 7zM18 5v14" /></svg>
export const Chat = () => <svg viewBox="0 0 24 24" {...P}><path d="M4 5h16v11H9l-5 4z" /></svg>
export const Hang = () => <svg viewBox="0 0 24 24" {...P}><path d="M3 15c5-5 13-5 18 0l-2 3-4-1v-3a10 10 0 0 0-6 0v3l-4 1z" /></svg>
export const Send = () => <svg viewBox="0 0 24 24" {...P} strokeWidth={2.2}><path d="M4 12h15M13 6l6 6-6 6" /></svg>
export const Dice = () => <svg viewBox="0 0 24 24" {...P}><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1.3" /><circle cx="15" cy="15" r="1.3" /><circle cx="15" cy="9" r="1.3" /><circle cx="9" cy="15" r="1.3" /></svg>
export const Pen = () => <svg viewBox="0 0 24 24" {...P}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M14 6l4 4" /></svg>
export const Camera = () => <svg viewBox="0 0 24 24" {...P}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
export const Left = () => <svg viewBox="0 0 24 24" {...P}><path d="M15 5l-7 7 7 7" /></svg>
export const Right = () => <svg viewBox="0 0 24 24" {...P}><path d="M9 5l7 7-7 7" /></svg>
export const TvFace = () => (
  <svg width="40" height="40" viewBox="0 0 16 16" shapeRendering="crispEdges"><rect x="2" y="3" width="12" height="10" fill="#E8E2D2" /><rect x="3" y="4" width="8" height="8" fill="#1B1D22" /><rect x="4" y="7" width="2" height="2" fill="#E3A94F" /><rect x="8" y="7" width="2" height="2" fill="#E3A94F" /><rect x="12" y="5" width="1" height="1" fill="#6b6b6b" /><rect x="12" y="7" width="1" height="1" fill="#6b6b6b" /></svg>
)
