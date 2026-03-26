import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from .database import Base

class TxType(str, enum.Enum):
    income  = "income"
    expense = "expense"

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="owner")

class Transaction(Base):
    __tablename__ = "transactions"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    type        = Column(Enum(TxType), nullable=False)
    amount      = Column(Numeric(15, 2), nullable=False)
    category    = Column(String(100))
    description = Column(String(255))
    date        = Column(Date, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="transactions")

