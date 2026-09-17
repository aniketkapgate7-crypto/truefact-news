from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import ApplicationUserModel
from app.schemas.user import UserResponse

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get profile and authoritative application role of authenticated user",
)
def get_authenticated_user_profile(
    current_user: Annotated[ApplicationUserModel, Depends(get_current_user)],
) -> ApplicationUserModel:
    """Return the profile and backend-authoritative role of the currently authenticated user.

    Identity is derived exclusively from the verified JWT bearer token subject.
    """
    return current_user
