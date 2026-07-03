import { renderSVG } from "uqr";

type TableQrProps = {
  /** Absolute URL encoded in the QR code. */
  url: string;
  /** Rendered size; the SVG scales losslessly for print. */
  className?: string;
};

/**
 * Server-rendered QR code as an inline SVG (no client JS, crisp at any
 * print size). See ADR-011 for the library choice.
 */
export function TableQr({ url, className }: TableQrProps) {
  const svg = renderSVG(url, { ecc: "M", border: 2 });

  return (
    <div
      role="img"
      aria-label={`Código QR para ${url}`}
      className={className}
      // The SVG is generated locally by uqr from our own URL — no user HTML.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
