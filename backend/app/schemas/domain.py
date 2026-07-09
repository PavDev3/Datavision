import uuid

from pydantic import BaseModel, ConfigDict


class DomainRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    display_name: str
    config: dict
