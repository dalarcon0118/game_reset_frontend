import * as SecureStore from 'expo-secure-store';
import { User, mockUsers } from '@/data/mockData';

export const LoginService = () => {
  const foundUserFn =(username:string)=> mockUsers.find(
        (u) => u.username === username && u.active
      );
   
  const validateCredentials = (username:string,password:string): string | null =>{
        
        if (!username.trim() || !password.trim()) {
          throw new Error( 'Por favor ingrese usuario y contraseña');
        }
        
        return null;
      }   
   const login = async (username: string, password: string): Promise<User | null > => {
    try {
      const validationError = validateCredentials(username,password);

      const foundUser = foundUserFn(username);

      if (foundUser && foundUser.password === password) {
        await SecureStore.setItemAsync('loggedInUser', JSON.stringify(foundUser));
        return  foundUser
      }
      await SecureStore.deleteItemAsync('loggedInUser');
      return null ;
    } catch (error) {
      console.error('Login error', error);
      await SecureStore.deleteItemAsync('loggedInUser');
      return null;
        
      };
    }
  

  const logout = async(): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync('loggedInUser');
    } catch (error) {
      console.error('Logout error', error);
    }
  }

   const checkLoginStatus = async (): Promise<User | null> =>{
    try {
      const storedUserString = await SecureStore.getItemAsync('loggedInUser');
      if (!storedUserString) {
        return null;
      }
      
      const loggedInUser: User = JSON.parse(storedUserString);
      const userExists = mockUsers.some(u => u.id === loggedInUser.id);
      
      if (!userExists) {
        await SecureStore.deleteItemAsync('loggedInUser');
        return null;
      }
      
      return loggedInUser;
    } catch (error) {
      console.error('Check login status error:', error);
      return null;
    }
  }
  return {
    login,
    logout,
    checkLoginStatus
  }
}