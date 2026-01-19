-- CreateTable
CREATE TABLE "cost_codes" (
    "id" TEXT NOT NULL,
    "jobSfx" TEXT NOT NULL,
    "bomItem" TEXT NOT NULL,
    "sequence" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "jobCode" INTEGER NOT NULL,
    "jobName" TEXT NOT NULL,
    "needByDate" TEXT NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_hours" (
    "id" TEXT NOT NULL,
    "empNum" TEXT NOT NULL,
    "timeIn" TIMESTAMP(3) NOT NULL,
    "timeOut" TIMESTAMP(3) NOT NULL,
    "jobCode" INTEGER NOT NULL,
    "costCode" TEXT,
    "quantity" DOUBLE PRECISION,
    "splitCode" TEXT,
    "breakFlag" INTEGER NOT NULL DEFAULT 0,
    "managerApproval" BOOLEAN NOT NULL DEFAULT false,
    "managerName" TEXT,
    "inVariance" INTEGER,
    "outVariance" INTEGER,
    "timeSheetMinutes" INTEGER NOT NULL,
    "timeOffset" INTEGER,
    "nightShift" BOOLEAN NOT NULL DEFAULT false,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "flag" TEXT,
    "tZOffset" TEXT,
    "jobDesc" TEXT,
    "actualTimeIn" TIMESTAMP(3),
    "actualTimeOut" TIMESTAMP(3),
    "hasNote" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_codes" (
    "id" TEXT NOT NULL,
    "jobCode" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "clockable" BOOLEAN NOT NULL DEFAULT true,
    "requiresCostCode" BOOLEAN NOT NULL DEFAULT false,
    "askQuantity" BOOLEAN NOT NULL DEFAULT false,
    "askSplitCode" BOOLEAN NOT NULL DEFAULT false,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_notes" (
    "id" TEXT NOT NULL,
    "empNum" TEXT NOT NULL,
    "hoursId" TEXT NOT NULL,
    "shiftNote" TEXT NOT NULL,
    "dateEntered" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cost_codes_jobSfx_key" ON "cost_codes"("jobSfx");

-- CreateIndex
CREATE INDEX "cost_codes_jobCode_idx" ON "cost_codes"("jobCode");

-- CreateIndex
CREATE INDEX "cost_codes_active_idx" ON "cost_codes"("active");

-- CreateIndex
CREATE INDEX "employee_hours_empNum_idx" ON "employee_hours"("empNum");

-- CreateIndex
CREATE INDEX "employee_hours_jobCode_idx" ON "employee_hours"("jobCode");

-- CreateIndex
CREATE INDEX "employee_hours_costCode_idx" ON "employee_hours"("costCode");

-- CreateIndex
CREATE INDEX "employee_hours_timeIn_idx" ON "employee_hours"("timeIn");

-- CreateIndex
CREATE INDEX "employee_hours_timeOut_idx" ON "employee_hours"("timeOut");

-- CreateIndex
CREATE INDEX "employee_hours_isConfirmed_idx" ON "employee_hours"("isConfirmed");

-- CreateIndex
CREATE UNIQUE INDEX "job_codes_jobCode_key" ON "job_codes"("jobCode");

-- CreateIndex
CREATE INDEX "job_codes_active_idx" ON "job_codes"("active");

-- CreateIndex
CREATE INDEX "job_codes_clockable_idx" ON "job_codes"("clockable");

-- CreateIndex
CREATE INDEX "shift_notes_empNum_idx" ON "shift_notes"("empNum");

-- CreateIndex
CREATE INDEX "shift_notes_hoursId_idx" ON "shift_notes"("hoursId");

-- CreateIndex
CREATE INDEX "shift_notes_dateEntered_idx" ON "shift_notes"("dateEntered");

-- AddForeignKey
ALTER TABLE "employee_hours" ADD CONSTRAINT "employee_hours_empNum_fkey" FOREIGN KEY ("empNum") REFERENCES "employees"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_hours" ADD CONSTRAINT "employee_hours_jobCode_fkey" FOREIGN KEY ("jobCode") REFERENCES "job_codes"("jobCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_hours" ADD CONSTRAINT "employee_hours_costCode_fkey" FOREIGN KEY ("costCode") REFERENCES "cost_codes"("jobSfx") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_notes" ADD CONSTRAINT "shift_notes_empNum_fkey" FOREIGN KEY ("empNum") REFERENCES "employees"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_notes" ADD CONSTRAINT "shift_notes_hoursId_fkey" FOREIGN KEY ("hoursId") REFERENCES "employee_hours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
