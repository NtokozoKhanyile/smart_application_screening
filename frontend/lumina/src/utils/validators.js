import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const personalInfoSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  middle_name: z.string().optional(),
  surname: z.string().min(2, 'Surname is required'),
  email: z.string().email('Please enter a valid email'),
  phone_number: z.string().min(10, 'Please enter a valid phone number'),
  id_number: z.string().min(13, 'ID number must be 13 digits').max(13),
  address: z.string().min(5, 'Please enter a valid address'),
})

export const guardianSchema = z.object({
  guardian_name: z.string().min(2, 'Guardian name is required'),
  guardian_phone_number: z.string().min(10, 'Please enter a valid phone number'),
  guardian_email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
})

export const academicSchema = z.object({
  course_id: z.number({ required_error: 'Please select a course' }),
  subjects: z.array(z.object({
    subject_id: z.number(),
    mark: z.number().min(0).max(100),
  })).min(1, 'Please add at least one subject'),
})