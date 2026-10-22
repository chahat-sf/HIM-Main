"use client";

import styles from "./OutfitPanel.module.css";

const DEFAULT_OUTFITS = ["Outfit 1", "Outfit 2", "Outfit 3"];

const STATS = [
  { label: "Style", value: 0.75 },
  { label: "Comfort", value: 0.5 },
  { label: "Confidence", value: 0.85 },
] as const;

export const OUTFIT_COUNT = 3;

export default function OutfitPanel({
  selected,
  onSelect,
  outfits = DEFAULT_OUTFITS,
}: {
  selected: number;
  onSelect: (index: number) => void;
  outfits?: string[];
}) {
  const items = outfits.slice(0, OUTFIT_COUNT);

  return (
    <div className={styles.stack} data-cast>
      <section className={styles.panel} aria-label="Outfit">
        <h2 className={styles.title}>Outfit</h2>
        <ul className={styles.list} role="listbox" aria-label="Choose outfit">
          {items.map((name, i) => (
            <li key={name}>
              <button
                type="button"
                className={styles.option}
                role="option"
                aria-selected={selected === i}
                aria-pressed={selected === i}
                onClick={() => onSelect(i)}
                onPointerDown={(event) => event.stopPropagation()}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel} aria-label="Stats">
        <div className={styles.stats}>
          {STATS.map((stat) => (
            <div key={stat.label} className={styles.statRow}>
              <span className={styles.statLabel}>{stat.label}</span>
              <div
                className={styles.track}
                role="meter"
                aria-label={stat.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(stat.value * 100)}
              >
                <span
                  className={styles.fill}
                  style={{ width: `${Math.round(stat.value * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
