import { Plus, Search } from 'lucide-react';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getEmployees() {
    return prisma.employee.findMany({
        include: {
            assignments: {
                include: { client: true },
            },
            _count: {
                select: { timesheets: true },
            },
        },
        orderBy: { name: 'asc' },
    });
}

export default async function EmployeesPage() {
    const employees = await getEmployees();

    return (
        <>
            <header className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="page-title">Employees</h1>
                        <p className="page-subtitle">Manage your workforce and their assignments</p>
                    </div>
                    <Link href="/employees/new" className="btn btn-primary">
                        <Plus size={18} />
                        Add Employee
                    </Link>
                </div>
            </header>

            <div className="page-content">
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Client Assignment</th>
                                    <th>Bill Rate</th>
                                    <th>Pay Rate</th>
                                    <th>Timesheets</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp) => {
                                    const activeAssignment = emp.assignments.find(a => !a.endDate);
                                    return (
                                        <tr key={emp.id}>
                                            <td>
                                                <Link href={`/employees/${emp.id}`} style={{ fontWeight: 500 }}>
                                                    {emp.name}
                                                </Link>
                                            </td>
                                            <td className="text-muted">{emp.email}</td>
                                            <td className="text-muted">{emp.phone || '-'}</td>
                                            <td>
                                                {activeAssignment ? (
                                                    <span>{activeAssignment.client.name}</span>
                                                ) : (
                                                    <span className="text-muted">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="font-mono">
                                                {activeAssignment
                                                    ? `$${activeAssignment.billRate.toNumber().toFixed(2)}/hr`
                                                    : '-'
                                                }
                                            </td>
                                            <td className="font-mono">
                                                {activeAssignment
                                                    ? `$${activeAssignment.payRate.toNumber().toFixed(2)}/hr`
                                                    : '-'
                                                }
                                            </td>
                                            <td>{emp._count.timesheets}</td>
                                            <td>
                                                <span className={`badge ${emp.status}`}>{emp.status}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
