import React, {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './features/app/App.tsx'
import store from "./common/store.ts"
import {Provider} from "react-redux";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}>
            <App/>
        </Provider>
    </StrictMode>,
)
