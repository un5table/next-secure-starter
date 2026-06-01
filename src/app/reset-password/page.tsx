import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-form";

// useSearchParams (in ResetPasswordForm) requires a Suspense boundary.
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
