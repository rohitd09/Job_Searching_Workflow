import os
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

load_dotenv() # loads the .env

class RAGService:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="gemini-embedding-001",
            api_key=os.getenv("GEMINI_API_KEY") # Picks the API Key from the .env file
        )

        self.vector_store = Chroma(
            embedding_function=self.embeddings,
            collection_name="resume_collection",
            persist_directory="./resume_vector_db"
        )

    def process_and_create_embeddings(self, file_path: str = "./Assets/resume.pdf") -> None:
        loader = PyPDFLoader(file_path) # loads the resume file
        pages = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=512,
            chunk_overlap=128
        )
        chunks = splitter.split_documents(pages)

        self.vector_store.add_documents(chunks)

    def get_retriever(self):
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        
        return retriever

if __name__ == "__main__":
    rag_service = RAGService()
    # rag_service.process_and_create_embeddings()
    # print("--------------VECTOR DB IS READY---------------")

    retriever = rag_service.get_retriever()
    docs = retriever.invoke("What are the work experiences of the user?")
    print(docs)