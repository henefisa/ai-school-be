import { Gender } from 'src/shared/constants';

/**
 * Groups form data fields by their prefixes
 * Converts fields like 'personal.firstName', 'personal.lastName', 'contact.email'
 * into { personal: { firstName, lastName }, contact: { email } }
 *
 * @example
 * // Form data like:
 * const formData = {
 *   'personal.firstName': 'John',
 *   'personal.lastName': 'Doe',
 *   'contact.email': 'john@example.com',
 *   photo: fileObject
 * };
 *
 * // Becomes:
 * const grouped = groupFormDataByPrefix(formData);
 * // {
 * //   personal: { firstName: 'John', lastName: 'Doe' },
 * //   contact: { email: 'john@example.com' }
 * // }
 * // Note: The 'photo' field is skipped as it doesn't have a prefix
 */
export function groupFormDataByPrefix<T extends Record<string, any>>(
  formData: T,
): Record<string, Record<string, any>> {
  const result: Record<string, Record<string, any>> = {};

  for (const [key, value] of Object.entries(formData)) {
    // Skip fields without a prefix or non-string keys
    if (!key.includes('.') || typeof key !== 'string') {
      continue;
    }

    const [prefix, field] = key.split('.');

    // Initialize the group if it doesn't exist
    if (!result[prefix]) {
      result[prefix] = {};
    }

    // Add the field to its group
    result[prefix][field] = value as unknown as string;
  }

  return result;
}

/**
 * Student form data structure after grouping
 */
export interface GroupedStudentFormData {
  personal: {
    firstName: string;
    lastName: string;
    dob: string;
    gender: Gender;
    username: string;
    password: string;
    studentId?: string;
  };
  contact: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    email: string;
    phone: string;
  };
  academic: {
    grade: string;
    academicYear: string;
    enrollmentDate?: string;
    previousSchool?: string;
    additionalNotes?: string;
  };
  parent: {
    name: string;
    relationship: string;
    email: string;
    phoneNumber: string;
    address: string;
    emergencyContact: string;
    parentId: string;
  };
}

/**
 * A type-safe extension of the groupFormDataByPrefix function
 * for student form data specifically.
 *
 * @example
 * // Using with StudentDTO from form data
 * const studentDto = new CreateStudentDto(); // From request.body
 * const groupedData = groupStudentFormData(studentDto);
 *
 * // Now you can access fields in a structured way
 * const firstName = groupedData.personal.firstName;
 * const email = groupedData.contact.email;
 */
export function groupStudentFormData<T extends Record<string, any>>(
  formData: T,
): GroupedStudentFormData {
  const grouped = groupFormDataByPrefix(formData);

  // Handle fields that need specific conversion
  if (grouped.personal && grouped.personal.gender) {
    // Ensure gender is converted to the proper enum value
    grouped.personal.gender = grouped.personal.gender as Gender;
  }

  // Cast to the expected type, after doing necessary conversions
  return grouped as unknown as GroupedStudentFormData;
}
