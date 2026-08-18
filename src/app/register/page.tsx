import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <div className="container flex items-center justify-center py-16">
      <AuthForm mode="register" />
    </div>
  );
}
