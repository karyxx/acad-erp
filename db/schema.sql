-- 1. Identity & Auth

CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,   -- 'admin', 'faculty', 'student'
    description TEXT
);

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by  INTEGER REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- 2. Organization

CREATE TABLE departments (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) UNIQUE NOT NULL,
    name        VARCHAR(150) UNIQUE NOT NULL,
    hod_id      INTEGER, -- Merged references
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE faculty_profiles (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id     VARCHAR(30) UNIQUE NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE,
    gender          VARCHAR(20),
    phone           VARCHAR(20),
    department_id   INTEGER NOT NULL REFERENCES departments(id),
    title           VARCHAR(100),
    bio             TEXT,
    join_date       DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE student_profiles (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roll_number     VARCHAR(30) UNIQUE NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE,
    gender          VARCHAR(20),
    phone           VARCHAR(20),
    address         TEXT,
    target_cgpa     NUMERIC(4,2), -- Added for CGPA goal tracking
    guardian_name   VARCHAR(200),
    guardian_phone  VARCHAR(20),
    department_id   INTEGER REFERENCES departments(id),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Academics

CREATE TABLE programs (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(200) NOT NULL,
    department_id   INTEGER NOT NULL REFERENCES departments(id),
    duration_years  SMALLINT NOT NULL,
    degree_type     VARCHAR(50) NOT NULL            -- 'UG', 'PG', 'PhD'
);

CREATE TABLE semesters (
    id                     SERIAL PRIMARY KEY,
    program_id             INTEGER NOT NULL REFERENCES programs(id),
    number                 SMALLINT NOT NULL,
    start_date             DATE NOT NULL,
    end_date               DATE NOT NULL,
    academic_calendar_url  TEXT,
    is_current             BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (program_id, number, start_date)
);

CREATE TABLE batches (
    id          SERIAL PRIMARY KEY,
    program_id  INTEGER NOT NULL REFERENCES programs(id),
    year        SMALLINT NOT NULL,
    label       VARCHAR(50) NOT NULL,
    UNIQUE (program_id, year)
);

CREATE TABLE batch_enrollments (
    id              SERIAL PRIMARY KEY,
    student_id      INTEGER NOT NULL REFERENCES student_profiles(id),
    batch_id        INTEGER NOT NULL REFERENCES batches(id),
    semester_id     INTEGER NOT NULL REFERENCES semesters(id),
    enrolled_on     DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    UNIQUE (student_id, batch_id, semester_id)
);

CREATE TABLE courses (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(200) NOT NULL,
    department_id   INTEGER NOT NULL REFERENCES departments(id),
    credits         NUMERIC(4,1) NOT NULL,
    course_type     VARCHAR(30) NOT NULL DEFAULT 'core',
    description     TEXT
);

CREATE TABLE course_offerings (
    id              SERIAL PRIMARY KEY,
    course_id       INTEGER NOT NULL REFERENCES courses(id),
    semester_id     INTEGER NOT NULL REFERENCES semesters(id),
    batch_id        INTEGER NOT NULL REFERENCES batches(id),
    syllabus_url    TEXT,
    UNIQUE (course_id, semester_id, batch_id)
);

CREATE TABLE offering_faculty (
    offering_id INTEGER NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    faculty_id  INTEGER NOT NULL REFERENCES faculty_profiles(id),
    role        VARCHAR(30) NOT NULL DEFAULT 'instructor',
    PRIMARY KEY (offering_id, faculty_id)
);

-- 4. Scheduling

CREATE TABLE rooms (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) UNIQUE NOT NULL,
    building    VARCHAR(100),
    capacity    SMALLINT NOT NULL,
    room_type   VARCHAR(30)
);

CREATE TABLE timetable_slots (
    id              SERIAL PRIMARY KEY,
    offering_id     INTEGER NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    room_id         INTEGER REFERENCES rooms(id),
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    CHECK (start_time < end_time)
);

CREATE UNIQUE INDEX uix_room_slot
    ON timetable_slots (room_id, day_of_week, start_time, effective_from)
    WHERE room_id IS NOT NULL;

-- 5. Attendance

CREATE TABLE attendance_sessions (
    id              SERIAL PRIMARY KEY,
    offering_id     INTEGER NOT NULL REFERENCES course_offerings(id),
    session_date    DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    conducted_by    INTEGER NOT NULL REFERENCES faculty_profiles(id),
    method          VARCHAR(30) NOT NULL DEFAULT 'manual',
    UNIQUE (offering_id, session_date, start_time)
);

CREATE TABLE attendance_records (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id      INTEGER NOT NULL REFERENCES student_profiles(id),
    status          VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by       INTEGER REFERENCES faculty_profiles(id),
    marked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, student_id)
);

