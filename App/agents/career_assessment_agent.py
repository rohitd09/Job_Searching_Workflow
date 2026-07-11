import os
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, ToolMessage

from App.services.rag_service import RAGService

load_dotenv()

@tool
def get_resume_data(query: str): # Function Object -> get_resume_data (or @tool -> function object -> .name, .description)
    """
    This is a RAG tool which get information about the user's career,
    including skills, experiences, projects, education and interests from their resume data.

    Arguments:
    query -> The section or a question about the resume that will fetch a particular data about the candidate.
    """
    rag_service = RAGService()
    retriever = rag_service.get_retriever()

    response = retriever.invoke(query)

    return response

class CareerAssessmentAgent:
    def __init__(self):
        llm = ChatGroq(
            model="openai/gpt-oss-20b",
            temperature=0.1,
            max_tokens=1024,
            api_key=os.getenv("GROQ_API_KEY")
        )

        self.tools = [get_resume_data]
        self.tools_by_names = {t.name: t for t in self.tools} # {Tool Name: Tool's Function Object}

        self.llm_with_tools = llm.bind_tools(self.tools)

    def agent_node(self, state: dict) -> dict: # Thinking
        messages = state["messages"]

        system_prompt = SystemMessage(content=(
            "You are an autonomous career assessment agent. Your instructions are strict:\n"
            "1. Use the `get_resume_data` tool to fetch all the information about the user.\n"
            "2. DO NOT ask human or the user for any clarifications, missing details or missing sections\n"
            "3. If certain details are missing in the retrieved data, proceed using ONLY what is available.\n"
            "4. You MUST compile and output a final `CANDIDATE CAREER EVALUATION REPORT` based on the retrieved data.\n"
            "5. Get resume data tool argument; query -> The section or a question about the resume that will fetch a particular data about the candidate."
            "6. DO NOT GIVE GENERIC QUERY TO THE TOOL. The tool can fetch data FROM the resume. Be very specific on what data you require from the resume."
            "7. Example queries for the tool call: Query = 'What are the work experiences of the user?', 'What is the educational background of the user?', 'What are the skills of the user?', 'What are the projects of the user?', 'What are the interests of the user?'"
            "Ensure the phrase `CANDIDATE CAREER EVALUATION REPORT` is clearly printed at the start of your final report."
        ))   

        full_message = [system_prompt] + messages
        response = self.llm_with_tools.invoke(full_message)
        print("\n\n\n", response)
        return {"messages": [response]}    

    def tool_node(self, state: dict) -> dict: # Acting
        messages = state["messages"]
        last_message = messages[-1]
        print("\n\n\n", last_message)
        tool_outputs = []

        if hasattr(last_message, "tool_calls"):
            for tool_call in last_message.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                tool_id = tool_call["id"]
                print("\n\n\n", tool_name, tool_args, tool_id)

                tool_function = self.tools_by_names.get(tool_name)

                if tool_function:
                    tool_result = tool_function.invoke(tool_args)
                else:
                    tool_result = f"Error: Tool `{tool_name}` not found"

                tool_outputs.append(
                    ToolMessage(content=(str(tool_result)), 
                                tool_call_id=tool_id,
                                name=tool_name)
                )

        print("\n\n\n", tool_outputs)
        return {"messages": tool_outputs}

if __name__ == "__main__":
    docs = get_resume_data.invoke('{"query":"What are the work experiences of the user?"}')
    print(docs)