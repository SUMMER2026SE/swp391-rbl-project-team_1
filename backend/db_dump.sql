--
-- PostgreSQL database dump
--

\restrict bAErPDD9slsruRWBniiHYVt5EvKkFaUjTY1pmU8o66cVTdV72FZXJ7Q3VxJLUfu

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY "public"."User" DROP CONSTRAINT IF EXISTS "User_doctorId_fkey";
ALTER TABLE IF EXISTS ONLY "public"."Prescription" DROP CONSTRAINT IF EXISTS "Prescription_medicalRecordId_fkey";
ALTER TABLE IF EXISTS ONLY "public"."MedicalRecord" DROP CONSTRAINT IF EXISTS "MedicalRecord_userId_fkey";
ALTER TABLE IF EXISTS ONLY "public"."MedicalRecord" DROP CONSTRAINT IF EXISTS "MedicalRecord_doctorId_fkey";
ALTER TABLE IF EXISTS ONLY "public"."MedicalRecord" DROP CONSTRAINT IF EXISTS "MedicalRecord_appointmentId_fkey";
ALTER TABLE IF EXISTS ONLY "public"."Doctor" DROP CONSTRAINT IF EXISTS "Doctor_specialtyId_fkey";
ALTER TABLE IF EXISTS ONLY "public"."Doctor" DROP CONSTRAINT IF EXISTS "Doctor_clinicId_fkey";
ALTER TABLE IF EXISTS ONLY "public"."DoctorSchedule" DROP CONSTRAINT IF EXISTS "DoctorSchedule_doctorId_fkey";
ALTER TABLE IF EXISTS ONLY "public"."Complaint" DROP CONSTRAINT IF EXISTS "Complaint_userId_fkey";
ALTER TABLE IF EXISTS ONLY "public"."Appointment" DROP CONSTRAINT IF EXISTS "Appointment_userId_fkey";
ALTER TABLE IF EXISTS ONLY "public"."Appointment" DROP CONSTRAINT IF EXISTS "Appointment_doctorId_fkey";
DROP INDEX IF EXISTS "public"."User_email_key";
DROP INDEX IF EXISTS "public"."User_doctorId_key";
DROP INDEX IF EXISTS "public"."Specialty_slug_key";
DROP INDEX IF EXISTS "public"."Specialty_name_key";
DROP INDEX IF EXISTS "public"."MedicalRecord_appointmentId_key";
ALTER TABLE IF EXISTS ONLY "public"."_prisma_migrations" DROP CONSTRAINT IF EXISTS "_prisma_migrations_pkey";
ALTER TABLE IF EXISTS ONLY "public"."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY "public"."Specialty" DROP CONSTRAINT IF EXISTS "Specialty_pkey";
ALTER TABLE IF EXISTS ONLY "public"."Prescription" DROP CONSTRAINT IF EXISTS "Prescription_pkey";
ALTER TABLE IF EXISTS ONLY "public"."OTP" DROP CONSTRAINT IF EXISTS "OTP_pkey";
ALTER TABLE IF EXISTS ONLY "public"."MedicalRecord" DROP CONSTRAINT IF EXISTS "MedicalRecord_pkey";
ALTER TABLE IF EXISTS ONLY "public"."Doctor" DROP CONSTRAINT IF EXISTS "Doctor_pkey";
ALTER TABLE IF EXISTS ONLY "public"."DoctorSchedule" DROP CONSTRAINT IF EXISTS "DoctorSchedule_pkey";
ALTER TABLE IF EXISTS ONLY "public"."Complaint" DROP CONSTRAINT IF EXISTS "Complaint_pkey";
ALTER TABLE IF EXISTS ONLY "public"."Clinic" DROP CONSTRAINT IF EXISTS "Clinic_pkey";
ALTER TABLE IF EXISTS ONLY "public"."Article" DROP CONSTRAINT IF EXISTS "Article_pkey";
ALTER TABLE IF EXISTS ONLY "public"."Appointment" DROP CONSTRAINT IF EXISTS "Appointment_pkey";
ALTER TABLE IF EXISTS "public"."OTP" ALTER COLUMN "id" DROP DEFAULT;
DROP TABLE IF EXISTS "public"."_prisma_migrations";
DROP TABLE IF EXISTS "public"."User";
DROP TABLE IF EXISTS "public"."Specialty";
DROP TABLE IF EXISTS "public"."Prescription";
DROP SEQUENCE IF EXISTS "public"."OTP_id_seq";
DROP TABLE IF EXISTS "public"."OTP";
DROP TABLE IF EXISTS "public"."MedicalRecord";
DROP TABLE IF EXISTS "public"."DoctorSchedule";
DROP TABLE IF EXISTS "public"."Doctor";
DROP TABLE IF EXISTS "public"."Complaint";
DROP TABLE IF EXISTS "public"."Clinic";
DROP TABLE IF EXISTS "public"."Article";
DROP TABLE IF EXISTS "public"."Appointment";
DROP TYPE IF EXISTS "public"."Role";
DROP TYPE IF EXISTS "public"."DoctorStatus";
DROP TYPE IF EXISTS "public"."ComplaintStatus";
DROP TYPE IF EXISTS "public"."AppointmentStatus";
DROP SCHEMA IF EXISTS "public";
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "public";


--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."AppointmentStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: ComplaintStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."ComplaintStatus" AS ENUM (
    'PENDING',
    'RESOLVED'
);


--
-- Name: DoctorStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."DoctorStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."Role" AS ENUM (
    'USER',
    'DOCTOR',
    'ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: Appointment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Appointment" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "doctorId" "text" NOT NULL,
    "appointmentDate" timestamp(3) without time zone NOT NULL,
    "status" "public"."AppointmentStatus" DEFAULT 'PENDING'::"public"."AppointmentStatus" NOT NULL,
    "notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "cancellationReason" "text"
);


--
-- Name: Article; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Article" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "thumbnail" "text",
    "published" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Clinic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Clinic" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "image" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Complaint; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Complaint" (
    "id" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "public"."ComplaintStatus" DEFAULT 'PENDING'::"public"."ComplaintStatus" NOT NULL,
    "userId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Doctor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Doctor" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "experience" integer NOT NULL,
    "hospital" "text" NOT NULL,
    "avatar" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "specialtyId" "text" NOT NULL,
    "clinicId" "text",
    "isLocked" boolean DEFAULT false NOT NULL,
    "rejectedReason" "text",
    "status" "public"."DoctorStatus" DEFAULT 'PENDING'::"public"."DoctorStatus" NOT NULL,
    "description" "text",
    "phone" "text",
    "price" integer
);


