# pi-kagi-api
Kagi API extension for pi - tools for running FastGPT and Universal Summarizer

## Usage
You need to generate an API Token in the [Advanced Settings](https://kagi.com/settings/api) page.

The extension will load the token from the following locations:
* `KAGI_API_TOKEN` environment variable (*recommended for security*)
* `.pi/kagi-config.json` in your local project (or the closest parent directory)
* `.pi/kagi-config.json` in you home directory

### Commands
* `/kagi-login` will prompt you for your API Token and save it in your config (stored in plain-text)
* `/kagi-settings` allows you to change your settings (currently, it supports changing the API used for searching the web)

### Tools
* `web-search` uses FastGPT or Enrichment API to search on Kagi (Search API is currently in closed beta, support is available, but untested)
* `universal-summarizer` uses the Universal Summarizer in order to give a summary of a given URL

## Notes
Both tools will use pre-paid credits from your Kagi account.

Pricing for the tools (as of now) is:
* $15 USD per 1000 queries (for FastGPT)
* $20 USD per 1000 queries (for Enrichment API)
* $25 USD per 1000 queries (for Search API closed beta)
* $0.030 USD per 1,000 tokens processed (for Universal Summarizer)

As per docs, users with [Ultimate Plan](https://help.kagi.com/kagi/plans/ultimate-plan.html) get discounts for the API usage ($0.025 per 1,000 tokens for Universal Summarizer).

*Finally, I'm not affiliated with Kagi. I just use their services.*

## References
* https://help.kagi.com/kagi/api/fastgpt.html
* https://help.kagi.com/kagi/api/summarizer.html
