import { useAuth } from '@/shared/context/AuthContext';
import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod'; // Eliminado
// import * as z from 'zod'; // Eliminado
import { useEffect } from 'react';

// Define el tipo para los valores del formulario manualmente si es necesario,
// o usa 'any' si no necesitas una tipificación estricta aquí.
interface LoginFormValues {
  username: string;
  password: string;
  // Puedes añadir más campos si tu formulario los tiene
}

export const useLoginForm = () => {
  const { login, user, error } = useAuth();

  const {
    // register, // react-hook-form v7+ ya no exporta register directamente desde useForm
    control, 
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    // resolver: zodResolver(loginSchema), // Eliminado
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
      if (error!==null) {
        // Asegúrate de que 'root' es un nombre de campo válido o usa un campo específico
        // como 'username' o 'password' si el error se relaciona con ellos.
        // O puedes manejar un error general de otra manera.
        setError('root', { type: 'manual', message: 'Usuario o contraseña incorrectos.' });
      }
  
  }, [error, setError]);

  const onSubmit = async (data: LoginFormValues) => {
       login(data.username, data.password);
  };

  return {
    control, 
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
  };
};