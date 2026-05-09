export function SheepIcon({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={style}
    >
      <path d="M14.5 13.5c-1-1.5-2.5-1.5-3.5-1.5s-2.5 0-3.5 1.5M10.5 18H9a3 3 0 0 1-3-3v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1a3 3 0 0 1-3 3h-1.5M7 14H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1M17 14h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1M12 4a3 3 0 0 0-3 3v1h6V7a3 3 0 0 0-3-3z"/>
    </svg>
  );
}
