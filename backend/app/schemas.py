from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from .models import TxType

# ── Auth ──────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    created_at: datetime
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

# ── Transactions ──────────────────────────────────
class TransactionCreate(BaseModel):
    type:        TxType
    amount:      Decimal
    category:    Optional[str] = None
    description: Optional[str] = None
    date:        date

class TransactionOut(TransactionCreate):
    id:         int
    user_id:    int
    created_at: datetime
    model_config = {"from_attributes": True}

# ── Summary (calculado solo en servidor) ──────────
class Summary(BaseModel):
    balance:        float
    total_income:   float
    total_expenses: float

