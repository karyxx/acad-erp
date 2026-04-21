// Student-facing queries

export const GET_STUDENT_PROFILE_BY_USER = `
  query GetStudentProfileByUser($userId: Int!) {
    getStudentProfiles { 
      id userId rollNumber firstName lastName
      dateOfBirth gender phone address departmentId
      targetCgpa guardianName guardianPhone
      bloodGroup fatherName fatherProfession motherName motherProfession
      category aadharNumber abcId emergencyContactName emergencyContactMobile
      localGuardian isActive
    }
  }
`

// We query the own profile via getStudentProfile(profileId)
// But we need the profileId first. We'll get it via the user's own profile
// Since students can only access their own, we use a workaround:
// Get student profile for own user_id

export const GET_MY_STUDENT_PROFILE = (profileId: number) => `
  query {
    getStudentProfile(profileId: ${profileId}) {
      id userId rollNumber firstName lastName
      dateOfBirth gender phone address departmentId
      targetCgpa bloodGroup category
      fatherName fatherProfession motherName motherProfession
      aadharNumber abcId emergencyContactName emergencyContactMobile
      localGuardian guardianName guardianPhone isActive
    }
  }
`

export const GET_STUDENT_MARKS = (studentId: number) => `
  query {
    getStudentMarks(studentId: ${studentId}) {
      id componentId studentId marksObtained isAbsent
    }
  }
`

export const GET_STUDENT_SEMESTER_RESULT = (studentId: number, semesterId: number) => `
  query {
    getStudentSemesterResult(studentId: ${studentId}, semesterId: ${semesterId}) {
      id studentId semesterId sgpa cgpa totalCreditsEarned
    }
  }
`

export const GET_STUDENT_FEE_STATUS = (studentId: number) => `
  query {
    getStudentFeeStatus(studentId: ${studentId}) {
      id studentId semesterId amount status receiptUrl
    }
  }
`

export const GET_SEMESTERS = `
  query {
    getSemesters {
      id programId number startDate endDate isCurrentregistrationWindowStart registrationWindowEnd
    }
  }
`

export const GET_COURSES = `
  query {
    getCourses {
      id code name departmentId credits courseType
    }
  }
`

export const GET_EXAMS = (semesterId: number) => `
  query {
    getExams(semesterId: ${semesterId}) {
      id semesterId name examType status
    }
  }
`

export const GET_EXAM_SCHEDULES = (examId: number) => `
  query {
    getExamSchedules(examId: ${examId}) {
      id examId courseId roomId examDate startTime endTime
    }
  }
`

// Faculty queries
export const GET_FACULTY_PROFILE = (profileId: number) => `
  query {
    getFacultyProfile(profileId: ${profileId}) {
      id userId employeeId firstName lastName departmentId title bio isActive
    }
  }
`

export const GET_FACULTY_PROFILES = `
  query {
    getFacultyProfiles {
      id userId employeeId firstName lastName departmentId title isActive
    }
  }
`

// Admin queries
export const GET_USERS = `
  query {
    getUsers { id email isActive }
  }
`

export const GET_DEPARTMENTS = `
  query {
    getDepartments { id code name hodId }
  }
`

export const GET_PROGRAMS = `
  query {
    getPrograms { id code name departmentId durationYears degreeType }
  }
`

export const GET_ROOMS = `
  query {
    getRooms { id code building capacity roomType }
  }
`

export const GET_ALL_SEMESTERS = `
  query {
    getSemesters { id programId number startDate endDate isCurrentregistrationWindowStart registrationWindowEnd }
  }
`

// Semester registrations
export const GET_SEMESTER_REGISTRATION = (id: number) => `
  query {
    getSemesterRegistration(id: ${id}) {
      id studentId semesterId instituteFeePayedhostelFeePaid totalCredits status
    }
  }
`
