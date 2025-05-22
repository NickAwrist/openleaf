import React, { useState, useEffect } from 'react';

import AuthPage from './pages/AuthPage';
import { User } from 'src/types/userTypes';

declare global {
    interface Window {
        electronAPI: {
            getCurrentUser: () => Promise<User | null>;
            login: (nickname: string, masterPassword: string) => Promise<boolean>;
            register: (user: any) => Promise<{success: boolean, error?: string}>;
        };
    }
}

// Basic Component 1: Greeting
const GreetingComponent = ({ name }: { name: string }) => {
    return <h2 className="text-xl font-semibold text-primary mb-2">Hello, {name}! This is a basic component.</h2>;
};

// Basic Component 2: Counter
const CounterComponent = () => {
    const [count, setCount] = useState(0);
    return (
        <div className="p-4 border border-base-300 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Counter: {count}</h3>
            <div className="join">
                <button className="btn btn-primary join-item" onClick={() => setCount(count + 1)}>Increment</button>
                <button className="btn btn-secondary join-item" onClick={() => setCount(count - 1)}>Decrement</button>
            </div>
        </div>
    );
};

const Page1 = () => (
    <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-accent mb-4">Page 1: Greetings</h1>
        <h2 className="text-xl font-semibold text-primary mb-2">Balance: $108.92</h2>
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <GreetingComponent name="User" />
                <p className="text-base-content">This page shows a simple greeting.</p>
            </div>
        </div>
    </div>
);

const Page2 = () => (
    <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-accent mb-4">Page 2: Interactive Counter</h1>
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <CounterComponent />
                <p className="mt-4 text-base-content">This page shows a simple counter.</p>
            </div>
        </div>
    </div>
);

function App() {
    const [currentPage, setCurrentPage] = useState('auth');

    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const checkCurrentUser = async () => {
            const currentUser = await window.electronAPI.getCurrentUser();
            setCurrentUser(currentUser);
        }
        checkCurrentUser();
    }, []);

    useEffect(() => {
        if(currentUser){
            console.log('currentUser', currentUser);
            if(currentUser.sessionExpiresAt < new Date().toISOString()){
                console.log('Session expired, redirecting to auth');
                setCurrentPage('auth');
            }else{
                console.log('Session not expired, redirecting to page1');
                setCurrentPage('page1');
            }
        }
    }, [currentUser]);

    return (
        <div className="min-h-screen flex flex-col bg-base-200">
            <div className="navbar bg-base-100 shadow-md">
                <div className="flex-1">
                    <a className="btn btn-ghost text-xl">OpenLeaf</a>
                </div>
                <div className="flex-none">
                    <div className="tabs tabs-boxed">
                        <a 
                            className={`tab ${currentPage === 'auth' ? 'tab-active' : ''}`} 
                            onClick={() => setCurrentPage('auth')}
                        >
                            Auth
                        </a>
                        <a 
                            className={`tab ${currentPage === 'page1' ? 'tab-active' : ''}`} 
                            onClick={() => setCurrentPage('page1')}
                        >
                            Page 1
                        </a>
                        <a 
                            className={`tab ${currentPage === 'page2' ? 'tab-active' : ''}`} 
                            onClick={() => setCurrentPage('page2')}
                        >
                            Page 2
                        </a>
                    </div>
                </div>
            </div>
            
            <main className="container mx-auto py-6 flex-grow">
                {currentPage === 'auth' ? <AuthPage currentUser={currentUser} changePage={setCurrentPage} /> : currentPage === 'page1' ? <Page1 /> : <Page2 />}
            </main>
        </div>
    );
}

export default App; 