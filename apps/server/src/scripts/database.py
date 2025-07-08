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

    data = {
        "reference": "25-00245",
        "date": None,
        "version": None,
        "company_name": "Lozier",
        "state_province": "NE",
        "street_address": "6336 Pershing Drive",
        "zip_code": 68110,
        "city": "Omaha",
        "country": "USA",
        "contact_name": "Parker Williams",
        "contact_position": "Engineer",
        "contact_phone_number": "402-405-2664",
        "contact_email": "parker.williams@lozier.biz",
        "days_per_week_running": 6,
        "shifts_per_day": 3,
        "line_application": "pressFeed",
        "type_of_line": "conventional",
        "pull_thru": "No",
        "max_coil_width": 24.0,
        "min_coil_width": 4.0,
        "max_coil_od": 72.0,
        "coil_id": 21.0,
        "max_coil_weight": 10000.0,
        "max_coil_handling_cap": None,
        "type_of_coil": None,
        "coil_car": False,
        "run_off_backplate": False,
        "req_rewinding": False,
        "max_material_thickness": 0.25,
        "max_material_width": 12.0,
        "max_material_type": "Cold Rolled Steel",
        "max_yield_strength": 45000.0,
        "max_tensile_strength": None,
        "full_material_thickness": 0.25,
        "full_material_width": 12.0,
        "full_material_type": "Cold Rolled Steel",
        "full_yield_strength": 36000.0,
        "full_tensile_strength": None,
        "min_material_thickness": 0.1,
        "min_material_width": 24.0,
        "min_material_type": "Cold Rolled Steel",
        "min_yield_strength": 50000.0,
        "min_tensile_strength": None,
        "width_material_thickness": 0.285,
        "width_material_width": 6.0,
        "width_material_type": "Cold Rolled Steel",
        "width_yield_strength": 40000.0,
        "width_tensile_strength": None,
        "cosmetic_material": False,
        "brand_of_feed_equipment": None,
        "gap_frame_press": False,
        "hydraulic_press": False,
        "obi": False,
        "servo_press": False,
        "shear_die_application": False,
        "straight_side_press": False,
        "other": False,
        "tonnage_of_press": None,
        "press_stroke_length": None,
        "press_max_spm": 60.0,
        "press_bed_area_width": None,
        "press_bed_area_length": None,
        "window_opening_size_of_press": None,
        "transfer_dies": False,
        "progressive_dies": True,
        "blanking_dies": False,
        "average_feed_length": 48.0,
        "average_spm": 40.0,
        "average_fpm": 160.0,
        "max_feed_length": 48.0,
        "max_spm": 40.0,
        "max_fpm": 160.0,
        "min_feed_length": 10.0,
        "min_spm": 50.0,
        "min_fpm": 41.67,
        "feed_window_degrees": None,
        "press_cycle_time": None,
        "voltage_required": 480.0,
        "space_allocated_length": None,
        "space_allocated_width": None,
        "obstructions": None,
        "feeder_mountable": True,
        "feeder_mount_adequate_support": None,
        "custom_mounting": None,
        "passline_height": None,
        "loop_pit": None,
        "coil_change_time_concern": False,
        "coil_change_time_goal": None,
        "feed_direction": "Right to Left",
        "coil_landing": "Operator Side",
        "line_guard_safety_req": None,
        "project_decision_date": None,
        "ideal_delivery_date": None,
        "earliest_delivery_date": None,
        "latest_delivery_date": None,
        "additional_comments": None
    }

    # create a new performance sheet
    new_id = db.create("25-00245", data)
    print(f"Created new record with id: {new_id}")

    # get all performance sheets
    print(db.get_all())

    # get a performance sheet by id
    print(db.get_by_id(new_id))

    # get a performance sheet by reference number
    print(db.get_by_reference_number("25-00245"))