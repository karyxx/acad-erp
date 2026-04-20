from datetime import date, time
from sqlmodel import Session
from core.database import engine, SQLModel
from auth.auth import pwd_context

# Import all models
from models import (
    Users, Roles, UserRoles,
    Departments, FacultyProfiles, StudentProfiles,
    Programs, Semesters, Batches, BatchEnrollments, Courses, CourseOfferings, OfferingFaculty, SemesterRegistrations, SubjectRegistrations,
    Rooms, TimetableSlots,
    AssessmentComponents, StudentMarks, GradeRules, StudentSemesterResults,
    Exams, ExamSchedules, ExamResults,
    CourseFacultyFeedbackLinks,
    StudentFees
)

# ---------------------------------------------------------------------------
# DATA EXTRACTED FROM:
#   Data/bms_students_grades.md   → 29 BMS students with SGPA/CGPA
#   Data/Course-of-study.pdf      → BMS Sem-1 course list (same as CSE Sem-1)
# ---------------------------------------------------------------------------

# BMS 2024 Batch – Semester 1 (2024–2028)
BMS_STUDENTS = [
    # (roll_no, first_name, last_name, sgpa, cgpa)
    ("2024BMS-001", "Aksh",              "Pathak",              7.65, 7.65),
    ("2024BMS-002", "Akshat",            "Tripathi",            9.52, 9.52),
    ("2024BMS-003", "Ali",               "Samin",               6.91, 6.91),
    ("2024BMS-004", "Anupam",            "Baraik",              6.65, 6.65),
    ("2024BMS-005", "Badavath",          "Sachin",              6.91, 6.91),
    ("2024BMS-006", "Challagondla",      "Rishitha",            7.83, 7.83),
    ("2024BMS-007", "Govind",            "Suman",               8.87, 8.87),
    ("2024BMS-008", "Gundlapalli",       "Raj Vardhan",         7.17, 7.17),
    ("2024BMS-009", "Jiya",              "Virpara",             8.78, 8.78),
    ("2024BMS-010", "Krishna",           "Soni",                7.78, 7.78),
    ("2024BMS-011", "Kummari",           "Vikas",               8.00, 8.00),
    ("2024BMS-012", "Lakshya",           "Mulchandani",         8.65, 8.65),
    ("2024BMS-013", "Mohnani Meet",      "Deepakkumar",         9.22, 9.22),
    ("2024BMS-014", "Neelabhro",         "Ghosh",               8.87, 8.87),
    ("2024BMS-015", "Paila Sai",         "Manjusha",            8.83, 8.83),
    ("2024BMS-016", "Prapit",            "",                    7.17, 7.17),
    ("2024BMS-017", "Pratham",           "Jaiswal",             8.04, 8.04),
    ("2024BMS-018", "Pray",              "Karia",               8.83, 8.83),
    ("2024BMS-019", "Priyanshu Sanjay",  "Kumar Jha",           7.96, 7.96),
    ("2024BMS-020", "Pulkit",            "Katariya",            8.83, 8.83),
    ("2024BMS-021", "Pushkar",           "Agrawal",             7.74, 7.74),
    ("2024BMS-022", "Rage Renu",         "Yasaswini",           6.65, 6.65),
    ("2024BMS-023", "Sai Varshith",      "Paluru",              9.00, 9.00),
    ("2024BMS-024", "Sawant Vedang",     "Amol",                7.83, 7.83),
    ("2024BMS-025", "Shreyas",           "Patil",               8.30, 8.30),
    ("2024BMS-026", "Sneh",              "Kansagara",           8.17, 8.17),
    ("2024BMS-027", "Veeravalli",        "Vinay",               9.13, 9.13),
    ("2024BMS-028", "Vijit",             "Deogade",             8.43, 8.43),
    ("2024BMS-029", "Yangoti Nandith",   "Reddy",               8.04, 8.04),
]

def _email(first: str, last: str, roll: str) -> str:
    """Generate an institutional email from name components."""
    slug = (first.split()[0] + last.split()[0] if last else first.split()[0]).lower()
    slug = slug.replace(" ", "").replace("-", "")
    num = roll.split("-")[1]  # e.g. '001'
    return f"{slug}{num}@iiitmg.ac.in"

