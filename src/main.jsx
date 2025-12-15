import React, {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import store, {persistor} from "./common/store.ts"
import {Provider} from "react-redux";
import {PersistGate} from "redux-persist/integration/react";
import App from "./features/app/App.tsx";
import {BrowserRouter} from "react-router-dom";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}>
            <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
                <BrowserRouter>
                    <App/>
                </BrowserRouter>
            </PersistGate>
        </Provider>
    </StrictMode>,
)
