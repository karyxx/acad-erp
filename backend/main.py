from fastapi import FastAPI, Depends, HTTPException, status
from sqlmodel import SQLModel, Session
from core.database import engine, get_session
from models.user.schema_gql import schema
from strawberry.fastapi import GraphQLRouter
from auth.auth import router as auth_router
from typing import Annotated
from auth.auth import get_current_user

app = FastAPI(title="AcadERP API")

# Initialize database
@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

# GraphQL context getter to provide database session
async def get_context(session = Depends(get_session)):
    return {"session": session}

# Strawberry GraphQL Router
graphql_app = GraphQLRouter(schema, context_getter=get_context)

# Include Routers
app.include_router(auth_router)
app.include_router(graphql_app, prefix="/graphql")

# @app.get("/")
# async def root():
#     return {"message": "Welcome to AcadERP API"}


db_dependency = Annotated[Session, Depends(get_session)]
user_dependency = Annotated[dict, Depends(get_current_user)]


@app.get("/", status_code=status.HTTP_200_OK)
async def user(user:user_dependency, db: db_dependency):
    if user is None:
        raise HTTPException(status_code=401, detail='Authentication failed')
    return {'User': user}