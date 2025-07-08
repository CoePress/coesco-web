from sqlalchemy import create_engine, Column, String, JSON, DateTime
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime

Base = declarative_base()

class PerformanceSheet(Base):
    __tablename__ = 'performance_sheets'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    referenceNumber = Column(String(255))
    data = Column(JSON)
    createdAt = Column(DateTime, default=datetime.now)
    updatedAt = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class Database:
    def __init__(self, host, database, user, password):
        engine = create_engine(f'postgresql://{user}:{password}@{host}/{database}')
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        self.session = Session()
    
    def create(self, reference_number, data):
        record = PerformanceSheet(referenceNumber=reference_number, data=data)
        self.session.add(record)
        self.session.commit()
        return str(record.id)
    
    def delete(self, record_id):
        record = self.session.query(PerformanceSheet).filter_by(id=record_id).first()
        if record:
            self.session.delete(record)
            self.session.commit()
    
    def update(self, record_id, data_updates):
        record = self.session.query(PerformanceSheet).filter_by(id=record_id).first()
        if record:
            record.data.update(data_updates)
            self.session.commit()
    
    def add_field(self, record_id, field_name, field_value):
        record = self.session.query(PerformanceSheet).filter_by(id=record_id).first()
        if record:
            record.data[field_name] = field_value
            self.session.commit()
    
    def remove_field(self, record_id, field_name):
        record = self.session.query(PerformanceSheet).filter_by(id=record_id).first()
        if record and field_name in record.data:
            del record.data[field_name]
            self.session.commit()
    
    def get_all(self):
        records = self.session.query(PerformanceSheet).all()
        return [
            {
                'id': str(record.id),
                'referenceNumber': record.referenceNumber,
                'data': record.data
            }
            for record in records
        ]
    
    def get_by_id(self, record_id):
        record = self.session.query(PerformanceSheet).filter_by(id=record_id).first()
        if record:
            return {
                'id': str(record.id),
                'referenceNumber': record.referenceNumber,
                'data': record.data
            }
        return None
    
    def get_by_reference_number(self, reference_number):
        record = self.session.query(PerformanceSheet).filter(PerformanceSheet.referenceNumber == reference_number).first()
        if record:
            return {
                'id': str(record.id),
                'referenceNumber': record.referenceNumber,
                'data': record.data
            }
        return None
    

if __name__ == "__main__":
    db = Database(
        host="localhost",
        database="coesco_dev",
        user="postgres",
        password="password"
    )

    # create a new performance sheet
    new_id = db.create("1234567890", {"name": "John Doe", "age": 30})
    print(f"Created new record with id: {new_id}")

    # get all performance sheets
    print(db.get_all())

    # get a performance sheet by id
    print(db.get_by_id(new_id))

    # get a performance sheet by reference number
    print(db.get_by_reference_number("1234567890"))