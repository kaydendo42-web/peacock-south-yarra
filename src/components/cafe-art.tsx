export function CoffeeDrawing({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 150 150"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M34 60h77l-10 49c-3 19-54 19-57 0L34 60Z"
          fill="var(--paper)"
        />
        <ellipse cx="73" cy="60" rx="39" ry="10" fill="var(--pink)" />
        <path d="M112 69c30-9 29 33-7 32M32 119c-27 14 4 24 43 24s67-12 34-25M55 82l4 23M76 82v24M52 38c-14-12 17-17 4-30M78 38c-14-12 17-17 4-30M103 38c-14-12 17-17 4-30" />
      </g>
    </svg>
  );
}
export function LeafDrawing({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 130 150"
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M63 143c-2-63 10-102 18-131M69 90C30 102 6 76 18 48c28-1 51 13 51 42ZM73 69C57 45 61 16 89 4c21 25 18 49-16 65ZM66 118c25 4 51-13 53-45-37-2-54 12-53 45Z"
          fill="var(--mint)"
        />
        <path d="M34 64l32 23M86 28 75 62M101 90l-34 24" />
      </g>
    </svg>
  );
}
