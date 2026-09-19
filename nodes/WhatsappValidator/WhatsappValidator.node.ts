import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const ACTOR_ID = 'apivault_labs~whatsapp-number-validator';

export class WhatsappValidator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WhatsApp Number Validator',
		name: 'whatsappValidator',
		icon: 'file:whatsappvalidator.svg',
		group: ['transform'],
		version: 1,
		description: 'Run WhatsApp Number Validator through the hosted Apify Actor and return structured Dataset results.',
		defaults: { name: 'WhatsApp Number Validator' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'apifyApi', required: true }],
		properties: [
   {
      "displayName": "Workflow",
      "name": "workflow",
      "description": "Choose how numbers are supplied. Auto merges both input fields and preserves existing API behavior.",
      "type": "options",
      "options": [
         {
            "name": "Auto-detect / merge both",
            "value": "auto"
         },
         {
            "name": "Number list only",
            "value": "list"
         },
         {
            "name": "Pasted text or CSV column only",
            "value": "text"
         }
      ],
      "default": "auto"
   },
   {
      "displayName": "Phone numbers",
      "name": "phoneNumbers",
      "description": "Phone numbers to validate (one per line). Include the country code with a leading + when possible, e.g. +14155552671. Numbers without a + are parsed using the Default country below. (comma or new-line separated)",
      "type": "string",
      "default": ""
   },
   {
      "displayName": "…or paste a list / CSV column",
      "name": "numbersText",
      "description": "Optional. Paste many numbers at once (one per line, or comma/semicolon separated — e.g. a copied spreadsheet column). They are merged with the list above and de-duplicated.",
      "type": "string",
      "default": ""
   },
   {
      "displayName": "Default country (for numbers without +)",
      "name": "defaultCountry",
      "description": "ISO 3166 alpha-2 region code (US, GB, BR, IN, DE, ...) used to interpret numbers that don't start with +. Leave empty to require + on every number.",
      "type": "string",
      "default": "US"
   },
   {
      "displayName": "Output preset",
      "name": "outputPreset",
      "description": "Full is best for AI and APIs. CSV is flat for spreadsheets. Both keeps full JSON and adds a nested CSV-friendly record.",
      "type": "options",
      "options": [
         {
            "name": "Full JSON (recommended for AI)",
            "value": "full"
         },
         {
            "name": "CSV-friendly",
            "value": "csv"
         },
         {
            "name": "Full JSON + CSV fields",
            "value": "both"
         }
      ],
      "default": "full"
   },
   {
      "displayName": "Legacy export format override",
      "name": "exportFormat",
      "description": "Backwards-compatible API option. Leave at default to use Output preset above.",
      "type": "options",
      "options": [
         {
            "name": "Default (full JSON)",
            "value": "default"
         },
         {
            "name": "CSV-friendly columns",
            "value": "csv"
         },
         {
            "name": "Both",
            "value": "both"
         }
      ],
      "default": "default"
   }
],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		for (let i = 0; i < items.length; i++) {
			try {
				const body: Record<string, unknown> = {};
				body["workflow"] = this.getNodeParameter("workflow", i);
				{ const _v = this.getNodeParameter("phoneNumbers", i, '') as string; const _a = _v.split(/[,\n]/).map(s=>s.trim()).filter(s=>s.length>0); if (_a.length) body["phoneNumbers"] = _a; }
				body["numbersText"] = this.getNodeParameter("numbersText", i);
				body["defaultCountry"] = this.getNodeParameter("defaultCountry", i);
				body["outputPreset"] = this.getNodeParameter("outputPreset", i);
				body["exportFormat"] = this.getNodeParameter("exportFormat", i);
				const options: IRequestOptions = {
					method: 'POST' as IHttpRequestMethods,
					url: `https://api.apify.com/v2/acts/${ACTOR_ID}/runs`,
					body,
					json: true,
				};
				const started = await this.helpers.requestWithAuthentication.call(this, 'apifyApi', options);
				const runId = started?.data?.id;
				if (!runId) throw new NodeOperationError(this.getNode(), 'Apify did not return a run ID', { itemIndex: i });
				let run = started.data;
				const deadline = Date.now() + 60 * 60 * 1000;
				while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) {
					if (Date.now() >= deadline) throw new NodeOperationError(this.getNode(), 'Waiting timed out; check the existing run in Apify before retrying', { itemIndex: i });
					const polled = await this.helpers.requestWithAuthentication.call(this, 'apifyApi', { method: 'GET', url: `https://api.apify.com/v2/actor-runs/${runId}?waitForFinish=20`, json: true });
					run = polled.data;
				}
				if (run.status !== 'SUCCEEDED') throw new NodeOperationError(this.getNode(), 'Apify run ended with status ' + run.status, { itemIndex: i });
				let offset = 0;
				while (true) {
					const page = await this.helpers.requestWithAuthentication.call(this, 'apifyApi', { method: 'GET', url: `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?clean=1&limit=1000&offset=${offset}`, json: true });
					if (!Array.isArray(page)) throw new NodeOperationError(this.getNode(), 'Unexpected Dataset response', { itemIndex: i });
					for (const result of page) returnData.push({ json: result as IDataObject, pairedItem: { item: i } });
					offset += page.length;
					if (page.length < 1000) break;
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}
		return [returnData];
	}
}
