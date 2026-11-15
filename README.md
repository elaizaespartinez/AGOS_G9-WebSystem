# _G9-WebSystem
Disaster Management Website 

Just testing how to implement API keys for the chatbot

## DRRM chatbot setup

The browser sends chat messages to the deployed server. The LLM key stays in Render and is never shipped to the client.

### Run locally without a key

1. Edit `client/src/config/api.js` and replace `REPLACE_WITH_RENDER_URL` with the deployed Render server URL.
2. Start the frontend:

	```powershell
	cd client
	npm.cmd install
	npm.cmd run dev
	```

### Deploy the server to Render

Create a Render Web Service with:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment variables: `GROQ_API`, `GEMINI_API`, and/or `OPEN_ROUTER_API`
- `API_KEY` is also accepted as a Groq key
- Optional environment variable: `ALLOWED_ORIGIN` = your frontend origin (default `*`)

The server exposes `GET /health` and `POST /api/chat` with `{ "message": "..." }`.

For now, wala pa masyado gaurd rails so pwede ma off topic ung chatbot
![AGOS Chatbot](<docs(not_permanent)/images/agos-chatbottest.png>)

## Flood Map

Test palang, no real flood data pa.
