import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import prisma from '@/lib/db';
import { hash } from 'bcryptjs';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { name, email, password, paymentMethod, transactionId } = data;

        // Basic validation
        if (!name || !email || !password || !paymentMethod || !transactionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        // 2. Create Inactive User
        const hashedPassword = await hash(password, 12);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'USER',
                subscriptionStatus: 'INACTIVE' // Pending Admin Approval
            }
        });

        // 3. Send Email to Admin via Resend
        try {
            const { error } = await resend.emails.send({
                from: 'TradeFlow <onboarding@resend.dev>',
                to: ['amazing15ani15@gmail.com'], // Always send to Admin
                subject: '🔥 New User Registered (Pending Activation)',
                html: `
                    <h1>New Registration + Payment</h1>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Status:</strong> <span style="color: red;">INACTIVE (Needs Activation)</span></p>
                    <hr />
                    <h3>Payment Details</h3>
                    <p><strong>Method:</strong> ${paymentMethod}</p>
                    <p><strong>Transaction ID:</strong> ${transactionId}</p>
                    <hr />
                    <p>
                        <a href="http://localhost:3000/admin/users" style="padding: 10px 20px; background-color: blue; color: white; text-decoration: none; border-radius: 5px;">
                            Go to Admin Dashboard to Activate
                        </a>
                    </p>
                `
            });

            if (error) {
                console.error('Resend API Error:', error);
            } else {
                console.log('Admin notification sent.');
            }

        } catch (emailError) {
            console.error('Failed to send email:', emailError);
        }

        return NextResponse.json({ success: true, message: 'Account created successfully' });
    } catch (error) {
        console.error('Payment/Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