--
-- Name: DoctorSchedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."DoctorSchedule" (
    "id" "text" NOT NULL,
    "doctorId" "text" NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startTime" "text" NOT NULL,
    "endTime" "text" NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: MedicalRecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."MedicalRecord" (
    "id" "text" NOT NULL,
    "appointmentId" "text" NOT NULL,
    "doctorId" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "diagnosis" "text" NOT NULL,
    "notes" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OTP; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."OTP" (
    "id" integer NOT NULL,
    "email" "text" NOT NULL,
    "code" "text" NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OTP_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."OTP_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OTP_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."OTP_id_seq" OWNED BY "public"."OTP"."id";


--
-- Name: Prescription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Prescription" (
    "id" "text" NOT NULL,
    "medicalRecordId" "text" NOT NULL,
    "medicationName" "text" NOT NULL,
    "dosage" "text" NOT NULL,
    "frequency" "text" NOT NULL,
    "duration" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Specialty; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Specialty" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "icon" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "description" "text"
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."User" (
    "id" "text" NOT NULL,
    "password" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "doctorId" "text",
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "role" "public"."Role" DEFAULT 'USER'::"public"."Role" NOT NULL,
    "email" "text" NOT NULL,
    "address" "text",
    "avatar" "text",
    "dateOfBirth" timestamp(3) without time zone,
    "fullName" "text",
    "gender" "text"
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


--
-- Name: OTP id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."OTP" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."OTP_id_seq"'::"regclass");


--
-- Data for Name: Appointment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Appointment" ("id", "userId", "doctorId", "appointmentDate", "status", "notes", "createdAt", "cancellationReason") FROM stdin;
d479e0b8-b9c8-4635-9acc-87a756feb9a3	f7d111ce-d956-4e4a-8b37-4813efa1f30b	doctor_66	2026-05-28 01:00:00	CANCELLED	bệnh nhân không đến khám	2026-05-27 14:48:32.736	\N
e2043b8b-3d5b-4f72-9ccf-c347668315b4	f7d111ce-d956-4e4a-8b37-4813efa1f30b	doctor_10	2026-05-28 01:00:00	COMPLETED	đau đầu	2026-05-27 13:02:47.527	\N
0757387a-9b80-4c9d-9adf-bb754f7e908a	f7d111ce-d956-4e4a-8b37-4813efa1f30b	doctor_22	2026-05-29 01:00:00	CANCELLED	bận đi du lịch với vợ	2026-05-28 06:42:33.196	\N
\.


--
-- Data for Name: Article; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Article" ("id", "title", "content", "thumbnail", "published", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Clinic; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Clinic" ("id", "name", "address", "image", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Complaint; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Complaint" ("id", "message", "status", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Doctor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Doctor" ("id", "name", "experience", "hospital", "avatar", "createdAt", "specialtyId", "clinicId", "isLocked", "rejectedReason", "status", "description", "phone", "price") FROM stdin;
doctor_1	TS BS. Lê Đức Nhân	25	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/leducnhan.jpg	2026-05-27 12:23:02.162	cmpo1bp590000cs28ral3o1xt	\N	f	\N	PENDING	\N	\N	\N
doctor_2	ThS.BS Phạm Trần Xuân Anh	20	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/phamtranxuananh.jpg	2026-05-27 12:23:02.173	cmpo1bp5n0001cs28h9pjtihn	\N	f	\N	PENDING	\N	\N	\N
doctor_3	BS.CK2 Trần Thị Khánh Ngọc	18	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/tranthikhanhngoc.jpg	2026-05-27 12:23:02.185	cmpo1bp5z0002cs2808mx2yjd	\N	f	\N	PENDING	\N	\N	\N
doctor_4	Bác sĩ CK2 Nguyễn Thành Trung	22	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenthanhtrung.jpg	2026-05-27 12:23:02.193	cmpo1bp670003cs28tzeidbud	\N	f	\N	PENDING	\N	\N	\N
doctor_5	Bs CK2. Trà Tấn Hoành	20	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/tratanhoanh.jpg	2026-05-27 12:23:02.199	cmpo1bp6d0004cs28c854k6d2	\N	f	\N	PENDING	\N	\N	\N
doctor_6	Bs.CK1 Lê Nghiêm Bảo	15	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/lenghiembao.jpg	2026-05-27 12:23:02.203	cmpo1bp6d0004cs28c854k6d2	\N	f	\N	PENDING	\N	\N	\N
doctor_7	Bs.CK2 Lê Quang Chí Cường	16	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/lequangchicuong.jpg	2026-05-27 12:23:02.208	cmpo1bp6d0004cs28c854k6d2	\N	f	\N	PENDING	\N	\N	\N
doctor_8	Bs CK2. Lê Văn Mười	22	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/levanmuoi.jpg	2026-05-27 12:23:02.213	cmpo1bp6s0005cs28u1989y9k	\N	f	\N	PENDING	\N	\N	\N
doctor_9	Bs CK2. Ngô Hạnh	18	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/ngohanh.jpg	2026-05-27 12:23:02.219	cmpo1bp6y0006cs28eyfgjbmd	\N	f	\N	PENDING	\N	\N	\N
doctor_11	Ths Bs. Thân Trọng Vũ	19	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/thantrongvu.jpg	2026-05-27 12:23:02.232	cmpo1bp7b0008cs281gc2uw57	\N	f	\N	PENDING	\N	\N	\N
doctor_12	Bs CKI. Phan Phước An Bình	12	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/phanphuocanbinh.jpg	2026-05-27 12:23:02.236	cmpo1bp7b0008cs281gc2uw57	\N	f	\N	PENDING	\N	\N	\N
doctor_13	Bs. Lê Kim Phượng	13	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/lekimphuong.jpg	2026-05-27 12:23:02.24	cmpo1bp7b0008cs281gc2uw57	\N	f	\N	PENDING	\N	\N	\N
doctor_14	Ths Bs. Nguyễn Ngọc Tuấn	14	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenngoctuan.jpg	2026-05-27 12:23:02.245	cmpo1bp7b0008cs281gc2uw57	\N	f	\N	PENDING	\N	\N	\N
doctor_15	Ths Bs. Lê Kim Trọng	11	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/lekimtrong.jpg	2026-05-27 12:23:02.249	cmpo1bp7b0008cs281gc2uw57	\N	f	\N	PENDING	\N	\N	\N
doctor_16	Ths. BS. Nguyễn Minh Hải	17	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenminhhai.jpg	2026-05-27 12:23:02.257	cmpo1bp7z0009cs28b1rgypth	\N	f	\N	PENDING	\N	\N	\N
doctor_17	Ths. BS. Nguyễn Bá triệu	15	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenbatrieu.jpg	2026-05-27 12:23:02.264	cmpo1bp7z0009cs28b1rgypth	\N	f	\N	PENDING	\N	\N	\N
doctor_18	BS CKII. NGUYỄN HOÀNG	21	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenhoang.jpg	2026-05-27 12:23:02.27	cmpo1bp8d000acs28lqyltdo1	\N	f	\N	PENDING	\N	\N	\N
doctor_20	ThS. LÊ TỰ DŨNG	18	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/letudung.jpg	2026-05-27 12:23:02.281	cmpo1bp8d000acs28lqyltdo1	\N	f	\N	PENDING	\N	\N	\N
doctor_21	Bs CKII Bùi Chín	23	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/buichin.jpg	2026-05-27 12:23:02.286	cmpo1bp8t000bcs28m86paexq	\N	f	\N	PENDING	\N	\N	\N
doctor_22	Bs CKII Võ Trịnh Phú	25	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/votrinhphu.jpg	2026-05-27 12:23:02.29	cmpo1bp8t000bcs28m86paexq	\N	f	\N	PENDING	\N	\N	\N
doctor_23	Ths Bs Cao Văn Trí	17	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/caovantri.jpg	2026-05-27 12:23:02.294	cmpo1bp8t000bcs28m86paexq	\N	f	\N	PENDING	\N	\N	\N
doctor_24	Ths Bs Phạm Trần Cảnh Nguyên	14	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/phamtrancanhnguyen.jpg	2026-05-27 12:23:02.298	cmpo1bp8t000bcs28m86paexq	\N	f	\N	PENDING	\N	\N	\N
doctor_25	Ths Bs Nguyễn Minh Tuấn	13	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenminhtuan.jpg	2026-05-27 12:23:02.304	cmpo1bp8t000bcs28m86paexq	\N	f	\N	PENDING	\N	\N	\N
doctor_26	BS CK2 HUỲNH ĐÌNH LAI	24	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenminhhai.jpg	2026-05-27 12:23:02.31	cmpo1bp9h000ccs28qut2rh67	\N	f	\N	PENDING	\N	\N	\N
doctor_27	Ths. Bs CKII Hồ Văn Phước	19	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/hovanphuoc.jpg	2026-05-27 12:23:02.315	cmpo1bp9h000ccs28qut2rh67	\N	f	\N	PENDING	\N	\N	\N
doctor_28	Thạc sỹ PHẠM VĂN HÙNG	16	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/phamvanhung.jpg	2026-05-27 12:23:02.319	cmpo1bp9h000ccs28qut2rh67	\N	f	\N	PENDING	\N	\N	\N
doctor_29	Bs CK2 Nguyễn Quốc Việt	14	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenquocviet.jpg	2026-05-27 12:23:02.323	cmpo1bp9h000ccs28qut2rh67	\N	f	\N	PENDING	\N	\N	\N
doctor_30	Thạc sỹ Bác sĩ CKII Nguyễn Văn Xứng	20	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenvanxung.jpg	2026-05-27 12:23:02.329	cmpo1bp9z000dcs28je8f75ss	\N	f	\N	PENDING	\N	\N	\N
doctor_31	Thạc sỹ Bác sĩ Nguyễn Thị Thuận	15	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenbothi.thuan.jpg	2026-05-27 12:23:02.336	cmpo1bp9z000dcs28je8f75ss	\N	f	\N	PENDING	\N	\N	\N
doctor_32	Bs CKII Nguyễn Hứa Quang	21	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenhuaquang.jpg	2026-05-27 12:23:02.341	cmpo1bpac000ecs28vnt469f9	\N	f	\N	PENDING	\N	\N	\N
doctor_33	Ths.Bs Nguyễn Bá Hùng	17	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenbahung.jpg	2026-05-27 12:23:02.345	cmpo1bpac000ecs28vnt469f9	\N	f	\N	PENDING	\N	\N	\N
doctor_34	Ths.Bs. Đặng Anh Đào	18	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/danganhdao.jpg	2026-05-27 12:23:02.349	cmpo1bpak000fcs2858cvcmu6	\N	f	\N	PENDING	\N	\N	\N
doctor_35	BS. CK II Thái Bá Sỹ	16	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/thaibasy.jpg	2026-05-27 12:23:02.353	cmpo1bpak000fcs2858cvcmu6	\N	f	\N	PENDING	\N	\N	\N
doctor_36	Bs. CK. I Nguyễn Hữu Đa	12	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenhuuda.jpg	2026-05-27 12:23:02.357	cmpo1bpak000fcs2858cvcmu6	\N	f	\N	PENDING	\N	\N	\N
doctor_37	Thạc sỹ Lê Hoàng Trường	19	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/lehoangtruong.jpg	2026-05-27 12:23:02.363	cmpo1bpay000gcs285s9w6ir6	\N	f	\N	PENDING	\N	\N	\N
doctor_38	BSCKI. Ngô Thị Minh Hiếu	13	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/ngothiminhhieu.jpg	2026-05-27 12:23:02.367	cmpo1bpay000gcs285s9w6ir6	\N	f	\N	PENDING	\N	\N	\N
doctor_39	BSCK2. Võ Duy Trinh	20	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/voduytrinh.jpg	2026-05-27 12:23:02.372	cmpo1bpb7000hcs28h8wk78on	\N	f	\N	PENDING	\N	\N	\N
doctor_40	BSCK2. Hà Sơn Bình	17	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/hasonbinh.jpg	2026-05-27 12:23:02.378	cmpo1bpb7000hcs28h8wk78on	\N	f	\N	PENDING	\N	\N	\N
doctor_41	Bs. Huỳnh Đức Phát	18	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/huynhducphat.jpg	2026-05-27 12:23:02.382	cmpo1bp5n0001cs28h9pjtihn	\N	f	\N	PENDING	\N	\N	\N
doctor_42	Bs. Hà Phước Hoàng	16	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/haphuochoang.jpg	2026-05-27 12:23:02.386	cmpo1bp5n0001cs28h9pjtihn	\N	f	\N	PENDING	\N	\N	\N
doctor_43	ThS.BS. Lê Quốc Tuấn	20	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/lequoctuan.jpg	2026-05-27 12:23:02.392	cmpo1bpbr000ics28dy7p2w6a	\N	f	\N	PENDING	\N	\N	\N
doctor_19	BS CKI Võ Văn Tường	16	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/vovantuong.jpg	2026-05-27 12:23:02.274	cmpo1bp8d000acs28lqyltdo1	\N	f	\N	PENDING	\N	\N	\N
doctor_44	Bác sỹ Phan Văn Lượng	15	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/phanvanluong.jpg	2026-05-27 12:23:02.396	cmpo1bpbr000ics28dy7p2w6a	\N	f	\N	PENDING	\N	\N	\N
doctor_45	Bác sỹ Huỳnh Văn Hiếu	12	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/huynhvanhieu.jpg	2026-05-27 12:23:02.401	cmpo1bpbr000ics28dy7p2w6a	\N	f	\N	PENDING	\N	\N	\N
doctor_46	Bác sỹ Đàm Minh Sơn	14	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/damminhson.jpg	2026-05-27 12:23:02.406	cmpo1bpbr000ics28dy7p2w6a	\N	f	\N	PENDING	\N	\N	\N
doctor_47	Bác sỹ Võ Tấn Tài	11	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/votantai.jpg	2026-05-27 12:23:02.41	cmpo1bpbr000ics28dy7p2w6a	\N	f	\N	PENDING	\N	\N	\N
doctor_48	Bs CK2 Huỳnh Anh	19	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/huynhanh.jpg	2026-05-27 12:23:02.422	cmpo1bpck000jcs2805h591l2	\N	f	\N	PENDING	\N	\N	\N
doctor_49	Bs CK2 Trương Ngọc Hùng	17	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/truongngochung.jpg	2026-05-27 12:23:02.429	cmpo1bpck000jcs2805h591l2	\N	f	\N	PENDING	\N	\N	\N
doctor_50	Bs CK2 Nguyễn Thêm	14	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenthem.jpg	2026-05-27 12:23:02.437	cmpo1bpck000jcs2805h591l2	\N	f	\N	PENDING	\N	\N	\N
doctor_51	BS CK2. NGUYỄN THỊ HỒNG MINH	16	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenthihongminh.jpg	2026-05-27 12:23:02.445	cmpo1bpd8000kcs28lu422bhl	\N	f	\N	PENDING	\N	\N	\N
doctor_52	Bs CK1 Đỗ Văn Hùng	17	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/dovanhung.jpg	2026-05-27 12:23:02.45	cmpo1bpdd000lcs28l85fdu9z	\N	f	\N	PENDING	\N	\N	\N
doctor_53	Bs. Thạc Sỹ Hoàng Dương Vương	18	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/hoangduongvuong.jpg	2026-05-27 12:23:02.456	cmpo1bpdi000mcs28i3qydpqn	\N	f	\N	PENDING	\N	\N	\N
doctor_54	TS.BS. Nguyễn Đức Lư	22	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenduclu.jpg	2026-05-27 12:23:02.461	cmpo1bpdo000ncs28n984j2ht	\N	f	\N	PENDING	\N	\N	\N
doctor_55	TS.BS. Đặng Công Lữ	20	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/dangconglu.jpg	2026-05-27 12:23:02.467	cmpo1bpdo000ncs28n984j2ht	\N	f	\N	PENDING	\N	\N	\N
doctor_56	Bác sỹ.Ths. CKII. Phạm Ngọc Hàm	19	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/phamngocham.jpg	2026-05-27 12:23:02.476	cmpo1bpe2000ocs28f9ph3kgb	\N	f	\N	PENDING	\N	\N	\N
doctor_57	Bác sỹ.Ths. CKII. Nguyễn Hoàng Sơn	17	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenhoangson.jpg	2026-05-27 12:23:02.48	cmpo1bpe2000ocs28f9ph3kgb	\N	f	\N	PENDING	\N	\N	\N
doctor_58	BS.CK2 Nguyễn Văn Minh	15	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenvanminh.jpg	2026-05-27 12:23:02.486	cmpo1bped000pcs280vogmuop	\N	f	\N	PENDING	\N	\N	\N
doctor_59	ThS. Bs. Nguyễn Công Huân	16	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenconghuan.jpg	2026-05-27 12:23:02.491	cmpo1bpei000qcs289qglhh19	\N	f	\N	PENDING	\N	\N	\N
doctor_60	Bác sĩ Phó khoa Bs.CK1 Phan Tín Dụng	14	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/phantindung.jpg	2026-05-27 12:23:02.495	cmpo1bpei000qcs289qglhh19	\N	f	\N	PENDING	\N	\N	\N
doctor_61	Bs. Lưu Quang Long	12	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/luuquanglong.jpg	2026-05-27 12:23:02.501	cmpo1bpei000qcs289qglhh19	\N	f	\N	PENDING	\N	\N	\N
doctor_62	BS.CKI.Nguyễn Hoàng Phương	18	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenhoangphuong.jpg	2026-05-27 12:23:02.509	cmpo1bpf0000rcs28hkzcoc7g	\N	f	\N	PENDING	\N	\N	\N
doctor_63	BS CKII Nguyễn Thị Ngọc Ánh	20	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenthingocanh.jpg	2026-05-27 12:23:02.518	cmpo1bpf8000scs28waonhm05	\N	f	\N	PENDING	\N	\N	\N
doctor_64	BSCKI Nguyễn Thị Hồng Phúc	16	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenthihongphuc.jpg	2026-05-27 12:23:02.525	cmpo1bpf8000scs28waonhm05	\N	f	\N	PENDING	\N	\N	\N
doctor_65	Bs CKII. Võ Quang Vinh	18	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/voquangvinh.jpg	2026-05-27 12:23:02.534	cmpo1bpfo000tcs28ky76vamw	\N	f	\N	PENDING	\N	\N	\N
doctor_66	Bs CKII Mạc Hữu	15	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/machuu.jpg	2026-05-27 12:23:02.541	cmpo1bpfo000tcs28ky76vamw	\N	f	\N	PENDING	\N	\N	\N
doctor_67	Thạc sỹ Bác sĩ Nguyễn Trường Minh	15	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyentruongminh.jpg	2026-05-27 12:23:02.55	cmpo1bpg4000ucs28jzwxo51g	\N	f	\N	PENDING	\N	\N	\N
doctor_68	Ths. Bs Nguyễn Đức Phúc	14	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyenducphuc.jpg	2026-05-27 12:23:02.557	cmpo1bpg4000ucs28jzwxo51g	\N	f	\N	PENDING	\N	\N	\N
doctor_69	Bác sĩ Nguyễn Tiến Hưng	12	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/nguyentienhung.jpg	2026-05-27 12:23:02.565	cmpo1bpg4000ucs28jzwxo51g	\N	f	\N	PENDING	\N	\N	\N
doctor_70	BS CK2. PHẠM VĂN TÚ	21	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/phamvantu.jpg	2026-05-27 12:23:02.573	cmpo1bpgr000vcs285rcesu5z	\N	f	\N	PENDING	\N	\N	\N
doctor_10	ThS.Bs Phạm Vĩnh Huy	14	Bệnh viện Đa khoa Đà Nẵng	/DoctorAvatar/phamvinhhuy.jpg	2026-05-27 12:23:02.226	cmpo1bp6s0005cs28u1989y9k	\N	f	\N	PENDING	\N	\N	\N
\.


--
-- Data for Name: DoctorSchedule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."DoctorSchedule" ("id", "doctorId", "dayOfWeek", "startTime", "endTime", "isAvailable", "createdAt") FROM stdin;
077f03b0-85b5-4779-ab58-65725a61fae3	doctor_1	1	08:00	17:00	t	2026-05-27 12:23:02.166
9a5fa324-d1e2-4aec-a94e-b9734f3f7e69	doctor_1	2	08:00	17:00	t	2026-05-27 12:23:02.167
2dd5a213-32ce-4cab-9227-e4f99a870210	doctor_1	3	08:00	17:00	t	2026-05-27 12:23:02.168
85250538-d6e8-432a-9b9f-8792c1e016bf	doctor_1	4	08:00	17:00	t	2026-05-27 12:23:02.169
ddf68688-51ca-45f1-9f15-14c434982ebd	doctor_1	5	08:00	17:00	t	2026-05-27 12:23:02.17
d468151c-1f8f-4aa9-b519-c869688bb8ed	doctor_2	1	08:00	17:00	t	2026-05-27 12:23:02.178
3414d4b4-f2fa-49ef-bf49-a26791699560	doctor_2	2	08:00	17:00	t	2026-05-27 12:23:02.179
5495e23a-e724-408f-aac8-366309ccacfb	doctor_2	3	08:00	17:00	t	2026-05-27 12:23:02.18
97984fae-6c6e-426f-9f74-300f79251106	doctor_2	4	08:00	17:00	t	2026-05-27 12:23:02.181
bc8d4c0c-12c8-4e5f-9aa5-0cc81c013f11	doctor_2	5	08:00	17:00	t	2026-05-27 12:23:02.182
13ce3787-00a7-4691-b580-23f94118a35b	doctor_3	1	08:00	17:00	t	2026-05-27 12:23:02.187
6ebf359b-367f-4702-bc76-85abc1e9ace1	doctor_3	2	08:00	17:00	t	2026-05-27 12:23:02.187
db26415f-3f2b-4d51-9268-740e614d5811	doctor_3	3	08:00	17:00	t	2026-05-27 12:23:02.188
e7cd277f-52a7-4870-ad61-6ab8311ec30a	doctor_3	4	08:00	17:00	t	2026-05-27 12:23:02.189
63248075-0af3-4ee9-be52-e2f24322c513	doctor_3	5	08:00	17:00	t	2026-05-27 12:23:02.19
0dce2021-8b20-46b0-8571-03ff65139aa9	doctor_4	1	08:00	17:00	t	2026-05-27 12:23:02.195
1496dde3-ddf4-40e8-9004-78e6f46b0c66	doctor_4	2	08:00	17:00	t	2026-05-27 12:23:02.196
bfad816a-ef4e-4d8a-8f45-6bef2dc36c0b	doctor_4	3	08:00	17:00	t	2026-05-27 12:23:02.196
5068045f-88d7-4496-8260-5febb165b1a5	doctor_4	4	08:00	17:00	t	2026-05-27 12:23:02.197
e4ba47a2-99bd-46ac-9d5b-b1e1d05986ef	doctor_4	5	08:00	17:00	t	2026-05-27 12:23:02.197
21d36a0a-b78a-468a-b6f7-9824b8f4ffcd	doctor_5	1	08:00	17:00	t	2026-05-27 12:23:02.2
d0f565e3-59a5-4fac-a49a-94ec4d92ad65	doctor_5	2	08:00	17:00	t	2026-05-27 12:23:02.201
73b37f37-7eba-4f9f-927d-ba7f656e3c10	doctor_5	3	08:00	17:00	t	2026-05-27 12:23:02.201
da98b965-3d15-4f13-8381-8530e963b4bf	doctor_5	4	08:00	17:00	t	2026-05-27 12:23:02.202
38a215f0-6e06-40dd-a786-06da07db76cd	doctor_5	5	08:00	17:00	t	2026-05-27 12:23:02.203
8453b73a-1240-44f8-93a2-ddcb626d3397	doctor_6	1	08:00	17:00	t	2026-05-27 12:23:02.205
0535eda2-11fa-4050-bbfb-d55d6a2d58e4	doctor_6	2	08:00	17:00	t	2026-05-27 12:23:02.206
3224151b-aea2-4273-b5fa-d196e0b2b259	doctor_6	3	08:00	17:00	t	2026-05-27 12:23:02.206
00801f38-a439-4179-bfa9-efa41501d534	doctor_6	4	08:00	17:00	t	2026-05-27 12:23:02.207
7727c4fa-3c39-466d-8465-f9ab86b8f154	doctor_6	5	08:00	17:00	t	2026-05-27 12:23:02.207
561a3fae-89d5-4dbf-b3c3-319bc1b12a1a	doctor_7	1	08:00	17:00	t	2026-05-27 12:23:02.209
05f39630-3912-4d33-9e23-c9f0eb2ae7de	doctor_7	2	08:00	17:00	t	2026-05-27 12:23:02.21
6782d785-c689-49a2-bb1d-5623a3518d6e	doctor_7	3	08:00	17:00	t	2026-05-27 12:23:02.21
97523458-3354-47e6-b9f1-1365777c3e23	doctor_7	4	08:00	17:00	t	2026-05-27 12:23:02.211
f2c8df62-f01e-419e-a522-1785fdf67358	doctor_7	5	08:00	17:00	t	2026-05-27 12:23:02.212
6817a0f2-440a-48fb-9443-576937bb36f7	doctor_8	1	08:00	17:00	t	2026-05-27 12:23:02.215
a1cb0700-fc65-454f-ba8f-cd3cc9e66652	doctor_8	2	08:00	17:00	t	2026-05-27 12:23:02.216
660c0dc5-2ad4-4063-87e7-a3e7d12c807c	doctor_8	3	08:00	17:00	t	2026-05-27 12:23:02.216
f7440317-4a54-4fa1-893b-463330c62b57	doctor_8	4	08:00	17:00	t	2026-05-27 12:23:02.217
34c0922c-4fc0-4573-80f4-fca1e72cf95b	doctor_8	5	08:00	17:00	t	2026-05-27 12:23:02.217
f85e8c97-4655-4958-8d0a-96d16eee15e5	doctor_9	1	08:00	17:00	t	2026-05-27 12:23:02.221
1f12bfb8-bf90-4c33-9ae5-40b9bee6bf74	doctor_9	2	08:00	17:00	t	2026-05-27 12:23:02.222
e7f45dd3-3a0f-4d21-acb7-bfd7d8032723	doctor_9	3	08:00	17:00	t	2026-05-27 12:23:02.223
e51d4a1e-e2b7-468f-921c-8669ec87e11a	doctor_9	4	08:00	17:00	t	2026-05-27 12:23:02.224
3eb837ac-3544-4bb7-b23a-3116bc7c792f	doctor_9	5	08:00	17:00	t	2026-05-27 12:23:02.224
d560427e-9601-4efc-8a45-7ea2affa80bb	doctor_10	1	08:00	17:00	t	2026-05-27 12:23:02.228
88082011-11de-4286-8d5d-732047191adb	doctor_10	2	08:00	17:00	t	2026-05-27 12:23:02.228
65f07c8f-7b21-4d86-a43a-c37e5fb2ca1e	doctor_10	3	08:00	17:00	t	2026-05-27 12:23:02.229
313c7196-92cb-42b3-8423-aac15c78c5ea	doctor_10	4	08:00	17:00	t	2026-05-27 12:23:02.23
f60b0cd8-1335-4454-ba49-ef9b4330286e	doctor_10	5	08:00	17:00	t	2026-05-27 12:23:02.23
43c83519-31ac-42ea-bd6a-1ce94583ca26	doctor_11	1	08:00	17:00	t	2026-05-27 12:23:02.233
c5072633-5c10-4077-8fc7-369392769797	doctor_11	2	08:00	17:00	t	2026-05-27 12:23:02.234
d1e2ccc0-2aa5-4ef1-be0e-1b108ca40ead	doctor_11	3	08:00	17:00	t	2026-05-27 12:23:02.234
a31b8332-2986-45af-9511-36be32c7c091	doctor_11	4	08:00	17:00	t	2026-05-27 12:23:02.235
1be2590d-e2f7-47fe-8799-0d6094a6e4b7	doctor_11	5	08:00	17:00	t	2026-05-27 12:23:02.235
96dc67db-0af0-4a26-96ef-978c65df4ae0	doctor_12	1	08:00	17:00	t	2026-05-27 12:23:02.238
0c75d9b4-8bbd-4b3c-acb2-31d40ea7642e	doctor_12	2	08:00	17:00	t	2026-05-27 12:23:02.238
d467d14d-8025-441b-a93f-10f54697ba5f	doctor_12	3	08:00	17:00	t	2026-05-27 12:23:02.239
e44786df-af1a-4ed9-93a7-c51f01760b4e	doctor_12	4	08:00	17:00	t	2026-05-27 12:23:02.239
6cf70c86-8f9d-4f5d-bd98-1271c144b277	doctor_12	5	08:00	17:00	t	2026-05-27 12:23:02.24
6734e731-b033-4dd7-9b27-6abd053aa5fb	doctor_13	1	08:00	17:00	t	2026-05-27 12:23:02.242
9d406d53-d6b7-46a0-a545-c45a9542039c	doctor_13	2	08:00	17:00	t	2026-05-27 12:23:02.243
6ad9b2e2-fba1-4742-bc7f-b1753bdaef89	doctor_13	3	08:00	17:00	t	2026-05-27 12:23:02.243
f0117bab-8ee5-4352-888d-cf43d3581511	doctor_13	4	08:00	17:00	t	2026-05-27 12:23:02.244
f028a80d-e41a-4d48-a7bd-53865425d906	doctor_13	5	08:00	17:00	t	2026-05-27 12:23:02.244
3914d9fe-e739-47da-b392-cfae8136f487	doctor_14	1	08:00	17:00	t	2026-05-27 12:23:02.246
0b5f8731-736b-4f99-9e3e-56b58a665781	doctor_14	2	08:00	17:00	t	2026-05-27 12:23:02.246
d38dd86e-753f-4ebe-9dd4-9d9434884025	doctor_14	3	08:00	17:00	t	2026-05-27 12:23:02.247
12039af2-ec8f-46f1-aacc-87aa37c400f1	doctor_14	4	08:00	17:00	t	2026-05-27 12:23:02.247
b65ab755-125b-4ac9-a904-cf6f716801e1	doctor_14	5	08:00	17:00	t	2026-05-27 12:23:02.248
53032001-122f-4dd0-8edc-9265ac58d9b3	doctor_15	1	08:00	17:00	t	2026-05-27 12:23:02.251
3fd270b2-ce7d-42b6-af2b-d2e0376440c2	doctor_15	2	08:00	17:00	t	2026-05-27 12:23:02.252
ead0fe44-eac9-4ef4-ae14-34c0925859c2	doctor_15	3	08:00	17:00	t	2026-05-27 12:23:02.253
6bfcfff2-2f3e-44c0-9be2-10ce7009bc24	doctor_15	4	08:00	17:00	t	2026-05-27 12:23:02.254
4c6b481b-b459-40bb-a5df-9c24fa308f68	doctor_15	5	08:00	17:00	t	2026-05-27 12:23:02.255
cddab87a-8c53-445b-9f3d-36ff7ee065a2	doctor_16	1	08:00	17:00	t	2026-05-27 12:23:02.259
5b4dbc80-c491-4b40-a1ae-f68a3d956a77	doctor_16	2	08:00	17:00	t	2026-05-27 12:23:02.26
ca27f734-4cff-4b46-a5db-693b05023e9e	doctor_16	3	08:00	17:00	t	2026-05-27 12:23:02.261
c993e8e3-ac21-4fd6-9922-63b273f093bb	doctor_16	4	08:00	17:00	t	2026-05-27 12:23:02.262
3c42bfff-52e6-4ed5-bc5a-71654e7516da	doctor_16	5	08:00	17:00	t	2026-05-27 12:23:02.263
b5db6256-f83b-4c23-9304-24e9a3505b47	doctor_17	1	08:00	17:00	t	2026-05-27 12:23:02.266
d8199714-1212-42e0-810a-f3a2cd251bf6	doctor_17	2	08:00	17:00	t	2026-05-27 12:23:02.266
9d99959e-6e0b-443d-85f2-473213739f00	doctor_17	3	08:00	17:00	t	2026-05-27 12:23:02.267
8d4a2ee3-957e-4dc4-904a-bcbcd34515ad	doctor_17	4	08:00	17:00	t	2026-05-27 12:23:02.268
65c04e53-6200-4a85-a452-9c64d501664a	doctor_17	5	08:00	17:00	t	2026-05-27 12:23:02.269
5a6a3890-5871-434e-a7c8-c339f3893fd9	doctor_18	1	08:00	17:00	t	2026-05-27 12:23:02.272
fe107991-38d6-44b1-83b5-fc3b21a32203	doctor_18	2	08:00	17:00	t	2026-05-27 12:23:02.272
f35a70bc-dfea-4243-a41c-77c94c164c49	doctor_18	3	08:00	17:00	t	2026-05-27 12:23:02.273
aead1252-ab44-4905-96ce-e3da3e364d51	doctor_18	4	08:00	17:00	t	2026-05-27 12:23:02.273
839d7a4e-fa8e-46b6-bc0d-842c3f89d2c4	doctor_18	5	08:00	17:00	t	2026-05-27 12:23:02.274
c5b5b8a2-74c0-4878-9697-0a1f0235d2e7	doctor_19	1	08:00	17:00	t	2026-05-27 12:23:02.276
608e8f8f-a42f-4835-8466-fcc664634f58	doctor_19	2	08:00	17:00	t	2026-05-27 12:23:02.276
115954b4-9751-49dd-b3c4-2ffb39f3438d	doctor_19	3	08:00	17:00	t	2026-05-27 12:23:02.277
a44300e5-6650-4df1-9a93-a8a04e5df189	doctor_19	4	08:00	17:00	t	2026-05-27 12:23:02.278
05c3e662-782c-4589-a34c-a53df407eb47	doctor_19	5	08:00	17:00	t	2026-05-27 12:23:02.279
ef528c2b-ad86-40a6-a72f-ec62f57a92be	doctor_20	1	08:00	17:00	t	2026-05-27 12:23:02.283
c3b3c1ae-3e56-4da2-9c2d-b8dc283353a3	doctor_20	2	08:00	17:00	t	2026-05-27 12:23:02.283
4f162965-52b2-4e97-887b-27e6d8be277d	doctor_20	3	08:00	17:00	t	2026-05-27 12:23:02.284
6c1ff2e1-a30d-40dd-8925-86ba78f2f568	doctor_20	4	08:00	17:00	t	2026-05-27 12:23:02.284
7fcc2ef2-c08a-4188-a5e5-767307ec954d	doctor_20	5	08:00	17:00	t	2026-05-27 12:23:02.285
bd5d56a7-2c35-4425-8714-d6e537f0b65d	doctor_21	1	08:00	17:00	t	2026-05-27 12:23:02.287
61e32c28-0c7d-4c05-90b7-c64cb0021aa0	doctor_21	2	08:00	17:00	t	2026-05-27 12:23:02.288
ed28c495-6d7b-434e-b620-5ddf0f59f308	doctor_21	3	08:00	17:00	t	2026-05-27 12:23:02.288
c17f7048-5630-4b40-8d82-13e2698b924d	doctor_21	4	08:00	17:00	t	2026-05-27 12:23:02.288
71c82185-06d4-4267-9c16-2eeb7a1d91c0	doctor_21	5	08:00	17:00	t	2026-05-27 12:23:02.289
de2769a9-f3bd-4088-bf9a-64a8719e94bf	doctor_22	1	08:00	17:00	t	2026-05-27 12:23:02.291
c7a063ff-c559-41aa-bf34-c82aac033ead	doctor_22	2	08:00	17:00	t	2026-05-27 12:23:02.291
e2347a78-f4d1-4b53-9a08-20b20f997e24	doctor_22	3	08:00	17:00	t	2026-05-27 12:23:02.292
d43ccea1-1010-437b-accf-0cadeb5aa0e6	doctor_22	4	08:00	17:00	t	2026-05-27 12:23:02.292
fa6aa295-f91c-4fef-8a67-47ce41cb1c43	doctor_22	5	08:00	17:00	t	2026-05-27 12:23:02.293
a7dbccbf-fcf0-42f7-8263-b3a3ded66586	doctor_23	1	08:00	17:00	t	2026-05-27 12:23:02.295
6f5401f7-8bbb-469e-b991-ed422b7d42b6	doctor_23	2	08:00	17:00	t	2026-05-27 12:23:02.295
2a3b5947-29d3-447d-a37d-a6315601a752	doctor_23	3	08:00	17:00	t	2026-05-27 12:23:02.296
135e0a49-2240-47c1-af91-6a49e8dfc6aa	doctor_23	4	08:00	17:00	t	2026-05-27 12:23:02.297
7f0a1eb9-38bd-4b95-8a9f-e31d33075be2	doctor_23	5	08:00	17:00	t	2026-05-27 12:23:02.297
f2f75972-e6c6-4474-bc3a-e5beba46cd1c	doctor_24	1	08:00	17:00	t	2026-05-27 12:23:02.3
7c6ee47f-7f90-411d-8e47-9b1a0c21d316	doctor_24	2	08:00	17:00	t	2026-05-27 12:23:02.301
25321e94-b69b-467c-ade4-4797d2bd8f7b	doctor_24	3	08:00	17:00	t	2026-05-27 12:23:02.302
9591c04a-2ffb-4872-87dc-25afb298bf70	doctor_24	4	08:00	17:00	t	2026-05-27 12:23:02.303
6cc88629-5d18-4476-8566-231e13af79bf	doctor_24	5	08:00	17:00	t	2026-05-27 12:23:02.304
28852f1d-8e76-4f13-96c8-24f6b416e444	doctor_25	1	08:00	17:00	t	2026-05-27 12:23:02.306
466c00cd-ad56-4ffa-b76c-0d9088b4d18e	doctor_25	2	08:00	17:00	t	2026-05-27 12:23:02.307
46f6732a-cb55-4240-be00-dde1efbf2b7e	doctor_25	3	08:00	17:00	t	2026-05-27 12:23:02.307
db715e15-6dce-47ef-a762-51ca3364c644	doctor_25	4	08:00	17:00	t	2026-05-27 12:23:02.308
8988f642-a4d8-4d9e-beeb-aa501fa3272f	doctor_25	5	08:00	17:00	t	2026-05-27 12:23:02.309
694a1134-7eb5-44cc-93ae-4255b6432491	doctor_26	1	08:00	17:00	t	2026-05-27 12:23:02.311
f89cab3b-c40b-4c25-b4a9-4f35c3897e24	doctor_26	2	08:00	17:00	t	2026-05-27 12:23:02.312
eb9dca41-95b6-464a-b2b0-77c3ba5f25aa	doctor_26	3	08:00	17:00	t	2026-05-27 12:23:02.313
9248352f-a3de-47a1-9123-67740d2625c0	doctor_26	4	08:00	17:00	t	2026-05-27 12:23:02.313
7163c5d3-a7b3-4d93-9c74-6e85d2afb0bd	doctor_26	5	08:00	17:00	t	2026-05-27 12:23:02.314
c4a567bb-afd2-4b45-9a98-c223bbce6ed5	doctor_27	1	08:00	17:00	t	2026-05-27 12:23:02.316
9b994724-d322-4a1c-ad96-710d6abcd1f4	doctor_27	2	08:00	17:00	t	2026-05-27 12:23:02.317
729155e8-4aa7-4400-bf1e-f8485664468a	doctor_27	3	08:00	17:00	t	2026-05-27 12:23:02.317
cc3a6f70-f34c-410f-8464-d30b6793f197	doctor_27	4	08:00	17:00	t	2026-05-27 12:23:02.318
164fe2df-9463-4229-80e3-1fc0ceab6727	doctor_27	5	08:00	17:00	t	2026-05-27 12:23:02.318
f9beb235-de99-45f7-8e7c-267e65b75a31	doctor_28	1	08:00	17:00	t	2026-05-27 12:23:02.32
1e91b265-4247-4555-b0f3-2df770740933	doctor_28	2	08:00	17:00	t	2026-05-27 12:23:02.321
dbef5e85-1bc7-4be3-bcc3-8d0a9833b1e3	doctor_28	3	08:00	17:00	t	2026-05-27 12:23:02.322
3f4d3e24-1267-44fe-856d-08de4a982bf2	doctor_28	4	08:00	17:00	t	2026-05-27 12:23:02.322
db525e24-a7ea-4b8c-bb73-a812d903edd3	doctor_28	5	08:00	17:00	t	2026-05-27 12:23:02.323
3dd0bb11-21fc-4b3d-84e3-0f3f8c61f661	doctor_29	1	08:00	17:00	t	2026-05-27 12:23:02.324
64e94ec8-a18c-403d-a888-0ce531b4c056	doctor_29	2	08:00	17:00	t	2026-05-27 12:23:02.325
d5ff79d7-4a30-4d9e-b540-63720db3b54d	doctor_29	3	08:00	17:00	t	2026-05-27 12:23:02.325
31781573-087b-4d78-ae02-0baff266f9ee	doctor_29	4	08:00	17:00	t	2026-05-27 12:23:02.326
592cc29a-3aa5-4993-9239-1a7f4db78981	doctor_29	5	08:00	17:00	t	2026-05-27 12:23:02.327
8e63a8a2-266e-4fe3-a680-b4464d466a63	doctor_30	1	08:00	17:00	t	2026-05-27 12:23:02.331
0845acda-9caa-40f6-bea5-dd10179f6b88	doctor_30	2	08:00	17:00	t	2026-05-27 12:23:02.332
8fbaaf24-7afd-41e1-8073-32b18ba7b7f2	doctor_30	3	08:00	17:00	t	2026-05-27 12:23:02.333
6bdad6bd-20f5-4401-b3db-ff211ffd4d36	doctor_30	4	08:00	17:00	t	2026-05-27 12:23:02.334
ff77fd0f-a765-4d85-80ce-e6696a35c1dd	doctor_30	5	08:00	17:00	t	2026-05-27 12:23:02.335
caa0c640-0b56-45c1-9208-dee7a79747e1	doctor_31	1	08:00	17:00	t	2026-05-27 12:23:02.337
aca2e3c8-73bd-4926-bc5f-7211c78639d1	doctor_31	2	08:00	17:00	t	2026-05-27 12:23:02.338
864e4c99-794f-4ee3-8504-423d0316ad0a	doctor_31	3	08:00	17:00	t	2026-05-27 12:23:02.338
c1724517-0baa-4eba-9367-cbb408307407	doctor_31	4	08:00	17:00	t	2026-05-27 12:23:02.339
40e282cd-dce7-4b4d-89b7-9196d8fad6ec	doctor_31	5	08:00	17:00	t	2026-05-27 12:23:02.339
87b1e0a1-61f6-411f-9d3b-edf9c3a9d835	doctor_32	1	08:00	17:00	t	2026-05-27 12:23:02.342
0e76b017-6b22-465b-ac3d-4f145e3b2e91	doctor_32	2	08:00	17:00	t	2026-05-27 12:23:02.343
ad27f59f-bdf1-4c74-93e9-2804918c81bb	doctor_32	3	08:00	17:00	t	2026-05-27 12:23:02.343
8cbf4372-b35c-4569-9ede-e109d365fa02	doctor_32	4	08:00	17:00	t	2026-05-27 12:23:02.344
6ee319a4-15f7-4510-ab8d-36b068a654e6	doctor_32	5	08:00	17:00	t	2026-05-27 12:23:02.344
6f6084c2-f9d7-4ae4-81e9-f0c02b538e0e	doctor_33	1	08:00	17:00	t	2026-05-27 12:23:02.346
066d2d39-ff96-4713-9621-9c8a18391a57	doctor_33	2	08:00	17:00	t	2026-05-27 12:23:02.346
65e6cdc6-e2da-4489-9b62-17388f4bbb72	doctor_33	3	08:00	17:00	t	2026-05-27 12:23:02.347
d142c01a-7240-488e-b824-e5f78e3e5ff0	doctor_33	4	08:00	17:00	t	2026-05-27 12:23:02.347
47e054b2-8dec-4675-b22e-bd72b92f15a9	doctor_33	5	08:00	17:00	t	2026-05-27 12:23:02.348
736109c7-36a7-4797-8f57-b0e7dcd94718	doctor_34	1	08:00	17:00	t	2026-05-27 12:23:02.351
08a7323f-0294-4deb-a575-0ee1e6e182bd	doctor_34	2	08:00	17:00	t	2026-05-27 12:23:02.351
455e1333-f501-47a2-b771-2bdb5e2c90de	doctor_34	3	08:00	17:00	t	2026-05-27 12:23:02.352
46c8f7cd-417e-4aff-bd50-f3492bbf4a4d	doctor_34	4	08:00	17:00	t	2026-05-27 12:23:02.352
237c64f0-4872-400c-a85a-89aa9a3be586	doctor_34	5	08:00	17:00	t	2026-05-27 12:23:02.353
6471a0ee-0a8a-4da7-8bc8-59dd64e89839	doctor_35	1	08:00	17:00	t	2026-05-27 12:23:02.354
1bf05f0e-259d-4052-809c-9ef136674640	doctor_35	2	08:00	17:00	t	2026-05-27 12:23:02.355
19917923-f8b8-49e1-bedf-a85648ce3735	doctor_35	3	08:00	17:00	t	2026-05-27 12:23:02.355
2752e1d1-4117-457c-b3b3-8327a920c9ef	doctor_35	4	08:00	17:00	t	2026-05-27 12:23:02.356
e5ccde9e-6c21-4bbb-ae6d-bd5668856806	doctor_35	5	08:00	17:00	t	2026-05-27 12:23:02.356
a53c8ea4-3f0b-48f1-bb92-ad087d182dc6	doctor_36	1	08:00	17:00	t	2026-05-27 12:23:02.358
68014e63-4168-441f-aac7-18863cefa09d	doctor_36	2	08:00	17:00	t	2026-05-27 12:23:02.359
d23b0aa7-6fee-448b-b891-c2bf7f9eb8ed	doctor_36	3	08:00	17:00	t	2026-05-27 12:23:02.36
b9115afa-de73-4ff0-a006-67c3e6082cd2	doctor_36	4	08:00	17:00	t	2026-05-27 12:23:02.361
beee3298-f21b-4da2-9f3f-c1d77262cc0a	doctor_36	5	08:00	17:00	t	2026-05-27 12:23:02.361
53bd3e39-3f98-4973-910e-31e2888beb2f	doctor_37	1	08:00	17:00	t	2026-05-27 12:23:02.365
23b8a37a-d846-4acc-8af0-0d5242409c53	doctor_37	2	08:00	17:00	t	2026-05-27 12:23:02.365
18d8782a-0b45-4019-8212-30bdec9bb14a	doctor_37	3	08:00	17:00	t	2026-05-27 12:23:02.366
83349fe8-7daa-4ff5-950d-8e902ad565d2	doctor_37	4	08:00	17:00	t	2026-05-27 12:23:02.366
95505158-7e88-49bb-bd2f-a0b4c1a86aff	doctor_37	5	08:00	17:00	t	2026-05-27 12:23:02.367
2efa7edc-ee19-4645-a66d-c2955e6c316a	doctor_38	1	08:00	17:00	t	2026-05-27 12:23:02.368
c843d39a-3240-4ba9-a652-af8eae8f4aa7	doctor_38	2	08:00	17:00	t	2026-05-27 12:23:02.369
abaa940b-e118-4245-a37b-71693b8cdef1	doctor_38	3	08:00	17:00	t	2026-05-27 12:23:02.369
39a04789-7633-43ca-a2f3-f9fdc46eaca8	doctor_38	4	08:00	17:00	t	2026-05-27 12:23:02.37
d4c90071-2338-4484-aff3-b65af16eaff8	doctor_38	5	08:00	17:00	t	2026-05-27 12:23:02.371
7ad3626a-722e-472b-8b0f-d52aba38fb06	doctor_39	1	08:00	17:00	t	2026-05-27 12:23:02.374
b67b80bd-8d4a-4935-97ea-74c571952922	doctor_39	2	08:00	17:00	t	2026-05-27 12:23:02.375
5555bf98-be90-4d59-8c12-16c161d6d4e8	doctor_39	3	08:00	17:00	t	2026-05-27 12:23:02.376
239c5381-1d68-4998-aaeb-6aaf784db102	doctor_39	4	08:00	17:00	t	2026-05-27 12:23:02.376
1272df85-ca7e-40db-98aa-16cb7ca7df85	doctor_39	5	08:00	17:00	t	2026-05-27 12:23:02.377
da8556f1-134e-49de-b47d-24c9fc91133b	doctor_40	1	08:00	17:00	t	2026-05-27 12:23:02.379
585b99a5-2ba3-4caf-b69f-32122acd28c9	doctor_40	2	08:00	17:00	t	2026-05-27 12:23:02.38
4278135e-be2f-408c-bcbb-b436ff9459e6	doctor_40	3	08:00	17:00	t	2026-05-27 12:23:02.38
d096bf56-8bfc-407a-bd11-37429614fd85	doctor_40	4	08:00	17:00	t	2026-05-27 12:23:02.381
9d794e4a-65a5-4702-8240-85bc2557e16a	doctor_40	5	08:00	17:00	t	2026-05-27 12:23:02.381
fa5f1bde-6dab-44ee-9255-4130d5d33072	doctor_41	1	08:00	17:00	t	2026-05-27 12:23:02.384
4ab5e8b8-2850-458b-be0a-f71d543f5787	doctor_41	2	08:00	17:00	t	2026-05-27 12:23:02.384
15b813d3-4df1-4de5-89d4-d1cf83589aa2	doctor_41	3	08:00	17:00	t	2026-05-27 12:23:02.385
6f3b7bde-cfe1-42fb-ab84-bd328502b4c4	doctor_41	4	08:00	17:00	t	2026-05-27 12:23:02.385
56b2faec-2a1a-4a9d-b558-f188fc010439	doctor_41	5	08:00	17:00	t	2026-05-27 12:23:02.386
09042074-3637-4797-929b-d465c9f5810a	doctor_42	1	08:00	17:00	t	2026-05-27 12:23:02.387
f2ecf4bc-c113-44f6-937f-d9eb2d3e7ffb	doctor_42	2	08:00	17:00	t	2026-05-27 12:23:02.388
530d8387-8fd2-4602-b12a-b3c1e299be11	doctor_42	3	08:00	17:00	t	2026-05-27 12:23:02.388
560ecf57-6d37-4484-8f5e-0205dd3dbc29	doctor_42	4	08:00	17:00	t	2026-05-27 12:23:02.39
14febd40-fc9a-4c29-a474-cf570421993e	doctor_42	5	08:00	17:00	t	2026-05-27 12:23:02.391
eaeaf861-642c-4df6-b842-a98b16201ac7	doctor_43	1	08:00	17:00	t	2026-05-27 12:23:02.393
b14c8a78-78b5-4d51-a5e0-ddf9cd2c085f	doctor_43	2	08:00	17:00	t	2026-05-27 12:23:02.394
5f7822f6-e48b-4995-a2da-a8fb2130ce73	doctor_43	3	08:00	17:00	t	2026-05-27 12:23:02.394
5a9c7f5d-349a-48c1-9ccc-2c8656ff3ca6	doctor_43	4	08:00	17:00	t	2026-05-27 12:23:02.395
d8264e72-c4b4-4273-8c49-ca042691eb54	doctor_43	5	08:00	17:00	t	2026-05-27 12:23:02.396
6fa02970-a706-4545-b58d-1051e3cf5dfe	doctor_44	1	08:00	17:00	t	2026-05-27 12:23:02.398
7b7db786-cd50-4000-8418-4e87c743f098	doctor_44	2	08:00	17:00	t	2026-05-27 12:23:02.399
005c36a7-0cef-4e26-838f-afc8ade68925	doctor_44	3	08:00	17:00	t	2026-05-27 12:23:02.399
dad989fa-adc8-4491-ba58-ba1c292622da	doctor_44	4	08:00	17:00	t	2026-05-27 12:23:02.4
bbd15d04-eab2-4c0a-bfc8-bad8381d7f26	doctor_44	5	08:00	17:00	t	2026-05-27 12:23:02.4
5b4d9aa7-a3f0-4f94-88f3-5a4fe33b023b	doctor_45	1	08:00	17:00	t	2026-05-27 12:23:02.402
7a7b6e95-be39-41cb-888a-44647648467a	doctor_45	2	08:00	17:00	t	2026-05-27 12:23:02.403
9d6267aa-f27a-4624-b214-752d877724e2	doctor_45	3	08:00	17:00	t	2026-05-27 12:23:02.404
dc976caf-ccfa-465e-b40b-a6cad01ac36e	doctor_45	4	08:00	17:00	t	2026-05-27 12:23:02.404
97db2182-cf61-4c0e-98d9-6c9f4dafbe98	doctor_45	5	08:00	17:00	t	2026-05-27 12:23:02.405
45a6087c-8b63-4f82-ae98-c8d80c4a7077	doctor_46	1	08:00	17:00	t	2026-05-27 12:23:02.407
140a31d5-8457-4f2d-a769-d0c224a0a994	doctor_46	2	08:00	17:00	t	2026-05-27 12:23:02.407
b6cc4937-46ab-4dff-8346-52809d9faaeb	doctor_46	3	08:00	17:00	t	2026-05-27 12:23:02.408
0ececc81-03e9-4ed5-bfce-77e266e0998b	doctor_46	4	08:00	17:00	t	2026-05-27 12:23:02.409
e89a88bc-ba77-463e-8f7d-543ba3b240b5	doctor_46	5	08:00	17:00	t	2026-05-27 12:23:02.41
046e5dad-d3cd-45f1-b7fe-e56536b7dd4c	doctor_47	1	08:00	17:00	t	2026-05-27 12:23:02.412
241ede13-698a-4fd4-bf8e-48e1ba8aab42	doctor_47	2	08:00	17:00	t	2026-05-27 12:23:02.413
1a1a8274-7d0e-4ba7-9222-487076b1f979	doctor_47	3	08:00	17:00	t	2026-05-27 12:23:02.413
5582411e-0ff7-4a98-be31-d9559311b00e	doctor_47	4	08:00	17:00	t	2026-05-27 12:23:02.414
3ba8fd23-2220-464d-bd86-87e5201a3559	doctor_47	5	08:00	17:00	t	2026-05-27 12:23:02.419
d2c501bc-4a63-43e2-b529-06700c604354	doctor_48	1	08:00	17:00	t	2026-05-27 12:23:02.424
f5876ec1-39cb-4a9b-a97e-bfa88ddbd442	doctor_48	2	08:00	17:00	t	2026-05-27 12:23:02.425
a5831dd9-7a3a-45b4-85be-cd3eb8674058	doctor_48	3	08:00	17:00	t	2026-05-27 12:23:02.426
3182b8b8-89ab-4937-965b-c698386664e8	doctor_48	4	08:00	17:00	t	2026-05-27 12:23:02.427
a469dc41-0955-4189-9c63-092559037a6d	doctor_48	5	08:00	17:00	t	2026-05-27 12:23:02.428
5e61b23d-3fdd-40b2-9913-12e5d26acd10	doctor_49	1	08:00	17:00	t	2026-05-27 12:23:02.431
a762d6da-a156-457e-8871-3a281cefc0eb	doctor_49	2	08:00	17:00	t	2026-05-27 12:23:02.432
06879971-8cc8-4dd1-8b06-e269fb5e1ce8	doctor_49	3	08:00	17:00	t	2026-05-27 12:23:02.434
795e587d-aa87-4a8b-8f5d-a1a096d7e699	doctor_49	4	08:00	17:00	t	2026-05-27 12:23:02.435
b14c9866-7093-4056-a7a2-12a8d0e1f573	doctor_49	5	08:00	17:00	t	2026-05-27 12:23:02.436
b77fdb07-d7a0-4cf1-a1d3-4195b5413db8	doctor_50	1	08:00	17:00	t	2026-05-27 12:23:02.439
0186460a-49a2-45ce-a35e-b0e9802e1c4c	doctor_50	2	08:00	17:00	t	2026-05-27 12:23:02.44
970d7275-dacb-4aa1-8d2f-4e2d99a557a4	doctor_50	3	08:00	17:00	t	2026-05-27 12:23:02.441
19b94dca-57de-490a-b980-c38e96ede433	doctor_50	4	08:00	17:00	t	2026-05-27 12:23:02.442
543c290e-122b-4e02-9cbc-db74e9ad9e6f	doctor_50	5	08:00	17:00	t	2026-05-27 12:23:02.443
4f3e0899-4b69-4a85-98a9-4154f48420e1	doctor_51	1	08:00	17:00	t	2026-05-27 12:23:02.447
644b8698-399f-40e1-b1fc-d5bf2f30e8bd	doctor_51	2	08:00	17:00	t	2026-05-27 12:23:02.447
31fe41f2-0be1-4cf2-a500-148cd03c5a9c	doctor_51	3	08:00	17:00	t	2026-05-27 12:23:02.448
421a4bd9-a6c4-4433-9f64-aa636bb1a900	doctor_51	4	08:00	17:00	t	2026-05-27 12:23:02.448
c5644689-edc8-420f-a724-60c8c6bea176	doctor_51	5	08:00	17:00	t	2026-05-27 12:23:02.449
0bbe82b5-4e4f-47ee-8cb7-531e44e950f5	doctor_52	1	08:00	17:00	t	2026-05-27 12:23:02.452
3ee0ed8b-a90c-47f8-915e-b210c4b2a4e0	doctor_52	2	08:00	17:00	t	2026-05-27 12:23:02.453
b62c298b-a0c0-429c-94b7-54cc81984fb2	doctor_52	3	08:00	17:00	t	2026-05-27 12:23:02.453
351f237d-4238-464e-b47c-9ca9b54ca50a	doctor_52	4	08:00	17:00	t	2026-05-27 12:23:02.454
696def33-3b10-47d9-894d-400583cda388	doctor_52	5	08:00	17:00	t	2026-05-27 12:23:02.454
6d956b45-2528-46b8-9f96-8a275d3366c4	doctor_53	1	08:00	17:00	t	2026-05-27 12:23:02.457
8d7eb819-dc01-4c86-a558-519180232118	doctor_53	2	08:00	17:00	t	2026-05-27 12:23:02.458
6a456e35-9cd8-43e3-a82e-762177881448	doctor_53	3	08:00	17:00	t	2026-05-27 12:23:02.458
3ce69d6e-4a03-4601-a308-7b597ff7410e	doctor_53	4	08:00	17:00	t	2026-05-27 12:23:02.459
1a6a1b54-d561-459e-a3ed-58208f8f1d61	doctor_53	5	08:00	17:00	t	2026-05-27 12:23:02.46
ee4ce0ba-15b2-4a7d-9529-d8b43f59ca21	doctor_54	1	08:00	17:00	t	2026-05-27 12:23:02.463
0d801fc1-7112-4fcb-8944-bb8596c3bb7e	doctor_54	2	08:00	17:00	t	2026-05-27 12:23:02.463
6896d9c1-3657-40c5-b182-b19336072ce4	doctor_54	3	08:00	17:00	t	2026-05-27 12:23:02.464
fc499d60-994e-4e49-b69f-dff0813341c8	doctor_54	4	08:00	17:00	t	2026-05-27 12:23:02.465
2f2aa002-cfc9-40fe-8939-731ee246cee1	doctor_54	5	08:00	17:00	t	2026-05-27 12:23:02.466
9c1b78d1-6421-400d-b600-9ca70c54bfd1	doctor_55	1	08:00	17:00	t	2026-05-27 12:23:02.469
fc6fe6fb-5bb3-4871-8764-e77ddcd32330	doctor_55	2	08:00	17:00	t	2026-05-27 12:23:02.471
e7e84c8b-07eb-4087-8da8-2efd35f2927b	doctor_55	3	08:00	17:00	t	2026-05-27 12:23:02.471
02049c2b-b3bd-4d17-813a-d3624117b17c	doctor_55	4	08:00	17:00	t	2026-05-27 12:23:02.473
167b80f2-7bc6-4092-a867-c30dcd0a9b23	doctor_55	5	08:00	17:00	t	2026-05-27 12:23:02.474
e11f0678-1a00-4d6c-beae-05397bc55db3	doctor_56	1	08:00	17:00	t	2026-05-27 12:23:02.477
45bf72da-0385-4038-b53f-a94b0144524d	doctor_56	2	08:00	17:00	t	2026-05-27 12:23:02.478
d96f8da7-d9bb-4093-890c-11f280b05f3c	doctor_56	3	08:00	17:00	t	2026-05-27 12:23:02.478
b884d8ad-c947-47f6-8080-65cfe1056288	doctor_56	4	08:00	17:00	t	2026-05-27 12:23:02.479
9d8a3a41-7ffa-4646-a008-ba81675881ea	doctor_56	5	08:00	17:00	t	2026-05-27 12:23:02.479
6c344ca7-63fc-4b8b-99d0-7759098513b5	doctor_57	1	08:00	17:00	t	2026-05-27 12:23:02.481
a7cdec9e-3e35-447a-8e2b-36c50ab2f27b	doctor_57	2	08:00	17:00	t	2026-05-27 12:23:02.482
80de7e55-925b-4737-bcbf-6c3e523bd5ea	doctor_57	3	08:00	17:00	t	2026-05-27 12:23:02.483
f29c891e-96ec-419d-8f04-8bd56c05a864	doctor_57	4	08:00	17:00	t	2026-05-27 12:23:02.484
45de0d2f-bb41-478b-9db8-c8124f288dc3	doctor_57	5	08:00	17:00	t	2026-05-27 12:23:02.484
a8f59be4-c869-411f-ab0a-6849db385517	doctor_58	1	08:00	17:00	t	2026-05-27 12:23:02.488
d21ca02b-977e-42df-8725-87507c6e2c65	doctor_58	2	08:00	17:00	t	2026-05-27 12:23:02.488
bc2de491-cd57-48da-8366-fc3e61c6a908	doctor_58	3	08:00	17:00	t	2026-05-27 12:23:02.489
2d81ca5e-2793-4b53-9464-b9bcc2ded8fa	doctor_58	4	08:00	17:00	t	2026-05-27 12:23:02.489
cfc9cd27-11ff-4852-b3a1-10c97d8f2506	doctor_58	5	08:00	17:00	t	2026-05-27 12:23:02.49
fd9e7297-8990-41f1-9392-3fad10b5b518	doctor_59	1	08:00	17:00	t	2026-05-27 12:23:02.492
a0c7976f-ce45-447d-b087-01d4f9c27610	doctor_59	2	08:00	17:00	t	2026-05-27 12:23:02.493
1a73121c-130d-442e-b998-decb65656450	doctor_59	3	08:00	17:00	t	2026-05-27 12:23:02.493
601bed64-1a9d-4f13-8b4c-7eb906bfcf53	doctor_59	4	08:00	17:00	t	2026-05-27 12:23:02.494
8a5f4f95-f213-4cd1-9198-9808bf3e43b4	doctor_59	5	08:00	17:00	t	2026-05-27 12:23:02.494
7c5ab257-8af7-4478-8c14-baa9d6d95823	doctor_60	1	08:00	17:00	t	2026-05-27 12:23:02.496
11dd776d-58bb-442a-b07d-ee719c9e6cee	doctor_60	2	08:00	17:00	t	2026-05-27 12:23:02.498
e1a2cc47-208b-4d09-8dc6-23b913574b58	doctor_60	3	08:00	17:00	t	2026-05-27 12:23:02.498
c300f129-3241-4f86-b459-7dab62e18a8e	doctor_60	4	08:00	17:00	t	2026-05-27 12:23:02.499
e9a719d5-9004-4606-be29-f2ae25e5700c	doctor_60	5	08:00	17:00	t	2026-05-27 12:23:02.5
21b16e10-9545-4e9a-8ccf-79dec42f3324	doctor_61	1	08:00	17:00	t	2026-05-27 12:23:02.503
97878d6c-9f66-4396-a611-02fd789235af	doctor_61	2	08:00	17:00	t	2026-05-27 12:23:02.504
2e9b00e3-ae23-4fea-808a-b670ef3665d7	doctor_61	3	08:00	17:00	t	2026-05-27 12:23:02.505
1d662a85-3664-4374-8abf-abd4bd2f8753	doctor_61	4	08:00	17:00	t	2026-05-27 12:23:02.506
72d3da1f-51eb-4ba7-b578-7af7afd3f637	doctor_61	5	08:00	17:00	t	2026-05-27 12:23:02.507
5cda1e11-ec46-4a11-a952-db06c43a54f8	doctor_62	1	08:00	17:00	t	2026-05-27 12:23:02.511
d0fd8908-0ad4-4f3a-8fa7-3ee9eddec387	doctor_62	2	08:00	17:00	t	2026-05-27 12:23:02.512
8e009194-2509-4e43-b79c-1ad34d54a923	doctor_62	3	08:00	17:00	t	2026-05-27 12:23:02.513
e537f6b0-33e4-46e3-9e5c-22c01d61edf3	doctor_62	4	08:00	17:00	t	2026-05-27 12:23:02.514
b9741789-a19e-4a16-a482-09426f16a572	doctor_62	5	08:00	17:00	t	2026-05-27 12:23:02.515
56b32e6f-7c0f-41aa-8ac1-ff132ce4ab0c	doctor_63	1	08:00	17:00	t	2026-05-27 12:23:02.52
8d52a0d1-0c71-4c09-8291-3e7ad7c336ec	doctor_63	2	08:00	17:00	t	2026-05-27 12:23:02.521
0334fb10-c408-4647-87cc-367e567fd7c6	doctor_63	3	08:00	17:00	t	2026-05-27 12:23:02.521
03fe5178-6058-4529-89ad-5a66bd80bacc	doctor_63	4	08:00	17:00	t	2026-05-27 12:23:02.523
008d8d48-acf5-4b61-998e-8251b925a1e3	doctor_63	5	08:00	17:00	t	2026-05-27 12:23:02.524
d6c2f1cd-17e8-4e47-940a-e3bcc009f625	doctor_64	1	08:00	17:00	t	2026-05-27 12:23:02.527
9ebc07e3-8a90-4c96-9560-a89edb7cbd98	doctor_64	2	08:00	17:00	t	2026-05-27 12:23:02.528
bf8dd1f1-aed9-425c-8cfe-8162ed97c1c2	doctor_64	3	08:00	17:00	t	2026-05-27 12:23:02.529
e64ac448-a9a2-4c7a-bfef-a11d43fe72e4	doctor_64	4	08:00	17:00	t	2026-05-27 12:23:02.53
127cc599-8cb1-4a51-aa6e-04b645c06876	doctor_64	5	08:00	17:00	t	2026-05-27 12:23:02.531
1ff2554d-9182-4521-85b8-81b083685294	doctor_65	1	08:00	17:00	t	2026-05-27 12:23:02.536
fd33638b-ee97-4e52-a6f2-6be5765b36d7	doctor_65	2	08:00	17:00	t	2026-05-27 12:23:02.537
1258306d-7fa0-4d88-86b2-e69c20852b8d	doctor_65	3	08:00	17:00	t	2026-05-27 12:23:02.538
15a9a2a1-00a8-49b9-a977-3e7c15fac4f1	doctor_65	4	08:00	17:00	t	2026-05-27 12:23:02.539
f92aef7e-752e-49c1-b465-5469c953692a	doctor_65	5	08:00	17:00	t	2026-05-27 12:23:02.54
4f868fcd-8a07-4aa0-893b-b88106c6de9b	doctor_66	1	08:00	17:00	t	2026-05-27 12:23:02.544
1cc47e25-74a2-4c8e-a57f-b376ca5a38e4	doctor_66	2	08:00	17:00	t	2026-05-27 12:23:02.545
8528cb04-e629-4978-a2c0-2e1e1843b54d	doctor_66	3	08:00	17:00	t	2026-05-27 12:23:02.546
44234d97-909a-4970-aa2c-4fdfaf6dce0a	doctor_66	4	08:00	17:00	t	2026-05-27 12:23:02.547
d59e1df3-80e2-44a6-af3c-1c0d4ec5a3f1	doctor_66	5	08:00	17:00	t	2026-05-27 12:23:02.547
16ae9f44-aaad-40f6-8d1a-c18feb6ee553	doctor_67	1	08:00	17:00	t	2026-05-27 12:23:02.552
b5a8cd0d-d782-4e44-9447-25827c0e952c	doctor_67	2	08:00	17:00	t	2026-05-27 12:23:02.553
c819c7a9-58f8-444e-b112-17634ef9a450	doctor_67	3	08:00	17:00	t	2026-05-27 12:23:02.554
4ae95198-fe25-4f4d-bf59-30e56971cf82	doctor_67	4	08:00	17:00	t	2026-05-27 12:23:02.554
926757a8-e61d-4ec2-a724-328ff5467d08	doctor_67	5	08:00	17:00	t	2026-05-27 12:23:02.555
933f2839-7686-4d8a-9d80-0ef2360ad76a	doctor_68	1	08:00	17:00	t	2026-05-27 12:23:02.559
42949b28-447c-4085-9f22-cd293048ee4b	doctor_68	2	08:00	17:00	t	2026-05-27 12:23:02.56
63a3da06-9a77-469d-8f54-b9a57e181c72	doctor_68	3	08:00	17:00	t	2026-05-27 12:23:02.561
5cc33634-f929-4f65-80e2-5ce772d067cb	doctor_68	4	08:00	17:00	t	2026-05-27 12:23:02.563
6eec88ce-12b4-4bd7-b067-463b8e76c306	doctor_68	5	08:00	17:00	t	2026-05-27 12:23:02.564
d052bb1a-0eb0-4660-bffa-d010901e0de5	doctor_69	1	08:00	17:00	t	2026-05-27 12:23:02.567
210589dc-7e0c-4b03-bc05-6e8141f72efe	doctor_69	2	08:00	17:00	t	2026-05-27 12:23:02.568
a456e43f-3e69-44dd-a397-3f58e6c2ec79	doctor_69	3	08:00	17:00	t	2026-05-27 12:23:02.569
c6314251-8cab-4f48-be9d-e90ae9b20310	doctor_69	4	08:00	17:00	t	2026-05-27 12:23:02.57
e1ddae66-074b-424d-b691-02605f4a90dd	doctor_69	5	08:00	17:00	t	2026-05-27 12:23:02.571
5bc842cd-d3be-469f-83e6-4dd697034720	doctor_70	1	08:00	17:00	t	2026-05-27 12:23:02.575
7bf276ee-f834-4807-bf5b-25eececa87ae	doctor_70	2	08:00	17:00	t	2026-05-27 12:23:02.576
6335aa65-ebcb-426b-814e-d606e14b1c5b	doctor_70	3	08:00	17:00	t	2026-05-27 12:23:02.577
027ff8b3-07f6-4ae7-a3e1-d14640f2ba07	doctor_70	4	08:00	17:00	t	2026-05-27 12:23:02.578
271f543a-6ae3-4337-ba90-0ee3e5c763ba	doctor_70	5	08:00	17:00	t	2026-05-27 12:23:02.579
\.


--
-- Data for Name: MedicalRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."MedicalRecord" ("id", "appointmentId", "doctorId", "userId", "diagnosis", "notes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OTP; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."OTP" ("id", "email", "code", "verified", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Prescription; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Prescription" ("id", "medicalRecordId", "medicationName", "dosage", "frequency", "duration", "createdAt") FROM stdin;
\.


--
-- Data for Name: Specialty; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Specialty" ("id", "name", "slug", "icon", "createdAt", "updatedAt", "description") FROM stdin;
cmpo1bp590000cs28ral3o1xt	Quản lý y tế	quan-ly-y-te	🏢	2026-05-27 12:23:02.158	2026-05-27 12:23:02.158	\N
cmpo1bp5n0001cs28h9pjtihn	Gây mê hồi sức	gay-me-hoi-suc	😴	2026-05-27 12:23:02.171	2026-05-27 12:23:02.171	\N
cmpo1bp5z0002cs2808mx2yjd	Nội khoa	noi-khoa	🩺	2026-05-27 12:23:02.183	2026-05-27 12:23:02.183	\N
cmpo1bp670003cs28tzeidbud	Ngoại khoa	ngoai-khoa	🔪	2026-05-27 12:23:02.191	2026-05-27 12:23:02.191	\N
cmpo1bp6d0004cs28c854k6d2	Ngoại thần kinh	ngoai-than-kinh	🧠	2026-05-27 12:23:02.198	2026-05-27 12:23:02.198	\N
cmpo1bp6s0005cs28u1989y9k	Chỉnh hình - Chấn thương	chinh-hinh-chan-thuong	🦴	2026-05-27 12:23:02.212	2026-05-27 12:23:02.212	\N
cmpo1bp6y0006cs28eyfgjbmd	Chỉnh hình - Cơ xương khớp	chinh-hinh-co-xuong-khop	🦵	2026-05-27 12:23:02.218	2026-05-27 12:23:02.218	\N
cmpo1bp7b0008cs281gc2uw57	Ngoại lồng ngực	ngoai-long-nguc	🫁	2026-05-27 12:23:02.231	2026-05-27 12:23:02.231	\N
cmpo1bp7z0009cs28b1rgypth	Tim mạch can thiệp	tim-mach-can-thiep	❤️	2026-05-27 12:23:02.256	2026-05-27 12:23:02.256	\N
cmpo1bp8d000acs28lqyltdo1	Ngoại tiêu hóa	ngoai-tieu-hoa	🥗	2026-05-27 12:23:02.269	2026-05-27 12:23:02.269	\N
cmpo1bp8t000bcs28m86paexq	Tiết niệu	tiet-nieu	💧	2026-05-27 12:23:02.285	2026-05-27 12:23:02.285	\N
cmpo1bp9h000ccs28qut2rh67	Tim mạch	tim-mach	❤️	2026-05-27 12:23:02.309	2026-05-27 12:23:02.309	\N
cmpo1bp9z000dcs28je8f75ss	Tiêu hóa - Gan - Mật	tieu-hoa-gan-mat	🍏	2026-05-27 12:23:02.328	2026-05-27 12:23:02.328	\N
cmpo1bpac000ecs28vnt469f9	Hô hấp	ho-hap	🫁	2026-05-27 12:23:02.34	2026-05-27 12:23:02.34	\N
cmpo1bpak000fcs2858cvcmu6	Thận - Nội tiết	than-noi-tiet	🧪	2026-05-27 12:23:02.349	2026-05-27 12:23:02.349	\N
cmpo1bpay000gcs285s9w6ir6	Thần kinh	than-kinh	🧠	2026-05-27 12:23:02.362	2026-05-27 12:23:02.362	\N
cmpo1bpb7000hcs28h8wk78on	Hồi sức tích cực	hoi-suc-tich-cuc	🚨	2026-05-27 12:23:02.372	2026-05-27 12:23:02.372	\N
cmpo1bpbr000ics28dy7p2w6a	Ung bướu	ung-buou	🎗️	2026-05-27 12:23:02.391	2026-05-27 12:23:02.391	\N
cmpo1bpck000jcs2805h591l2	Tai Mũi Họng	tai-mui-hong	👂	2026-05-27 12:23:02.42	2026-05-27 12:23:02.42	\N
cmpo1bpd8000kcs28lu422bhl	Răng Hàm Mặt	rang-ham-mat	🦷	2026-05-27 12:23:02.444	2026-05-27 12:23:02.444	\N
cmpo1bpdd000lcs28l85fdu9z	Bỏng - Tạo hình	bong-tao-hinh	🩹	2026-05-27 12:23:02.45	2026-05-27 12:23:02.45	\N
cmpo1bpdi000mcs28i3qydpqn	Ngoại tổng hợp	ngoai-tong-hop	⚕️	2026-05-27 12:23:02.455	2026-05-27 12:23:02.455	\N
cmpo1bpdo000ncs28n984j2ht	Nội tổng hợp	noi-tong-hop	🩺	2026-05-27 12:23:02.46	2026-05-27 12:23:02.46	\N
cmpo1bpe2000ocs28f9ph3kgb	Y học nhiệt đới	y-hoc-nhiet-doi	🌡️	2026-05-27 12:23:02.475	2026-05-27 12:23:02.475	\N
cmpo1bped000pcs280vogmuop	Y học hạt nhân	y-hoc-hat-nhan	☢️	2026-05-27 12:23:02.485	2026-05-27 12:23:02.485	\N
cmpo1bpei000qcs289qglhh19	Phục hồi chức năng	phuc-hoi-chuc-nang	🏃	2026-05-27 12:23:02.49	2026-05-27 12:23:02.49	\N
cmpo1bpf0000rcs28hkzcoc7g	Y học cổ truyền	y-hoc-co-truyen	🌿	2026-05-27 12:23:02.508	2026-05-27 12:23:02.508	\N
cmpo1bpf8000scs28waonhm05	Phụ sản	phu-san	🤰	2026-05-27 12:23:02.516	2026-05-27 12:23:02.516	\N
cmpo1bpfo000tcs28ky76vamw	Thận nhân tạo	than-nhan-tao	🔬	2026-05-27 12:23:02.533	2026-05-27 12:23:02.533	\N
cmpo1bpg4000ucs28jzwxo51g	Khám bệnh tổng quát	kham-benh-tong-quat	📋	2026-05-27 12:23:02.548	2026-05-27 12:23:02.548	\N
cmpo1bpgr000vcs285rcesu5z	Lão khoa	lao-khoa	🧓	2026-05-27 12:23:02.572	2026-05-27 12:23:02.572	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."User" ("id", "password", "createdAt", "doctorId", "updatedAt", "role", "email", "address", "avatar", "dateOfBirth", "fullName", "gender") FROM stdin;
f7d111ce-d956-4e4a-8b37-4813efa1f30b	\N	2026-05-27 13:02:30.869	\N	2026-05-27 13:02:30.869	USER	bondz1607@gmail.com	\N	https://lh3.googleusercontent.com/a/ACg8ocIpAV7jQhhmeO2ThYlqz_par4Y9evz5iv1vSrxB0TX3VX3VBbY=s96-c	\N	Trung Nguyễn Minh	\N
4e726782-6623-4cc9-94e6-2b6e41dcd834	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.324	doctor_29	2026-05-27 13:52:43.442	DOCTOR	nguyenquocviet@gmail.com	\N	\N	\N	Bs CK2 Nguyễn Quốc Việt	\N
1379810c-165d-4f1a-9470-1a672c473e0f	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.354	doctor_35	2026-05-27 13:52:43.453	DOCTOR	thaibasy@gmail.com	\N	\N	\N	BS. CK II Thái Bá Sỹ	\N
4051d4a1-e662-4e8e-abc6-218595feb6f5	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.387	doctor_42	2026-05-27 13:52:43.463	DOCTOR	haphuochoang@gmail.com	\N	\N	\N	Bs. Hà Phước Hoàng	\N
7b22608b-116d-422a-8864-12bd2594bfad	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.438	doctor_50	2026-05-27 13:52:43.476	DOCTOR	nguyenthem@gmail.com	\N	\N	\N	Bs CK2 Nguyễn Thêm	\N
5dab2192-2007-420e-bb55-10f1ec75e4a5	$2b$12$fg9g6OB0Lp/gtKBsyZ4xkufqVfBHh1vDEtZ7TWEXDFrDdTiGWOkrW	2026-05-27 12:21:39.164	\N	2026-05-27 12:23:02.092	ADMIN	admin@medbooking.com	\N	\N	\N	\N	\N
ebe06a31-a009-4e94-b293-35e3f9f420fe	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.164	doctor_1	2026-05-27 13:52:43.384	DOCTOR	leducnhan@gmail.com	\N	\N	\N	TS BS. Lê Đức Nhân	\N
c5fa5342-23c6-4dbb-b166-9531a3f36a4a	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.176	doctor_2	2026-05-27 13:52:43.399	DOCTOR	phamtranxuananh@gmail.com	\N	\N	\N	ThS.BS Phạm Trần Xuân Anh	\N
4b39e34c-77d0-4c07-8c2c-16a16593450f	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.186	doctor_3	2026-05-27 13:52:43.401	DOCTOR	tranthikhanhngoc@gmail.com	\N	\N	\N	BS.CK2 Trần Thị Khánh Ngọc	\N
22181cd7-6744-45bb-bd49-0462542296e0	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.194	doctor_4	2026-05-27 13:52:43.404	DOCTOR	nguyenthanhtrung@gmail.com	\N	\N	\N	Bác sĩ CK2 Nguyễn Thành Trung	\N
385e540c-7f29-465f-9656-d00263a75b7b	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.199	doctor_5	2026-05-27 13:52:43.406	DOCTOR	tratanhoanh@gmail.com	\N	\N	\N	Bs CK2. Trà Tấn Hoành	\N
323a2b16-b6d1-486b-b2a5-62fb89127bd5	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.204	doctor_6	2026-05-27 13:52:43.407	DOCTOR	lenghiembao@gmail.com	\N	\N	\N	Bs.CK1 Lê Nghiêm Bảo	\N
34917091-eb81-436f-b958-da2b5334737f	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.209	doctor_7	2026-05-27 13:52:43.41	DOCTOR	lequangchicuong@gmail.com	\N	\N	\N	Bs.CK2 Lê Quang Chí Cường	\N
659a9106-00bb-498f-a9e9-9ed111982374	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.214	doctor_8	2026-05-27 13:52:43.413	DOCTOR	levanmuoi@gmail.com	\N	\N	\N	Bs CK2. Lê Văn Mười	\N
e904b9c4-3281-494e-b5de-21944bee4a0c	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.219	doctor_9	2026-05-27 13:52:43.414	DOCTOR	ngohanh@gmail.com	\N	\N	\N	Bs CK2. Ngô Hạnh	\N
105c167f-0f0e-4ac1-999b-d3910fabfc1d	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.232	doctor_11	2026-05-27 13:52:43.415	DOCTOR	thantrongvu@gmail.com	\N	\N	\N	Ths Bs. Thân Trọng Vũ	\N
fd60845d-915f-4787-9c2a-41d5c3872a4a	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.237	doctor_12	2026-05-27 13:52:43.418	DOCTOR	phanphuocanbinh@gmail.com	\N	\N	\N	Bs CKI. Phan Phước An Bình	\N
828c3267-d393-40ee-9a68-8e53e94e51b4	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.241	doctor_13	2026-05-27 13:52:43.419	DOCTOR	lekimphuong@gmail.com	\N	\N	\N	Bs. Lê Kim Phượng	\N
33b0d052-471a-41fb-bfb0-774d8ad2cf7b	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.227	doctor_10	2026-05-27 13:52:43.508	DOCTOR	phamvinhhuy@gmail.com	\N	\N	\N	ThS.Bs Phạm Vĩnh Huy	\N
b222b74a-7562-4ecb-ae0b-28cfb34394f6	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.814	\N	2026-05-27 12:23:02.092	USER	patient.1@medbooking.com	\N	\N	\N	\N	\N
32f3c334-83d8-4cea-8bf9-b1c17d72dbc0	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.817	\N	2026-05-27 12:23:02.092	USER	patient.2@medbooking.com	\N	\N	\N	\N	\N
a9a0584d-7cde-4676-80dd-1dbfa9f0978a	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.819	\N	2026-05-27 12:23:02.092	USER	patient.3@medbooking.com	\N	\N	\N	\N	\N
36d83ee2-066f-4fe6-a678-345b70c1fe8d	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.821	\N	2026-05-27 12:23:02.092	USER	patient.4@medbooking.com	\N	\N	\N	\N	\N
d747de65-de03-43be-bf2d-30c50f09b963	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.824	\N	2026-05-27 12:23:02.092	USER	patient.5@medbooking.com	\N	\N	\N	\N	\N
99c661ca-81ac-4fdd-8707-ae026eadd346	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.826	\N	2026-05-27 12:23:02.092	USER	patient.6@medbooking.com	\N	\N	\N	\N	\N
f7e86cf0-703b-47d6-a20c-e4565e3b9d2e	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.828	\N	2026-05-27 12:23:02.092	USER	patient.7@medbooking.com	\N	\N	\N	\N	\N
1f1868c1-89c4-4529-9898-49581398ec0a	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.83	\N	2026-05-27 12:23:02.092	USER	patient.8@medbooking.com	\N	\N	\N	\N	\N
1ade694e-be3e-4ca8-9481-279ae792b519	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.832	\N	2026-05-27 12:23:02.092	USER	patient.9@medbooking.com	\N	\N	\N	\N	\N
737ee529-f12f-4644-b379-56af3e653278	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.834	\N	2026-05-27 12:23:02.092	USER	patient.10@medbooking.com	\N	\N	\N	\N	\N
359118c2-6694-4fdb-9511-56634f8a1cac	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.836	\N	2026-05-27 12:23:02.092	USER	patient.11@medbooking.com	\N	\N	\N	\N	\N
20dca70f-9166-48e6-bb3e-e37c8c1f3907	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.838	\N	2026-05-27 12:23:02.092	USER	patient.12@medbooking.com	\N	\N	\N	\N	\N
ccfb16e5-e8d2-4cee-ae83-831f44ff8b2e	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.84	\N	2026-05-27 12:23:02.092	USER	patient.13@medbooking.com	\N	\N	\N	\N	\N
4107cd1f-5941-4db6-9cab-7649a53c3a8a	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.842	\N	2026-05-27 12:23:02.092	USER	patient.14@medbooking.com	\N	\N	\N	\N	\N
2c9cdb14-5e1d-4afd-b8c6-74394dd772ff	$2b$12$PWZQdPAZBE8QF7u6/u9vbOx0rE0hn9qLIZ4GZAv022wq6EniMo6.e	2026-05-27 12:21:44.844	\N	2026-05-27 12:23:02.092	USER	patient.15@medbooking.com	\N	\N	\N	\N	\N
e8885d8b-a378-417d-be44-377b40dcfbdb	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.245	doctor_14	2026-05-27 13:52:43.421	DOCTOR	nguyenngoctuan@gmail.com	\N	\N	\N	Ths Bs. Nguyễn Ngọc Tuấn	\N
56d111c5-fd5d-455f-bf9a-dad21f9f362e	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.25	doctor_15	2026-05-27 13:52:43.422	DOCTOR	lekimtrong@gmail.com	\N	\N	\N	Ths Bs. Lê Kim Trọng	\N
091742b5-c593-4d01-9f3f-b3a516b74fe9	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.258	doctor_16	2026-05-27 13:52:43.423	DOCTOR	nguyenminhhai@gmail.com	\N	\N	\N	Ths. BS. Nguyễn Minh Hải	\N
11de6e54-933c-4060-9d60-e7508cddbf36	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.265	doctor_17	2026-05-27 13:52:43.425	DOCTOR	nguyenbatrieu@gmail.com	\N	\N	\N	Ths. BS. Nguyễn Bá triệu	\N
534832ca-a404-4bc1-98c4-6b8c6cdbfe05	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.271	doctor_18	2026-05-27 13:52:43.426	DOCTOR	nguyenhoang@gmail.com	\N	\N	\N	BS CKII. NGUYỄN HOÀNG	\N
94eeddb7-fa84-4834-a2b6-2ccafd48c237	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.275	doctor_19	2026-05-27 13:52:43.428	DOCTOR	vovantuong@gmail.com	\N	\N	\N	BS CKI Võ Văn Tường	\N
b0ef62b9-dd5c-40e2-9a71-48f63fcedaea	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.282	doctor_20	2026-05-27 13:52:43.428	DOCTOR	letudung@gmail.com	\N	\N	\N	ThS. LÊ TỰ DŨNG	\N
8cf1c8d5-16aa-48f9-9fd0-b1bfec1ff573	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.287	doctor_21	2026-05-27 13:52:43.43	DOCTOR	buichin@gmail.com	\N	\N	\N	Bs CKII Bùi Chín	\N
0193ce01-736b-4a76-aa1d-fbf7ec01cc06	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.29	doctor_22	2026-05-27 13:52:43.432	DOCTOR	votrinhphu@gmail.com	\N	\N	\N	Bs CKII Võ Trịnh Phú	\N
36440770-2a7b-413b-8bc7-4c4758e83d26	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.294	doctor_23	2026-05-27 13:52:43.433	DOCTOR	caovantri@gmail.com	\N	\N	\N	Ths Bs Cao Văn Trí	\N
ab7c8e08-c21b-41dd-8909-21525cc80c20	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.299	doctor_24	2026-05-27 13:52:43.434	DOCTOR	phamtrancanhnguyen@gmail.com	\N	\N	\N	Ths Bs Phạm Trần Cảnh Nguyên	\N
8f5d18e4-7e98-4dfa-8d2d-96a91b5c5e56	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.305	doctor_25	2026-05-27 13:52:43.435	DOCTOR	nguyenminhtuan@gmail.com	\N	\N	\N	Ths Bs Nguyễn Minh Tuấn	\N
fba265c6-314b-428f-8f25-af28b86836e8	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.311	doctor_26	2026-05-27 13:52:43.437	DOCTOR	huynhdinhlai@gmail.com	\N	\N	\N	BS CK2 HUỲNH ĐÌNH LAI	\N
6ba08ce9-c747-42b4-9970-10599151c334	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.315	doctor_27	2026-05-27 13:52:43.439	DOCTOR	hovanphuoc@gmail.com	\N	\N	\N	Ths. Bs CKII Hồ Văn Phước	\N
a408ac94-1bd8-41d9-a45a-74ec685bd095	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.32	doctor_28	2026-05-27 13:52:43.44	DOCTOR	phamvanhung@gmail.com	\N	\N	\N	Thạc sỹ PHẠM VĂN HÙNG	\N
58a8ca19-6590-4ff2-9735-4617e6a4e89c	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.33	doctor_30	2026-05-27 13:52:43.445	DOCTOR	nguyenvanxung@gmail.com	\N	\N	\N	Thạc sỹ Bác sĩ CKII Nguyễn Văn Xứng	\N
49749343-43ce-4645-a25b-a12e988b7956	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.337	doctor_31	2026-05-27 13:52:43.446	DOCTOR	nguyenthithuan@gmail.com	\N	\N	\N	Thạc sỹ Bác sĩ Nguyễn Thị Thuận	\N
9049b7e1-af0b-461e-a571-3b54e0137ea0	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.341	doctor_32	2026-05-27 13:52:43.447	DOCTOR	nguyenhuaquang@gmail.com	\N	\N	\N	Bs CKII Nguyễn Hứa Quang	\N
87530ecc-09e1-43ef-a222-1ff038adcfe9	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.345	doctor_33	2026-05-27 13:52:43.449	DOCTOR	nguyenbahung@gmail.com	\N	\N	\N	Ths.Bs Nguyễn Bá Hùng	\N
52afae24-590a-4a81-a70f-6e4e922db114	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.35	doctor_34	2026-05-27 13:52:43.451	DOCTOR	danganhdao@gmail.com	\N	\N	\N	Ths.Bs. Đặng Anh Đào	\N
f02abaae-2946-4baf-a384-a0923cd750c3	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.357	doctor_36	2026-05-27 13:52:43.454	DOCTOR	inguyenhuuda@gmail.com	\N	\N	\N	Bs. CK. I Nguyễn Hữu Đa	\N
00c745bc-517f-468f-b4ae-52ce2bb7a170	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.364	doctor_37	2026-05-27 13:52:43.455	DOCTOR	lehoangtruong@gmail.com	\N	\N	\N	Thạc sỹ Lê Hoàng Trường	\N
2797cc53-794c-41ac-9c7b-5efcfcf63c77	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.368	doctor_38	2026-05-27 13:52:43.457	DOCTOR	ngothiminhhieu@gmail.com	\N	\N	\N	BSCKI. Ngô Thị Minh Hiếu	\N
b3846f11-31ae-4db5-9265-99f872eb5411	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.373	doctor_39	2026-05-27 13:52:43.459	DOCTOR	voduytrinh@gmail.com	\N	\N	\N	BSCK2. Võ Duy Trinh	\N
0867cfb7-1305-45e3-aed0-433b271bf729	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.378	doctor_40	2026-05-27 13:52:43.461	DOCTOR	hasonbinh@gmail.com	\N	\N	\N	BSCK2. Hà Sơn Bình	\N
7287c6fb-9605-4b99-9b34-8bcfbcc3f1ca	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.383	doctor_41	2026-05-27 13:52:43.462	DOCTOR	huynhducphat@gmail.com	\N	\N	\N	Bs. Huỳnh Đức Phát	\N
591610e7-7764-4e31-92e0-e1d7fdeda957	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.393	doctor_43	2026-05-27 13:52:43.465	DOCTOR	lequoctuan@gmail.com	\N	\N	\N	ThS.BS. Lê Quốc Tuấn	\N
9bd9d24a-321a-4f8b-98c1-1f4488bbfd26	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.397	doctor_44	2026-05-27 13:52:43.467	DOCTOR	phanvanluong@gmail.com	\N	\N	\N	Bác sỹ Phan Văn Lượng	\N
098fa196-6cbf-469a-bf15-0270f5ce1a3c	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.402	doctor_45	2026-05-27 13:52:43.469	DOCTOR	huynhvanhieu@gmail.com	\N	\N	\N	Bác sỹ Huỳnh Văn Hiếu	\N
67e9bbf1-2019-46a0-ab14-fad7f9d5ba28	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.406	doctor_46	2026-05-27 13:52:43.47	DOCTOR	damminhson@gmail.com	\N	\N	\N	Bác sỹ Đàm Minh Sơn	\N
f041a70f-1d75-4f4b-83ed-980dce3c39f9	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.411	doctor_47	2026-05-27 13:52:43.471	DOCTOR	votantai@gmail.com	\N	\N	\N	Bác sỹ Võ Tấn Tài	\N
bf7edc0c-2242-4742-931d-f148a772cc85	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.423	doctor_48	2026-05-27 13:52:43.473	DOCTOR	huynhanh@gmail.com	\N	\N	\N	Bs CK2 Huỳnh Anh	\N
5256d606-d127-4a91-91d8-f8ce0e36950c	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.43	doctor_49	2026-05-27 13:52:43.475	DOCTOR	truongngochung@gmail.com	\N	\N	\N	Bs CK2 Trương Ngọc Hùng	\N
bbc4595a-18a5-46f7-9e2c-2954bf5ecc4a	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.446	doctor_51	2026-05-27 13:52:43.478	DOCTOR	nguyenthihongminh@gmail.com	\N	\N	\N	BS CK2. NGUYỄN THỊ HỒNG MINH	\N
080f9c76-d6af-418c-859a-09889327a3a7	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.452	doctor_52	2026-05-27 13:52:43.48	DOCTOR	dovanhung@gmail.com	\N	\N	\N	Bs CK1 Đỗ Văn Hùng	\N
aeead5bb-42f1-4c47-a9b4-d5bf8b9432e4	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.457	doctor_53	2026-05-27 13:52:43.482	DOCTOR	hoangduongvuong@gmail.com	\N	\N	\N	Bs. Thạc Sỹ Hoàng Dương Vương	\N
a3ad15cb-f88b-447d-b839-13426d7b71e3	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.462	doctor_54	2026-05-27 13:52:43.483	DOCTOR	nguyenduclu@gmail.com	\N	\N	\N	TS.BS. Nguyễn Đức Lư	\N
2ec17174-e58a-491f-b663-46c742603802	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.468	doctor_55	2026-05-27 13:52:43.485	DOCTOR	dangconglu@gmail.com	\N	\N	\N	TS.BS. Đặng Công Lữ	\N
bcb8bfde-8e24-45bf-a4e3-8a9d95d50c34	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.476	doctor_56	2026-05-27 13:52:43.487	DOCTOR	phamngocham@gmail.com	\N	\N	\N	Bác sỹ.Ths. CKII. Phạm Ngọc Hàm	\N
49c621c0-a324-4dd1-af6b-41a82f37f3da	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.481	doctor_57	2026-05-27 13:52:43.489	DOCTOR	nguyenhoangson@gmail.com	\N	\N	\N	Bác sỹ.Ths. CKII. Nguyễn Hoàng Sơn	\N
8dd30b13-7ec0-49ac-b64f-0f161159b28b	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.487	doctor_58	2026-05-27 13:52:43.49	DOCTOR	nguyenvanminh@gmail.com	\N	\N	\N	BS.CK2 Nguyễn Văn Minh	\N
e1520c9c-7f26-49ab-b3cf-89d6cb91df7f	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.492	doctor_59	2026-05-27 13:52:43.492	DOCTOR	nguyenconghuan@gmail.com	\N	\N	\N	ThS. Bs. Nguyễn Công Huân	\N
bda7238e-28e6-4510-8c8b-e56b7f9d9a6c	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.496	doctor_60	2026-05-27 13:52:43.494	DOCTOR	phantindung@gmail.com	\N	\N	\N	Bác sĩ Phó khoa Bs.CK1 Phan Tín Dụng	\N
44348a71-b490-4ff0-a957-a590b3d2aa3a	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.502	doctor_61	2026-05-27 13:52:43.496	DOCTOR	luuquanglong@gmail.com	\N	\N	\N	Bs. Lưu Quang Long	\N
a2c0a4f5-d6ba-4cb8-be8b-9d33cf9d41f5	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.51	doctor_62	2026-05-27 13:52:43.496	DOCTOR	nguyenhoangphuong@gmail.com	\N	\N	\N	BS.CKI.Nguyễn Hoàng Phương	\N
3501b2d4-9bab-428d-b8b0-26191f679558	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.519	doctor_63	2026-05-27 13:52:43.497	DOCTOR	nguyenthingocanh@gmail.com	\N	\N	\N	BS CKII Nguyễn Thị Ngọc Ánh	\N
7cdfc613-13f3-4b31-9587-6663892f6f66	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.526	doctor_64	2026-05-27 13:52:43.498	DOCTOR	nguyenthihongphuc@gmail.com	\N	\N	\N	BSCKI Nguyễn Thị Hồng Phúc	\N
7b781c94-1db5-4be1-a8b4-196b2b8f387d	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.535	doctor_65	2026-05-27 13:52:43.5	DOCTOR	voquangvinh@gmail.com	\N	\N	\N	Bs CKII. Võ Quang Vinh	\N
04e2d449-f926-4b6e-8e3f-fd31614e7a28	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.543	doctor_66	2026-05-27 13:52:43.502	DOCTOR	machuu@gmail.com	\N	\N	\N	Bs CKII Mạc Hữu	\N
ff06f2b3-1d47-4ab5-812b-9e3039bf537e	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.551	doctor_67	2026-05-27 13:52:43.503	DOCTOR	nguyentruongminh@gmail.com	\N	\N	\N	Thạc sỹ Bác sĩ Nguyễn Trường Minh	\N
82d173e4-4756-447b-ae52-57fa03322e6c	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.558	doctor_68	2026-05-27 13:52:43.504	DOCTOR	nguyenducphuc@gmail.com	\N	\N	\N	Ths. Bs Nguyễn Đức Phúc	\N
bcf8575f-1a85-4c98-b9c4-896b01de78f5	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.566	doctor_69	2026-05-27 13:52:43.505	DOCTOR	nguyentienhung@gmail.com	\N	\N	\N	Bác sĩ Nguyễn Tiến Hưng	\N
fcb7d6bb-961a-43a6-8d99-3ab595634d0e	$2b$10$rNvwlqX3t2NGdjuhbnohbuCyQBY0WRJx8if9DWJcX4q6wuVloT2KK	2026-05-27 12:23:02.574	doctor_70	2026-05-27 13:52:43.507	DOCTOR	phamvantu@gmail.com	\N	\N	\N	BS CK2. PHẠM VĂN TÚ	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") FROM stdin;
be739436-9d86-4c30-b4a1-15a5934ce0e3	987b37076c67652e33fb5272d5fe36098c55e383ee2e56dda2b5442708ff66d2	2026-05-27 15:40:59.425619+07	20260517155145_init	\N	\N	2026-05-27 15:40:59.413851+07	1
554eaa30-d9db-4cf9-97bb-c50ee1089277	424916af8c3937353607891bedb023d4cbdaf45d8a15b96a3ab8118ec42e34de	2026-05-27 15:40:59.440751+07	20260520033429_add_doctor_appointment	\N	\N	2026-05-27 15:40:59.426668+07	1
11dba302-ef82-4be1-ab6c-86c9893507c0	48ee412eb2bea43ca8d51e1caa5bd8e6e1141332b46f880c6c5990bea30f6ffb	2026-05-27 15:40:59.44973+07	20260520034843_add_doctor_schedule	\N	\N	2026-05-27 15:40:59.441446+07	1
20a8f726-d9a2-4adf-8f4d-12f7914490b7	b007c4e599a0ddaa48feec42938f39f24ef4d666c3d1fb24dc4c8025a63becd2	2026-05-27 15:40:59.456669+07	20260520040000_add_role_enum_and_user_doctor_link	\N	\N	2026-05-27 15:40:59.45035+07	1
a1d81f34-2250-48b0-923a-2df1dd43b062	dca8940add97f3bac8cb0da66c55c0e5e6ddecbf94466b455bc18eda744c46c4	2026-05-27 15:40:59.460713+07	20260520123504_seed_data	\N	\N	2026-05-27 15:40:59.457237+07	1
20fa9d50-cc7f-4905-acc4-e7fbb26c7ec8	ed89841104c5df55a67916e859824eb3b10c9bf06427beaeea38b8606fec0dd1	2026-05-27 15:40:59.464915+07	20260525_add_email_otp	\N	\N	2026-05-27 15:40:59.46151+07	1
2db6f68d-d9a4-42fa-bfb4-d2aeea825305	04c04e3a789c0446d9b892c84d761832089abde31373ecee2b07c151bf01e5b3	2026-05-27 15:40:59.476237+07	20260526061803_init_otp	\N	\N	2026-05-27 15:40:59.465603+07	1
ff4a0005-88b3-4310-b4b1-bc007090f588	c064f125df07f5679a5c11842f8e6438997503df38e27dbd7bb244d95737a380	2026-05-27 15:40:59.478817+07	20260527063541_add_profile_fields	\N	\N	2026-05-27 15:40:59.476815+07	1
62028b04-3f46-466b-bb91-6d29f0d96e0c	9cb51e0b7636fa960d2bd9f801893d4151f9fbecb6d7514cfd9cd8926b70ca3d	2026-05-27 15:40:59.482642+07	20260527064021_make_password_nullable	\N	\N	2026-05-27 15:40:59.479675+07	1
ae51beda-dbb3-418c-841d-d04a4940088b	57474498e79fcf1270be57eacc937817ece53f852df5f4e49e6b76ed71e29caf	2026-05-27 15:40:59.492177+07	20260527072742_create_specialty_relation	\N	\N	2026-05-27 15:40:59.483278+07	1
\.


--
-- Name: OTP_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('"public"."OTP_id_seq"', 1, false);


--
-- Name: Appointment Appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id");


--
-- Name: Article Article_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Article"
    ADD CONSTRAINT "Article_pkey" PRIMARY KEY ("id");


--
-- Name: Clinic Clinic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Clinic"
    ADD CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id");


--
-- Name: Complaint Complaint_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Complaint"
    ADD CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id");


--
-- Name: DoctorSchedule DoctorSchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."DoctorSchedule"
    ADD CONSTRAINT "DoctorSchedule_pkey" PRIMARY KEY ("id");


--
-- Name: Doctor Doctor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Doctor"
    ADD CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id");


--
-- Name: MedicalRecord MedicalRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id");


--
-- Name: OTP OTP_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."OTP"
    ADD CONSTRAINT "OTP_pkey" PRIMARY KEY ("id");


--
-- Name: Prescription Prescription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Prescription"
    ADD CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id");


--
-- Name: Specialty Specialty_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Specialty"
    ADD CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");


--
-- Name: MedicalRecord_appointmentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MedicalRecord_appointmentId_key" ON "public"."MedicalRecord" USING "btree" ("appointmentId");


--
-- Name: Specialty_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Specialty_name_key" ON "public"."Specialty" USING "btree" ("name");


--
-- Name: Specialty_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Specialty_slug_key" ON "public"."Specialty" USING "btree" ("slug");


--
-- Name: User_doctorId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_doctorId_key" ON "public"."User" USING "btree" ("doctorId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON "public"."User" USING "btree" ("email");


--
-- Name: Appointment Appointment_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Appointment"
    ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Appointment"
    ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Complaint Complaint_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Complaint"
    ADD CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DoctorSchedule DoctorSchedule_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."DoctorSchedule"
    ADD CONSTRAINT "DoctorSchedule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Doctor Doctor_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Doctor"
    ADD CONSTRAINT "Doctor_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "public"."Clinic"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Doctor Doctor_specialtyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Doctor"
    ADD CONSTRAINT "Doctor_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."Specialty"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MedicalRecord MedicalRecord_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MedicalRecord MedicalRecord_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MedicalRecord MedicalRecord_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."MedicalRecord"
    ADD CONSTRAINT "MedicalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Prescription Prescription_medicalRecordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Prescription"
    ADD CONSTRAINT "Prescription_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "public"."MedicalRecord"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict bAErPDD9slsruRWBniiHYVt5EvKkFaUjTY1pmU8o66cVTdV72FZXJ7Q3VxJLUfu

