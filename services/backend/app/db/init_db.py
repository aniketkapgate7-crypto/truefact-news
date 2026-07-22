from app.db.database import Base, engine


def create_database_tables() -> None:
    """Create all registered database tables."""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")


if __name__ == "__main__":
    create_database_tables()
