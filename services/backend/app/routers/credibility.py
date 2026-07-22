from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.credibility import CredibilityAssessmentModel
from app.models.news import NewsArticleModel
from app.schemas.credibility import (
    CredibilityAssessment,
    CredibilityAssessmentCreate,
    CredibilityAssessmentUpdate,
)
from app.services.credibility import calculate_credibility_score

router = APIRouter(
    prefix="/api/v1",
    tags=["Credibility"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


def _get_article_or_404(
    article_id: int,
    db: Session,
) -> NewsArticleModel:
    article = db.get(NewsArticleModel, article_id)

    if article is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News article not found",
        )

    return article


def _get_assessment_or_404(
    article_id: int,
    db: Session,
) -> CredibilityAssessmentModel:
    statement = select(CredibilityAssessmentModel).where(
        CredibilityAssessmentModel.news_article_id == article_id
    )
    assessment = db.scalar(statement)

    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credibility assessment not found",
        )

    return assessment


def _calculate_assessment_score(
    assessment: CredibilityAssessmentModel,
) -> int:
    return calculate_credibility_score(
        source_reliability_score=(assessment.source_reliability_score),
        evidence_quality_score=(assessment.evidence_quality_score),
        corroboration_score=assessment.corroboration_score,
        content_quality_score=assessment.content_quality_score,
    )


@router.post(
    "/news/{article_id}/credibility-assessment",
    response_model=CredibilityAssessment,
    status_code=status.HTTP_201_CREATED,
    summary="Create a credibility assessment",
)
def create_credibility_assessment(
    article_id: int,
    assessment: CredibilityAssessmentCreate,
    db: DatabaseSession,
) -> CredibilityAssessmentModel:
    _get_article_or_404(article_id, db)

    existing_statement = select(CredibilityAssessmentModel).where(
        CredibilityAssessmentModel.news_article_id == article_id
    )

    if db.scalar(existing_statement) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=("A credibility assessment already exists for this article"),
        )

    assessment_data = assessment.model_dump()

    credibility_score = calculate_credibility_score(
        source_reliability_score=(assessment.source_reliability_score),
        evidence_quality_score=(assessment.evidence_quality_score),
        corroboration_score=assessment.corroboration_score,
        content_quality_score=assessment.content_quality_score,
    )

    database_assessment = CredibilityAssessmentModel(
        news_article_id=article_id,
        credibility_score=credibility_score,
        **assessment_data,
    )

    try:
        db.add(database_assessment)
        db.commit()
        db.refresh(database_assessment)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=("A credibility assessment already exists for this article"),
        ) from error

    return database_assessment


@router.get(
    "/news/{article_id}/credibility-assessment",
    response_model=CredibilityAssessment,
    summary="Get a credibility assessment",
)
def get_credibility_assessment(
    article_id: int,
    db: DatabaseSession,
) -> CredibilityAssessmentModel:
    _get_article_or_404(article_id, db)
    return _get_assessment_or_404(article_id, db)


@router.patch(
    "/news/{article_id}/credibility-assessment",
    response_model=CredibilityAssessment,
    summary="Update a credibility assessment",
)
def update_credibility_assessment(
    article_id: int,
    updates: CredibilityAssessmentUpdate,
    db: DatabaseSession,
) -> CredibilityAssessmentModel:
    _get_article_or_404(article_id, db)
    assessment = _get_assessment_or_404(article_id, db)

    update_data = updates.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one field to update",
        )

    if any(value is None for value in update_data.values()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Updated credibility fields cannot be null",
        )

    for field_name, value in update_data.items():
        setattr(assessment, field_name, value)

    assessment.credibility_score = _calculate_assessment_score(assessment)

    db.commit()
    db.refresh(assessment)

    return assessment
