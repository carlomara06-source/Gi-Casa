-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'SELLER', 'AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'SOLD');

-- CreateEnum
CREATE TYPE "PropertyState" AS ENUM ('DA_RISTRUTTURARE', 'BUONO_STATO', 'RISTRUTTURATO', 'NUOVO');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APPARTAMENTO', 'VILLA', 'ATTICO', 'RUSTICO');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PLANIMETRIA', 'VISURA', 'APE', 'ATTO_PROVENIENZA', 'REGOLAMENTO_CONDOMINIALE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('MISSING', 'UPLOADED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "MandateStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'VISIBILITY_BOOST', 'SMART_AGENT', 'CONCIERGE_LUXURY');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('WEEK', 'FOUR_WEEK');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "Portal" AS ENUM ('IMMOBILIARE', 'IDEALISTA', 'CASA_IT');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'FOGLIO_VISITA', 'FEA_SIGNATURE');

-- CreateEnum
CREATE TYPE "OtpStatus" AS ENUM ('PENDING', 'APPROVED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ChatKind" AS ENUM ('BUYER_SELLER', 'AGENT', 'SUPPORT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'BUYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 4.9,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,

    CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "type" "PropertyType" NOT NULL DEFAULT 'APPARTAMENTO',
    "price" INTEGER NOT NULL,
    "mq" INTEGER NOT NULL,
    "locali" INTEGER NOT NULL,
    "bagni" INTEGER NOT NULL DEFAULT 1,
    "piano" INTEGER NOT NULL,
    "hasLift" BOOLEAN NOT NULL DEFAULT false,
    "stato" "PropertyState" NOT NULL DEFAULT 'BUONO_STATO',
    "classeEnergetica" TEXT NOT NULL DEFAULT 'D',
    "balcone" BOOLEAN NOT NULL DEFAULT false,
    "cantina" BOOLEAN NOT NULL DEFAULT false,
    "box" BOOLEAN NOT NULL DEFAULT false,
    "giardino" BOOLEAN NOT NULL DEFAULT false,
    "arredato" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL DEFAULT '',
    "catastoFoglio" TEXT,
    "catastoParticella" TEXT,
    "catastoSubalterno" TEXT,
    "renditaCatastale" INTEGER,
    "speseCondominiali" INTEGER,
    "disponibilita" TEXT NOT NULL DEFAULT 'Libera',
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPhoto" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ListingPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'MISSING',
    "fileUrl" TEXT,
    "meta" TEXT NOT NULL DEFAULT '',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mandate" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "status" "MandateStatus" NOT NULL DEFAULT 'ACTIVE',
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "withdrawableFrom" TIMESTAMP(3) NOT NULL,
    "withdrawnAt" TIMESTAMP(3),
    "signatureHash" TEXT NOT NULL,
    "legalTextVersion" TEXT NOT NULL DEFAULT '2026-09',

    CONSTRAINT "Mandate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "cycle" "BillingCycle" NOT NULL DEFAULT 'WEEK',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "welcomeBoxSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalSyndication" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "portal" "Portal" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "showBanner" BOOLEAN NOT NULL DEFAULT true,
    "lastPushedAt" TIMESTAMP(3),

    CONSTRAINT "PortalSyndication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "agentId" TEXT,
    "agentProfileId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'REQUESTED',
    "feeCents" INTEGER NOT NULL DEFAULT 2900,
    "agentShareCents" INTEGER NOT NULL DEFAULT 1500,
    "foglioVisitaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitReport" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "interestScore" INTEGER NOT NULL,
    "checklist" TEXT[],
    "notes" TEXT NOT NULL DEFAULT '',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "status" "OtpStatus" NOT NULL DEFAULT 'PENDING',
    "twilioSid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoglioVisita" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "otpVerificationId" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoglioVisita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "depositPct" INTEGER NOT NULL,
    "depositCents" INTEGER NOT NULL,
    "validDays" INTEGER NOT NULL,
    "conditions" TEXT[],
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "amlIdDone" BOOLEAN NOT NULL DEFAULT false,
    "amlCfDone" BOOLEAN NOT NULL DEFAULT false,
    "amlFundsDone" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signatureHash" TEXT,
    "counterOfId" TEXT,
    "counterAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValuationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "address" TEXT NOT NULL,
    "mq" INTEGER NOT NULL,
    "piano" INTEGER NOT NULL,
    "stato" "PropertyState" NOT NULL,
    "balconiMq" INTEGER NOT NULL,
    "cantinaMq" INTEGER NOT NULL,
    "annoCostruzione" INTEGER NOT NULL,
    "ascensore" BOOLEAN NOT NULL,
    "esposizione" TEXT NOT NULL,
    "affaccio" TEXT NOT NULL,
    "luminosita" TEXT NOT NULL,
    "vuZonaEurMq" INTEGER NOT NULL,
    "kTotale" DOUBLE PRECISION NOT NULL,
    "resultLow" INTEGER NOT NULL,
    "resultMid" INTEGER NOT NULL,
    "resultHigh" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValuationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatThread" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "kind" "ChatKind" NOT NULL DEFAULT 'BUYER_SELLER',
    "buyerId" TEXT NOT NULL,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "wasRedacted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProfile_userId_key" ON "AgentProfile"("userId");

-- CreateIndex
CREATE INDEX "Listing_city_zone_idx" ON "Listing"("city", "zone");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Mandate_listingId_key" ON "Mandate"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_listingId_key" ON "Subscription"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "PortalSyndication_listingId_portal_key" ON "PortalSyndication"("listingId", "portal");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_foglioVisitaId_key" ON "Visit"("foglioVisitaId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitReport_visitId_key" ON "VisitReport"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "FoglioVisita_otpVerificationId_key" ON "FoglioVisita"("otpVerificationId");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_counterOfId_key" ON "Proposal"("counterOfId");

-- AddForeignKey
ALTER TABLE "AgentProfile" ADD CONSTRAINT "AgentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPhoto" ADD CONSTRAINT "ListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalSyndication" ADD CONSTRAINT "PortalSyndication_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_agentProfileId_fkey" FOREIGN KEY ("agentProfileId") REFERENCES "AgentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_foglioVisitaId_fkey" FOREIGN KEY ("foglioVisitaId") REFERENCES "FoglioVisita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitReport" ADD CONSTRAINT "VisitReport_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoglioVisita" ADD CONSTRAINT "FoglioVisita_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoglioVisita" ADD CONSTRAINT "FoglioVisita_otpVerificationId_fkey" FOREIGN KEY ("otpVerificationId") REFERENCES "OtpVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_counterOfId_fkey" FOREIGN KEY ("counterOfId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValuationRequest" ADD CONSTRAINT "ValuationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
