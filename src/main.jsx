import React, {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import AppRouter from './features/app/Router.tsx'
import store from "./common/store.ts"
import {Provider} from "react-redux";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}>
            <AppRouter/>
        </Provider>
    </StrictMode>,
)
