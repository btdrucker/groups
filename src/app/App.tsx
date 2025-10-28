import React from "react";
import Composer from "../features/composer/Composer";
import {persistor} from "./store";
import {useDispatch} from "react-redux";
import {useAppDispatch} from "./hooks";
import AuthScreen from "../features/auth/AuthScreen";
import WelcomeUser from "../features/auth/WelcomeUser";
import { onAuthStateChange } from "../firebase/auth";
import { User } from "firebase/auth";

const App = () => {
    const [user, setUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChange((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // const dispatch = useAppDispatch();
    // dispatch({type: "RESET_STATE"})

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {user && <WelcomeUser user={user} />}
            {user ? <Composer/> : <AuthScreen/>}
        </>
    )
}

export default App