# ---------------------------------------------------------------------------
# BMS Semester-1 courses (from Course-of-study.pdf, page 2)
# These are SHARED with CSE/EE/ES students in first year
# ---------------------------------------------------------------------------
BMS_SEM1_COURSES = [
    # (code, name,                                    credits, dept_code)
    ("EE101",  "Fundamentals of Electrical and Electronics Engineering", 4.0, "EE"),
    ("ES101",  "Engineering Physics",                                    4.0, "ES"),
    ("ES102",  "Engineering Mathematics",                                4.0, "ES"),
    ("EE102",  "Engineering Design Principles",                          3.0, "EE"),
    ("CS101",  "Principles of Computer Programming",                     4.0, "CS"),
    ("HS101",  "Freshman Skills",                                        2.0, "HS"),
    ("HS102",  "Sports and Physical Education",                          2.0, "HS"),
]

# Grade rules for BMS program (standard 10-point scale)
GRADE_RULES = [
    ("O",  90.0, 100.0, 10.0),
    ("A+", 80.0,  89.9,  9.0),
    ("A",  70.0,  79.9,  8.0),
    ("B+", 60.0,  69.9,  7.0),
    ("B",  50.0,  59.9,  6.0),
    ("C",  45.0,  49.9,  5.0),
    ("P",  40.0,  44.9,  4.0),
    ("F",   0.0,  39.9,  0.0),
]

# Faculty for BMS – fabricated but realistic
BMS_FACULTY = [
    # (emp_id, first, last, title, dept_code, email)
    ("FAC-CS-01",  "Rahul",   "Sharma",     "Dr.",  "CS", "rahul.sharma@iiitmg.ac.in"),
    ("FAC-EE-01",  "Ananya",  "Verma",      "Dr.",  "EE", "ananya.verma@iiitmg.ac.in"),
    ("FAC-ES-01",  "Suresh",  "Gupta",      "Dr.",  "ES", "suresh.gupta@iiitmg.ac.in"),
    ("FAC-HS-01",  "Priya",   "Nair",       "Prof.","HS", "priya.nair@iiitmg.ac.in"),
]

# Map course code prefix → faculty index in BMS_FACULTY
COURSE_FACULTY_MAP = {
    "CS":  0,
    "EE":  1,
    "ES":  2,
    "HS":  3,
}

DEFAULT_PASSWORD = "1234"


