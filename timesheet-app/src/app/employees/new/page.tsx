'use client';

import { useRouter } from 'next/navigation';
import { createEmployee } from '@/lib/actions';
import { useState } from 'react';
import { Save, X } from 'lucide-react';
import Link from 'next/link';

export default function NewEmployeePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            await createEmployee(formData);
            router.push('/employees');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to create employee');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Add Employee</h1>
                    <p className="page-subtitle">Add a new workforce member to the system</p>
                </div>
            </header>

            <div className="page-content" style={{ maxWidth: '600px' }}>
                <div className="card animate-slide-up">
                    <form action={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                className="form-input"
                                placeholder="e.g. John Doe"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Work Email</label>
                            <input
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="john.doe@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                name="phone"
                                type="tel"
                                className="form-input"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Employment Status</label>
                            <select name="status" className="form-select">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <Link href="/employees" className="btn btn-secondary">
                                <X size={18} />
                                Cancel
                            </Link>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? (
                                    <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Employee
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
