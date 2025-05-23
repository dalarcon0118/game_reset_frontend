import { useAuth } from '@/shared/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';

// Define the form schema using zod
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const useLoginForm = () => {
  const { login,user,error } = useAuth();

  const {
    register,
    control, 
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
      if (error!==null) {
        setError('root', { message: 'Usuario o contraseña incorrectos.' });
      }
  
  }, [error]);

  const onSubmit = async (data: LoginFormValues) => {
       login(data.username, data.password);
       
      
  };

  return {
    register,
    control, 
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
  };
};