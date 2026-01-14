import { Plus } from 'lucide-react';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getClients() {
    return prisma.client.findMany({
        include: {
            assignments: {
                include: { employee: true },
                where: { endDate: null },
            },
            _count: {
                select: { invoices: true },
            },
        },
        orderBy: { name: 'asc' },
    });
}

export default async function ClientsPage() {
    const clients = await getClients();

    return (
        <>
            <header className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="page-title">Clients</h1>
                        <p className="page-subtitle">Manage your client organizations</p>
                    </div>
                    <Link href="/clients/new" className="btn btn-primary">
                        <Plus size={18} />
                        Add Client
                    </Link>
                </div>
            </header>

            <div className="page-content">
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Company Name</th>
                                    <th>Email</th>
                                    <th>Address</th>
                                    <th>Active Employees</th>
                                    <th>Total Invoices</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map((client) => (
                                    <tr key={client.id}>
                                        <td>
                                            <Link href={`/clients/${client.id}`} style={{ fontWeight: 500 }}>
                                                {client.name}
                                            </Link>
                                        </td>
                                        <td className="text-muted">{client.email}</td>
                                        <td className="text-muted text-sm">{client.address || '-'}</td>
                                        <td>
                                            {client.assignments.length > 0 ? (
                                                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                                    {client.assignments.map((a) => (
                                                        <span key={a.id} className="badge active">
                                                            {a.employee.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted">None</span>
                                            )}
                                        </td>
                                        <td>{client._count.invoices}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
