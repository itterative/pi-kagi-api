# pi-kagi-api
Kagi API extension for pi - tools for running FastGPT and Universal Summarizer

## Usage
You need to generate an API Token in the [Advanced Settings](https://kagi.com/settings/api) page.

The extension will load the token from the following locations:
* `KAGI_API_TOKEN` environment variable (*recommended for security*)
* `.pi/kagi-config.json` in your local project
* `.pi/kagi-config.json` in you home directory

### Commands
* `/kagi-login` will prompt you for your API Token and save it in `~/.pi/kagi-config.json` (stored in plain-text)

### Tools
* `web-search` uses FastGPT to search on Kagi (Search API is currently in closed beta, support might be added once it is publicly available)
* `universal-summarizer` uses the Universal Summarizer in order to give a summary of a given URL

## Notes
Both tools will use pre-paid credits from your Kagi account.

Pricing for the tools (as of now) is:
* $15 USD per 1000 queries (for FastGPT)
* $0.030 USD per 1,000 tokens processed (for Universal Summarizer)

As per docs, users with [Ultimate Plan](https://help.kagi.com/kagi/plans/ultimate-plan.html) get discounts for the API usage ($0.025 per 1,000 tokens for Universal Summarizer).

*Finally, I'm not affiliated with Kagi. I just use their services.*

## References
* https://help.kagi.com/kagi/api/fastgpt.html
* https://help.kagi.com/kagi/api/summarizer.html
