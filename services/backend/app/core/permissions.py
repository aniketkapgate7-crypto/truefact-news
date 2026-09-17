from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.core.auth import get_current_user
from app.models.user import ApplicationUserModel, UserRole


def require_role(
    *allowed_roles: UserRole,
) -> Callable[[ApplicationUserModel], ApplicationUserModel]:
    """Dependency factory enforcing backend database-authoritative role verification."""

    def _role_verifier(
        user: Annotated[ApplicationUserModel, Depends(get_current_user)],
    ) -> ApplicationUserModel:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires authorized role: {', '.join(r.value for r in allowed_roles)}",
            )
        return user

    return _role_verifier


# Common role requirement dependencies
require_authenticated_user = get_current_user
require_reviewer_or_admin = require_role(UserRole.REVIEWER, UserRole.ADMIN)
require_admin_role = require_role(UserRole.ADMIN)
