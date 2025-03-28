import { Gender } from 'src/shared/constants';
import { groupFormDataByPrefix, groupStudentFormData } from './form-data.utils';

describe('Form Data Utilities', () => {
  describe('groupFormDataByPrefix', () => {
    it('should group form data by prefix', () => {
      // Arrange
      const formData = {
        'personal.firstName': 'John',
        'personal.lastName': 'Doe',
        'contact.email': 'john@example.com',
        'contact.phone': '123456789',
        photo: 'some-file-object',
      };

      // Act
      const result = groupFormDataByPrefix(formData);

      // Assert
      expect(result).toEqual({
        personal: {
          firstName: 'John',
          lastName: 'Doe',
        },
        contact: {
          email: 'john@example.com',
          phone: '123456789',
        },
      });
      // Non-prefixed fields should be skipped
      expect(result.photo).toBeUndefined();
    });

    it('should handle empty input', () => {
      // Act
      const result = groupFormDataByPrefix({});

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('groupStudentFormData', () => {
    it('should group student form data with proper types', () => {
      // Arrange
      const studentFormData = {
        'personal.firstName': 'John',
        'personal.lastName': 'Doe',
        'personal.dob': '2000-01-01',
        'personal.gender': Gender.Male,
        'personal.username': 'john.doe',
        'personal.password': 'password123',

        'contact.street': '123 Main St',
        'contact.city': 'New York',
        'contact.state': 'NY',
        'contact.zipCode': '10001',
        'contact.country': 'USA',
        'contact.email': 'john@example.com',
        'contact.phone': '123456789',

        'academic.grade': '10',
        'academic.academicYear': '2023-2024',
        'academic.previousSchool': 'Previous School',

        'parent.name': 'Parent Name',
        'parent.relationship': 'Father',
        'parent.email': 'parent@example.com',
        'parent.phoneNumber': '987654321',
        'parent.address': '456 Parent St',
        'parent.emergencyContact': 'Emergency Contact',
        'parent.parentId': '12345678-1234-1234-1234-123456789abc',

        photo: 'some-file-object',
      };

      // Act
      const result = groupStudentFormData(studentFormData);

      // Assert
      expect(result.personal.firstName).toBe('John');
      expect(result.personal.lastName).toBe('Doe');
      expect(result.personal.gender).toBe(Gender.Male);

      expect(result.contact.email).toBe('john@example.com');
      expect(result.contact.phone).toBe('123456789');

      expect(result.academic.grade).toBe('10');
      expect(result.academic.academicYear).toBe('2023-2024');

      expect(result.parent.name).toBe('Parent Name');
      expect(result.parent.parentId).toBe(
        '12345678-1234-1234-1234-123456789abc',
      );
    });
  });
});