def seed_db():
    print("Dropping existing tables...")
    SQLModel.metadata.drop_all(engine)
    print("Creating tables...")
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        print("Seeding data from institutional records...")

        # 1. ROLES
        role_admin = Roles(name="Admin", description="System Administrator")
        role_faculty = Roles(name="Faculty", description="Teaching Staff")
        role_student = Roles(name="Student", description="Enrolled Student")
        session.add_all([role_admin, role_faculty, role_student])
        session.commit()

        # 2. USERS (Exactly 3)
        admin_user = Users(email="admin@college.edu", password_hash=pwd_context.hash("password123"), is_active=True)
        faculty_user = Users(email="faculty@college.edu", password_hash=pwd_context.hash("password123"), is_active=True)
        student_user = Users(email="student@college.edu", password_hash=pwd_context.hash("password123"), is_active=True)
        session.add_all([admin_user, faculty_user, student_user])
        session.commit()

        # Link Roles
        session.add(UserRoles(user_id=admin_user.id, role_id=role_admin.id))
        session.add(UserRoles(user_id=faculty_user.id, role_id=role_faculty.id))
        session.add(UserRoles(user_id=student_user.id, role_id=role_student.id))
        session.commit()

        # 3. DEPARTMENTS & PROGRAMS
        dept_cse = Departments(code="CSE", name="Computer Science")
        session.add(dept_cse)
        session.commit()

        prog_bcs = Programs(code="BCS", name="B.Tech CS", department_id=dept_cse.id, duration_years=4, degree_type="UG")
        session.add(prog_bcs)
        session.commit()

        sem_1 = Semesters(program_id=prog_bcs.id, number=1, start_date=date(2026, 8, 1), end_date=date(2026, 12, 15), is_current=True)
        session.add(sem_1)
        session.commit()

        batch_1 = Batches(program_id=prog_bcs.id, name="Class of 2030", year=2026, label="BCS-2026")
        session.add(batch_1)
        session.commit()

        # 4. PROFILES
        faculty_profile = FacultyProfiles(user_id=faculty_user.id, employee_id="FAC001", first_name="John", last_name="Doe", department_id=dept_cse.id, title="Professor")
        student_profile = StudentProfiles(user_id=student_user.id, roll_number="26BCS001", first_name="Jane", last_name="Smith", department_id=dept_cse.id)
        session.add_all([faculty_profile, student_profile])
        session.commit()

        session.add(BatchEnrollments(student_id=student_profile.id, batch_id=batch_1.id, semester_id=sem_1.id))
        session.commit()

        # 5. COURSES & OFFERINGS
        course_1 = Courses(code="CS101", name="Intro to CS", department_id=dept_cse.id, credits=4.0)
        session.add(course_1)
        session.commit()

        offering_1 = CourseOfferings(course_id=course_1.id, semester_id=sem_1.id, batch_id=batch_1.id)
        session.add(offering_1)
        session.commit()

        session.add(OfferingFaculty(offering_id=offering_1.id, faculty_id=faculty_profile.id, role="instructor"))
        session.commit()

        # Student registers for semester & course
        sr = SemesterRegistrations(student_id=student_profile.id, semester_id=sem_1.id, institute_fee_paid=True, hostel_fee_paid=True, total_credits=4.0, status="approved")
        session.add(sr)
        session.commit()

        sub_reg = SubjectRegistrations(registration_id=sr.id, course_offering_id=offering_1.id, is_backlog=False)
        session.add(sub_reg)
        session.commit()

        # 6. SCHEDULING
        room_1 = Rooms(code="LT-1", capacity=100)
        session.add(room_1)
        session.commit()

        slot_1 = TimetableSlots(offering_id=offering_1.id, room_id=room_1.id, day_of_week=1, start_time=time(10, 0), end_time=time(11, 0), effective_from=date(2026, 8, 1))
        session.add(slot_1)
        session.commit()

        # 7. ASSESSMENTS
        comp_1 = AssessmentComponents(offering_id=offering_1.id, name="Midterm", max_marks=100.0, weightage_pct=30.0)
        session.add(comp_1)
        session.commit()

        mark_1 = StudentMarks(component_id=comp_1.id, student_id=student_profile.id, marks_obtained=85.0, is_absent=False)
        session.add(mark_1)
        session.commit()

        sem_res = StudentSemesterResults(student_id=student_profile.id, semester_id=sem_1.id, total_credits=4.0, earned_credits=4.0, sgpa=9.0, cgpa=9.0)
        session.add(sem_res)
        session.commit()

        # 8. EXAMS
        exam_1 = Exams(semester_id=sem_1.id, name="Finals", exam_type="Final", status="scheduled")
        session.add(exam_1)
        session.commit()

        exam_sched = ExamSchedules(exam_id=exam_1.id, course_id=course_1.id, room_id=room_1.id, exam_date=date(2026, 12, 10), start_time=time(9, 0), end_time=time(12, 0))
        session.add(exam_sched)
        session.commit()

        exam_res = ExamResults(exam_schedule_id=exam_sched.id, student_id=student_profile.id, marks_obtained=90.0, is_absent=False, is_published=True)
        session.add(exam_res)
        session.commit()

        # 9. FEEDBACK
        feedback_1 = CourseFacultyFeedbackLinks(offering_id=offering_1.id, faculty_id=faculty_profile.id, form_url="http://forms.abc", is_active=True)
        session.add(feedback_1)
        session.commit()

        # 10. FINANCE
        fee_1 = StudentFees(student_id=student_profile.id, semester_id=sem_1.id, amount=50000.0, status="paid", receipt_url="http://receipts.abc")
        session.add(fee_1)
        session.commit()

        print("Database Seeded Successfully with 3 core users and all modules populated!")

if __name__ == "__main__":
    seed_db()
