'use client';

import { useState } from 'react';
import { FileJson, X } from 'lucide-react';

interface RawDataViewerProps {
    data: any;
    label?: string;
}

export default function RawDataViewer({ data, label = 'Raw Extracted Data' }: RawDataViewerProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!data) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-ghost btn-icon"
                title="View Extracted Data"
                style={{ color: 'var(--accent-blue)' }}
            >
                <FileJson size={16} />
            </button>

            {isOpen && (
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{label}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setIsOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="code-block" style={{
                                backgroundColor: 'var(--bg-primary)',
                                padding: '16px',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'auto',
                                maxHeight: '400px',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                color: '#d4d4d4',
                                border: '1px solid var(--border-color)'
                            }}>
                                <pre>{JSON.stringify(data, null, 2)}</pre>
                            </div>
                            <p className="mt-4 text-sm text-muted">
                                This data was extracted using Gemini 2.5 Flash from the original attachment.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setIsOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
