from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session
from passlib.context import CryptContext
from fastapi.security import OAuthPasswordRequestFrom, OAuth2PasswordBearer
from jose import jwt, JWTError
from auth.config import auth_settings
from database import SessionLocal

router = APIRouter(
    prefix = '/auth',
    tags =  ['auth']
)

SECRET_KEY = auth_settings.SECRET_KEY
ALGORITHM = auth_settings.ALGORITHM

pwd_context = CryptContext(schemes=['bycrypt'])
oauth2_bearer = OAuth2PasswordBearer(tokenUrl = 'auth/token')

class CreateUserRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
    

