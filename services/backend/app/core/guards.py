from fastapi import HTTPException, status

from app.core.config import settings


def require_editorial_mutation_access() -> None:
    """Fail-closed guard for editorial fact-check review mutations, publishing, and retractions.

    Treats ENABLE_EDITORIAL_MUTATIONS as a temporary explicit local control,
    not authentication or RBAC.
    """
    if not settings.enable_editorial_mutations:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editorial mutations are disabled in this environment",
        )


def require_admin_mutation_access() -> None:
    """Fail-closed guard for administrative CRUD operations on articles, assessments, and social posts.

    Treats ENABLE_ADMIN_MUTATIONS as a temporary explicit local control,
    not authentication or RBAC.
    """
    if not settings.enable_admin_mutations:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative data mutations are disabled in this environment",
        )
