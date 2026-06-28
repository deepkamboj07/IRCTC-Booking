-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PASSENGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TrainType" AS ENUM ('EXPRESS', 'SUPERFAST', 'LOCAL');

-- CreateEnum
CREATE TYPE "SeatClassName" AS ENUM ('SLEEPER', 'AC_3TIER', 'AC_2TIER', 'AC_FIRST_CLASS');

-- CreateEnum
CREATE TYPE "BerthType" AS ENUM ('LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'RUNNING', 'ARRIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "PassengerGender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PASSENGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Train" (
    "id" TEXT NOT NULL,
    "trainNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TrainType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Train_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainRouteStop" (
    "id" TEXT NOT NULL,
    "trainId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "arrivalTime" TEXT,
    "departureTime" TEXT,
    "distanceKm" INTEGER NOT NULL,

    CONSTRAINT "TrainRouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatClass" (
    "id" TEXT NOT NULL,
    "name" "SeatClassName" NOT NULL,
    "displayName" TEXT NOT NULL,
    "priceMultiplier" DECIMAL(4,2) NOT NULL,

    CONSTRAINT "SeatClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "trainId" TEXT NOT NULL,
    "coachNumber" TEXT NOT NULL,
    "seatClassId" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "berthType" "BerthType" NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainSchedule" (
    "id" TEXT NOT NULL,
    "trainId" TEXT NOT NULL,
    "journeyDate" DATE NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatAvailability" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "fromStationId" TEXT NOT NULL,
    "toStationId" TEXT NOT NULL,
    "availableCount" INTEGER NOT NULL,

    CONSTRAINT "SeatAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "fromStationId" TEXT NOT NULL,
    "toStationId" TEXT NOT NULL,
    "pnr" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "totalFare" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPassenger" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "PassengerGender" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',

    CONSTRAINT "BookingPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Station_code_key" ON "Station"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Train_trainNumber_key" ON "Train"("trainNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TrainRouteStop_trainId_sequence_key" ON "TrainRouteStop"("trainId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "TrainRouteStop_trainId_stationId_key" ON "TrainRouteStop"("trainId", "stationId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatClass_name_key" ON "SeatClass"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Coach_trainId_coachNumber_key" ON "Coach"("trainId", "coachNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_coachId_seatNumber_key" ON "Seat"("coachId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TrainSchedule_trainId_journeyDate_key" ON "TrainSchedule"("trainId", "journeyDate");

-- CreateIndex
CREATE UNIQUE INDEX "SeatAvailability_scheduleId_coachId_fromStationId_toStation_key" ON "SeatAvailability"("scheduleId", "coachId", "fromStationId", "toStationId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_pnr_key" ON "Booking"("pnr");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPassenger_seatId_bookingId_key" ON "BookingPassenger"("seatId", "bookingId");

-- AddForeignKey
ALTER TABLE "TrainRouteStop" ADD CONSTRAINT "TrainRouteStop_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainRouteStop" ADD CONSTRAINT "TrainRouteStop_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_seatClassId_fkey" FOREIGN KEY ("seatClassId") REFERENCES "SeatClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainSchedule" ADD CONSTRAINT "TrainSchedule_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAvailability" ADD CONSTRAINT "SeatAvailability_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TrainSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAvailability" ADD CONSTRAINT "SeatAvailability_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAvailability" ADD CONSTRAINT "SeatAvailability_fromStationId_fkey" FOREIGN KEY ("fromStationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAvailability" ADD CONSTRAINT "SeatAvailability_toStationId_fkey" FOREIGN KEY ("toStationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "TrainSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_fromStationId_fkey" FOREIGN KEY ("fromStationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_toStationId_fkey" FOREIGN KEY ("toStationId") REFERENCES "Station"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPassenger" ADD CONSTRAINT "BookingPassenger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPassenger" ADD CONSTRAINT "BookingPassenger_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
