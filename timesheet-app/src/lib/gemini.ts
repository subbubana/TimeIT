import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface TimesheetData {
    employeeName?: string;
    employeeEmail?: string;
    periodStart?: string;
    periodEnd?: string;
    regularHours?: number;
    overtimeHours?: number;
    clientName?: string;
    approverName?: string;
    approved?: boolean;
}

export async function parseTimesheetWithGemini(
    fileData: Buffer,
    mimeType: string
): Promise<TimesheetData> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Convert buffer to base64
        const base64Data = fileData.toString('base64');

        const prompt = `Analyze this timesheet document and extract the following information in JSON format:
{
  "employeeName": "Full name of the employee",
  "employeeEmail": "Email address if visible",
  "periodStart": "Start date of the pay period (YYYY-MM-DD format)",
  "periodEnd": "End date of the pay period (YYYY-MM-DD format)",
  "regularHours": "Total regular hours worked (number)",
  "overtimeHours": "Total overtime hours worked (number, 0 if none)",
  "clientName": "Client/Company name if visible",
  "approverName": "Name of the approver/manager if visible",
  "approved": "Whether the timesheet appears to be approved (true/false based on signatures, stamps, or approval indicators)"
}

Return ONLY valid JSON, no markdown formatting or additional text. If a field cannot be determined, use null.`;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType,
                    data: base64Data,
                },
            },
            { text: prompt },
        ]);

        const responseText = result.response.text();

        // Clean up the response (remove markdown code blocks if present)
        let jsonText = responseText;
        if (responseText.includes('```')) {
            jsonText = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonText);
        return parsed as TimesheetData;
    } catch (error) {
        console.error('Error parsing timesheet with Gemini:', error);
        throw new Error('Failed to parse timesheet document');
    }
}

export async function parseTimesheetFromUrl(
    fileUri: string,
    mimeType: string
): Promise<TimesheetData> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Analyze this timesheet document and extract the following information in JSON format:
{
  "employeeName": "Full name of the employee",
  "employeeEmail": "Email address if visible",
  "periodStart": "Start date of the pay period (YYYY-MM-DD format)",
  "periodEnd": "End date of the pay period (YYYY-MM-DD format)",
  "regularHours": "Total regular hours worked (number)",
  "overtimeHours": "Total overtime hours worked (number, 0 if none)",
  "clientName": "Client/Company name if visible",
  "approverName": "Name of the approver/manager if visible",
  "approved": "Whether the timesheet appears to be approved (true/false based on signatures, stamps, or approval indicators)"
}

Return ONLY valid JSON, no markdown formatting or additional text. If a field cannot be determined, use null.`;

        const result = await model.generateContent([
            {
                fileData: {
                    mimeType,
                    fileUri,
                },
            },
            { text: prompt },
        ]);

        const responseText = result.response.text();

        // Clean up the response
        let jsonText = responseText;
        if (responseText.includes('```')) {
            jsonText = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonText);
        return parsed as TimesheetData;
    } catch (error) {
        console.error('Error parsing timesheet with Gemini:', error);
        throw new Error('Failed to parse timesheet document');
    }
}
