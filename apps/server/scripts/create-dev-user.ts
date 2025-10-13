#!/usr/bin/env node
/* eslint-disable node/prefer-global/process */
import { UserRole } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { PasswordService } from "../src/utils/password";
import { logger } from "../src/utils/logger";
import { prisma } from "../src/utils/prisma";

async function createDevUser() {
    const username = "dev";
    const password = "DevPassword123!";
    const email = "dev@coesco.local";

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { username },
            include: { employee: true },
        });

        if (existingUser) {
            logger.info(`Dev user '${username}' already exists`);
            logger.info(`Employee: ${existingUser.employee?.firstName} ${existingUser.employee?.lastName}`);
            logger.info(`Email: ${existingUser.employee?.email}`);
            logger.info(`Use credentials: ${username} / ${password}`);
            return;
        }

        // Hash the password
        const hashedPassword = await PasswordService.hashPassword(password);

        // Create employee first
        const employee = await prisma.employee.create({
            data: {
                firstName: "Development",
                lastName: "User",
                initials: "DEV",
                email,
                title: "Developer",
                number: `DEV-${randomUUID().slice(0, 6)}`,
                hireDate: new Date(),
                startDate: new Date(),
                isActive: true,
                createdById: "system",
                updatedById: "system",
                user: {
                    create: {
                        username,
                        password: hashedPassword,
                        role: UserRole.ADMIN, // Give admin role for testing
                        isActive: true,
                    },
                },
            },
            include: {
                user: true,
            },
        });

        logger.info("✅ Development user created successfully!");
        logger.info(`👤 Username: ${username}`);
        logger.info(`🔑 Password: ${password}`);
        logger.info(`📧 Email: ${email}`);
        logger.info(`👨‍💼 Employee: ${employee.firstName} ${employee.lastName}`);
        logger.info(`🎭 Role: ${employee.user?.role}`);
        logger.info("");
        logger.info("You can now log in using these credentials instead of Microsoft login.");
    }
    catch (error) {
        logger.error("Failed to create dev user:", error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}

// Run the script
if (require.main === module) {
    createDevUser()
        .then(() => {
            logger.info("Dev user creation completed");
            process.exit(0);
        })
        .catch((error) => {
            logger.error("Dev user creation failed:", error);
            process.exit(1);
        });
}

export { createDevUser };