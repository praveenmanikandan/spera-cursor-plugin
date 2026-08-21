# Data handling

The plugin sends only user-requested MCP tool calls to `https://api.spera.bot/mcp`. Depending on the
selected tool, those calls can contain Spera project identifiers, strategy or module content, backtest
parameters, project knowledge, and documentation. Responses can contain the corresponding Spera data
and backtest results.

Authentication uses Spera OAuth with explicit scopes. No access token or client secret is included in
this repository. The plugin does not request exchange credentials and does not provide live-deployment
or live-trading tools.

Spera uses data received through this integration to provide and secure the requested service. Spera
does not use plugin content or client user data received through this integration to train machine-
learning models. Account controls, retention, and deletion requests are governed by the
[Spera privacy policy](https://www.spera.bot/privacy) and [terms](https://www.spera.bot/terms).

Report privacy or security concerns to `support@spera.bot`. Do not send tokens, private keys, exchange
credentials, or unnecessary private project data in support messages or public issues.
