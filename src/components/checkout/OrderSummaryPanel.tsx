"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { toCardImage } from "@/lib/card-image";

const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export type OrderSummaryLine = {
	name: string;
	size?: string;
	color?: string;
	qty: number;
	/** Unit price in rupees (not paise). */
	price: number;
	image: string;
};

export type OrderSummaryPanelProps = {
	title?: string;
	lines: OrderSummaryLine[];
	subtotal: number;
	tax: number;
	total: number;
	itemCount: number;
	/** Extra rows below totals (CTAs, notes). */
	footer?: ReactNode;
	className?: string;
};

function fmt(n: number) {
	return "₹ " + n.toLocaleString("en-IN");
}

/**
 * Shared order lines + GST invoice breakdown for checkout / success / failed.
 */
export default function OrderSummaryPanel({
	title = "ORDER SUMMARY",
	lines,
	subtotal,
	tax,
	total,
	itemCount,
	footer,
	className = "",
}: OrderSummaryPanelProps) {
	return (
		<aside className={`osp-panel osp-summary ${className}`.trim()}>
			<p className="osp-title">{title}</p>

			{lines.length === 0 ? (
				<p className="osp-empty">No items</p>
			) : (
				<ul className="osp-lines">
					{lines.map((item, index) => (
						<li
							key={`${item.name}-${item.size}-${item.color}-${index}`}
							className="osp-line"
						>
							<div className="osp-thumb">
								{item.image ? (
									<Image
										src={toCardImage(item.image)}
										alt=""
										fill
										sizes="64px"
										style={{ objectFit: "cover" }}
									/>
								) : null}
							</div>
							<div className="osp-line-meta">
								<p className="osp-line-name">{item.name}</p>
								<p className="osp-line-detail">
									{[item.size, item.color].filter(Boolean).join(" · ")}
									{" · "}
									Qty {item.qty}
								</p>
							</div>
							<p className="osp-line-price">{fmt(item.price * item.qty)}</p>
						</li>
					))}
				</ul>
			)}

			<div className="osp-totals">
				<div>
					<span>Taxable value ({itemCount} items)</span>
					<span>{fmt(subtotal)}</span>
				</div>
				<div>
					<span>Shipping</span>
					<span className="osp-free">Free</span>
				</div>
				<div>
					<span>GST (18%)</span>
					<span>{fmt(tax)}</span>
				</div>
				<div className="osp-total">
					<span>Total</span>
					<span>{fmt(total)}</span>
				</div>
				<p className="osp-incl-note">Inclusive of 18% GST</p>
			</div>

			{footer}

			<style jsx>{`
				.osp-panel {
					border: 1px solid rgba(255, 255, 255, 0.28);
					padding: clamp(20px, 3vw, 28px);
					font-family: ${SANS};
					color: #fff;
				}
				.osp-title {
					margin: 0 0 20px;
					font-size: 11px;
					letter-spacing: 0.22em;
					color: rgba(255, 255, 255, 0.55);
				}
				.osp-empty {
					margin: 0 0 16px;
					font-size: 13px;
					color: rgba(255, 255, 255, 0.45);
				}
				.osp-lines {
					list-style: none;
					margin: 0;
					padding: 0;
					display: grid;
					gap: 16px;
				}
				.osp-line {
					display: grid;
					grid-template-columns: 64px 1fr auto;
					gap: 14px;
					align-items: start;
				}
				.osp-thumb {
					position: relative;
					width: 64px;
					height: 80px;
					background: rgba(255, 255, 255, 0.06);
					overflow: hidden;
				}
				.osp-line-name {
					margin: 0 0 4px;
					font-size: 13px;
					letter-spacing: 0.04em;
				}
				.osp-line-detail {
					margin: 0;
					font-size: 11px;
					letter-spacing: 0.06em;
					color: rgba(255, 255, 255, 0.45);
				}
				.osp-line-price {
					margin: 0;
					font-size: 13px;
					white-space: nowrap;
				}
				.osp-totals {
					margin-top: 24px;
					padding-top: 18px;
					border-top: 1px solid rgba(255, 255, 255, 0.14);
					display: grid;
					gap: 10px;
					font-size: 12px;
					letter-spacing: 0.04em;
					color: rgba(255, 255, 255, 0.55);
				}
				.osp-totals > div {
					display: flex;
					justify-content: space-between;
					gap: 12px;
				}
				.osp-free {
					color: #fff;
					font-weight: 600;
				}
				.osp-total {
					margin-top: 6px;
					padding-top: 12px;
					border-top: 1px solid rgba(255, 255, 255, 0.14);
					color: #fff;
					font-size: 13px;
					font-weight: 500;
				}
				.osp-incl-note {
					margin: 2px 0 0;
					font-size: 11px;
					letter-spacing: 0.04em;
					color: rgba(255, 255, 255, 0.4);
					text-align: right;
				}
			`}</style>
		</aside>
	);
}
