# **Core Access & Authorization**

The system operates on strict Role-Based Access Control (RBAC) with three primary tiers: Administration, Faculty, and Student. Cross-role data visibility is strictly isolated.

## **1\. Administration Module**

* **Identity Management:** Provision and manage user accounts and assign roles (Admin, Faculty, Student).  
* **Financial Administration:** Update and verify student fee statuses (Paid/Unpaid/Partial) and manage fee receipt uploads. *(Constraint: Students should only be allowed to download their own fee receipts).*  
* **Academic Lifecycle:** Manage the overarching academic structure, including courses, programs, and curriculum updates.  
* **Scheduling & Logistics:** Define the academic timetable, assigning courses to specific rooms and time slots, and manage the master exam schedule.  
* **Enrollment Control:** Toggle online course registration windows open or closed for subsequent semesters.  
* **Result Publication & Grade Approval:** Review, approve, and publish final course grades forwarded by the faculty. Only Admins have the authority to officially publish final semester results. Admins also retain the ability to directly upload, override, or publish final grades themselves.  
* **Feedback Administration:** Generate, upload, and monitor feedback forms and review links for courses and faculty evaluations.

## **2\. Faculty Module**

* **Course Dashboard:** View assigned courses for the current semester and access a personalized timetable detailing lecture locations and timings.  
* **Academic Evaluation:** Manage continuous assessment by updating raw marks for minor/major exams, quizzes, lab evaluations, and assignments. *(Constraint: Faculty cannot publish final grades. They compile and forward the proposed final grades to the Administration for official approval and publication).*  
* **Attendance Tracking:** Record daily lecture/lab attendance.  
* **Automated Alerts:** Identify students falling below the mandatory 75% attendance threshold and trigger automated warning emails.

## **3\. Student Module**

* **Personal Dashboard:** Access a personalized, real-time academic timetable.  
* **Academic Performance & Analytics:** View individual grades and access statistical insights (percentiles, class averages, and medians). *(Strict privacy rule: A student cannot query or view another student's specific grades).*  
* **Historical Results:** Track historical SGPAs and the cumulative CGPA alongside the batch averages.  
* **Goal Tracking System:** Input a "Target CGPA" to receive automated calculations on the exact SGPA required in upcoming semesters to achieve or maintain the goal.  
* **Contextual Feedback:** Submit course and faculty evaluations strictly limited to the courses the student is actively enrolled in for the current semester.  


* SGPA and CGPA are given out of 10.00
