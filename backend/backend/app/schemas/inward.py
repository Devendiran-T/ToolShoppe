from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class InwardItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inward_id: int
    item_id: int
    item_name: Optional[str] = None
    item_code: Optional[str] = None
    accepted_qty: Decimal
    rate: Decimal
    line_total: Optional[Decimal] = None


class InwardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inward_no: str
    grn_id: int
    grn_no: Optional[str] = None
    customer_request_id: int
    customer_request_no: Optional[str] = None
    supplier_name: Optional[str] = None
    status: str
    added_at: Optional[datetime] = None
    created_at: datetime
    total_qty: Decimal = Decimal("0.00")
    total_value: Decimal = Decimal("0.00")
    items: List[InwardItemOut] = []


class InwardListOut(BaseModel):
    total: int
    items: List[InwardOut]
