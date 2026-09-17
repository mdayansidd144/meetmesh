import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function GoogleButton({ onError }) {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");

  const handleSuccess = async (response) => {
    try {
      await loginWithGoogle(response.credential);
    } catch (err) {
      const msg = err.response?.data?.message || "Google sign in failed";
      setError(msg);
      if (onError) onError(msg);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          setError("Google sign in failed");
          if (onError) onError("Google sign in failed");
        }}
        theme="outline"
        size="large"
        width="360"
        text="continue_with"
        shape="pill"
        logo_alignment="left"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}