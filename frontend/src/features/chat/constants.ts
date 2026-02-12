import type { Message } from "./types/types";

export const CHAT_MESSAGES: Message[] = [
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
    timestamp: new Date("2026-02-12T10:24:00"),
    content:
      "<p>Certainly! You can use the <code>requests</code> library to fetch the webpage and <code>BeautifulSoup</code> to parse the HTML. Here is a simple example:</p><pre><code class=\"language-python\">import requests\nfrom bs4 import BeautifulSoup\n\nurl = 'https://example-blog.com'\nresponse = requests.get(url)\nif response.status_code == 200:\n    soup = BeautifulSoup(response.content, 'html.parser')\n    titles = soup.find_all('h2', class_='post-title')\n    for title in titles:\n        print(title.get_text().strip())\nelse:\n    print(f\"Failed to retrieve the page. Status code: {response.status_code}\")</code></pre><p>Make sure to install the required libraries first:</p><pre><code class=\"language-bash\">pip install requests beautifulsoup4</code></pre>",
  },
];
