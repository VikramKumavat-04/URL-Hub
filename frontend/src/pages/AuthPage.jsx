import LoginForm from '../components/LoginForm.jsx';
import RegisterForm from '../components/RegisterForm.jsx';
import { useState } from 'react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  return isLogin
    ? <LoginForm state={setIsLogin} />
    : <RegisterForm state={setIsLogin} />;
}
