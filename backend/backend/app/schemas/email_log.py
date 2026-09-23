from datetime import datetime
from pydantic import BaseModel


class EmailLogOut(BaseModel):
    id: int
    document_type: str
    document_id: int
    recipient: str
    subject: str
    body: str
    status: str = "Sent"
    sent_at: datetime

    class Config:
        from_attributes = True
