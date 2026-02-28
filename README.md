# ⬡ AI Study Buddy

A clean, minimal AI-powered study assistant built with Node.js + Express + Vanilla JS.  
Powered by **Mistral-7B** via the **Hugging Face Inference API** (free tier).

---

## ✨ Features

- 📖 **3 Explanation Modes** — Simple, Exam, and Analogy
- ✨ **Auto Summary** — Concise key-point summaries
- 📝 **5 MCQs** — Multiple choice questions with answers highlighted
- 🃏 **5 Flashcards** — Q&A format for quick revision
- 💾 **Download .txt** — Save your study material
- 🕒 **History** — Last 15 queries saved in browser (localStorage)
- 🌙 **Dark Mode** — Toggle with one click
- 📱 **Responsive** — Works on mobile

---

## 🚀 Setup & Running

### 1. Clone or download this project

```bash
git clone <repo-url>
cd ai-study-buddy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your Hugging Face API key

Copy the example env file and add your key:

```bash
cp .env.example .env
```

Then open `.env` and replace the placeholder:

```
HF_API_KEY=your_actual_api_key_here
```

**How to get a free Hugging Face API key:**
1. Go to [https://huggingface.co/join](https://huggingface.co/join) and create a free account
2. Visit [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
3. Click **"New token"** → choose **Read** access → copy the token
4. Paste it as the value of `HF_API_KEY` in your `.env` file

### 4. Start the server

```bash
npm start
```

Open your browser at **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
ai-study-buddy/
├── server.js          # Express backend + /generate API route
├── package.json       # Dependencies & scripts
├── .env               # Your API key (never commit this!)
├── .env.example       # Template for .env
├── .gitignore
├── README.md
└── public/
    ├── index.html     # App UI
    ├── style.css      # Styling
    └── script.js      # Frontend logic
```

---

## 🔧 How It Works

1. User enters a topic or pastes notes and picks an explanation mode
2. Frontend sends a `POST /generate` request to the Express server
3. Server builds a structured prompt and calls the Hugging Face Inference API
4. Mistral-7B generates the explanation, summary, MCQs, and flashcards
5. Frontend parses the structured response and renders each section

### Mode Prompts

| Mode | Instruction |
|------|-------------|
| Simple | Explain in simple language suitable for a 10th grade student |
| Exam | Explain in structured bullet points for exam preparation |
| Analogy | Explain using real-life analogies |

---

## 💡 Tips

- If you get a **503 error**, the model is warming up — wait 20 seconds and retry
- Use **Ctrl + Enter** in the text area to generate quickly
- Click any **history item** to reload a previous result
- The **Download .txt** button saves all generated content to a file

---

## 📄 License

MIT — free to use and modify.
