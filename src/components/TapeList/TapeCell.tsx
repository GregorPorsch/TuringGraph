// src/components/TapeList/TapeCell.tsx
import styles from '@components/TapeList/TapeList.module.css';

export type TapeCellProps = {
  value: string; //This is the value of the tape cell, should be a character
  position: number; //This is the position of the tape cell, --> indexed as the head
};

export function TapeCell({ value, position }: TapeCellProps) {
  const translate = -40 + position * 50;

  return (
    <g className={styles.tapecell} transform={`translate(${translate})`}>
      <rect width="50" height="50"></rect>
      <text x="25" y="33">
        {value}
      </text>
    </g>
  );
}
