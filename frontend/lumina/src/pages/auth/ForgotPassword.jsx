import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AuthLayout from '../../components/layout/AuthLayout'
import TextInput from '../../components/forms/TextInput'
import { ROUTES } from '../../utils/constants'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    // Backend does not have a reset endpoint yet
    // We simulate the flow for now
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSubmitted(true)
  }

  return (
    <AuthLayout>
      {submitted ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-6">
            If an account exists for that email, we've sent password reset instructions.
          </p>
          <Link to={ROUTES.LOGIN} className="btn-primary inline-block">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Forgot password?</h2>
            <p className="text-gray-500 text-sm mt-1">
              Enter your email and we'll send you reset instructions.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInput
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              register={register}
              error={errors.email}
              required
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password?{' '}
            <Link to={ROUTES.LOGIN} className="text-navy-700 font-medium hover:text-navy-800">
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}

export default ForgotPassword