export enum EntityName {
  User = 'user',
  Enrollment = 'enrollment',
  Course = 'course',
  Department = 'department',
  Teacher = 'teacher',
  Student = 'student',
  Parent = 'parent',
  Class = 'class',
  Room = 'room',
  Semester = 'semester',
  Address = 'address',
  Attendance = 'attendance',
}

export const ERROR_MESSAGES = {
  notFound: (entityName: EntityName) => `${entityName}_not_found`,
  badRequest: (entityName: EntityName) => `${entityName}_bad_request`,
  exists: (entityName: EntityName) => `${entityName}_already_exists`,
  invalidCredentials: () => `invalid_credentials`,
};
