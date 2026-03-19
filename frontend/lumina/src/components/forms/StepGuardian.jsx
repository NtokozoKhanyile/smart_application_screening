import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import TextInput from './TextInput'
import FormSection from './FormSection'
import { guardianSchema } from '../../utils/validators'

const StepGuardian = ({ formData, onNext, onBack }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(guardianSchema),
    defaultValues: formData,
  })

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <FormSection title="Guardian / Emergency Contact" description="Provide details of your parent or legal guardian.">
        <TextInput label="Guardian Full Name" name="guardian_name" register={register} error={errors.guardian_name} required />
        <TextInput label="Guardian Phone" name="guardian_phone_number" register={register} error={errors.guardian_phone_number} required />
        <TextInput label="Guardian Email" name="guardian_email" type="email" register={register} error={errors.guardian_email} />
      </FormSection>
      <div className="flex justify-between mt-6">
        <button type="button" onClick={onBack} className="btn-secondary px-8">← Back</button>
        <button type="submit" className="btn-primary px-8">Next →</button>
      </div>
    </form>
  )
}

export default StepGuardian