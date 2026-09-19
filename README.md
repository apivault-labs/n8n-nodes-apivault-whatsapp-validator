# n8n-nodes-apivault-whatsapp-validator

An [n8n](https://n8n.io) community node for **WhatsApp Number Validator**, powered by the [`apivault_labs/whatsapp-number-validator` Apify Actor](https://apify.com/apivault_labs/whatsapp-number-validator).

Run WhatsApp Number Validator through the hosted Apify Actor and return structured Dataset results.

The node is a thin connector: collection, analysis, retries and billing run in the hosted Actor. It contains no private scraper implementation or embedded credentials.

## Installation

1. Open **Settings → Community Nodes** in your n8n instance.
2. Select **Install**.
3. Enter `n8n-nodes-apivault-whatsapp-validator` and confirm.

## Credentials

Create an **Apify API** credential in n8n and paste your personal token from [Apify Console → Integrations](https://console.apify.com/account/integrations). The token is sent to Apify as a bearer credential and is never bundled with this package.

## Usage

Add **WhatsApp Number Validator** to a workflow, fill the public Actor inputs below, and execute the node. Every Dataset result becomes one n8n item, so it can flow into Sheets, databases, CRMs, alerts or your own code. The node respects n8n's **Continue On Fail** behavior.

## Ready-to-import workflow

Import [`examples/quickstart-workflow.json`](examples/quickstart-workflow.json), select your Apify API credential in the Actor node, replace the sample business inputs and run it. The workflow returns destination-ready rows without exposing Actor internals.

| Input | Type | Description |
|---|---|---|
| `workflow` | `string` | Choose how numbers are supplied. Auto merges both input fields and preserves existing API behavior. |
| `phoneNumbers` | `array` | Phone numbers to validate (one per line). Include the country code with a leading + when possible, e.g. +14155552671. Numbers without a + are parsed using the Default country below |
| `numbersText` | `string` | Optional. Paste many numbers at once (one per line, or comma/semicolon separated — e.g. a copied spreadsheet column). They are merged with the list above and de-duplicated. |
| `defaultCountry` | `string` | ISO 3166 alpha-2 region code (US, GB, BR, IN, DE, ...) used to interpret numbers that don't start with +. Leave empty to require + on every number. |
| `outputPreset` | `string` | Full is best for AI and APIs. CSV is flat for spreadsheets. Both keeps full JSON and adds a nested CSV-friendly record. |
| `exportFormat` | `string` | Backwards-compatible API option. Leave at default to use Output preset above. |

## Pricing

The package is free. Actor runs are billed by Apify using the pricing shown on the [Actor page](https://apify.com/apivault_labs/whatsapp-number-validator); platform usage may also apply.

## Resources

- [Actor and live input schema](https://apify.com/apivault_labs/whatsapp-number-validator)
- [Source repository](https://github.com/apivault-labs/n8n-nodes-apivault-whatsapp-validator)
- [n8n community-node documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

MIT. The hosted Actor is a separate paid service governed by Apify terms.
