from groq import Groq

from config import GROQ_API_KEY

client = Groq(
    api_key=GROQ_API_KEY
)

def generate_response(prompt):

    response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    temperature=0.2,
    messages=[
        {
            "role": "system",
            "content": """
You are PDFMind.

Never use Markdown.

Never use:
**, *, ###, ##, #, +, -, |.

Return answers as clean HTML only.

Allowed tags:
<h2>
<h3>
<p>
<ul>
<li>
<strong>

Example:

<h2>Technology Stack</h2>

<p>The project uses the following technologies:</p>

<ul>
<li><strong>Python</strong> - Backend development</li>
<li><strong>YOLOv8</strong> - Object detection</li>
</ul>
"""
        },
        {
            "role": "user",
            "content": prompt
        }
    ]
)

    return response.choices[0].message.content