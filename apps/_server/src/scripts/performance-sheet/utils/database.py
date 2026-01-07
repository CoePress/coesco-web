from sqlalchemy import create_engine, Column, String, JSON, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import uuid
from datetime import datetime
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel
from typing import Optional, Type, TypeVar, Dict, Any

Base = declarative_base()

class PerformanceSheet(Base):
    __tablename__ = 'performance_sheets'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    referenceNumber = Column(String(255))
    data = Column(JSON)
    createdAt = Column(DateTime, default=datetime.now)
    updatedAt = Column(DateTime, default=datetime.now, onupdate=datetime.now)

T = TypeVar('T', bound=BaseModel)

class PerformanceSheetRepository:
    """
    Repository for CRUD operations on PerformanceSheet using reference number as the main key.
    Accepts and returns Pydantic models or dicts.
    """
    def __init__(self, host, database, user, password):
        engine = create_engine(f'postgresql://{user}:{password}@{host}/{database}')
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        self.session = Session()

    def create(self, reference_number: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new record. Raises ValueError if reference_number already exists.
        Returns the created record as a dict.
        """
        existing = self.get(reference_number)
        if existing:
            raise ValueError(f"Reference number {reference_number} already exists.")
        record = PerformanceSheet(referenceNumber=reference_number, data=data)
        self.session.add(record)
        self.session.commit()
        return self._to_dict(record)

    def upsert(self, reference_number: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create or update a record by reference_number. Returns the upserted record as a dict.
        """
        existing = self.session.query(PerformanceSheet).filter_by(referenceNumber=reference_number).first()
        if existing:
            updated = False
            for k, v in data.items():
                if k not in existing.data or existing.data[k] != v:
                    existing.data[k] = v
                    updated = True
            if updated:
                flag_modified(existing, "data")
                self.session.commit()
            return self._to_dict(existing)
        else:
            record = PerformanceSheet(referenceNumber=reference_number, data=data)
            self.session.add(record)
            self.session.commit()
            return self._to_dict(record)

    def get(self, reference_number: str) -> Optional[Dict[str, Any]]:
        """
        Get a record by reference_number. Returns dict or None.
        """
        record = self.session.query(PerformanceSheet).filter_by(referenceNumber=reference_number).first()
        if record:
            return self._to_dict(record)
        return None

    def update(self, reference_number: str, data_updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update fields for a record by reference_number. Raises ValueError if not found.
        Returns the updated record as a dict.
        """
        record = self.session.query(PerformanceSheet).filter_by(referenceNumber=reference_number).first()
        if not record:
            raise ValueError(f"Reference number {reference_number} not found.")
        updated = False
        for k, v in data_updates.items():
            if k not in record.data or record.data[k] != v:
                record.data[k] = v
                updated = True
        if updated:
            flag_modified(record, "data")
            self.session.commit()
        return self._to_dict(record)

    def delete(self, reference_number: str) -> bool:
        """
        Delete a record by reference_number. Returns True if deleted, False if not found.
        """
        record = self.session.query(PerformanceSheet).filter_by(referenceNumber=reference_number).first()
        if record:
            self.session.delete(record)
            self.session.commit()
            return True
        return False

    def _to_dict(self, record: PerformanceSheet) -> Dict[str, Any]:
        return {
            'id': str(record.id),
            'referenceNumber': record.referenceNumber,
            'data': record.data,
            'createdAt': record.createdAt,
            'updatedAt': record.updatedAt
        }

# Deprecated: Use PerformanceSheetRepository instead
class Database(PerformanceSheetRepository):
    pass

_repo_instance = None

def get_default_repository():
    global _repo_instance
    if _repo_instance is None:
        _repo_instance = PerformanceSheetRepository(
            host="10.231.200.65:5432",
            database="coesco_test",
            user="cpec",
            password="password"
        )
    return _repo_instance

# For backward compatibility
get_default_db = get_default_repository