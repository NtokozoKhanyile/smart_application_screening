import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import AuthLayout from '../../components/layout/AuthLayout'
import TextInput from '../../components/forms/TextInput'
import FormError from '../../components/forms/FormError'
import useAuth from '../../hooks/useAuth'
import { registerSchema } from '../../utils/validators'
import { ROUTES } from '../../utils/constants'

const Register = () => {
  const { register: registerUser, isLoading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) })

  useEffect(() => {
    return () => clearError()
  }, [])

  const onSubmit = async (data) => {
    try {
      await registerUser(data.email, data.password)
      toast.success('Account created! Please sign in.')
      navigate(ROUTES.LOGIN)
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    }
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
        <p className="text-gray-500 text-sm mt-1">
          Apply for university admission through Lumina
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormError message={error} />

        <TextInput
          label="Email Address"
          name="email"
          type="email"
          placeholder="you@example.com"
          register={register}
          error={errors.email}
          required
        />

        <TextInput
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          register={register}
          error={errors.password}
          required
          hint="Minimum 6 characters"
        />

        <TextInput
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          register={register}
          error={errors.confirmPassword}
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-navy-700 font-medium hover:text-navy-800">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Register