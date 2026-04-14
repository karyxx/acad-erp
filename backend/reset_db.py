from core.database import engine
from sqlmodel import SQLModel
from models import *

# This will drop all tables defined in models and recreate them clean
SQLModel.metadata.drop_all(engine)
SQLModel.metadata.create_all(engine)
print("Database schema dropped and successfully rebuilt.")
