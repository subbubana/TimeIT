'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/actions';
import { useState } from 'react';
import { Save, X } from 'lucide-react';
import Link from 'next/link';

export default function NewClientPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            await createClient(formData);
            router.push('/clients');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to create client');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Add Client</h1>
                    <p className="page-subtitle">Register a new client organization in the system</p>
                </div>
            </header>

            <div className="page-content" style={{ maxWidth: '600px' }}>
                <div className="card animate-slide-up">
                    <form action={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Company Name</label>
                            <input
                                name="name"
                                type="text"
                                className="form-input"
                                placeholder="e.g. Acme Corp"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contact Email</label>
                            <input
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="billing@acme.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Office Address</label>
                            <textarea
                                name="address"
                                className="form-textarea"
                                rows={3}
                                placeholder="123 Business Way, New York, NY 10001"
                            ></textarea>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <Link href="/clients" className="btn btn-secondary">
                                <X size={18} />
                                Cancel
                            </Link>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                                {isLoading ? (
                                    <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Client
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
