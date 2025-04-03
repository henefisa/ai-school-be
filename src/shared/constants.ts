export enum Role {
  Admin = 'ADMIN',
  Teacher = 'TEACHER',
  Student = 'STUDENT',
  Parent = 'PARENT',
}

export enum Gender {
  Male = 'MALE',
  Female = 'FEMALE',
  Other = 'OTHER',
}

export enum RelationshipToStudent {
  Mother = 'MOTHER',
  Father = 'FATHER',
  Other = 'OTHER',
}

export enum Grade {
  APlus = 'A_PLUS',
  A = 'A',
  AMinus = 'A_MINUS',
  BPlus = 'B_PLUS',
  B = 'B',
  BMinus = 'B_MINUS',
  CPlus = 'C_PLUS',
  C = 'C',
  CMinus = 'C_MINUS',
  DPlus = 'D_PLUS',
  D = 'D',
  F = 'F',
}

export enum DayOfWeek {
  Monday = 'MONDAY',
  TuesDay = 'TUESDAY',
  Wednesday = 'WEDNESDAY',
  Thursday = 'THURSDAY',
  Friday = 'FRIDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
}

export enum AttendanceStatus {
  Present = 'PRESENT',
  Absent = 'ABSENT',
  Late = 'LATE',
  Excused = 'EXCUSED',
}

export enum RoomType {
  ClassRoom = 'CLASS_ROOM',
  Lab = 'LAB',
  Office = 'OFFICE',
  Auditorium = 'AUDITORIUM',
  Other = 'OTHER',
}

export enum Title {
  Dr = 'DR',
  Mr = 'MR',
  Ms = 'MS',
  Mrs = 'MRS',
  Prof = 'PROF',
}

export enum EmploymentType {
  FullTime = 'FULL_TIME',
  PartTime = 'PART_TIME',
  Contract = 'CONTRACT',
  Temporary = 'TEMPORARY',
}

export enum SemesterStatus {
  Active = 'ACTIVE',
  Upcoming = 'UPCOMING',
  Completed = 'COMPLETED',
}

export enum EnrollmentStatus {
  Active = 'ACTIVE',
  Dropped = 'DROPPED',
  Completed = 'COMPLETED',
  OnHold = 'ON_HOLD',
  Waitlisted = 'WAITLISTED',
}
