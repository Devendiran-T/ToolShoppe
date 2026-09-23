from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.email_log import EmailLog
from app.schemas.email_log import EmailLogOut
from app.schemas.response import SuccessResponse

router = APIRouter(prefix="/email-logs", tags=["5. Email Communications"])
api_alias_router = APIRouter(prefix="/api/email-logs", tags=["5. Email Communications"])


@router.get(
    "",
    response_model=SuccessResponse[List[EmailLogOut]],
    summary="List Sent Email Logs",
    description="Retrieve all outbound email records dispatched by the system (RFQs, quotations, etc.)."
)
@api_alias_router.get(
    "",
    response_model=SuccessResponse[List[EmailLogOut]],
    summary="List Sent Email Logs",
)
def list_email_logs(
    document_type: Optional[str] = Query(None, description="Filter by document type (e.g. 'RFQ')"),
    document_id: Optional[int] = Query(None, description="Filter by linked document ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(EmailLog)
    if document_type:
        query = query.filter(EmailLog.document_type == document_type)
    if document_id:
        query = query.filter(EmailLog.document_id == document_id)

    logs = query.order_by(EmailLog.sent_at.desc()).offset(skip).limit(limit).all()
    return SuccessResponse(
        success=True,
        message="Email logs retrieved successfully.",
        data=[EmailLogOut.model_validate(log) for log in logs],
    )


@router.get(
    "/{id}",
    response_model=SuccessResponse[EmailLogOut],
    summary="Get Single Email Log by ID",
    description="Retrieve full details for a single email log entry."
)
@api_alias_router.get(
    "/{id}",
    response_model=SuccessResponse[EmailLogOut],
    summary="Get Single Email Log by ID",
)
def get_email_log(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(EmailLog).filter(EmailLog.id == id).first()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email log {id} not found."
        )
    return SuccessResponse(
        success=True,
        message="Email log retrieved successfully.",
        data=EmailLogOut.model_validate(log),
    )
