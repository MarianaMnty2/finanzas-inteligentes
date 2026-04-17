from sqlalchemy import text, extract
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

def get_balance_summary(db: Session, user_id: int,
                        month: int = None, year: int = None) -> dict:
    filters = "WHERE user_id = :uid"
    params: dict = {"uid": user_id}
    if month:
        filters += " AND EXTRACT(MONTH FROM date) = :month"
        params["month"] = month
    if year:
        filters += " AND EXTRACT(YEAR FROM date) = :year"
        params["year"] = year

    row = db.execute(text(f"""
        SELECT
            COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
            COALESCE(SUM(CASE WHEN type = 'income'  THEN  amount
                              WHEN type = 'expense' THEN -amount END), 0)        AS balance
        FROM transactions {filters}
    """), params).fetchone()

    return {
        "balance":        float(row.balance),
        "total_income":   float(row.total_income),
        "total_expenses": float(row.total_expenses),
    }

def get_transactions(db: Session, user_id: int,
                     skip: int = 0, limit: int = 50,
                     month: int = None, year: int = None):
    query = db.query(models.Transaction).filter_by(user_id=user_id)
    if month:
        query = query.filter(
            db.query(models.Transaction)
              .filter(models.Transaction.date.month == month)
        )
        query = db.query(models.Transaction).filter_by(user_id=user_id)
        if month:
            query = query.filter(extract('month', models.Transaction.date) == month)
        if year:
            query = query.filter(extract('year', models.Transaction.date) == year)
    return (
        query.order_by(models.Transaction.date.desc())
             .offset(skip).limit(limit).all()
    )

def create_transaction(db: Session, tx: schemas.TransactionCreate, user_id: int):
    obj = models.Transaction(**tx.model_dump(), user_id=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_transaction(db: Session, tx_id: int, user_id: int):
    tx = db.query(models.Transaction).filter_by(id=tx_id, user_id=user_id).first()
    if tx:
        db.delete(tx)
        db.commit()
    return tx

