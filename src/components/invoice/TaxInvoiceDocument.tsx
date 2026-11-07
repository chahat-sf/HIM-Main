import {
	formatInvoiceMoney,
	invoiceLineAmounts,
	type InvoiceDocumentModel,
} from "@/lib/invoice-document";

export default function TaxInvoiceDocument({
	model,
}: {
	model: InvoiceDocumentModel;
}) {
	const {
		invoiceNumber,
		orderNumber,
		placedAtLabel,
		currency,
		subtotalCents,
		taxCents,
		totalCents,
		paymentId,
		business,
		gst,
		billTo,
		items,
	} = model;

	return (
		<article className="inv-sheet">
			<header className="inv-header">
				<div className="inv-supplier">
					<p className="inv-doc-label">Tax invoice</p>
					<p className="inv-brand">{business.tradeName}</p>
					<p className="inv-biz-meta">{business.legalName}</p>
					{business.addressLines.map((line) => (
						<p key={line} className="inv-biz-meta">
							{line}
						</p>
					))}
					<p className="inv-biz-meta">
						State: {business.state} ({business.stateCode})
					</p>
					<p className="inv-biz-meta">
						<strong>GSTIN:</strong> {business.gstin}
					</p>
					<p className="inv-biz-meta">
						<strong>PAN:</strong> {business.pan}
					</p>
				</div>
				<div className="inv-meta">
					<p>
						<strong>Invoice no.</strong> {invoiceNumber}
					</p>
					<p>
						<strong>Order ID</strong> #{orderNumber}
					</p>
					<p>
						<strong>Invoice date</strong> {placedAtLabel}
					</p>
					<p>
						<strong>Place of supply</strong> {gst.placeOfSupply} (
						{gst.placeOfSupplyCode})
					</p>
					<p>
						<strong>Reverse charge</strong> No
					</p>
					{paymentId ? (
						<p>
							<strong>Payment ref</strong> {paymentId}
						</p>
					) : null}
				</div>
			</header>

			<section className="inv-parties">
				<div className="inv-billto">
					<h2>Bill to / Ship to</h2>
					{billTo.map((line) => (
						<p key={line}>{line}</p>
					))}
					<p className="inv-biz-meta">Recipient GSTIN: Unregistered (B2C)</p>
				</div>
			</section>

			<table className="inv-table">
				<thead>
					<tr>
						<th>Description</th>
						<th>HSN/SAC</th>
						<th>Details</th>
						<th className="num">Qty</th>
						<th className="num">Taxable</th>
						<th className="num">Tax</th>
						<th className="num">Amount</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item, index) => {
						const { lineIncl, lineTax, lineTaxable } = invoiceLineAmounts(
							item,
							taxCents,
							totalCents,
						);
						return (
							<tr key={`${item.name}-${index}`}>
								<td>{item.name}</td>
								<td>—</td>
								<td>
									{[item.size, item.color].filter(Boolean).join(" · ") || "—"}
								</td>
								<td className="num">{item.qty}</td>
								<td className="num">
									{formatInvoiceMoney(lineTaxable, currency)}
								</td>
								<td className="num">
									{formatInvoiceMoney(lineTax, currency)}
								</td>
								<td className="num">
									{formatInvoiceMoney(lineIncl, currency)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>

			<div className="inv-totals">
				<div>
					<span>Taxable value</span>
					<span>{formatInvoiceMoney(subtotalCents, currency)}</span>
				</div>
				<div>
					<span>Shipping</span>
					<span>Free</span>
				</div>
				{gst.mode === "intra" ? (
					<>
						<div>
							<span>CGST (9%)</span>
							<span>{formatInvoiceMoney(gst.cgstCents, currency)}</span>
						</div>
						<div>
							<span>SGST (9%)</span>
							<span>{formatInvoiceMoney(gst.sgstCents, currency)}</span>
						</div>
					</>
				) : (
					<div>
						<span>IGST (18%)</span>
						<span>{formatInvoiceMoney(gst.igstCents, currency)}</span>
					</div>
				)}
				<div className="inv-grand">
					<span>Total invoice value</span>
					<span>{formatInvoiceMoney(totalCents, currency)}</span>
				</div>
				<p className="inv-incl-note">Prices are inclusive of 18% GST</p>
			</div>

			<footer className="inv-foot">
				<p>
					This is a computer-generated tax invoice under the CGST / SGST / IGST
					Acts and does not require a physical signature.
				</p>
				<p>
					Supplier: {business.legalName} · GSTIN {business.gstin} ·{" "}
					{business.constitution}
				</p>
				<p>
					For support, quote invoice {invoiceNumber} / order #{orderNumber}.
				</p>
			</footer>
		</article>
	);
}
