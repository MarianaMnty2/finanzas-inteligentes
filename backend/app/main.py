from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from . import crud, schemas, auth, models
from .database import engine, get_db


app = FastAPI(title="Flujo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )

oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/token")

def current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)):
    return auth.verify_token(token, db)


models.Base.metadata.create_all(bind=engine)

# Auth 
@app.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(email=data.email).first():
        raise HTTPException(400, "El email ya está registrado")
    return crud.create_user(db, data)

@app.post("/auth/token", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate(db, form.username, form.password)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciales incorrectas")
    return {"access_token": auth.create_token(user.id), "token_type": "bearer"}

# Dashboard 
@app.get("/me/summary", response_model=schemas.Summary)
def summary(month: int = None, year: int = None,
            user=Depends(current_user), db: Session = Depends(get_db)):
    return crud.get_balance_summary(db, user.id, month, year)

# Transactions 
@app.post("/me/transactions", response_model=schemas.TransactionOut, status_code=201)
def add_transaction(tx: schemas.TransactionCreate,
                    user=Depends(current_user), db: Session = Depends(get_db)):
    return crud.create_transaction(db, tx, user.id)

@app.get("/me/transactions", response_model=list[schemas.TransactionOut])
def list_transactions(skip: int = 0, limit: int = 50,
                      month: int = None, year: int = None,
                      user=Depends(current_user), db: Session = Depends(get_db)):
    return crud.get_transactions(db, user.id, skip, limit, month, year)

@app.delete("/me/transactions/{tx_id}", status_code=204)
def delete_transaction(tx_id: int,
                       user=Depends(current_user), db: Session = Depends(get_db)):
    if not crud.delete_transaction(db, tx_id, user.id):
        raise HTTPException(404, "Transacción no encontrada")

@app.get("/me/budget-table")
def budget_table(user=Depends(current_user), db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            EXTRACT(MONTH FROM date)::int AS month,
            type,
            category,
            SUM(amount) AS total
        FROM transactions
        WHERE user_id = :uid
        GROUP BY month, type, category
        ORDER BY month
    """), {"uid": user.id}).fetchall()

    result = {}
    for row in rows:
        m = row.month
        if m not in result:
            result[m] = []
        result[m].append({
            "type": row.type,
            "category": row.category,
            "total": float(row.total)
        })
    return result

@app.get("/me/weekly-trend")
def weekly_trend(month: int = None, year: int = None,
                 user=Depends(current_user), db: Session = Depends(get_db)):
    from sqlalchemy import text
    from datetime import date

    # Si no se pasa mes/año, usar el mes actual
    today = date.today()
    m = month or today.month
    y = year or today.year

    rows = db.execute(text("""
        SELECT
            date,
            type,
            SUM(amount) AS total
        FROM transactions
        WHERE user_id = :uid
          AND EXTRACT(MONTH FROM date) = :month
          AND EXTRACT(YEAR  FROM date) = :year
        GROUP BY date, type
        ORDER BY date
    """), {"uid": user.id, "month": m, "year": y}).fetchall()

    result = {}
    for row in rows:
        d = str(row.date)
        if d not in result:
            result[d] = {"income": 0, "expense": 0}
        result[d][row.type] += float(row.total)

    return {"data": result, "month": m, "year": y}