from pydantic import BaseModel


class SubjectCreate(BaseModel):
    name: str


class SubjectOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
