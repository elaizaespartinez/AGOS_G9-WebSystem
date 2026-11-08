# _G9-WebSystem
Disaster Management Website 

Just testing how to implement API keys for the chatbot

## DRRM chatbot setup

The React client calls `POST /api/chat`; provider keys stay in the Node server and are never exposed to the browser.

1. Copy `.env.example` to `.env` in the repository root.
2. Add any available keys for Gemini, Groq, and OpenRouter. 

Dko pa alam kung pano macloclone but I think the best way is to host na lang natin yung backend (Render, Railway, or Vercel) tapos doon natin ilagay yung mga API keys. So yung app, nagsesend lang ng message sa backend natin, then yung backend na bahala tumawag sa Gemini, Groq, or OpenRouter. Dko kse alam kung pano di maexpose ung API keys.

Things to do:
   - Keys sa `.env` lang, at nasa `.gitignore` yung `.env` para di mapush. May `.env.example` na placeholders lang.
   - Lagyan din ng rate limit at max length ng message, kasi pwedeng gamitin ng kahit sino yung backend URL at baka maubos yung free quota natin.
   - Kung may gustong magrun ng backend sa sarili nilang laptop, gagamit sila ng sarili nilang free keys sa `.env` nila.
  

3. Start the backend in one terminal:

	```powershell
	cd server
	npm install
	npm start
	```

4. Start the frontend in a second terminal:

	```powershell
	cd client
	npm.cmd install
	npm.cmd run dev
	```

The chatbot tries Groq first, then Gemini, then OpenRouter. Temporary provider failures are retried twice with backoff before moving to the next provider. Run the mocked fallback tests with `cd server; npm test`.

For now, wala pa masyado gaurd rails so pwede ma off topic ung chatbot
![AGOS Chatbot](<docs(not_permanent)/images/agos-chatbottest.png>)

## Flood Map

Test palang, no real flood data pa.