-- 6. Assessments & Grades

CREATE TABLE assessment_components (
    id              SERIAL PRIMARY KEY,
    offering_id     INTEGER NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    max_marks       NUMERIC(6,2) NOT NULL,
    weightage_pct   NUMERIC(5,2),
    conducted_on    DATE,
    UNIQUE (offering_id, name)
);

CREATE TABLE student_marks (
    id              SERIAL PRIMARY KEY,
    component_id    INTEGER NOT NULL REFERENCES assessment_components(id) ON DELETE CASCADE,
    student_id      INTEGER NOT NULL REFERENCES student_profiles(id),
    marks_obtained  NUMERIC(6,2),
    is_absent       BOOLEAN NOT NULL DEFAULT FALSE,
    entered_by      INTEGER REFERENCES faculty_profiles(id),
    entered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (component_id, student_id)
);

CREATE TABLE grade_rules (
    id              SERIAL PRIMARY KEY,
    program_id      INTEGER NOT NULL REFERENCES programs(id),
    grade_letter    VARCHAR(5) NOT NULL,
    min_percentage  NUMERIC(5,2) NOT NULL,
    max_percentage  NUMERIC(5,2) NOT NULL,
    grade_point     NUMERIC(3,1) NOT NULL,
    UNIQUE (program_id, grade_letter)
);

CREATE TABLE student_grades (
    id              SERIAL PRIMARY KEY,
    offering_id     INTEGER NOT NULL REFERENCES course_offerings(id),
    student_id      INTEGER NOT NULL REFERENCES student_profiles(id),
    total_marks     NUMERIC(6,2),
    grade_letter    VARCHAR(5),
    grade_point     NUMERIC(3,1),
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    published_at    TIMESTAMPTZ,
    UNIQUE (offering_id, student_id)
);

CREATE TABLE student_semester_results (
    id                   SERIAL PRIMARY KEY,
    student_id           INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    semester_id          INTEGER NOT NULL REFERENCES semesters(id),
    sgpa                 NUMERIC(4,2),
    cgpa                 NUMERIC(4,2),
    total_credits_earned NUMERIC(5,1),
    UNIQUE(student_id, semester_id)
);

-- 7. Exams

CREATE TABLE exams (
    id          SERIAL PRIMARY KEY,
    semester_id INTEGER NOT NULL REFERENCES semesters(id),
    name        VARCHAR(200) NOT NULL,
    exam_type   VARCHAR(50) NOT NULL,
    status      VARCHAR(30) NOT NULL DEFAULT 'scheduled'
);

CREATE TABLE exam_schedules (
    id          SERIAL PRIMARY KEY,
    exam_id     INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    course_id   INTEGER NOT NULL REFERENCES courses(id),
    room_id     INTEGER REFERENCES rooms(id),
    exam_date   DATE NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    UNIQUE (exam_id, course_id)
);

CREATE TABLE exam_results (
    id                  SERIAL PRIMARY KEY,
    exam_schedule_id    INTEGER NOT NULL REFERENCES exam_schedules(id),
    student_id          INTEGER NOT NULL REFERENCES student_profiles(id),
    marks_obtained      NUMERIC(6,2),
    is_absent           BOOLEAN NOT NULL DEFAULT FALSE,
    is_published        BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (exam_schedule_id, student_id)
);

-- 8. Feedback

CREATE TABLE course_faculty_feedback_links (
    id          SERIAL PRIMARY KEY,
    offering_id INTEGER NOT NULL,
    faculty_id  INTEGER NOT NULL,
    form_url    TEXT NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (offering_id, faculty_id) REFERENCES offering_faculty(offering_id, faculty_id) ON DELETE CASCADE,
    UNIQUE (offering_id, faculty_id)
);

-- 9. Finance (Simplified)

CREATE TABLE student_fees (
    id           SERIAL PRIMARY KEY,
    student_id   INTEGER NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    semester_id  INTEGER NOT NULL REFERENCES semesters(id),
    amount       NUMERIC(12,2) NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'unpaid', -- 'paid', 'unpaid', 'partial'
    receipt_url  TEXT, -- Link to the PDF receipt uploaded by admin
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
