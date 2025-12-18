import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const AdminDashboard = () => {
    const { logout, token } = useContext(AuthContext);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setUploadStatus('');
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadStatus('Uploading and Processing...');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/players/upload`, formData, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setUploadStatus(`Success: ${res.data.message}`);
            setSelectedFile(null);
            // reset file input visually if needed, but simple clear is fine
        } catch (err) {
            console.error('Upload error', err);
            setUploadStatus('Error: Failed to upload/process file.');
        } finally {
            setUploading(false);
        }
    };

    const fetchPendingUsers = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/pending`, {
                headers: { 'x-auth-token': token }
            });
            setPendingUsers(res.data);
        } catch (err) {
            console.error('Error fetching users', err);
        }
    };

    const approveUser = async (id) => {
        try {
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/auth/approve/${id}`, {}, {
                headers: { 'x-auth-token': token }
            });
            // Refresh list
            fetchPendingUsers();
        } catch (err) {
            console.error('Error approving user', err);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-green-800 p-4 text-white flex justify-between items-center shadow-lg">
                <h1 className="text-2xl font-bold">Umpire's Lounge (Super Admin)</h1>
                <button onClick={logout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">Retire (Logout)</button>
            </nav>
            <div className="container mx-auto p-8">
                <h2 className="text-2xl font-bold mb-6 text-green-900">Pending Players Selection</h2>

                {/* File Upload Section */}
                <div className="mb-8 p-6 bg-white rounded-lg shadow-md border-l-4 border-cricketGold">
                    <h3 className="text-lg font-bold mb-4 text-green-800">Upload Player Data (JSON)</h3>
                    <div className="flex items-center space-x-4">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-green-50 file:text-green-700
                                hover:file:bg-green-100"
                        />
                        <button
                            onClick={handleUpload}
                            disabled={uploading || !selectedFile}
                            className={`px-6 py-2 rounded-full font-bold uppercase text-xs tracking-widest shadow-lg transition-transform active:scale-95 ${
                                uploading || !selectedFile
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-cricketGold text-black hover:bg-yellow-500'
                            }`}
                        >
                            {uploading ? 'Processing...' : 'Upload & Sync'}
                        </button>
                    </div>
                    {uploadStatus && (
                        <p className={`mt-2 text-sm font-semibold ${uploadStatus.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
                            {uploadStatus}
                        </p>
                    )}
                </div>

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Player Name
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                        No pending players found.
                                    </td>
                                </tr>
                            ) : (
                                pendingUsers.map(user => (
                                    <tr key={user._id}>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <p className="text-gray-900 whitespace-no-wrap">{user.username}</p>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                                                <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                                                <span className="relative">{user.role}</span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <button
                                                onClick={() => approveUser(user._id)}
                                                className="text-white bg-green-600 hover:bg-green-800 px-3 py-1 rounded"
                                            >
                                                Approve Selection
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
