import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import prisma from '@/lib/db';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, name, paymentMethod, transactionId } = body;

        if (!email || !paymentMethod || !transactionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Update user record with latest payment info
        await prisma.user.update({
            where: { email },
            data: {
                lastPaymentMethod: paymentMethod,
                lastPaymentTransactionId: transactionId,
            }
        });

        // 2. Send notification to admin
        try {
            await resend.emails.send({
                from: 'TradeFlow <onboarding@resend.dev>',
                to: ['amazing15ani15@gmail.com'],
                subject: '💎 Subscription Renewal Requested',
                html: `
                    <h1>Renewal Request</h1>
                    <p><strong>User:</strong> ${name} (${email})</p>
                    <p><strong>Status:</strong> Needs extension in Admin Panel</p>
                    <hr />
                    <h3>Payment Details</h3>
                    <p><strong>Method:</strong> ${paymentMethod}</p>
                    <p><strong>Transaction ID:</strong> ${transactionId}</p>
                    <hr />
                    <p>
                        <a href="http://localhost:3000/admin/users" style="padding: 10px 20px; background-color: blue; color: white; text-decoration: none; border-radius: 5px;">
                            Approve/Extend in Admin Dashboard
                        </a>
                    </p>
                `
            });
        } catch (emailError) {
            console.error('Failed to send renewal email:', emailError);
        }

        return NextResponse.json({ success: true, message: 'Renewal request submitted' });
    } catch (error) {
        console.error('Renewal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
