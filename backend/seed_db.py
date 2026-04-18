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

def seed_db():
    print("Dropping existing tables...")
    SQLModel.metadata.drop_all(engine)
    print("Creating tables...")
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        print("Seeding initial data...")

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
