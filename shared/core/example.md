```typescript
// Imagina que tienes un servicio de API configurado con interceptores
import apiService from './services/api'; 

const effectHandlers = {
  'HTTP': async (payload) => {
    const { url, method, body, headers, msgCreator } = payload;
    
    // El apiService ya tiene los interceptores para inyectar el Token
    // y manejar la renovación del mismo.
    try {
      const response = await apiService({
        url,
        method,
        data: body,
        headers: headers // Puedes mezclar headers específicos con los globales
      });
      return response.data;
    } catch (error) {
      // Aquí podrías normalizar el error antes de devolverlo
      throw error; 
    }
  }
};

const update = (model, msg) => {
  switch (msg.type) {
    case 'LOGIN_CLICKED':
      return [
        { ...model, loading: true, error: null },
        Cmd.task({
          task: AuthService.login,
          args: [msg.email, msg.password],
          onSuccess: (user) => ({ type: 'LOGIN_SUCCESS', user }),
          onFailure: (err) => ({ type: 'LOGIN_FAILED', error: err.message })
        })
      ];

    case 'LOGIN_SUCCESS':
      return [{ ...model, user: msg.user, loading: false }, null];

    case 'LOGIN_FAILED':
      return [{ ...model, error: msg.error, loading: false }, null];
      
    default:
      return [model, null];
  }
};

export default effectHandlers;````
