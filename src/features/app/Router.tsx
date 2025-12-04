import React, {useEffect} from 'react';
import {BrowserRouter, Routes, Route, useNavigate, useParams, useLocation} from 'react-router-dom';
import {useAppDispatch, useAppSelector} from '../../common/hooks';
import {selectUser, selectAuthInitialized, setUser} from '../auth/slice';
import {setPendingPuzzleId, selectPendingPuzzleId} from './slice';
import {onAuthStateChange} from '../../firebase/auth';
import AuthScreen from '../auth/AuthScreen';
import Compose from '../compose/Compose';
import ComposeList from '../compose-list/ComposeList';
import Play from '../play/Play';
import PlayList from '../play-list/PlayList';
import styles from './style.module.css';
import { ensureGameStateLoaded } from '../play/slice';

const PlayRoute: React.FC = () => {
    const {puzzleId} = useParams<{ puzzleId: string }>();
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);

    useEffect(() => {
        if (!user && puzzleId) {
            dispatch(setPendingPuzzleId(puzzleId));
        } else if (user && puzzleId) {
            dispatch(ensureGameStateLoaded(puzzleId));
            dispatch(setPendingPuzzleId(undefined));
        }
    }, [user, puzzleId, dispatch]);

    if (!user) {
        return (
            <div className={styles.appContainer}>
                <AuthScreen/>
            </div>
        );
    }

    return (
        <div className={styles.appContainer}>
            <Play/>
        </div>
    );
};

const ComposeRoute: React.FC = () => {
    const user = useAppSelector(selectUser);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/');
        }
    }, [user, navigate]);

    if (!user) {
        return null;
    }

    return (
        <div className={styles.appContainer}>
            <Compose/>
        </div>
    );
};

const HomeRoute: React.FC = () => {
    const user = useAppSelector(selectUser);
    const pendingPuzzleId = useAppSelector(selectPendingPuzzleId);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (user && pendingPuzzleId) {
            navigate(`/play/${pendingPuzzleId}`);
            dispatch(setPendingPuzzleId(undefined));
        }
    }, [user, pendingPuzzleId, navigate, dispatch]);

    if (!user) {
        return (
            <div className={styles.appContainer}>
                <AuthScreen/>
            </div>
        );
    }

    return (
        <div className={styles.appContainer}>
            <ComposeList/>
        </div>
    );
};

const PlayListRoute: React.FC = () => {
    const user = useAppSelector(selectUser);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!user) {
            navigate('/');
        } else if (location.pathname === '/play' || location.pathname === '/play/') {
            navigate('/puzzles', {replace: true});
        }
    }, [user, navigate, location.pathname]);

    if (!user) {
        return null;
    }

    return (
        <div className={styles.appContainer}>
            <PlayList/>
        </div>
    );
};

const LoadingScreen: React.FC = () => (
    <div className={styles.appContainer}>
        <div>Loading...</div>
    </div>
);

const AppRouter: React.FC = () => {
    const dispatch = useAppDispatch();
    const initialized = useAppSelector(selectAuthInitialized);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((currentUser) => {
            dispatch(setUser(currentUser));
        });
        return () => unsubscribe();
    }, [dispatch]);

    if (!initialized) {
        return <LoadingScreen/>;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomeRoute/>}/>
                <Route path="/play/:puzzleId" element={<PlayRoute/>}/>
                <Route path="/compose" element={<ComposeRoute/>}/>
                <Route path="/puzzles" element={<PlayListRoute/>}/>
                <Route path="*" element={<PlayListRoute/>}/>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
