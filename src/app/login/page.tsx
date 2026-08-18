import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="container flex items-center justify-center py-16">
      <AuthForm mode="login" />
    </div>
  );
}
