from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.crud.customer import (
    get_customer_by_id,
    get_customer_by_email,
    get_customers,
    create_customer,
    update_customer,
    update_customer_status,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerStatusUpdate, CustomerOut
from app.schemas.response import SuccessResponse

router = APIRouter(prefix="/customers", tags=["1. Masters - Customers"])


@router.post(
    "",
    response_model=SuccessResponse[CustomerOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create Customer",
    description="Create a new customer master record with auto-generated code and validation."
)
def create_new_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Enforce unique email check
    existing = get_customer_by_email(db, customer_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A customer with email '{customer_in.email}' already exists.",
        )

    customer = create_customer(db, customer_in)
    return SuccessResponse(
        success=True,
        message="Customer created successfully",
        data=CustomerOut.model_validate(customer),
    )


@router.get(
    "",
    response_model=SuccessResponse[Dict[str, Any]],
    summary="List Customers",
    description="Retrieve customers with optional search term, status filter ('active', 'inactive', 'all'), and pagination."
)
def list_customers(
    search: Optional[str] = Query(None, description="Search by customer name, code, email, or phone"),
    status: Optional[str] = Query("all", description="Filter by status: 'active', 'inactive', or 'all'"),
    skip: int = Query(0, ge=0, description="Records to skip for pagination"),
    limit: int = Query(50, ge=1, le=500, description="Max records to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = get_customers(db, skip=skip, limit=limit, search=search, status=status)
    return SuccessResponse(
        success=True,
        message="Customers retrieved successfully",
        data={
            "items": [CustomerOut.model_validate(c) for c in items],
            "total": total,
            "skip": skip,
            "limit": limit,
        },
    )


@router.get(
    "/{customer_id}",
    response_model=SuccessResponse[CustomerOut],
    summary="Get Customer Details",
    description="Retrieve a single customer by their numeric ID."
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found.",
        )
    return SuccessResponse(
        success=True,
        message="Customer details retrieved successfully",
        data=CustomerOut.model_validate(customer),
    )


@router.put(
    "/{customer_id}",
    response_model=SuccessResponse[CustomerOut],
    summary="Update Customer",
    description="Update fields of an existing customer."
)
def update_existing_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found.",
        )

    # If updating email, ensure it does not collide with another customer
    if customer_in.email and customer_in.email != customer.email:
        conflict = get_customer_by_email(db, customer_in.email)
        if conflict and conflict.id != customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{customer_in.email}' is already registered by another customer.",
            )

    updated = update_customer(db, customer, customer_in)
    return SuccessResponse(
        success=True,
        message="Customer updated successfully",
        data=CustomerOut.model_validate(updated),
    )


@router.patch(
    "/{customer_id}/status",
    response_model=SuccessResponse[CustomerOut],
    summary="Toggle Customer Status (Soft Delete)",
    description="Activate or deactivate a customer. Records are soft-deleted and never physically removed."
)
def change_customer_status(
    customer_id: int,
    status_in: CustomerStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found.",
        )

    updated = update_customer_status(db, customer, status_in.status)
    status_label = "activated" if status_in.status else "deactivated"
    return SuccessResponse(
        success=True,
        message=f"Customer has been {status_label} successfully",
        data=CustomerOut.model_validate(updated),
    )
