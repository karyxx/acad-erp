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
    AttendanceSessions, AttendanceRecords,
    AssessmentComponents, StudentMarks, GradeRules, StudentGrades, StudentSemesterResults,
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

        # ------------------------------------------------------------------ #
        # 1. ROLES
        # ------------------------------------------------------------------ #
        role_admin   = Roles(name="Admin",   description="System Administrator")
        role_faculty = Roles(name="Faculty", description="Teaching Staff")
        role_student = Roles(name="Student", description="Enrolled Student")
        session.add_all([role_admin, role_faculty, role_student])
        session.commit()

        # ------------------------------------------------------------------ #
        # 2. DEPARTMENTS
        # ------------------------------------------------------------------ #
        dept_cs = Departments(code="CS", name="Computer Science and Engineering")
        dept_ee = Departments(code="EE", name="Electrical and Electronics Engineering")
        dept_es = Departments(code="ES", name="Mathematics and Scientific Computing")
        dept_hs = Departments(code="HS", name="Humanities and Social Sciences")
        dept_ms = Departments(code="MS", name="Management Studies (BMS)")
        session.add_all([dept_cs, dept_ee, dept_es, dept_hs, dept_ms])
        session.commit()

        dept_map = {
            "CS": dept_cs,
            "EE": dept_ee,
            "ES": dept_es,
            "HS": dept_hs,
            "MS": dept_ms,
        }

        # ------------------------------------------------------------------ #
        # 3. ADMIN USER
        # ------------------------------------------------------------------ #
        admin_user = Users(
            email="admin@iiitmg.ac.in",
            password_hash=pwd_context.hash(DEFAULT_PASSWORD),
            is_active=True,
        )
        session.add(admin_user)
        session.commit()
        session.add(UserRoles(user_id=admin_user.id, role_id=role_admin.id))
        session.commit()

        # ------------------------------------------------------------------ #
        # 4. PROGRAMS & SEMESTERS & BATCH
        # ------------------------------------------------------------------ #
        prog_bms = Programs(
            code="BMS",
            name="B.Tech. + MBA (Integrated PG in Business Administration)",
            department_id=dept_ms.id,
            duration_years=6,
            degree_type="IPG",
        )
        session.add(prog_bms)
        session.commit()

        # Semester 1 (Aug–Dec 2024, already completed – grades available)
        sem1 = Semesters(
            program_id=prog_bms.id,
            number=1,
            start_date=date(2024, 8, 1),
            end_date=date(2024, 12, 15),
            is_current=False,
        )
        # Semester 2 (Jan–Jun 2025, current even semester)
        sem2 = Semesters(
            program_id=prog_bms.id,
            number=2,
            start_date=date(2025, 1, 1),
            end_date=date(2025, 6, 15),
            is_current=True,
        )
        session.add_all([sem1, sem2])
        session.commit()

        batch_2028 = Batches(
            program_id=prog_bms.id,
            name="BMS Class of 2028-30",
            year=2024,
            label="BMS-2024",
        )
        session.add(batch_2028)
        session.commit()

        # ------------------------------------------------------------------ #
        # 5. GRADE RULES
        # ------------------------------------------------------------------ #
        for gl, min_p, max_p, gp in GRADE_RULES:
            session.add(GradeRules(
                program_id=prog_bms.id,
                grade_letter=gl,
                min_percentage=min_p,
                max_percentage=max_p,
                grade_point=gp,
            ))
        session.commit()

        # ------------------------------------------------------------------ #
        # 6. FACULTY
        # ------------------------------------------------------------------ #
        faculty_profiles = []
        for emp_id, first, last, title, d_code, email in BMS_FACULTY:
            f_user = Users(
                email=email,
                password_hash=pwd_context.hash(DEFAULT_PASSWORD),
                is_active=True,
            )
            session.add(f_user)
            session.commit()
            session.add(UserRoles(user_id=f_user.id, role_id=role_faculty.id))

            f_profile = FacultyProfiles(
                user_id=f_user.id,
                employee_id=emp_id,
                first_name=first,
                last_name=last,
                department_id=dept_map[d_code].id,
                title=title,
                join_date=date(2015, 7, 1),
                is_active=True,
            )
            session.add(f_profile)
            session.commit()
            faculty_profiles.append(f_profile)

        # ------------------------------------------------------------------ #
        # 7. COURSES (Sem-1 syllabus from Course-of-study.pdf)
        # ------------------------------------------------------------------ #
        course_objs = {}
        for code, name, credits, d_code in BMS_SEM1_COURSES:
            c = Courses(
                code=code,
                name=name,
                department_id=dept_map[d_code].id,
                credits=credits,
                course_type="core",
            )
            session.add(c)
            session.commit()
            course_objs[code] = c

        total_sem1_credits = sum(cr for _, _, cr, _ in BMS_SEM1_COURSES)  # 23.0

        # ------------------------------------------------------------------ #
        # 8. COURSE OFFERINGS for Semester 1
        # ------------------------------------------------------------------ #
        offering_objs = {}
        for code, _, _, dept_code in BMS_SEM1_COURSES:
            offering = CourseOfferings(
                course_id=course_objs[code].id,
                semester_id=sem1.id,
                batch_id=batch_2028.id,
            )
            session.add(offering)
            session.commit()
            offering_objs[code] = offering

            # Assign faculty
            fac_idx = COURSE_FACULTY_MAP.get(code[:2], 0)
            session.add(OfferingFaculty(
                offering_id=offering.id,
                faculty_id=faculty_profiles[fac_idx].id,
                role="instructor",
            ))
        session.commit()

        # Assessment components for each offering (Midterm 30% + EndSem 70%)
        assessment_map = {}  # code → (midterm_comp, endsem_comp)
        for code, offering in offering_objs.items():
            mid = AssessmentComponents(
                offering_id=offering.id,
                name="Mid-Semester Exam",
                max_marks=100.0,
                weightage_pct=30.0,
                conducted_on=date(2024, 10, 14),
            )
            end = AssessmentComponents(
                offering_id=offering.id,
                name="End-Semester Exam",
                max_marks=100.0,
                weightage_pct=70.0,
                conducted_on=date(2024, 12, 5),
            )
            session.add_all([mid, end])
            session.commit()
            assessment_map[code] = (mid, end)

        # Rooms
        room_lt1 = Rooms(code="LT-1", capacity=120)
        room_lt2 = Rooms(code="LT-2", capacity=120)
        session.add_all([room_lt1, room_lt2])
        session.commit()

        # Exam setup for Sem-1
        exam_sem1 = Exams(
            semester_id=sem1.id,
            name="End Semester Examination – Odd Semester 2024-25",
            exam_type="Final",
            status="completed",
        )
        session.add(exam_sem1)
        session.commit()

        # Exam schedules for each course
        exam_dates = {
            "EE101": (date(2024, 12, 5),  time(9, 0),  time(12, 0), room_lt1),
            "ES101": (date(2024, 12, 7),  time(9, 0),  time(12, 0), room_lt1),
            "ES102": (date(2024, 12, 9),  time(9, 0),  time(12, 0), room_lt2),
            "EE102": (date(2024, 12, 11), time(9, 0),  time(12, 0), room_lt2),
            "CS101": (date(2024, 12, 13), time(9, 0),  time(12, 0), room_lt1),
            "HS101": (date(2024, 12, 2),  time(14, 0), time(16, 0), room_lt1),
            "HS102": (date(2024, 12, 3),  time(14, 0), time(16, 0), room_lt2),
        }
        exam_sched_map = {}
        for code, (ex_date, st, et, room) in exam_dates.items():
            xs = ExamSchedules(
                exam_id=exam_sem1.id,
                course_id=course_objs[code].id,
                room_id=room.id,
                exam_date=ex_date,
                start_time=st,
                end_time=et,
            )
            session.add(xs)
            session.commit()
            exam_sched_map[code] = xs

        # ------------------------------------------------------------------ #
        # 9. STUDENTS – all 29 BMS students
        # ------------------------------------------------------------------ #
        print(f"  → Seeding {len(BMS_STUDENTS)} students...")

        for roll, first, last, sgpa, cgpa in BMS_STUDENTS:
            email = _email(first, last, roll)
            last_name = last if last else first  # handle single-name students

            # User account
            s_user = Users(
                email=email,
                password_hash=pwd_context.hash(DEFAULT_PASSWORD),
                is_active=True,
            )
            session.add(s_user)
            session.commit()
            session.add(UserRoles(user_id=s_user.id, role_id=role_student.id))

            # Student profile
            s_profile = StudentProfiles(
                user_id=s_user.id,
                roll_number=roll,
                first_name=first,
                last_name=last_name,
                department_id=dept_ms.id,
                is_active=True,
            )
            session.add(s_profile)
            session.commit()

            # Batch enrollment
            session.add(BatchEnrollments(
                student_id=s_profile.id,
                batch_id=batch_2028.id,
                semester_id=sem1.id,
                status="active",
            ))

            # Semester registration (Sem-1, approved & fees paid)
            sem_reg = SemesterRegistrations(
                student_id=s_profile.id,
                semester_id=sem1.id,
                institute_fee_paid=True,
                hostel_fee_paid=True,
                total_credits=total_sem1_credits,
                status="approved",
            )
            session.add(sem_reg)
            session.commit()

            # Subject registrations for every course
            for code, offering in offering_objs.items():
                session.add(SubjectRegistrations(
                    registration_id=sem_reg.id,
                    course_offering_id=offering.id,
                    is_backlog=False,
                ))

            session.commit()

            # ---- Marks & Grades (reverse-engineer from SGPA) ----
            # We distribute marks so that the weighted average ≈ sgpa*10
            target_pct = sgpa * 10.0  # e.g. 8.83 → 88.3%

            for code, offering in offering_objs.items():
                mid_comp, end_comp = assessment_map[code]

                # Small per-course variation (±3%)
                import random
                random.seed(hash(roll + code))
                variation = random.uniform(-3.0, 3.0)
                course_pct = min(100.0, max(40.0, target_pct + variation))

                # mid: slightly lower than end (students usually score higher in endsem with preparation)
                mid_pct  = max(35.0, course_pct - 5.0)
                end_pct  = min(100.0, course_pct + 2.0)
                total_pct = mid_pct * 0.30 + end_pct * 0.70

                session.add(StudentMarks(
                    component_id=mid_comp.id,
                    student_id=s_profile.id,
                    marks_obtained=round(mid_pct, 1),
                    is_absent=False,
                ))
                session.add(StudentMarks(
                    component_id=end_comp.id,
                    student_id=s_profile.id,
                    marks_obtained=round(end_pct, 1),
                    is_absent=False,
                ))

                # Determine grade letter
                gp = 0.0
                gl = "F"
                for letter, min_p, max_p, grade_point in GRADE_RULES:
                    if min_p <= total_pct <= max_p:
                        gl = letter
                        gp = grade_point
                        break

                sg = StudentGrades(
                    offering_id=offering.id,
                    student_id=s_profile.id,
                    total_marks=round(total_pct, 2),
                    grade_letter=gl,
                    grade_point=gp,
                    is_published=True,
                    published_at=None,
                )
                session.add(sg)

                # Exam result (end-sem marks)
                session.add(ExamResults(
                    exam_schedule_id=exam_sched_map[code].id,
                    student_id=s_profile.id,
                    marks_obtained=round(end_pct, 1),
                    is_absent=False,
                    is_published=True,
                ))

            # Semester result (use actual grades data)
            session.add(StudentSemesterResults(
                student_id=s_profile.id,
                semester_id=sem1.id,
                sgpa=sgpa,
                cgpa=cgpa,
                total_credits_earned=total_sem1_credits,
            ))

            # Fee record
            session.add(StudentFees(
                student_id=s_profile.id,
                semester_id=sem1.id,
                amount=85000.0,
                status="paid",
            ))

            session.commit()
            print(f"    ✓ [{roll}] {first} {last_name}  SGPA={sgpa}")

        # ------------------------------------------------------------------ #
        # 10. FEEDBACK LINKS – one per course-faculty pair
        # ------------------------------------------------------------------ #
        for code, offering in offering_objs.items():
            fac_idx = COURSE_FACULTY_MAP.get(code[:2], 0)
            session.add(CourseFacultyFeedbackLinks(
                offering_id=offering.id,
                faculty_id=faculty_profiles[fac_idx].id,
                form_url=f"https://feedback.iiitmg.ac.in/sem1/{code.lower()}",
                is_active=False,  # Semester 1 feedback closed
            ))
        session.commit()

        print("\n" + "="*60)
        print("Database seeded successfully!")
        print("="*60)
        print(f"  Admin:    admin@iiitmg.ac.in       / {DEFAULT_PASSWORD}")
        print(f"  Faculty:  rahul.sharma@iiitmg.ac.in / {DEFAULT_PASSWORD}")
        print(f"            ananya.verma@iiitmg.ac.in / {DEFAULT_PASSWORD}")
        print(f"            suresh.gupta@iiitmg.ac.in / {DEFAULT_PASSWORD}")
        print(f"            priya.nair@iiitmg.ac.in   / {DEFAULT_PASSWORD}")
        print(f"  Students: <name><num>@iiitmg.ac.in  / {DEFAULT_PASSWORD}")
        print(f"            e.g. pulkit020@iiitmg.ac.in")
        print("="*60)
        print(f"  Program:  BMS (B.Tech + MBA) – 2024 Batch")
        print(f"  Courses:  {len(BMS_SEM1_COURSES)} × Sem-1 courses  ({total_sem1_credits} credits)")
        print(f"  Students: {len(BMS_STUDENTS)} (with real SGPA/CGPA from grades file)")
        print("="*60)


if __name__ == "__main__":
    seed_db()
