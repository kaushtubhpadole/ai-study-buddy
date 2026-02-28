# AI Study Buddy

A web app I built to help with studying. You paste in a topic or your notes, pick how you want it explained, and it generates an explanation, summary, multiple choice questions, and flashcards — all at once.

I got tired of having to look up explanations, then separately find practice questions, then make my own flashcards. This just does all of it in one go.

---

## What it does

- Paste any topic or notes into the text box
- Choose an explanation style:
  - **Simple** — plain English, no jargon
  - **Exam Mode** — bullet points, structured for revision
  - **Analogy Mode** — uses real-life comparisons to explain things
- Hit Generate and you get back:
  - A full explanation
  - A short summary
  - 5 multiple choice questions (with answers)
  - 5 flashcards in Q&A format
- Download everything as a `.txt` file
- Previous searches are saved in your browser so you can go back to them
- Dark mode toggle

---

## Tech stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks)
- **AI:** Groq API — using `llama-3.1-8b-instant`, it's free and fast

---

## Running it locally

You'll need Node.js installed. Download it from [nodejs.org](https://nodejs.org) if you don't have it.

**1. Clone the repo**
```bash
git clone https://github.com/YOUR_USERNAME/ai-study-buddy.git
cd ai-study-buddy
```

**2. Install dependencies**
```bash
npm install
```

**3. Get a Groq API key**

Go to [console.groq.com](https://console.groq.com), create a free account, and generate an API key. It's free, no credit card needed.

**4. Set up your `.env` file**
```bash
cp .env.example .env
```
Open `.env` and paste your key:
```
GROQ_API_KEY=your_key_here
```

**5. Start the server**
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) and you're good to go.

---

## Project structure

```
ai-study-buddy/
├── server.js        — Express server, handles API calls to Groq
├── package.json
├── .env.example     — copy this to .env and add your key
└── public/
    ├── index.html   — the whole UI
    ├── style.css    — styling, supports dark mode
    └── script.js    — handles requests, parses output, history
```

---

## Notes

- The `.env` file is in `.gitignore` so your API key won't get pushed to GitHub
- Groq's free tier has rate limits — if you hit a 429 error just wait a few seconds
- Works on mobile too

---

## Things I might add later

- [ ] Let you export flashcards as a proper deck (Anki format maybe)
- [ ] Quiz mode where it actually tests you on the MCQs
- [ ] Option to upload a PDF instead of pasting text
