from datetime import datetime, timedelta
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from core.database import get_session
from models.user import User, create_user, get_user_by_username

router = APIRouter(
    prefix = '/auth',
    tags =  ['auth']
)

from core.config import SECRET_KEY, ALGORITHM

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl = 'auth/token')

class CreateUserRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    create_user_request: CreateUserRequest,
    session: Annotated[Session, Depends(get_session)]
):
    hashed_password = pwd_context.hash(create_user_request.password)
    user_model = User(
        username=create_user_request.username,
        email=create_user_request.email,
        hashed_password=hashed_password
    )
    return create_user(session, user_model)
    

