import React from "react";
import Composer from "../features/composer/Composer";
import {persistor} from "./store";
import {useDispatch} from "react-redux";
import {useAppDispatch} from "./hooks";
import AuthScreen from "../features/auth/AuthScreen";

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    // const dispatch = useAppDispatch();
    // dispatch({type: "RESET_STATE"})
    return (
        isAuthenticated ? <Composer/> : <AuthScreen/>
    )
}

export default App
