# AcadERP Platform Features

Below is a comprehensive list of all the features and capabilities we have successfully implemented and discussed within the AcadERP backend architecture, categorized broadly by their core modules to reflect our modular, Domain-Driven Design (DDD).

## 1. Identity & Access Module
*Powers authentication, user accounts, and security levels across the platform.*

- **Email-Based Identity**: Secure user account management powered by hashed passwords (`Users` model) using `pwd_context`.
- **Role-Based Access Control (RBAC)**: Dynamic role assignment natively mapped to system users (`Roles` and `UserRoles`). It supports custom roles like Admin, Faculty, and Student.
- **Audit Trails**: Built-in timestamps for user creation, modification, and precisely when access roles are granted.

## 2. Organization Module
*Maintains top-level institute architecture and overarching profiles of all individuals.*

- **Departments Management**: Stores departmental details mapped to a Head of Department (`Departments`).
- **Student Profiling**: 
  - Unique identification (Roll number mapping).
  - **Comprehensive Personal Registration**: Detailed tracking mechanism for demographics, category (General, SC, ST, etc.), residential background, and blood group.
  - **Guardian & Parent Info**: Father's and Mother's profession and contact, alongside Local Guardian and Emergency contacts.
  - **Government & Banking Info**: Secure fields for Aadhar number, ABC Id, and personal bank account details (for stipends/scholarships).
- **Faculty Profiling**: Secure employee management connecting Faculty ID (`Employee ID`), titles, bios, joining dates, and departments to the central logging identity. 

## 3. Academics Module
*The core structural engine tracking how education is delivered.*

- **Programs**: Definition of degrees provided (e.g., B.Tech, M.Tech, Integrated), duration, and departmental ownership.
- **Batches & Cohorts**: Systematic grouping of students joining in identical academic years into single identifiable batches.
- **Semesters Management**: Robust timelines mapping start and end dates and specifically tracking whether a semester is currently active globally.
- **Courses**: Subject catalogue repository enforcing credits, department ownership, and course types.
- **Course Offerings (The Pipeline)**: Attaching a `Course` to a specific `Batch` and `Semester`, representing a real-life class being conducted.
- **Faculty Allocation**: Mapping specific professors to a specific `Course Offering` (as an instructor or other custom role).
- **Online Semester Registration**:
  - Ability for students to declare their status and intent to register at the start of a semester.
  - Explicit tracking of **Institute Fee** and **Hostel Fee** payment statuses for each semester registration.
- **Online Subject Selection**:
  - Fine-grained tracking mapping a student's `Semester Registration` to exact `Course Offerings`.
  - First-class support for **Backlog Courses**, allowing out-of-batch course selections while strictly maintaining max-credit enforcing limits.

## 4. Scheduling & Facilities Module
*Resolves logistics and physical resource allocation.*

- **Rooms**: Physical inventory definitions (e.g., Lecture Theatres), maintaining exact student capacity and room logic.
- **Timetable Slots**: Granular time-based assignments mapping a class (`CourseOffering`) to a specific `Room`, day of the week, and precise time blocks (e.g., 11:00 AM - 11:55 AM) using effective dates.

## 5. Assessments & Grading Module
*Translates academic pipelines into measurable success.*

- **Evaluation Schema**: Definitions of component exams (Mid-terms, End-terms, Assignments).
- **Grades & Marks Logic**: Storage structures handling grade boundaries, individual component scores, and final Semester Results (GPA/CGPA resolution).

## 6. Exams & Feedback Module
*Dedicated handling of examination schedules and institutional feedback pipelines.*

- **Examination Orchestration**: Centralized exam scheduling and generalized exam result logic.
- **Course & Faculty Feedback**: Schema infrastructure capable of housing contextual feedback securely linking course instances and the responsible faculty.

## 7. Finance Module
*Administrative oversight on institutional monetary affairs.*

- **Fee Receipts**: High-level financial ledgers linking students to semesters with recorded amounts, payment statuses (Paid/Unpaid), and cloud receipt URLs. (This works in tandem with the quick boolean flags now attached to the Academic online registration flow).

## 8. Automated Scripts & Tooling
*Behind-the-scenes processes ensuring developer capabilities.*

- **Dynamic Database Bootstrapping** (`seed_db.py`): A complete wiping and re-seeding mechanism equipped to generate dummy faculties, populate real class schedules, inject dummy users/students, and establish structural blueprints matching the data architecture.
- **Modular GraphQL API**: Integration of `Strawberry` to provide a tightly-typed, flexible API interface allowing front-end portals to query exactly what they need across diverse domains without over/under-fetching. 
