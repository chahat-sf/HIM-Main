"use client";

import {
	useDeferredValue,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
} from "react";
import cities from "@/data/cities.json";
import styles from "./creators.module.css";

type CityOption = { value: string; label: string };

const OPTIONS: CityOption[] = [
	...cities,
	{ value: "Other", label: "Other" },
];
const MAX_RESULTS = 12;

type CityAutocompleteProps = {
	value: string;
	onChange: (value: string) => void;
	required?: boolean;
	name?: string;
};

export default function CityCountryAutocomplete({
	value,
	onChange,
	required = false,
	name = "cityCountry",
}: CityAutocompleteProps) {
	const listId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const [query, setQuery] = useState(value);
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const deferredQuery = useDeferredValue(query.trim().toLowerCase());

	const suggestions = useMemo(() => {
		if (!deferredQuery) return [];
		const starts: CityOption[] = [];
		const contains: CityOption[] = [];
		for (const opt of OPTIONS) {
			const label = opt.label.toLowerCase();
			if (label.startsWith(deferredQuery)) starts.push(opt);
			else if (label.includes(deferredQuery)) contains.push(opt);
			if (starts.length >= MAX_RESULTS) break;
		}
		return [...starts, ...contains].slice(0, MAX_RESULTS);
	}, [deferredQuery]);

	useEffect(() => {
		setQuery(value);
	}, [value]);

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: MouseEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", onPointerDown);
		return () => document.removeEventListener("mousedown", onPointerDown);
	}, [open]);

	useEffect(() => {
		setActiveIndex(0);
	}, [deferredQuery]);

	const selectOption = (next: string) => {
		onChange(next);
		setQuery(next);
		setOpen(false);
	};

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
			if (suggestions.length) setOpen(true);
			return;
		}
		if (!open || !suggestions.length) {
			if (event.key === "Escape") setOpen(false);
			return;
		}

		if (event.key === "ArrowDown") {
			event.preventDefault();
			setActiveIndex((i) => (i + 1) % suggestions.length);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
		} else if (event.key === "Enter") {
			event.preventDefault();
			const pick = suggestions[activeIndex];
			if (pick) selectOption(pick.value);
		} else if (event.key === "Escape") {
			event.preventDefault();
			setOpen(false);
		}
	};

	const showList = open && suggestions.length > 0;

	return (
		<div className={styles.autocomplete} ref={rootRef}>
			<input
				type="text"
				name={name}
				role="combobox"
				aria-expanded={showList}
				aria-controls={listId}
				aria-autocomplete="list"
				aria-activedescendant={
					showList ? `${listId}-option-${activeIndex}` : undefined
				}
				autoComplete="address-level2"
				placeholder="Start typing a city / country"
				value={query}
				required={required}
				onChange={(e) => {
					const next = e.target.value;
					setQuery(next);
					onChange(next);
					setOpen(true);
				}}
				onFocus={() => setOpen(true)}
				onKeyDown={onKeyDown}
			/>
			{showList ? (
				<ul id={listId} className={styles.autocompleteList} role="listbox">
					{suggestions.map((opt, index) => (
						<li
							key={opt.value}
							id={`${listId}-option-${index}`}
							role="option"
							aria-selected={index === activeIndex}
							className={
								index === activeIndex
									? `${styles.autocompleteOption} ${styles.autocompleteOptionActive}`
									: styles.autocompleteOption
							}
							onMouseEnter={() => setActiveIndex(index)}
							onMouseDown={(e) => {
								e.preventDefault();
								selectOption(opt.value);
							}}
						>
							{opt.label}
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
