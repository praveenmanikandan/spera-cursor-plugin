# Security

Report security issues privately to `support@spera.bot`. Do not open a public issue containing tokens,
private project data, authentication details, or an unpatched vulnerability.

The plugin stores no credentials in this repository. Authentication is handled by the production Spera
OAuth flow, and each client stores the resulting authorization according to its own product behavior.
The portable `mcp.json` contains only a public HTTPS endpoint and the non-secret authoring-mode header.
