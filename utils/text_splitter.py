from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_text(pages_data, filename):

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )

    chunk_data = []

    chunk_id = 1

    for page in pages_data:

        page_number = page["page"]

        chunks = text_splitter.split_text(
            page["text"]
        )

        for chunk in chunks:

            chunk_data.append({
                "chunk_id": chunk_id,
                "source": filename,
                "page": page_number,
                "content": chunk
            })

            chunk_id += 1

    return chunk_data