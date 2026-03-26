from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import crud, schemas, auth, models
from .database import engine, get_db

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.cors import CORSMiddleware as StarletteCorS
from fastapi import Request
from fastapi.responses import JSONResponse


app = FastAPI(title="Flujo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/token")

def current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)):
    return auth.verify_token(token, db)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials": "true",
        }
    )

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
def summary(user=Depends(current_user), db: Session = Depends(get_db)):
    return crud.get_balance_summary(db, user.id)

# Transactions 
@app.post("/me/transactions", response_model=schemas.TransactionOut, status_code=201)
def add_transaction(tx: schemas.TransactionCreate,
                    user=Depends(current_user), db: Session = Depends(get_db)):
    return crud.create_transaction(db, tx, user.id)

@app.get("/me/transactions", response_model=list[schemas.TransactionOut])
def list_transactions(skip: int = 0, limit: int = 50,
                      user=Depends(current_user), db: Session = Depends(get_db)):
    return crud.get_transactions(db, user.id, skip, limit)

@app.delete("/me/transactions/{tx_id}", status_code=204)
def delete_transaction(tx_id: int,
                       user=Depends(current_user), db: Session = Depends(get_db)):
    if not crud.delete_transaction(db, tx_id, user.id):
        raise HTTPException(404, "Transacción no encontrada")

