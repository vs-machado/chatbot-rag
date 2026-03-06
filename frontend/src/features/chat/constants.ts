import type { ChatModelOption, ChatSession, Message, ResponseSource } from './types/types'

export const NEW_CHAT_TITLE = 'New chat'

export const FALLBACK_CHAT_MODELS: ChatModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    provider: 'google',
  },
  {
    id: 'arcee-ai/trinity-large-preview:free',
    label: 'Trinity Large (Free)',
    provider: 'openrouter',
  },
  {
    id: 'arcee-ai/trinity-mini:free',
    label: 'Trinity Mini (Free)',
    provider: 'openrouter',
  },
  {
    id: 'openai/gpt-oss-120b:free',
    label: 'GPT OSS 120B (Free)',
    provider: 'openrouter',
  },
]

export const DEFAULT_CHAT_MODEL = FALLBACK_CHAT_MODELS[0]

export const DEFAULT_USER_NAME = 'Default User'

export const DEFAULT_USER_AVATAR_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQD5UnORwz1VbrJnNxbbEgOuT7KMEzzr-XTaFy39tTf1L-hhpKXfvqFzRnj0xeu0OG_nlQfO2qo5ZO4TtPnXKPKJLSAS-8oMaS5BQ2cCGo5mgZ4jmKjRSU_D6C7p8P_AXUmPFqdj2-ixMPkTjSf6qaIfDiPxdVe1Yl20xRw0Qh41Pz3m0XHVsThRSFsD0EFiokVS0h83kupoOKFRS53EFEs28HjxZor73lvnbs8Yqp32jCgWTWxT3x21uyFR4NBaL46V7TBH8h'

export const DEFAULT_USER_AVATAR_FALLBACK = 'DU'

export const CHAT_RESPONSE_SOURCE = {
  DATABASE: 'DATABASE',
  MODEL_FALLBACK: 'MODEL_FALLBACK',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
} as const satisfies Record<string, ResponseSource>

export const RESPONSE_SOURCE_BADGE_LABELS: Record<Exclude<ResponseSource, 'NOT_APPLICABLE'>, string> = {
  DATABASE: 'Retrieved from database',
  MODEL_FALLBACK: 'General Knowledge',
}

export const NEW_CHAT_WELCOME_MESSAGE: Omit<Message, "id" | "timestamp"> = {
  role: 'assistant',
  content: '<p>New chat started. How can I help you today?</p>',
}

export const INITIAL_CHAT_SESSIONS: ChatSession[] = [
  {
    id: "session-python-web-scraper",
    title: "Python Web Scraper",
    date: new Date("2026-02-12T10:24:00"),
    messages: [
      {
        id: "assistant-1",
        role: "assistant",
        timestamp: new Date("2026-02-12T10:23:00"),
        content: "<p>Hello! How can I assist you with your coding tasks today?</p>",
      },
      {
        id: "user-1",
        role: "user",
        timestamp: new Date("2026-02-12T10:24:00"),
        content:
          "Can you write a Python script to scrape a website? I need to get the titles from a blog homepage.",
      },
      {
        id: "assistant-2",
        role: "assistant",
        timestamp: new Date("2026-02-12T10:24:30"),
        content:
          "<p>Certainly! You can use the <code>requests</code> library to fetch the webpage and <code>BeautifulSoup</code> to parse the HTML. Here is a simple example:</p><pre><code class=\"language-python\">import requests\nfrom bs4 import BeautifulSoup\n\nurl = 'https://example-blog.com'\nresponse = requests.get(url)\nif response.status_code == 200:\n    soup = BeautifulSoup(response.content, 'html.parser')\n    titles = soup.find_all('h2', class_='post-title')\n    for title in titles:\n        print(title.get_text().strip())\nelse:\n    print(f\"Failed to retrieve the page. Status code: {response.status_code}\")</code></pre><p>Make sure to install the required libraries first:</p><pre><code class=\"language-bash\">pip install requests beautifulsoup4</code></pre>",
      },
    ],
  },
  {
    id: "session-react-component-ideas",
    title: "React Component Ideas",
    date: new Date("2026-02-12T08:42:00"),
    messages: [
      {
        id: "assistant-react-1",
        role: "assistant",
        timestamp: new Date("2026-02-12T08:40:00"),
        content: "<p>Want ideas for a dashboard, a landing page, or both?</p>",
      },
      {
        id: "user-react-1",
        role: "user",
        timestamp: new Date("2026-02-12T08:42:00"),
        content: "Both. I need reusable components with clean props.",
      },
    ],
  },
  {
    id: "session-debugging-dockerfile",
    title: "Debugging Dockerfile",
    date: new Date("2026-02-11T19:20:00"),
    messages: [
      {
        id: "assistant-docker-1",
        role: "assistant",
        timestamp: new Date("2026-02-11T19:18:00"),
        content: "<p>Share your Dockerfile and I can pinpoint image-size issues.</p>",
      },
    ],
  },
  {
    id: "session-marketing-copy-drafts",
    title: "Marketing Copy Drafts",
    date: new Date("2026-02-11T14:02:00"),
    messages: [
      {
        id: "assistant-copy-1",
        role: "assistant",
        timestamp: new Date("2026-02-11T14:02:00"),
        content: "<p>Let's draft three headline options with different tones.</p>",
      },
    ],
  },
  {
    id: "session-sql-query-optimization",
    title: "SQL Query Optimization",
    date: new Date("2026-02-08T09:14:00"),
    messages: [
      {
        id: "assistant-sql-1",
        role: "assistant",
        timestamp: new Date("2026-02-08T09:14:00"),
        content: "<p>Start by sharing your schema and current query plan.</p>",
      },
    ],
  },
  {
    id: "session-gift-ideas-for-mom",
    title: "Gift Ideas for Mom",
    date: new Date("2026-02-07T17:05:00"),
    messages: [
      {
        id: "assistant-gift-1",
        role: "assistant",
        timestamp: new Date("2026-02-07T17:05:00"),
        content: "<p>What budget range and interests should I target?</p>",
      },
    ],
  },
]
