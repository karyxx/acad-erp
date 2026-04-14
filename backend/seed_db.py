from datetime import date, time
from sqlmodel import Session
from core.database import engine, SQLModel
from auth.auth import pwd_context

# Import all models
from models import (
    Users, Roles, UserRoles, 
    Departments, FacultyProfiles, StudentProfiles,
    Programs, Semesters, Batches, BatchEnrollments, Courses, CourseOfferings, OfferingFaculty,
    Rooms, TimetableSlots
)

def seed_db():
    # Only run this if you want to wipe and seed
    print("Dropping existing tables...")
    SQLModel.metadata.drop_all(engine)
    print("Creating tables...")
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        print("Seeding initial data...")

        # ------------------- 1. ROLES -------------------
        role_admin = Roles(name="Admin", description="System Administrator")
        role_faculty = Roles(name="Faculty", description="Teaching Staff")
        role_student = Roles(name="Student", description="Enrolled Student")
        session.add_all([role_admin, role_faculty, role_student])
        session.commit()

        # ------------------- 2. DEPARTMENTS -------------------
        dept_cse = Departments(code="CSE", name="Computer Science and Engineering")
        dept_ee = Departments(code="EE", name="Electrical Engineering")
        dept_mngt = Departments(code="MNGT", name="Management Studies")
        session.add_all([dept_cse, dept_ee, dept_mngt])
        session.commit()

        # ------------------- 3. USERS & FACULTY PROFILES -------------------
        faculty_data = [
            ("sj@college.edu", "SJ", "Singh", dept_ee.id),
            ("ps2@college.edu", "PS", "Sharma", dept_mngt.id),
            ("nsp@college.edu", "NSP", "Patel", dept_cse.id),
            ("vkj@college.edu", "VKJ", "Jain", dept_cse.id),
            ("anl@college.edu", "ANL", "Lal", dept_cse.id),
            ("anj@college.edu", "ANJ", "Joshi", dept_cse.id),
        ]
        
        faculties = {}
        for idx, (email, fname, lname, dept_id) in enumerate(faculty_data):
            user = Users(email=email, password_hash=pwd_context.hash("password123"), is_active=True)
            session.add(user)
            session.commit()
            
            # Link role
            session.add(UserRoles(user_id=user.id, role_id=role_faculty.id))
            
            # Create profile
            profile = FacultyProfiles(
                user_id=user.id,
                employee_id=f"FAC{100 + idx}",
                first_name=fname,
                last_name=lname,
                department_id=dept_id,
                title="Assistant Professor"
            )
            session.add(profile)
            session.commit()
            faculties[fname] = profile.id
            
        # Add Admin User
        admin_user = Users(email="admin@college.edu", password_hash=pwd_context.hash("admin123"), is_active=True)
        session.add(admin_user)
        session.commit()
        session.add(UserRoles(user_id=admin_user.id, role_id=role_admin.id))
        session.commit()

        # ------------------- 4. PROGRAMS & SEMESTERS -------------------
        prog_bcs = Programs(code="BCS", name="B.Tech Computer Science", department_id=dept_cse.id, duration_years=4, degree_type="UG")
        prog_imt = Programs(code="IMT", name="Integrated M.Tech IT", department_id=dept_cse.id, duration_years=5, degree_type="Integrated")
        prog_bee = Programs(code="BEE", name="B.Tech Electrical", department_id=dept_ee.id, duration_years=4, degree_type="UG")
        prog_bms = Programs(code="BMS", name="Mathematics and Scientific Computing", department_id=dept_mngt.id, duration_years=4, degree_type="UG")
        session.add_all([prog_bcs, prog_imt, prog_bee, prog_bms])
        session.commit()

        sem_even = Semesters(
            program_id=prog_bcs.id, 
            number=2, 
            start_date=date(2026, 1, 1), 
            end_date=date(2026, 5, 30), 
            is_current=True
        )
        session.add(sem_even)
        session.commit()

        # ------------------- 5. BATCHES & STUDENTS -------------------
        batch_bcs = Batches(program_id=prog_bcs.id, name="BCS", year=2025, label="BCS - II")
        batch_imt = Batches(program_id=prog_imt.id, name="IMT", year=2025, label="IMT - II")
        batch_bee = Batches(program_id=prog_bee.id, name="BEE", year=2025, label="BEE + IMG - II")
        batch_bms = Batches(program_id=prog_bms.id, name="BMS", year=2025, label="BMS + IMG - II")
        session.add_all([batch_bcs, batch_imt, batch_bee, batch_bms])
        session.commit()

        student_user = Users(email="student1@college.edu", password_hash=pwd_context.hash("password123"), is_active=True)
        session.add(student_user)
        session.commit()
        session.add(UserRoles(user_id=student_user.id, role_id=role_student.id))
        
        student_profile = StudentProfiles(
            user_id=student_user.id,
            roll_number="2025BCS001",
            first_name="Rahul",
            last_name="Kumar",
            department_id=dept_cse.id
        )
        session.add(student_profile)
        session.commit()
        
        session.add(BatchEnrollments(student_id=student_profile.id, batch_id=batch_bcs.id, semester_id=sem_even.id))
        session.commit()

        # ------------------- 6. COURSES & OFFERINGS -------------------
        courses_data = [
            ("CS102", "Data Structures (DS)", dept_cse.id, 4.0),
            ("CS103", "Object Oriented Programming (OOPS)", dept_cse.id, 4.0),
            ("EC102", "Digital Electronics (DE)", dept_ee.id, 3.0),
            ("MA102", "Probability & Statistics (P&S)", dept_mngt.id, 3.0),
        ]
        courses = {}
        for code, name, dept, credits in courses_data:
            course = Courses(code=code, name=name, department_id=dept, credits=credits)
            session.add(course)
            session.commit()
            courses[code] = course.id
            
        print("Course records created.")
        
        # ------------------- 7. ROOMS & TIMETABLE (From Schedule) -------------------
        room_008 = Rooms(code="LT-II-008", capacity=120)
        room_203 = Rooms(code="LT-II-203", capacity=120)
        session.add_all([room_008, room_203])
        session.commit()

        # Create Offering: Data Structures for BCS-II
        offering_ds_bcs = CourseOfferings(course_id=courses["CS102"], semester_id=sem_even.id, batch_id=batch_bcs.id)
        session.add(offering_ds_bcs)
        session.commit()
        
        # Assign Faculty NSP to DS (BCS)
        session.add(OfferingFaculty(offering_id=offering_ds_bcs.id, faculty_id=faculties["NSP"], role="instructor"))
        
        # Add Timetable plot: Monday 11:00-11:55AM in LT-II-008
        slot_ds = TimetableSlots(
            offering_id=offering_ds_bcs.id, 
            room_id=room_008.id, 
            day_of_week=0, # Monday
            start_time=time(11, 0), 
            end_time=time(11, 55),
            effective_from=date(2026, 1, 1)
        )
        session.add(slot_ds)
        session.commit()

        print("Database Seeded Successfully!")

if __name__ == "__main__":
    seed_db()
