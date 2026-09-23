import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

logger = logging.getLogger("app.db")

def create_db_engine():
    """
    Attempt to initialize database engine.
    Uses MySQL if available; falls back to SQLite if unreachable or configured.
    """
    db_url = settings.DATABASE_URL
    try:
        if db_url.startswith("mysql"):
            # Fast check with short timeout to detect if MySQL is reachable
            test_engine = create_engine(
                db_url,
                connect_args={"connect_timeout": 2}
            )
            with test_engine.connect() as conn:
                pass
            logger.info("Successfully connected to MySQL database.")
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 5}
            )
            return engine
        else:
            engine = create_engine(
                db_url,
                connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
            )
            return engine
    except Exception as exc:
        if settings.FALLBACK_TO_SQLITE:
            sqlite_url = f"sqlite:///{settings.SQLITE_DB_PATH}"
            logger.warning(
                f"Could not connect to primary database ({exc}). "
                f"Falling back to local SQLite: {sqlite_url}"
            )
            return create_engine(sqlite_url, connect_args={"check_same_thread": False})
        else:
            raise exc


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session per request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
