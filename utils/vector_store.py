import os

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from utils.embeddings import get_embedding_model


VECTOR_DB_PATH = "vectorstore/faiss_index"


class CustomEmbeddings(Embeddings):

    def __init__(self):
        self.model = get_embedding_model()

    def embed_documents(self, texts):
        return self.model.encode(texts).tolist()

    def embed_query(self, text):
        return self.model.encode(text).tolist()

def create_vector_store(chunks):

    documents = []

    for chunk in chunks:

        documents.append(
            Document(
                page_content=chunk["content"],
                metadata={
    "source": chunk["source"],
    "page": chunk["page"]
}
            )
        )

    embeddings = CustomEmbeddings()

    vector_store = FAISS.from_documents(
        documents,
        embeddings
    )

    os.makedirs("vectorstore", exist_ok=True)

    vector_store.save_local(
        VECTOR_DB_PATH
    )

    return vector_store


def load_vector_store():

    if not os.path.exists(VECTOR_DB_PATH):

        return None

    embeddings = CustomEmbeddings()

    return FAISS.load_local(
        VECTOR_DB_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )
def similarity_search(query, k=3):

    vector_store = load_vector_store()

    if not vector_store:
        return []

    docs = vector_store.similarity_search(
        query,
        k=k
    )

    return docs