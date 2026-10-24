"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDown } from "lucide-react";
import styles from "./Dropdown.module.css";

export type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type DropdownProps = {
  options: DropdownOption[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

function normalize(options: DropdownOption[] | string[]): DropdownOption[] {
  return options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt,
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <ChevronDown
      className={`${styles.chevron}${open ? ` ${styles.chevronOpen}` : ""}`}
      size={9}
      strokeWidth={1.25}
      absoluteStrokeWidth={false}
      aria-hidden
    />
  );
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select",
  id,
  className,
  disabled = false,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const list = normalize(options);
  const autoId = useId();
  const listboxId = `${id ?? autoId}-listbox`;
  const buttonId = id ?? autoId;

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = list.find((o) => o.value === value);
  const enabledIndexes = list
    .map((o, i) => (o.disabled ? -1 : i))
    .filter((i) => i >= 0);

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const openMenu = (preferEnd = false) => {
    if (disabled) return;
    const selectedIdx = list.findIndex((o) => o.value === value && !o.disabled);
    if (selectedIdx >= 0) {
      setActiveIndex(selectedIdx);
    } else if (preferEnd) {
      setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
    } else {
      setActiveIndex(enabledIndexes[0] ?? -1);
    }
    setOpen(true);
  };

  const selectAt = (index: number) => {
    const opt = list[index];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    close();
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        rootRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const moveActive = (delta: number) => {
    if (!enabledIndexes.length) return;
    const currentPos = enabledIndexes.indexOf(activeIndex);
    const nextPos =
      currentPos < 0
        ? delta > 0
          ? 0
          : enabledIndexes.length - 1
        : (currentPos + delta + enabledIndexes.length) % enabledIndexes.length;
    setActiveIndex(enabledIndexes[nextPos]);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openMenu(false);
        else moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openMenu(true);
        else moveActive(-1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) openMenu(false);
        else if (activeIndex >= 0) selectAt(activeIndex);
        break;
      case "Home":
        if (open) {
          event.preventDefault();
          setActiveIndex(enabledIndexes[0] ?? -1);
        }
        break;
      case "End":
        if (open) {
          event.preventDefault();
          setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={rootRef}
      className={`${styles.root}${open ? ` ${styles.open}` : ""}${disabled ? ` ${styles.disabled}` : ""}${className ? ` ${className}` : ""}`}
    >
      <button
        type="button"
        id={buttonId}
        className={styles.trigger}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu(false))}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={selected ? styles.value : styles.placeholder}>
          {selected?.label ?? placeholder}
        </span>
        <Chevron open={open} />
      </button>

      <div className={styles.panel}>
        <ul
          ref={listRef}
          id={listboxId}
          className={styles.list}
          role="listbox"
          aria-labelledby={buttonId}
          tabIndex={-1}
        >
          {list.map((opt, index) => {
            const selectedOpt = opt.value === value;
            const active = index === activeIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={selectedOpt}
                aria-disabled={opt.disabled || undefined}
                className={`${styles.option}${selectedOpt ? ` ${styles.optionSelected}` : ""}${active ? ` ${styles.optionActive}` : ""}${opt.disabled ? ` ${styles.optionDisabled}` : ""}`}
                onMouseEnter={() => {
                  if (!opt.disabled) setActiveIndex(index);
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  if (!opt.disabled) selectAt(index);
                }}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
