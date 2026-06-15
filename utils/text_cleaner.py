import re

def clean_text(text):

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text)

    # Remove special characters
    text = re.sub(r"[^\w\s.,!?()-]", "", text)

    # Strip spaces
    text = text.strip()

    return text