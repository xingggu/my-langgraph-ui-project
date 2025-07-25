import os
import uuid
import re
from typing import TypedDict, List

from fastapi import FastAPI, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain_core.messages import AIMessage, HumanMessage, BaseMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langgraph.graph.message import add_messages
from langgraph.graph.ui import AnyUIMessage, ui_message_reducer, push_ui_message

# ✅ 加载 .env 文件
load_dotenv()


# ✅ FastAPI 应用
app = FastAPI()

# ✅ LangGraph 状态结构
class AgentState(TypedDict):
    messages: List[BaseMessage]
    ui: List[AnyUIMessage]

# ✅ Swagger 请求体结构
class Message(BaseModel):
    type: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

# ✅ LangGraph 节点逻辑
async def weather(state: AgentState):
    # ⚙️ 初始化 LLM（DeepSeek Chat）
    llm = ChatOpenAI(
        model="deepseek-chat",
        base_url=os.getenv("BASE_URL", "https://api.deepseek.com/v1"),
        api_key=os.getenv("KEY"),
    )

    # 🔁 调用模型
    response = await llm.ainvoke(state["messages"])
    reply = response.content.strip()

    # 🏙️ 尝试从最近的人类输入中提取城市名
    city = "your city"
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage):
            match = re.search(r"in\s+([A-Za-z\s]+)[\?\.]?", msg.content)
            if match:
                city = match.group(1).strip()
            break

    # ✉️ 创建 AI 回复消息
    message = AIMessage(
        id=str(uuid.uuid4()),
        content=reply,
    )

    # 📦 推送 UI 元素
    return {
        "messages": [message],
        "ui": [
            {
                "type": "ui",
                "id": str(uuid.uuid4()),
                "name": "weather",
                "props": {"city": city},
                "metadata": {
                    "message_id": message.id,
                    "merge": False,
                },
            }
        ]
    }

# ✅ 构建 LangGraph
workflow = StateGraph(AgentState)
workflow.add_node("weather", weather)
workflow.set_entry_point("weather")
graph = workflow.compile()

# ✅ 聊天接口（自动 JSON 验证 + 类型转换）
@app.post("/chat")
async def chat(request: ChatRequest = Body(...)):
    try:
        # 🧠 把 Pydantic 消息转成 LangChain 格式
        converted: List[BaseMessage] = []
        for msg in request.messages:
            if msg.type == "human":
                converted.append(HumanMessage(content=msg.content))
            elif msg.type == "ai":
                converted.append(AIMessage(content=msg.content))
            else:
                raise ValueError(f"Unsupported message type: {msg.type}")

        result = await graph.ainvoke({"messages": converted})
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

# ✅ 可选：根路径测试
@app.get("/")
def root():
    return {"status": "✅ LangGraph backend is running"}
