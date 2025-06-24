"use client";
import React from 'react';
import { useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/store";


const UserManagementPage = () => {
    const collapsed = useAppSelector(
        (state: RootState) => state.ui.sidebar.collapsed
      );
    return (
         <div
            className={`transition-all duration-300 min-h-full md:pb-0 px-4 ${
            collapsed ? "md:ml-20" : "md:ml-60"
            } pt-18`}
        >
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">User Management</h1>
            <div className="bg-white rounded-lg shadow p-4">
                <p className="text-gray-600">User management functionality coming soon...</p>
            </div>
        </div>
        </div>
    );
};

export default UserManagementPage;