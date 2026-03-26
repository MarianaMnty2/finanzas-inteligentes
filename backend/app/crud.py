from sqlalchemy import text
from sqlalchemy.orm import Session
from . import models, schemas, auth

def create_user(db: Session, data: schemas.UserCreate):
    user = models.User(
        email=data.email,
        hashed_password=auth.hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_balance_summary(db: Session, user_id: int) -> dict:
    """
    Saldo = Ingresos - Gastos
    Esta operación NUNCA ocurre en el cliente React.
    """
    row = db.execute(text("""
        SELECT
            COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
            COALESCE(SUM(CASE WHEN type = 'income'  THEN  amount
                              WHEN type = 'expense' THEN -amount END), 0)        AS balance
        FROM transactions
        WHERE user_id = :uid
    """), {"uid": user_id}).fetchone()

    return {
        "balance":        float(row.balance),
        "total_income":   float(row.total_income),
        "total_expenses": float(row.total_expenses),
    }

def create_transaction(db: Session, tx: schemas.TransactionCreate, user_id: int):
    obj = models.Transaction(**tx.model_dump(), user_id=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_transactions(db: Session, user_id: int, skip: int = 0, limit: int = 50):
    return (
        db.query(models.Transaction)
          .filter_by(user_id=user_id)
          .order_by(models.Transaction.date.desc())
          .offset(skip).limit(limit).all()
    )

def delete_transaction(db: Session, tx_id: int, user_id: int):
    tx = db.query(models.Transaction).filter_by(id=tx_id, user_id=user_id).first()
    if tx:
        db.delete(tx)
        db.commit()
    return tx

