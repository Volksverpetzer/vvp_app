/**
 * Builds the payload for an EPC QR code (a.k.a. GiroCode), following the
 * European Payments Council standard EPC069-12 v2 ("SCT" service).
 *
 * German and Austrian banking apps can scan this code to pre-fill a SEPA
 * credit transfer form — from which the user can then set up a standing order
 * ("Dauerauftrag"). The payload is generated entirely on-device; no data
 * leaves the phone.
 *
 * @see https://en.wikipedia.org/wiki/EPC_QR_code
 * @see https://www.europeanpaymentscouncil.eu/document-library/guidance-documents/quick-response-code-guidelines-enable-data-capture-initiation
 */
export interface GiroCodeInput {
  /** Account holder / beneficiary name (max. 70 chars). */
  name: string;
  /** Recipient IBAN — spaces are stripped automatically. */
  iban: string;
  /** Optional BIC. Since SEPA migration (2016) it may be left empty. */
  bic?: string;
  /** Unstructured remittance info / Verwendungszweck (max. 140 chars). */
  remittance?: string;
  /** Amount in EUR. Omit (or pass a non-positive value) to leave it open. */
  amount?: number;
}

const MAX_NAME_LENGTH = 70;
const MAX_REMITTANCE_LENGTH = 140;
// EPC spec limits the amount to 0.01 – 999999999.99 EUR.
const MAX_AMOUNT = 999999999.99;

/** Formats an amount as the spec requires, e.g. `EUR10.00`. */
const formatAmount = (amount?: number): string => {
  if (!amount || !Number.isFinite(amount) || amount <= 0) return "";
  const clamped = Math.min(amount, MAX_AMOUNT);
  return `EUR${clamped.toFixed(2)}`;
};

export const buildGiroCodePayload = ({
  name,
  iban,
  bic = "",
  remittance = "",
  amount,
}: GiroCodeInput): string => {
  const lines = [
    "BCD", // Service Tag
    "002", // Version (002 makes BIC optional)
    "1", // Character set: 1 = UTF-8
    "SCT", // Identification: SEPA Credit Transfer
    bic.replaceAll(/\s/g, ""), // BIC (optional)
    name.slice(0, MAX_NAME_LENGTH), // Beneficiary name
    iban.replaceAll(/\s/g, ""), // Beneficiary IBAN
    formatAmount(amount), // Amount (optional)
    "", // Purpose code (unused)
    "", // Structured reference (unused, mutually exclusive with next)
    remittance.slice(0, MAX_REMITTANCE_LENGTH), // Unstructured remittance info
  ];

  // Trailing empty fields may be dropped per the spec.
  return lines.join("\n").replace(/\n+$/, "");
};
