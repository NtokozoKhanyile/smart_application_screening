import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import AuthLayout from '../../components/layout/AuthLayout'
import TextInput from '../../components/forms/TextInput'
import FormError from '../../components/forms/FormError'
import useAuth from '../../hooks/useAuth'
import { loginSchema } from '../../utils/validators'
import { ROUTES, ROLES } from '../../utils/constants'

const Login = () => {
  const { login, isAuthenticated, isLoading, error, clearError, user } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === ROLES.ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD)
      } else {
        navigate(ROUTES.STUDENT_DASHBOARD)
      }
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    return () => clearError()
  }, [])

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password)
      toast.success('Welcome back!')
      if (user.role === ROLES.ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD)
      } else {
        navigate(ROUTES.STUDENT_DASHBOARD)
      }
    } catch (err) {
      toast.error(err.message || 'Login failed')
    }
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-gray-500 text-sm mt-1">Sign in to your account to continue</p>
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
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-navy-700 focus:ring-navy-700"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm text-navy-700 hover:text-navy-800 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} className="text-navy-700 font-medium hover:text-navy-800">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}

export default Login