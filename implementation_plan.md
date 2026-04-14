# Academic ERP System - Complete Design & Implementation Plan

A modular, scalable Enterprise Resource Planning system for colleges/universities, designed for real-world academic environments.

### Team
- Neelabhro Ghosh (2024BMS-014) **Backend developer**
- Pulkit Katariya (2024BMS-020) **Backend developer**
- Pray Karia (2024BMS-018) **Database management**
- Anupam Baraik (2024BMS-004) **Frontend developer**
- Sachin Badavath (2024BMS-005) **Frontend developer**

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React.js | Modern, component-based UI framework |
| **API Layer** | GraphQL | Flexible, efficient API queries with single endpoint |
| **Backend** | Node.js + Express | Server runtime with GraphQL integration (Apollo Server) |
| **Database** | PostgreSQL | Robust relational database for academic data |
| **Authentication** | JWT + OAuth 2.0 | Secure token-based auth with SSO support |
| **Caching** | Redis | Session management and query caching |
| **File Storage** | AWS S3 / MinIO | Document and transcript storage |

### Why GraphQL?

- **Efficient Data Fetching**: Clients request exactly what they need, reducing over-fetching
- **Single Endpoint**: Simplifies API management with one `/graphql` endpoint
- **Strong Typing**: Schema-first approach with built-in validation
- **Real-time Support**: Subscriptions for live notifications and updates
- **Flexible Queries**: Students, faculty, and admin can query data tailored to their views

---

## 1. Feature Breakdown

### 1.1 Student Module

#### Core Features (Must-Have)

| Feature | Description | Problem Solved |
|---------|-------------|----------------|
| **User Profile View** | View personal details and uploaded documents | Centralizes student data; students can verify their info |
| **Class Schedule View** | Weekly/monthly calendar view with class timings, rooms, faculty | Eliminates scheduling confusion; real-time updates |
| **Attendance Tracking** | View attendance percentage per course with alerts | Students can self-monitor; reduces proxy issues |
| **Grade & Result Portal** | View grades, CGPA/SGPA, download transcripts | Instant access to academic records; reduces admin load |
| **Fee Management** | View fee structure, pending dues, payment history, online payment | Streamlines payments; reduces queues at finance office |
| **Exam Schedule View** | View exam dates and venue | Ensures timely access to exam information |
| **Leave/Application System** | Apply for leaves, academic requests with status tracking | Digitizes paper applications; transparent tracking |
| **Notifications** | Push/email/in-app notifications for deadlines, events | Ensures timely communication; reduces information gaps |
| **Course & Faculty Feedback** | Anonymous feedback on courses and faculty | Improves teaching quality; structured feedback |

#### Role-Based Access (Student)
- View own data only (grades, attendance, fees)
- Cannot modify personal details or academic records
- Can submit applications/requests and feedback
- Limited to registered courses

---

### 1.2 Faculty Module

#### Core Features (Must-Have)

| Feature | Description | Problem Solved |
|---------|-------------|----------------|
| **Profile & Credentials** | Manage qualifications, publications, certifications | Centralized faculty records for accreditation |
| **Course Management** | View assigned courses, upload syllabus, course materials | Organized course content delivery |
| **Attendance Management** | Mark/edit attendance for classes (manual/QR/biometric) | Digitizes attendance; reduces manipulation |
| **Gradebook & Assessments** | Enter marks, define grading rubrics, calculate grades | Streamlines evaluation; transparent grading |
| **Class Schedule View** | Personal teaching schedule with room allocations | Time management; conflict visibility |
| **Student Performance Analytics** | View class averages, identify at-risk students | Proactive intervention; data-driven teaching |

#### Role-Based Access (Faculty)
- Full access to assigned course data
- Can mark attendance, enter grades for own courses
- Cannot access other faculty's data
- View-only access to student personal details

---

### 1.3 Administration Module

#### Core Features (Must-Have)

| Feature | Description | Problem Solved |
|---------|-------------|----------------|
| **User Management** | Create, update, deactivate user accounts (students/faculty/staff) | Centralized identity management |
| **Student Profile Management** | Edit student personal details, documents | Only admin can modify student data |
| **Course & Curriculum Management** | Create courses, define prerequisites, manage curriculum versions | Academic planning; accreditation compliance |
| **Department Management** | Manage departments, assign HODs, faculty allocation | Organizational structure management |
| **Batch & Section Management** | Create batches, sections, assign students | Automated class formation |
| **Academic Calendar** | Define semesters, holidays, exam periods | Institution-wide schedule coordination |
| **Fee Structure Management** | Create/modify fee structures, scholarships, discounts | Financial administration |
| **Exam Management** | Create exams, manage results publication | End-to-end exam lifecycle |
| **Notification System** | Send notifications visible on student and faculty portals | Direct communication channel |
| **Audit Logs** | Track all administrative actions | Security; accountability |

#### Role-Based Access (Admin)

| Role | Access Level |
|------|--------------|
| **Super Admin** | Full system access; all modules and user management |
| **Account Section** | Fee management, payment records, financial operations |
| **Academic Section** | Course management, exam scheduling, results, academic calendar |

---