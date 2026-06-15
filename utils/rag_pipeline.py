from utils.vector_store import similarity_search
from utils.prompt_template import PROMPT_TEMPLATE
from utils.groq_client import generate_response


def ask_question(question, chat_history=None):

    if chat_history is None:
        chat_history = []

    # Retrieve relevant chunks
    docs = similarity_search(
        question,
        k=8
    )

    context = "\n\n".join(
    [doc.page_content for doc in docs]
)

    pages = sorted(
    list(
        set(
            [
                doc.metadata.get("page")
                for doc in docs
                if doc.metadata.get("page")
            ]
        )
    )
)

    # Recent conversation memory
    history_text = ""

    for chat in chat_history[-10:]:

        history_text += (
            f"User: {chat['user']}\n"
            f"Assistant: {chat.get('raw_bot', chat['bot'])}\n\n"
        )

    prompt = PROMPT_TEMPLATE.format(
        history=history_text,
        context=context,
        question=question
    )

    answer = generate_response(prompt)

    if pages:

        answer += "<h3>Sources</h3><ul>"

    for page in pages:

        answer += f"<li>Page {page}</li>"

    answer += "</ul>"

    return answer