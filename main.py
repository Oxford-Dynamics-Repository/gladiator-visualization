from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

from chat_invite import IncludeExpertInConversation


app = FastAPI()

class InviteRequest(BaseModel):
    conversation_path: str
    persons_list: str

class Chat(BaseModel):
    error: Optional[str] = None
    payload: Optional[str]
    description: Optional[str] = None

@app.post("/invite", response_model=Chat)
def invite(request: InviteRequest, api_key: str = Header(...)):
    if api_key is None:
        raise HTTPException(status_code=400, detail="OpenAI API Key in header is missing")
    
    IncludeObj = IncludeExpertInConversation(api_key)
    votes = IncludeObj.consensus_pick_person(request.conversation_path, request.persons_list)
    
    return Chat(error=None, payload=max(votes, key=votes.get), description="")
