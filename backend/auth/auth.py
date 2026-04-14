from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import jwt, JWTError
from core.database import get_session
from models.user import Users, create_user, get_user_by_username
from core.config import settings

router = APIRouter(
    prefix = '/auth',
    tags =  ['auth']
)


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl = 'auth/token')

class CreateUserRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str


db_dependency = Annotated[Session, Depends(get_session)]
    
# End-point: create new user and add it to database
@router.post("/", status_code =  status.HTTP_201_CREATED)
async def create_user(db:db_dependency,create_user_request: CreateUserRequest):
    create_user_model = Users(username = create_user_request.username, 
                             hashed_password = pwd_context.hash(create_user_request.password)
                            )

    db.add(create_user_model)
    db.commit()


# Queries User table and authenticate user
def authenticate_user(username: str, password: str, db: Session):
    user = db.exec(select(Users).where(Users.username == username)).one_or_none()
    if not user:
        return False
    if not pwd_context.verify(password, user.hashed_password):
        return False
    return user

# Encode JWT
def create_access_token(username: str, user_id: int ,expires_after: timedelta):
    expires = datetime.now(timezone.utc) + expires_after
    encode = {'sub':username, 'id': user_id, 'exp': expires}
    return jwt.encode(encode, settings.SECRET_KEY, algorithm= settings.ALGORITHM)

# Decode JWT
async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=settings.ALGORITHM)
        username: str = payload.get('sub')
        user_id: int = payload.get('id')
        if username is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Couldn't validate user")
        return {'username':username, 'id':user_id}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Couldn't validate user")



# End-point: Login and get JWT token
@router.post("/token",response_model = Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
                                 db: db_dependency):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Couldn't not validate user")
    token = create_access_token(user.username, user.id,timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    return {'access_token': token, 'token_type':'bearer'}



#def auth_login_request():


# @router.post("/create", status_code=status.HTTP_201_CREATED)
# async def create_user_endpoint(
#     create_user_request: CreateUserRequest,
#     session: Annotated[Session, Depends(get_session)]
# ):
#     hashed_password = pwd_context.hash(create_user_request.password)
#     user_model = Users(
#         username=create_user_request.username,
#         email=create_user_request.email,
#         hashed_password=hashed_password
#     )
#     return create_user(session, user_model)
    

