import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import TextInput from './TextInput'
import FormSection from './FormSection'
import { personalInfoSchema } from '../../utils/validators'

const StepPersonalInfo = ({ formData, onNext }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: formData,
  })

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <FormSection title="Personal Information" description="Enter your details as they appear on your ID document.">
        <TextInput label="First Name" name="first_name" register={register} error={errors.first_name} required />
        <TextInput label="Middle Name" name="middle_name" register={register} error={errors.middle_name} />
        <TextInput label="Surname" name="surname" register={register} error={errors.surname} required />
        <TextInput label="Email Address" name="email" type="email" register={register} error={errors.email} required />
        <TextInput label="Phone Number" name="phone_number" register={register} error={errors.phone_number} required placeholder="+27123456789" />
        <TextInput label="ID Number" name="id_number" register={register} error={errors.id_number} required hint="13 digit South African ID number" />
      </FormSection>
      <FormSection title="Address">
        <div className="md:col-span-2">
          <TextInput label="Full Address" name="address" register={register} error={errors.address} required />
        </div>
      </FormSection>
      <div className="flex justify-end mt-6">
        <button type="submit" className="btn-primary px-8">Next →</button>
      </div>
    </form>
  )
}

export default StepPersonalInfo