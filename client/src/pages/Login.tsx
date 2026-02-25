import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../main";
import axios from "axios";
import toast from "react-hot-toast";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { useAppData } from "../context/AppContext";

const Login = ()=>{
    const [loading , setLoading] = useState(false);
    const navigate = useNavigate();

    const {setUser , setIsAuth} = useAppData();

    const responceGoogle = async (credentialResponse: any) => {
        setLoading(true);
        try {
        const idToken = credentialResponse.credential;

        const res = await axios.post(
            `${authService}/api/auth/google-login`,
            { idToken }
        );

        // Store tokens
        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        toast.success(res.data.message);
        setLoading(false)
        setUser(res.data.user)
        setIsAuth(true)
        navigate("/")
        } catch (error) {
            console.error(error);
            toast.error("Problem while login");
            setLoading(false);
        }
    };

    const googlelogin = useGoogleLogin({
        onSuccess:responceGoogle,
        onError:responceGoogle,
        flow:"auth-code",
    })
    
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-white px-4">
            <div className="w-full max-w-sm space-y-6">

                <h1 className="text-center text-3xl font-bold text-[#E23774]">
                    Cravzo Delivery Login
                </h1>
                <p className="text-center text-sm text-gray-500">
                    Login or SignUp to Continue
                </p>

            
                <GoogleLogin
                onSuccess={responceGoogle}
                onError={() => console.log("Login Failed")}
                size="large"
                />

                <p className="text-cneter text-xs text-gray-400">
                    By continueing , you agree with our{" "}
                    <span className="text-[#E23774]">Terms of Service</span> & {" "}
                    <span className="text-[#E23774]">Privacy Policy</span>
                </p>
            </div>
        </div>
    )
}

export default Login;