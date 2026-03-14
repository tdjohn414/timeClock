--
-- PostgreSQL database dump
--

\restrict SbnJBWIHywme5MHxMQ2cKyZzSl2nzf7CglgP7sV2vign73XiGbqvteBD7jAOLKl

-- Dumped from database version 17.7 (Debian 17.7-3.pgdg13+1)
-- Dumped by pg_dump version 17.7 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_log (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    action character varying(100) NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id integer,
    details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_log OWNER TO postgres;

--
-- Name: activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_log_id_seq OWNER TO postgres;

--
-- Name: activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_log_id_seq OWNED BY public.activity_log.id;


--
-- Name: invoice_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_number_seq
    START WITH 2000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_number_seq OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number character varying(10) NOT NULL,
    company_name character varying(255) NOT NULL,
    company_address character varying(255),
    company_city_state_zip character varying(255),
    contact_name character varying(255),
    job_name character varying(255),
    previous_rcv numeric(12,2) NOT NULL,
    current_rcv numeric(12,2) NOT NULL,
    difference numeric(12,2) GENERATED ALWAYS AS ((current_rcv - previous_rcv)) STORED,
    invoice_amount numeric(12,2) GENERATED ALWAYS AS (((current_rcv - previous_rcv) * 0.10)) STORED,
    invoice_date date DEFAULT CURRENT_DATE NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    paid_at timestamp without time zone,
    notes text,
    sent_at timestamp without time zone
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    type character varying(50) NOT NULL,
    message text NOT NULL,
    shift_id integer,
    read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: shifts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shifts (
    id integer NOT NULL,
    user_id integer,
    date date NOT NULL,
    total_hours numeric(5,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    clock_in_time timestamp with time zone,
    clock_out_time timestamp with time zone,
    clock_in_timestamp timestamp with time zone,
    clock_out_timestamp timestamp with time zone,
    paid_at timestamp with time zone
);


ALTER TABLE public.shifts OWNER TO postgres;

--
-- Name: shifts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shifts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shifts_id_seq OWNER TO postgres;

--
-- Name: shifts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shifts_id_seq OWNED BY public.shifts.id;


--
-- Name: time_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.time_blocks (
    id integer NOT NULL,
    shift_id integer,
    tasks text,
    is_break boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    start_timestamp timestamp with time zone,
    end_timestamp timestamp with time zone,
    is_unpaid boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_block_type CHECK ((NOT ((is_break = true) AND (is_unpaid = true))))
);


ALTER TABLE public.time_blocks OWNER TO postgres;

--
-- Name: time_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.time_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.time_blocks_id_seq OWNER TO postgres;

--
-- Name: time_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.time_blocks_id_seq OWNED BY public.time_blocks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log ALTER COLUMN id SET DEFAULT nextval('public.activity_log_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: shifts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts ALTER COLUMN id SET DEFAULT nextval('public.shifts_id_seq'::regclass);


--
-- Name: time_blocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_blocks ALTER COLUMN id SET DEFAULT nextval('public.time_blocks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_log (id, admin_id, action, target_type, target_id, details, created_at) FROM stdin;
1	5	user_deactivated	user	3	{"deactivatedBy": "tyler@fullscopeestimating.com"}	2026-01-28 03:37:37.319043
2	5	user_created	user	6	{"name": "Test Test", "role": "user", "email": "test4@test.com", "status": "active", "createdBy": "tyler@fullscopeestimating.com"}	2026-01-28 04:17:13.183734
3	5	user_created	user	7	{"name": "LJ", "role": "user", "email": "test@test.com", "status": "active", "createdBy": "tyler@fullscopeestimating.com"}	2026-01-28 04:18:45.00746
4	5	user_created	user	8	{"name": "Dallin Johnston", "role": "user", "email": "dallin@fullscopeestimating.com", "status": "active", "createdBy": "tyler@fullscopeestimating.com"}	2026-01-28 04:22:30.725022
5	5	user_updated	user	7	{"changes": {"id": 7, "name": "LJ", "role": "user", "email": "lj@fullscopeestimating.com", "status": "active", "created_at": "2026-01-28T11:18:44.969Z", "last_login": null}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-01-28 04:25:47.934465
6	5	user_updated	user	8	{"changes": {"id": 8, "name": "Dallin", "role": "user", "email": "dallin@fullscopeestimating.com", "status": "active", "created_at": "2026-01-28T11:22:30.686Z", "last_login": null}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-01-28 04:26:02.913583
7	5	user_created	user	9	{"name": "Trevor", "role": "user", "email": "trevor@fullscopeestimating.com", "status": "active", "createdBy": "tyler@fullscopeestimating.com"}	2026-01-28 04:31:46.219729
8	5	shift_created	shift	20	{"date": "2026-01-27", "userId": 9, "createdBy": "tyler@fullscopeestimating.com", "totalHours": 13.5, "blocksCount": 1}	2026-01-28 04:32:22.23622
9	5	shift_deleted	shift	21	{"deletedBy": "tyler@fullscopeestimating.com", "deletedShift": {"id": 21, "date": "2026-01-27T00:00:00.000Z", "status": "pending", "user_id": 4, "user_name": "Crista", "created_at": "2026-01-28T04:41:27.394Z", "user_email": "admin@fullscopeestimating.com", "total_hours": null, "clock_in_time": "2026-01-27T21:41:00.000Z", "clock_out_time": null}}	2026-01-28 04:42:58.037868
10	4	shift_created	shift	28	{"date": "2026-01-28", "userId": 4, "createdBy": "admin@fullscopeestimating.com", "totalHours": "8.75", "blocksCount": 7, "selfService": true}	2026-01-29 01:37:25.334931
11	9	shift_submitted	shift	31	{"date": "2026-01-29T07:00:00.000Z", "userId": 9, "clockIn": "2026-01-29T22:30:00.000Z", "clockOut": "2026-01-29T23:00:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "0.50", "selfService": true}	2026-01-29 23:24:05.02296
12	5	shift_approved	shift	31	{"date": "2026-01-29T07:00:00.000Z", "userId": 9, "userName": "Trevor", "approvedBy": "tyler@fullscopeestimating.com"}	2026-01-29 23:24:50.442695
13	5	shift_marked_paid	shift	31	{"date": "2026-01-29T07:00:00.000Z", "userId": 9, "markedBy": "tyler@fullscopeestimating.com", "userName": "Trevor", "totalHours": "0.50"}	2026-01-30 02:21:15.452828
14	5	shift_updated	shift	31	{"changes": {"status": "approved"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-01-30 02:24:07.315476
15	9	shift_submitted	shift	32	{"date": "2026-01-29T07:00:00.000Z", "userId": 9, "clockIn": "2026-01-30T03:03:00.000Z", "clockOut": "2026-01-30T04:03:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "1.00", "selfService": true}	2026-01-30 03:03:46.455929
16	5	shift_rejected	shift	32	{"date": "2026-01-29T07:00:00.000Z", "reason": "include more details about what you did", "userId": 9, "userName": "Trevor", "rejectedBy": "tyler@fullscopeestimating.com"}	2026-01-30 03:19:05.780261
17	9	shift_submitted	shift	33	{"date": "2026-01-29T07:00:00.000Z", "userId": 9, "clockIn": "2026-01-30T03:20:00.000Z", "clockOut": "2026-01-30T03:50:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "0.50", "selfService": true}	2026-01-30 03:20:46.239013
18	5	shift_approved	shift	33	{"date": "2026-01-29T07:00:00.000Z", "userId": 9, "userName": "Trevor", "approvedBy": "tyler@fullscopeestimating.com"}	2026-01-30 03:28:24.024569
19	5	shift_deleted	shift	32	{"deletedBy": "tyler@fullscopeestimating.com", "deletedShift": {"id": 32, "date": "2026-01-29T00:00:00.000Z", "status": "rejected", "user_id": 9, "user_name": "Trevor", "created_at": "2026-01-30T03:03:37.622Z", "user_email": "trevor@fullscopeestimating.com", "total_hours": "1.00", "clock_in_time": "2026-01-30T03:03:00.000Z", "clock_out_time": "2026-01-30T04:03:00.000Z", "clock_in_timestamp": null, "clock_out_timestamp": null}}	2026-01-30 03:38:39.796332
20	5	shift_deleted	shift	31	{"deletedBy": "tyler@fullscopeestimating.com", "deletedShift": {"id": 31, "date": "2026-01-29T00:00:00.000Z", "status": "approved", "user_id": 9, "user_name": "Trevor", "created_at": "2026-01-29T23:23:41.636Z", "user_email": "trevor@fullscopeestimating.com", "total_hours": "0.50", "clock_in_time": "2026-01-29T22:30:00.000Z", "clock_out_time": "2026-01-29T23:00:00.000Z", "clock_in_timestamp": null, "clock_out_timestamp": null}}	2026-01-30 03:38:54.740237
21	5	shift_deleted	shift	33	{"deletedBy": "tyler@fullscopeestimating.com", "deletedShift": {"id": 33, "date": "2026-01-29T00:00:00.000Z", "status": "approved", "user_id": 9, "user_name": "Trevor", "created_at": "2026-01-30T03:20:38.652Z", "user_email": "trevor@fullscopeestimating.com", "total_hours": "0.50", "clock_in_time": "2026-01-30T03:20:00.000Z", "clock_out_time": "2026-01-30T03:50:00.000Z", "clock_in_timestamp": null, "clock_out_timestamp": null}}	2026-01-30 03:38:59.681819
22	9	shift_submitted	shift	34	{"date": "2026-01-29T00:00:00.000Z", "userId": 9, "clockIn": "2026-01-30T02:00:00.000Z", "clockOut": "2026-01-30T03:30:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "1.50", "selfService": true}	2026-01-30 03:40:36.887331
23	4	shift_submitted	shift	29	{"date": "2026-01-29T00:00:00.000Z", "userId": 4, "clockIn": "2026-01-29T13:00:00.000Z", "clockOut": "2026-01-28T21:45:00.000Z", "createdBy": "admin@fullscopeestimating.com", "totalHours": "8.75", "selfService": true}	2026-01-30 05:14:39.271551
24	5	user_updated	user	4	{"changes": {"id": 4, "name": "Crista", "role": "user", "email": "crista@fullscopeestimating.com", "status": "active", "created_at": "2026-01-27T11:59:22.978Z", "last_login": null}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-01 21:06:46.475665
25	9	shift_submitted	shift	71	{"date": "2026-02-01T07:00:00.000Z", "userId": 9, "clockIn": "2026-02-01T21:00:00.000Z", "clockOut": "2026-02-01T22:00:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "1.00", "selfService": true}	2026-02-02 01:17:53.037039
26	5	shift_approved	shift	71	{"date": "2026-02-01T00:00:00.000Z", "userId": 9, "userName": "Trevor", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-02 04:32:49.83701
27	5	shift_approved	shift	34	{"date": "2026-01-29T00:00:00.000Z", "userId": 9, "userName": "Trevor", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-02 04:32:52.508387
28	5	shift_approved	shift	29	{"date": "2026-01-29T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-02 04:38:08.210327
29	4	shift_submitted	shift	74	{"date": "2026-01-30T00:00:00.000Z", "userId": 4, "clockIn": "2026-01-29T18:00:00.000Z", "clockOut": "2026-01-29T23:00:00.000Z", "createdBy": "admin@fullscopeestimating.com", "totalHours": "5.00", "selfService": true}	2026-02-02 19:18:31.364221
30	7	shift_submitted	shift	73	{"date": "2026-02-02T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-02T13:00:00.000Z", "clockOut": "2026-02-01T21:16:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.27", "selfService": true}	2026-02-02 21:16:36.900889
31	4	shift_submitted	shift	75	{"date": "2026-01-31T00:00:00.000Z", "userId": 4, "clockIn": "2026-01-30T20:00:00.000Z", "clockOut": "2026-01-30T21:00:00.000Z", "createdBy": "admin@fullscopeestimating.com", "totalHours": "1.00", "selfService": true}	2026-02-02 21:17:14.128299
32	4	shift_submitted	shift	76	{"date": "2026-02-02T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-02T00:30:00.000Z", "clockOut": "2026-02-02T10:45:00.000Z", "createdBy": "admin@fullscopeestimating.com", "totalHours": "10.25", "selfService": true}	2026-02-03 00:27:58.069946
33	9	shift_submitted	shift	77	{"date": "2026-02-02", "userId": 9, "clockIn": "2026-02-02T19:30:00.000Z", "clockOut": "2026-02-02T21:15:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "1.75", "blocksCount": 1, "selfService": true}	2026-02-03 04:11:54.060903
34	9	shift_submitted	shift	78	{"date": "2026-02-02T00:00:00.000Z", "userId": 9, "clockIn": "2026-02-03T02:30:00.000Z", "clockOut": "2026-02-03T04:15:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "1.75", "selfService": true}	2026-02-03 04:13:50.246424
35	9	shift_submitted	shift	79	{"date": "2026-02-03", "userId": 9, "clockIn": "2026-02-03T19:30:00.000Z", "clockOut": "2026-02-03T21:15:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "1.75", "blocksCount": 1, "selfService": true}	2026-02-03 04:14:22.93412
36	9	shift_submitted	shift	80	{"date": "2026-02-02", "userId": 9, "clockIn": "2026-02-02T07:30:00.000Z", "clockOut": "2026-02-02T09:15:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "1.75", "blocksCount": 1, "selfService": true}	2026-02-03 04:26:11.398706
37	9	shift_submitted	shift	81	{"date": "2026-02-02", "userId": 9, "clockIn": "2026-02-03T02:30:00.000Z", "clockOut": "2026-02-03T04:15:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "1.75", "blocksCount": 1, "selfService": true}	2026-02-03 04:30:31.792836
38	5	shift_approved	shift	78	{"date": "2026-02-02T00:00:00.000Z", "userId": 9, "userName": "Trevor", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-03 04:33:23.234502
39	5	shift_approved	shift	74	{"date": "2026-01-30T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-03 04:33:31.6173
40	5	shift_approved	shift	75	{"date": "2026-01-31T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-03 04:33:33.330443
41	9	shift_submitted	shift	85	{"date": "2026-02-02T07:00:00.000Z", "userId": 9, "clockIn": "2026-02-02T09:00:00.000Z", "clockOut": "2026-02-02T14:00:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "5.00", "selfService": true}	2026-02-03 04:59:04.323327
42	9	shift_submitted	shift	86	{"date": "2026-02-02T07:00:00.000Z", "userId": 9, "clockIn": "2026-02-03T05:15:00.000Z", "clockOut": "2026-02-02T12:00:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "6.75", "selfService": true}	2026-02-03 05:05:02.807827
43	5	shift_rejected	shift	85	{"date": "2026-02-02T00:00:00.000Z", "reason": "test", "userId": 9, "userName": "Trevor", "rejectedBy": "tyler@fullscopeestimating.com"}	2026-02-03 05:06:08.830695
44	7	shift_submitted	shift	87	{"date": "2026-02-03T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-03T14:00:00.000Z", "clockOut": "2026-02-02T22:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-03 22:00:20.273451
45	9	shift_submitted	shift	91	{"date": "2026-02-03T07:00:00.000Z", "userId": 9, "clockIn": "2026-02-04T01:45:00.000Z", "clockOut": "2026-02-04T03:15:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "1.50", "selfService": true}	2026-02-04 03:10:47.422405
46	4	shift_submitted	shift	88	{"date": "2026-02-03T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-03T01:00:00.000Z", "clockOut": "2026-02-03T12:30:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "11.50", "selfService": true}	2026-02-04 16:05:15.386924
47	5	shift_approved	shift	73	{"date": "2026-02-02T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-04 18:21:39.780724
48	5	shift_approved	shift	76	{"date": "2026-02-02T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-04 18:21:46.979638
49	5	shift_approved	shift	87	{"date": "2026-02-03T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-04 18:21:55.54089
50	5	shift_approved	shift	88	{"date": "2026-02-03T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-04 18:29:27.025142
51	5	shift_approved	shift	91	{"date": "2026-02-03T00:00:00.000Z", "userId": 9, "userName": "Trevor", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-04 18:29:33.619273
52	7	shift_submitted	shift	92	{"date": "2026-02-04T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-04T09:00:00.000Z", "clockOut": "2026-02-04T09:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "10.50", "selfService": true}	2026-02-05 02:03:03.771442
53	7	shift_submitted	shift	94	{"date": "2026-02-05T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-04T16:00:00.000Z", "clockOut": "2026-02-05T02:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "10.00", "selfService": true}	2026-02-05 02:46:10.571712
54	4	shift_submitted	shift	93	{"date": "2026-02-03T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-02T16:00:00.000Z", "clockOut": "2026-02-02T21:45:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "5.75", "selfService": true}	2026-02-05 17:17:06.894591
82	5	shift_marked_paid	shift	28	{"date": "2026-01-28T00:00:00.000Z", "userId": 4, "markedBy": "tyler@fullscopeestimating.com", "userName": "Crista", "totalHours": "8.75"}	2026-02-08 03:24:21.291803
83	5	shift_marked_paid	shift	29	{"date": "2026-01-29T00:00:00.000Z", "userId": 4, "markedBy": "tyler@fullscopeestimating.com", "userName": "Crista", "totalHours": "8.75"}	2026-02-08 03:24:23.262119
84	5	shift_marked_paid	shift	74	{"date": "2026-01-30T00:00:00.000Z", "userId": 4, "markedBy": "tyler@fullscopeestimating.com", "userName": "Crista", "totalHours": "5.00"}	2026-02-08 03:24:25.514526
85	5	shift_marked_paid	shift	75	{"date": "2026-01-31T00:00:00.000Z", "userId": 4, "markedBy": "tyler@fullscopeestimating.com", "userName": "Crista", "totalHours": "1.00"}	2026-02-08 03:24:37.137391
55	5	shift_updated	shift	94	{"changes": {"id": 94, "date": "2026-02-04", "status": "pending_approval", "user_id": 7, "user_name": "LJ", "created_at": "2026-02-05T02:24:10.109Z", "timeBlocks": [{"id": 380, "tasks": "Recap • Huddle with Mitchel and Tyler • Review Supplement ", "end_time": "2026-02-04T17:00:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:24:11.014Z", "start_time": "2026-02-04T16:00:00.000Z"}, {"id": 381, "tasks": "Facilitate New Hire Interview ", "end_time": "2026-02-04T17:15:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:25:36.004Z", "start_time": "2026-02-04T17:00:00.000Z"}, {"id": 382, "tasks": "Training Agenda Creation", "end_time": "2026-02-04T18:00:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:25:57.284Z", "start_time": "2026-02-04T17:15:00.000Z"}, {"id": 384, "tasks": "BREAK", "end_time": "2026-02-04T18:15:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:26:37.492Z", "start_time": "2026-02-04T18:00:00.000Z"}, {"id": 383, "tasks": "15 min Break", "end_time": "2026-02-04T18:15:00.000Z", "is_break": true, "shift_id": 94, "created_at": "2026-02-05T02:26:06.887Z", "start_time": "2026-02-04T18:00:00.000Z"}, {"id": 385, "tasks": "Confirming COC received - Carungi2", "end_time": "2026-02-04T19:00:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:27:19.985Z", "start_time": "2026-02-04T18:15:00.000Z"}, {"id": 386, "tasks": "Confirming depreciation released - Clark", "end_time": "2026-02-04T19:00:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:28:46.828Z", "start_time": "2026-02-04T18:30:00.000Z"}, {"id": 387, "tasks": "Confirming depreciation released - Lawrence", "end_time": "2026-02-04T19:15:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:30:18.352Z", "start_time": "2026-02-04T19:00:00.000Z"}, {"id": 388, "tasks": "Confirming depreciation released - Garnica", "end_time": "2026-02-04T19:30:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:30:38.605Z", "start_time": "2026-02-04T19:15:00.000Z"}, {"id": 389, "tasks": "Confirming depreciation released - Blue", "end_time": "2026-02-04T19:45:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:30:56.665Z", "start_time": "2026-02-04T19:30:00.000Z"}, {"id": 390, "tasks": "Confirming depreciation released - Heise", "end_time": "2026-02-04T20:00:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:32:37.545Z", "start_time": "2026-02-04T19:45:00.000Z"}, {"id": 391, "tasks": "WRAP UP AND DOCUMENT UPDATES", "end_time": "2026-02-04T20:15:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:34:00.139Z", "start_time": "2026-02-04T20:00:00.000Z"}, {"id": 392, "tasks": "15 min Break", "end_time": "2026-02-04T20:30:00.000Z", "is_break": true, "shift_id": 94, "created_at": "2026-02-05T02:34:36.758Z", "start_time": "2026-02-04T20:15:00.000Z"}, {"id": 393, "tasks": "Sync- Adjuster Email and Take aways for Phone time", "end_time": "2026-02-04T21:00:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:35:39.307Z", "start_time": "2026-02-04T20:30:00.000Z"}, {"id": 394, "tasks": "Confirming depreciation released - Lawarence • Lawrence a call back since routed to VM-  Initial", "end_time": "2026-02-04T21:15:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:36:47.896Z", "start_time": "2026-02-04T21:00:00.000Z"}, {"id": 395, "tasks": "Sync with Tyler ", "end_time": "2026-02-04T22:15:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:38:42.836Z", "start_time": "2026-02-04T21:15:00.000Z"}, {"id": 396, "tasks": "15 min Break", "end_time": "2026-02-04T22:30:00.000Z", "is_break": true, "shift_id": 94, "created_at": "2026-02-05T02:42:33.478Z", "start_time": "2026-02-04T22:15:00.000Z"}, {"id": 397, "tasks": "Finalizing Training Calendar Agenda", "end_time": "2026-02-04T23:00:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:43:02.518Z", "start_time": "2026-02-04T22:30:00.000Z"}, {"id": 398, "tasks": "Gathering of Training Manuals to be consolidated  • Upload Materials to fullscope dropbox", "end_time": "2026-02-04T23:30:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:43:55.341Z", "start_time": "2026-02-04T23:00:00.000Z"}, {"id": 399, "tasks": "Training Plan Agenda with Tyler", "end_time": "2026-02-05T00:30:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:45:24.648Z", "start_time": "2026-02-04T23:30:00.000Z"}, {"id": 400, "tasks": "Transcribing Materials to PPT ", "end_time": "2026-02-05T02:00:00.000Z", "is_break": false, "shift_id": 94, "created_at": "2026-02-05T02:46:00.261Z", "start_time": "2026-02-05T00:30:00.000Z"}], "user_email": "lj@fullscopeestimating.com", "total_hours": "10.00", "clock_in_time": "2026-02-04T16:00:00.000Z", "clock_out_time": "2026-02-05T02:00:00.000Z", "clock_in_timestamp": null, "clock_out_timestamp": null}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-06 00:17:40.877777
56	5	shift_approved	shift	94	{"date": "2026-02-04T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-06 00:29:55.435878
57	5	shift_approved	shift	93	{"date": "2026-02-03T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-06 00:30:06.637106
58	7	shift_submitted	shift	95	{"date": "2026-02-06T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-06T00:45:00.000Z", "clockOut": "2026-02-06T11:45:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "9.25", "selfService": true}	2026-02-06 03:50:10.239278
59	7	shift_submitted	shift	98	{"date": "2026-02-06T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-05T16:45:00.000Z", "clockOut": "2026-02-06T03:15:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "10.50", "selfService": true}	2026-02-06 04:05:08.928678
60	4	shift_submitted	shift	96	{"date": "2026-02-05T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-04T16:00:00.000Z", "clockOut": "2026-02-05T00:30:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.50", "selfService": true}	2026-02-06 10:51:56.292764
61	7	shift_submitted	shift	99	{"date": "2026-02-06T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-05T16:00:00.000Z", "clockOut": "2026-02-05T21:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "5.00", "selfService": true}	2026-02-06 21:04:31.953475
62	5	shift_marked_paid	shift	71	{"date": "2026-02-01T00:00:00.000Z", "userId": 9, "markedBy": "tyler@fullscopeestimating.com", "userName": "Trevor", "totalHours": "1.00"}	2026-02-06 23:38:07.401698
63	5	shift_marked_paid	shift	34	{"date": "2026-01-29T00:00:00.000Z", "userId": 9, "markedBy": "tyler@fullscopeestimating.com", "userName": "Trevor", "totalHours": "1.50"}	2026-02-06 23:38:09.033628
64	5	shift_marked_paid	shift	27	{"date": "2026-01-27T00:00:00.000Z", "userId": 9, "markedBy": "tyler@fullscopeestimating.com", "userName": "Trevor", "totalHours": "1.50"}	2026-02-06 23:38:10.290639
65	5	user_created	user	10	{"name": "Mitchell", "role": "admin", "email": "mitchell@fullscopeestimating.com", "status": "active", "createdBy": "tyler@fullscopeestimating.com"}	2026-02-07 00:42:14.86475
66	9	shift_submitted	shift	106	{"date": "2026-02-06T00:00:00.000Z", "userId": 9, "clockIn": "2026-02-06T23:30:00.000Z", "clockOut": "2026-02-07T00:30:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "1.00", "selfService": true}	2026-02-07 00:55:30.471302
67	4	shift_submitted	shift	100	{"date": "2026-02-06T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-05T16:00:00.000Z", "clockOut": "2026-02-05T23:45:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "7.75", "selfService": true}	2026-02-07 20:24:19.315466
68	4	shift_submitted	shift	107	{"date": "2026-02-07", "userId": 4, "clockIn": "2026-02-06T20:00:00.000Z", "clockOut": "2026-02-06T22:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "2.00", "blocksCount": 1, "selfService": true}	2026-02-07 23:43:53.667903
69	5	shift_approved	shift	107	{"date": "2026-02-07T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 00:34:08.382782
70	5	shift_approved	shift	100	{"date": "2026-02-06T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 00:34:42.101221
71	5	shift_approved	shift	96	{"date": "2026-02-05T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 00:34:53.110731
72	5	shift_approved	shift	106	{"date": "2026-02-06T00:00:00.000Z", "userId": 9, "userName": "Trevor", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 01:48:58.878984
73	5	shift_approved	shift	99	{"date": "2026-02-06T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 02:18:08.460271
74	5	shift_approved	shift	98	{"date": "2026-02-06T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 02:18:09.70527
75	5	shift_marked_paid	shift	76	{"date": "2026-02-02T00:00:00.000Z", "userId": 4, "markedBy": "tyler@fullscopeestimating.com", "userName": "Crista", "totalHours": "10.25"}	2026-02-08 03:24:06.004301
76	5	shift_marked_paid	shift	88	{"date": "2026-02-03T00:00:00.000Z", "userId": 4, "markedBy": "tyler@fullscopeestimating.com", "userName": "Crista", "totalHours": "11.50"}	2026-02-08 03:24:11.722752
77	5	shift_marked_paid	shift	93	{"date": "2026-02-03T00:00:00.000Z", "userId": 4, "markedBy": "tyler@fullscopeestimating.com", "userName": "Crista", "totalHours": "5.75"}	2026-02-08 03:24:13.342699
78	5	shift_marked_paid	shift	96	{"date": "2026-02-05T00:00:00.000Z", "userId": 4, "markedBy": "tyler@fullscopeestimating.com", "userName": "Crista", "totalHours": "8.50"}	2026-02-08 03:24:14.585828
79	5	shift_marked_paid	shift	100	{"date": "2026-02-06T00:00:00.000Z", "userId": 4, "markedBy": "tyler@fullscopeestimating.com", "userName": "Crista", "totalHours": "7.75"}	2026-02-08 03:24:15.957295
80	5	shift_marked_paid	shift	107	{"date": "2026-02-07T00:00:00.000Z", "userId": 4, "markedBy": "tyler@fullscopeestimating.com", "userName": "Crista", "totalHours": "2.00"}	2026-02-08 03:24:17.496051
81	5	shift_marked_paid	shift	16	{"date": "2026-01-27T00:00:00.000Z", "userId": 4, "markedBy": "tyler@fullscopeestimating.com", "userName": "Crista", "totalHours": "9.67"}	2026-02-08 03:24:19.628834
148	5	shift_updated	shift	201	{"changes": {"status": "approved"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-17 20:42:16.977291
86	5	shift_marked_paid	shift	19	{"date": "2026-01-27T00:00:00.000Z", "userId": 7, "markedBy": "tyler@fullscopeestimating.com", "userName": "LJ", "totalHours": "2.00"}	2026-02-08 03:24:55.928408
87	5	shift_marked_paid	shift	99	{"date": "2026-02-06T00:00:00.000Z", "userId": 7, "markedBy": "tyler@fullscopeestimating.com", "userName": "LJ", "totalHours": "5.00"}	2026-02-08 03:24:57.374228
88	5	shift_marked_paid	shift	98	{"date": "2026-02-06T00:00:00.000Z", "userId": 7, "markedBy": "tyler@fullscopeestimating.com", "userName": "LJ", "totalHours": "10.50"}	2026-02-08 03:24:58.654263
89	5	shift_marked_paid	shift	94	{"date": "2026-02-04T00:00:00.000Z", "userId": 7, "markedBy": "tyler@fullscopeestimating.com", "userName": "LJ", "totalHours": "10.00"}	2026-02-08 03:24:59.958426
90	5	shift_marked_paid	shift	87	{"date": "2026-02-03T00:00:00.000Z", "userId": 7, "markedBy": "tyler@fullscopeestimating.com", "userName": "LJ", "totalHours": "8.00"}	2026-02-08 03:25:01.054125
91	5	shift_marked_paid	shift	73	{"date": "2026-02-02T00:00:00.000Z", "userId": 7, "markedBy": "tyler@fullscopeestimating.com", "userName": "LJ", "totalHours": "8.27"}	2026-02-08 03:25:02.176292
92	5	shift_marked_paid	shift	78	{"date": "2026-02-02T07:00:00.000Z", "userId": 9, "markedBy": "tyler@fullscopeestimating.com", "userName": "Trevor", "totalHours": "1.75"}	2026-02-08 20:27:00.504382
93	5	shift_marked_paid	shift	91	{"date": "2026-02-03T07:00:00.000Z", "userId": 9, "markedBy": "tyler@fullscopeestimating.com", "userName": "Trevor", "totalHours": "1.50"}	2026-02-08 20:27:02.45728
94	5	shift_marked_paid	shift	106	{"date": "2026-02-06T07:00:00.000Z", "userId": 9, "markedBy": "tyler@fullscopeestimating.com", "userName": "Trevor", "totalHours": "1.00"}	2026-02-08 20:27:04.019732
95	5	shift_updated	shift	131	{"changes": {"status": "approved"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-08 20:59:56.713896
96	5	shift_updated	shift	132	{"changes": {"status": "approved"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-08 20:59:59.465401
97	5	shift_updated	shift	133	{"changes": {"status": "approved"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:00:02.610234
98	5	shifts_batch_pending_approval	shift	\N	{"count": 3, "shiftIds": [131, 132, 133], "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:00:27.428695
99	5	shifts_batch_approved	shift	\N	{"count": 5, "shiftIds": [131, 132, 133, 134, 135], "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:01:17.563335
100	5	shifts_batch_pending_approval	shift	\N	{"count": 5, "shiftIds": [131, 132, 133, 134, 135], "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:01:21.461101
101	5	shifts_batch_approved	shift	\N	{"count": 5, "shiftIds": [131, 132, 133, 134, 135], "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:01:36.870346
102	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [131, 132, 133, 134, 135]}	2026-02-08 21:01:51.264751
103	5	shifts_batch_approved	shift	\N	{"count": 5, "shiftIds": [122, 123, 124, 125, 126], "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:01:55.970383
104	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [122, 123, 124, 125, 126]}	2026-02-08 21:01:59.420805
105	5	shifts_batch_approved	shift	\N	{"count": 4, "shiftIds": [127, 128, 129, 130], "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:02:01.68514
106	5	shifts_batch_paid	shift	\N	{"count": 4, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [127, 128, 129, 130]}	2026-02-08 21:02:03.560872
107	5	shift_updated	shift	131	{"changes": {"status": "pending_approval"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:02:37.710688
108	5	shifts_batch_approved	shift	\N	{"count": 6, "shiftIds": [131, 145, 146, 147, 148, 149], "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:03:38.887987
109	5	shifts_batch_pending_approval	shift	\N	{"count": 10, "shiftIds": [131, 145, 146, 132, 147, 133, 148, 134, 149, 135], "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:03:41.761677
110	5	shifts_batch_pending_approval	shift	\N	{"count": 5, "shiftIds": [122, 123, 124, 125, 126], "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:03:48.376168
111	5	shifts_batch_pending_approval	shift	\N	{"count": 4, "shiftIds": [127, 128, 129, 130], "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:03:50.879884
112	5	shift_approved	shift	163	{"date": "2026-02-13T07:00:00.000Z", "userId": 9, "userName": "Trevor", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:05:19.292795
113	5	shift_approved	shift	154	{"date": "2026-02-13T07:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-08 21:05:20.78053
114	9	shift_submitted	shift	195	{"date": "2026-02-08T00:00:00.000Z", "userId": 9, "clockIn": "2026-02-08T20:00:00.000Z", "clockOut": "2026-02-08T21:30:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "1.50", "selfService": true}	2026-02-08 21:34:02.372728
115	7	shift_submitted	shift	196	{"date": "2026-02-09T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-09T01:00:00.000Z", "clockOut": "2026-02-09T03:15:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "2.25", "selfService": true}	2026-02-09 03:10:25.527112
116	5	user_created	user	11	{"name": "Rein", "role": "user", "email": "rein@fullscopeestimating.com", "status": "active", "createdBy": "tyler@fullscopeestimating.com"}	2026-02-09 13:26:54.448167
117	5	user_created	user	12	{"name": "Girly", "role": "user", "email": "girly@fullscopeestimating.com", "status": "active", "createdBy": "tyler@fullscopeestimating.com"}	2026-02-09 13:27:41.265644
118	11	shift_submitted	shift	200	{"date": "2026-02-09T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-09T14:00:00.000Z", "clockOut": "2026-02-09T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-09 21:47:59.212956
119	7	shift_submitted	shift	197	{"date": "2026-02-09T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-09T01:30:00.000Z", "clockOut": "2026-02-09T10:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.50", "selfService": true}	2026-02-09 21:53:22.375322
149	5	shift_updated	shift	206	{"changes": {"status": "approved"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-17 20:42:21.455268
120	12	shift_submitted	shift	199	{"date": "2026-02-09T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-09T14:00:00.000Z", "clockOut": "2026-02-09T20:30:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-09 22:02:12.622049
121	7	shift_submitted	shift	202	{"date": "2026-02-10T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-10T01:00:00.000Z", "clockOut": "2026-02-10T02:15:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "1.25", "selfService": true}	2026-02-10 02:27:11.168372
122	4	shift_submitted	shift	201	{"date": "2026-02-10T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-09T18:00:00.000Z", "clockOut": "2026-02-10T02:30:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.50", "selfService": true}	2026-02-10 04:48:47.496453
123	11	shift_submitted	shift	207	{"date": "2026-02-11T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-10T14:00:00.000Z", "clockOut": "2026-02-10T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-10 22:00:20.31741
124	7	shift_submitted	shift	205	{"date": "2026-02-10T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-10T02:00:00.000Z", "clockOut": "2026-02-10T10:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-10 22:00:21.462873
125	12	shift_submitted	shift	203	{"date": "2026-02-10T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-10T14:15:00.000Z", "clockOut": "2026-02-10T22:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "7.75", "selfService": true}	2026-02-10 22:03:16.66042
126	11	shift_submitted	shift	208	{"date": "2026-02-11T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-10T14:00:00.000Z", "clockOut": "2026-02-10T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-10 22:07:21.434273
127	4	shift_submitted	shift	206	{"date": "2026-02-11T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-11T13:45:00.000Z", "clockOut": "2026-02-11T22:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.25", "selfService": true}	2026-02-11 01:06:05.170984
128	11	shift_submitted	shift	210	{"date": "2026-02-12T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-11T16:00:00.000Z", "clockOut": "2026-02-12T00:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-12 00:00:29.412308
129	12	shift_submitted	shift	211	{"date": "2026-02-12T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-11T16:00:00.000Z", "clockOut": "2026-02-12T00:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-12 00:01:00.073375
130	7	shift_submitted	shift	209	{"date": "2026-02-12T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-11T16:00:00.000Z", "clockOut": "2026-02-12T00:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-12 01:21:21.155102
131	4	shift_submitted	shift	215	{"date": "2026-02-13T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-13T01:00:00.000Z", "clockOut": "2026-02-13T09:45:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.75", "selfService": true}	2026-02-12 20:56:30.681661
132	12	shift_submitted	shift	213	{"date": "2026-02-13T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-12T16:00:00.000Z", "clockOut": "2026-02-12T23:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "7.00", "selfService": true}	2026-02-12 23:00:22.963654
133	11	shift_submitted	shift	212	{"date": "2026-02-13T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-12T16:00:00.000Z", "clockOut": "2026-02-12T23:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "7.00", "selfService": true}	2026-02-12 23:00:46.545881
134	7	shift_submitted	shift	214	{"date": "2026-02-13T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-12T17:00:00.000Z", "clockOut": "2026-02-12T23:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "6.00", "selfService": true}	2026-02-13 15:45:53.708112
135	4	shift_submitted	shift	216	{"date": "2026-02-13T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-12T16:00:00.000Z", "clockOut": "2026-02-12T23:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "7.00", "selfService": true}	2026-02-13 17:23:51.236684
136	11	shift_submitted	shift	219	{"date": "2026-02-14T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-13T16:00:00.000Z", "clockOut": "2026-02-14T00:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-13 23:05:33.932549
137	7	shift_submitted	shift	217	{"date": "2026-02-14T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-13T16:00:00.000Z", "clockOut": "2026-02-14T00:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-14 00:32:57.257323
138	12	shift_submitted	shift	218	{"date": "2026-02-14T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-13T16:00:00.000Z", "clockOut": "2026-02-13T23:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "7.00", "selfService": true}	2026-02-14 00:37:13.933743
139	11	shift_submitted	shift	221	{"date": "2026-02-17T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-16T16:00:00.000Z", "clockOut": "2026-02-17T00:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-17 00:00:19.644748
140	7	shift_submitted	shift	220	{"date": "2026-02-17T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-16T16:00:00.000Z", "clockOut": "2026-02-17T00:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-17 00:00:28.666172
141	12	shift_submitted	shift	222	{"date": "2026-02-17T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-16T16:00:00.000Z", "clockOut": "2026-02-17T00:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-17 00:04:58.517613
142	4	shift_submitted	shift	223	{"date": "2026-02-17T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-16T18:00:00.000Z", "clockOut": "2026-02-17T02:30:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.50", "selfService": true}	2026-02-17 13:39:20.580997
143	5	shift_approved	shift	201	{"date": "2026-02-10T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-17 20:41:56.857993
144	5	shift_approved	shift	206	{"date": "2026-02-11T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-17 20:42:04.165339
145	5	shift_approved	shift	215	{"date": "2026-02-13T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-17 20:42:05.607677
146	5	shift_approved	shift	216	{"date": "2026-02-13T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-17 20:42:07.199308
147	5	shifts_batch_paid	shift	\N	{"count": 4, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [201, 206, 215, 216]}	2026-02-17 20:42:11.707485
150	5	shift_updated	shift	215	{"changes": {"status": "approved"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-17 20:42:22.75084
151	5	shift_updated	shift	216	{"changes": {"status": "approved"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-17 20:43:15.709537
152	5	shifts_batch_paid	shift	\N	{"count": 4, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [201, 206, 215, 216]}	2026-02-17 20:47:31.888661
153	5	shift_approved	shift	197	{"date": "2026-02-09T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-17 23:58:52.934888
154	5	shift_approved	shift	196	{"date": "2026-02-09T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-17 23:58:55.284298
155	5	shift_approved	shift	205	{"date": "2026-02-10T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-17 23:59:22.24591
156	5	shift_approved	shift	202	{"date": "2026-02-10T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-17 23:59:35.398834
157	5	shift_approved	shift	209	{"date": "2026-02-12T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-17 23:59:37.495918
158	5	shift_approved	shift	214	{"date": "2026-02-13T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-17 23:59:42.251461
159	5	shift_approved	shift	217	{"date": "2026-02-14T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-17 23:59:58.292626
160	5	shifts_batch_paid	shift	\N	{"count": 7, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [197, 196, 205, 202, 209, 214, 217]}	2026-02-18 00:04:26.644052
161	7	shift_submitted	shift	224	{"date": "2026-02-18T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-17T16:00:00.000Z", "clockOut": "2026-02-18T00:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-18 00:05:44.898142
162	5	shift_approved	shift	200	{"date": "2026-02-09T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-18 00:09:08.349678
163	5	shift_approved	shift	208	{"date": "2026-02-11T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-18 00:09:09.596173
164	5	shift_approved	shift	210	{"date": "2026-02-12T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-18 00:09:11.351228
165	11	shift_submitted	shift	225	{"date": "2026-02-18T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-17T16:00:00.000Z", "clockOut": "2026-02-18T00:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-18 00:10:01.208266
166	5	shift_approved	shift	212	{"date": "2026-02-13T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-18 00:10:27.131917
167	5	shift_approved	shift	219	{"date": "2026-02-14T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-18 00:10:43.181343
168	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [200, 208, 210, 212, 219]}	2026-02-18 00:10:45.973887
169	5	shift_approved	shift	199	{"date": "2026-02-09T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-18 01:17:15.834043
170	5	shift_approved	shift	203	{"date": "2026-02-10T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-18 01:17:16.784521
171	5	shift_approved	shift	211	{"date": "2026-02-12T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-18 01:17:18.114838
172	12	shift_submitted	shift	226	{"date": "2026-02-18T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-18T00:00:00.000Z", "clockOut": "2026-02-18T08:45:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-18 01:30:40.014732
173	4	shift_submitted	shift	227	{"date": "2026-02-18T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-18T00:00:00.000Z", "clockOut": "2026-02-18T15:30:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "10.25", "selfService": true}	2026-02-18 17:12:53.824656
174	11	shift_submitted	shift	229	{"date": "2026-02-19T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-18T16:00:00.000Z", "clockOut": "2026-02-19T00:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-19 00:00:49.350898
175	7	shift_submitted	shift	228	{"date": "2026-02-19T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-18T16:00:00.000Z", "clockOut": "2026-02-19T00:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-19 00:49:49.395825
176	5	shift_updated	shift	195	{"changes": {"date": "2026-02-08", "timeBlocks": [{"tasks": "Improved time clock app, payroll section and Manage Invoices", "endTime": "14:30", "isBreak": false, "isUnpaid": false, "startTime": "13:00"}], "totalHours": "2.5", "clockInTime": "2026-02-08T20:00:00.000Z", "clockOutTime": "2026-02-08T21:30:00.000Z"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-19 01:24:02.842088
177	5	shift_updated	shift	195	{"changes": {"date": "2026-02-08", "timeBlocks": [{"tasks": "Improved time clock app, payroll section and Manage Invoices", "endTime": "14:30", "isBreak": false, "isUnpaid": false, "startTime": "13:00"}], "totalHours": "1.50", "clockInTime": "2026-02-08T20:00:00.000Z", "clockOutTime": "2026-02-08T21:30:00.000Z"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-19 01:24:10.074399
178	9	shift_submitted	shift	233	{"date": "2026-02-18T00:00:00.000Z", "userId": 9, "clockIn": "2026-02-19T02:00:00.000Z", "clockOut": "2026-02-19T02:45:00.000Z", "createdBy": "trevor@fullscopeestimating.com", "totalHours": "0.75", "selfService": true}	2026-02-19 02:49:45.879378
179	12	shift_submitted	shift	230	{"date": "2026-02-19T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-19T00:00:00.000Z", "clockOut": "2026-02-19T07:45:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-19 09:31:36.956235
180	4	shift_submitted	shift	231	{"date": "2026-02-19T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-18T16:00:00.000Z", "clockOut": "2026-02-19T00:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-19 13:58:32.75969
181	11	shift_submitted	shift	235	{"date": "2026-02-20T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-19T16:00:00.000Z", "clockOut": "2026-02-20T00:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-20 00:00:18.491626
182	12	shift_submitted	shift	237	{"date": "2026-02-20T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-19T16:00:00.000Z", "clockOut": "2026-02-20T00:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-20 00:00:59.291921
183	4	shift_submitted	shift	236	{"date": "2026-02-20T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-19T16:00:00.000Z", "clockOut": "2026-02-20T00:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-20 00:01:31.325713
184	7	shift_submitted	shift	234	{"date": "2026-02-20T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-19T16:00:00.000Z", "clockOut": "2026-02-20T00:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-20 00:02:20.263229
185	11	shift_submitted	shift	239	{"date": "2026-02-21T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-20T16:00:00.000Z", "clockOut": "2026-02-21T00:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-20 21:59:20.327829
186	7	shift_submitted	shift	240	{"date": "2026-02-21T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-20T16:00:00.000Z", "clockOut": "2026-02-20T22:45:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-20 21:59:31.030787
187	5	shift_updated	shift	213	{"changes": {"date": "2026-02-13", "timeBlocks": [{"tasks": "Review supplement with Mitchele ", "endTime": "11:00", "isBreak": false, "isUnpaid": false, "startTime": "09:00"}, {"tasks": "15 min Break", "endTime": "11:15", "isBreak": true, "isUnpaid": false, "startTime": "11:00"}, {"tasks": "Review supplemet with Mitchele ", "endTime": "11:45", "isBreak": false, "isUnpaid": false, "startTime": "11:00"}, {"tasks": "15 min Break", "endTime": "12:00", "isBreak": true, "isUnpaid": false, "startTime": "11:45"}, {"tasks": "Aqulinks email review ", "endTime": "14:00", "isBreak": false, "isUnpaid": false, "startTime": "12:00"}, {"tasks": "15 min Break", "endTime": "14:15", "isBreak": true, "isUnpaid": false, "startTime": "14:00"}, {"tasks": "Aqulinks email review ", "endTime": "16:00", "isBreak": false, "isUnpaid": false, "startTime": "14:15"}], "totalHours": "8", "clockInTime": "2026-02-13T16:00:00.000Z", "clockOutTime": "2026-02-13T23:00:00.000Z"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:00:55.71946
188	5	shift_approved	shift	213	{"date": "2026-02-13T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:00:59.223166
189	5	shift_updated	shift	218	{"changes": {"date": "2026-02-14", "timeBlocks": [{"tasks": "Acculynx email review with Tyler ", "endTime": "11:00", "isBreak": false, "isUnpaid": false, "startTime": "09:00"}, {"tasks": "15 min Break", "endTime": "11:15", "isBreak": true, "isUnpaid": false, "startTime": "11:00"}, {"tasks": "15 min Break", "endTime": "11:30", "isBreak": true, "isUnpaid": false, "startTime": "11:15"}, {"tasks": "Training ", "endTime": "13:30", "isBreak": false, "isUnpaid": false, "startTime": "11:30"}, {"tasks": "15 min Break", "endTime": "11:45", "isBreak": true, "isUnpaid": false, "startTime": "11:30"}, {"tasks": "15 min Break", "endTime": "13:45", "isBreak": true, "isUnpaid": false, "startTime": "13:30"}, {"tasks": "Call shadow with LJ ", "endTime": "15:00", "isBreak": false, "isUnpaid": false, "startTime": "13:45"}, {"tasks": "Call Shadow with LJ", "endTime": "16:00", "isBreak": false, "isUnpaid": false, "startTime": "15:00"}], "totalHours": "8", "clockInTime": "2026-02-14T16:00:00.000Z", "clockOutTime": "2026-02-14T23:00:00.000Z"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:01:11.639473
190	5	shift_approved	shift	218	{"date": "2026-02-14T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:01:13.401132
191	4	shift_submitted	shift	241	{"date": "2026-02-21T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-20T16:00:00.000Z", "clockOut": "2026-02-21T00:45:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.75", "selfService": true}	2026-02-20 22:01:19.160247
192	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [199, 203, 211, 213, 218]}	2026-02-20 22:01:26.460259
193	12	shift_submitted	shift	238	{"date": "2026-02-21T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-20T16:00:00.000Z", "clockOut": "2026-02-21T00:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-20 22:01:50.267423
194	5	shift_approved	shift	222	{"date": "2026-02-17T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:06:33.559417
195	5	shift_approved	shift	226	{"date": "2026-02-18T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:06:34.608073
196	5	shift_approved	shift	230	{"date": "2026-02-19T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:06:35.77326
197	5	shift_approved	shift	237	{"date": "2026-02-20T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:06:40.066803
198	5	shift_approved	shift	238	{"date": "2026-02-21T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:06:41.37255
199	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [222, 226, 230, 237, 238]}	2026-02-20 22:06:43.965722
200	5	shift_approved	shift	221	{"date": "2026-02-17T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:08:24.514548
201	5	shift_approved	shift	225	{"date": "2026-02-18T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:08:25.947433
202	5	shift_approved	shift	229	{"date": "2026-02-19T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:08:27.125668
203	5	shift_approved	shift	235	{"date": "2026-02-20T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:08:28.412297
204	5	shift_approved	shift	239	{"date": "2026-02-21T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-20 22:08:29.761599
205	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [221, 225, 229, 235, 239]}	2026-02-20 22:08:34.412596
229	7	shift_submitted	shift	256	{"date": "2026-02-26T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-26T02:00:00.000Z", "clockOut": "2026-02-26T10:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-27 15:07:30.510504
206	5	shift_updated	shift	241	{"changes": {"date": "2026-02-21", "timeBlocks": [{"tasks": "Training with the team", "endTime": "11:00", "isBreak": false, "isUnpaid": false, "startTime": "09:00"}, {"tasks": "15 min Break", "endTime": "11:15", "isBreak": true, "isUnpaid": false, "startTime": "11:00"}, {"tasks": "Training with the team", "endTime": "13:15", "isBreak": false, "isUnpaid": false, "startTime": "11:15"}, {"tasks": "15 min Break", "endTime": "13:30", "isBreak": true, "isUnpaid": false, "startTime": "13:15"}, {"tasks": "Training with the team", "endTime": "15:30", "isBreak": false, "isUnpaid": false, "startTime": "13:30"}, {"tasks": "15 min Break", "endTime": "15:45", "isBreak": true, "isUnpaid": false, "startTime": "15:30"}, {"tasks": "Training with the team", "endTime": "17:45", "isBreak": false, "isUnpaid": false, "startTime": "15:45"}], "totalHours": "8", "clockInTime": "2026-02-21T16:00:00.000Z", "clockOutTime": "2026-02-22T00:45:00.000Z"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-23 16:16:52.763515
207	5	shift_approved	shift	241	{"date": "2026-02-21T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-23 16:17:04.273285
208	5	shift_approved	shift	236	{"date": "2026-02-20T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-23 16:17:08.249687
209	5	shift_approved	shift	231	{"date": "2026-02-19T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-23 16:17:11.311644
210	5	shift_approved	shift	227	{"date": "2026-02-18T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-23 16:18:56.01139
211	5	shift_approved	shift	223	{"date": "2026-02-17T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-02-23 16:18:59.966617
212	7	shift_submitted	shift	242	{"date": "2026-02-23T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-23T02:00:00.000Z", "clockOut": "2026-02-23T10:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-23 21:54:46.683872
213	12	shift_submitted	shift	244	{"date": "2026-02-23T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-23T02:00:00.000Z", "clockOut": "2026-02-23T10:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-23 21:55:44.781507
214	4	shift_submitted	shift	245	{"date": "2026-02-24T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-24T02:00:00.000Z", "clockOut": "2026-02-24T10:45:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.75", "selfService": true}	2026-02-23 22:46:24.541307
215	5	shift_updated	shift	241	{"changes": {"date": "2026-02-20", "timeBlocks": [{"tasks": "Training with the team", "endTime": "04:00", "isBreak": false, "isUnpaid": false, "startTime": "02:00"}, {"tasks": "15 min Break", "endTime": "04:15", "isBreak": true, "isUnpaid": false, "startTime": "04:00"}, {"tasks": "Training with the team", "endTime": "06:15", "isBreak": false, "isUnpaid": false, "startTime": "04:15"}, {"tasks": "15 min Break", "endTime": "06:30", "isBreak": true, "isUnpaid": false, "startTime": "06:15"}, {"tasks": "Training with the team", "endTime": "08:30", "isBreak": false, "isUnpaid": false, "startTime": "06:30"}, {"tasks": "15 min Break", "endTime": "08:45", "isBreak": true, "isUnpaid": false, "startTime": "08:30"}, {"tasks": "Training with the team", "endTime": "10:45", "isBreak": false, "isUnpaid": false, "startTime": "08:45"}], "totalHours": "8.00", "clockInTime": "2026-02-20T16:00:00.000Z", "clockOutTime": "2026-02-21T00:45:00.000Z"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-02-24 04:00:52.210259
216	11	shift_submitted	shift	243	{"date": "2026-02-23T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-23T10:00:00.000Z", "clockOut": "2026-02-23T18:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-24 15:46:08.24899
217	11	shift_submitted	shift	246	{"date": "2026-02-24T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-24T14:00:00.000Z", "clockOut": "2026-02-24T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-24 15:50:59.543878
218	7	shift_submitted	shift	249	{"date": "2026-02-25T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-24T16:00:00.000Z", "clockOut": "2026-02-25T00:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-24 22:47:39.962677
219	12	shift_submitted	shift	247	{"date": "2026-02-25T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-24T16:00:00.000Z", "clockOut": "2026-02-25T00:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-24 22:49:45.240685
220	11	shift_submitted	shift	248	{"date": "2026-02-25T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-24T16:00:00.000Z", "clockOut": "2026-02-25T00:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-25 00:01:11.781117
221	4	shift_submitted	shift	250	{"date": "2026-02-25T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-24T16:00:00.000Z", "clockOut": "2026-02-25T00:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-25 18:23:23.91196
222	7	shift_submitted	shift	253	{"date": "2026-02-26T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-26T14:00:00.000Z", "clockOut": "2026-02-26T22:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-25 22:04:50.951751
223	12	shift_submitted	shift	252	{"date": "2026-02-26T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-26T02:00:00.000Z", "clockOut": "2026-02-26T10:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-25 22:05:10.64451
224	11	shift_submitted	shift	251	{"date": "2026-02-25T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-25T14:00:00.000Z", "clockOut": "2026-02-25T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-25 22:05:47.816082
225	4	shift_submitted	shift	254	{"date": "2026-02-26T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-26T02:00:00.000Z", "clockOut": "2026-02-26T10:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-25 22:13:50.061362
226	12	shift_submitted	shift	257	{"date": "2026-02-27T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-27T02:00:00.000Z", "clockOut": "2026-02-27T10:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-26 21:29:10.606828
227	11	shift_submitted	shift	255	{"date": "2026-02-26T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-26T14:00:00.000Z", "clockOut": "2026-02-26T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-26 22:01:11.360933
228	4	shift_submitted	shift	258	{"date": "2026-02-27T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-27T02:00:00.000Z", "clockOut": "2026-02-27T10:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-27 10:42:09.738744
230	12	shift_submitted	shift	261	{"date": "2026-02-28T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-28T02:00:00.000Z", "clockOut": "2026-02-28T10:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-27 21:25:47.690435
231	11	shift_submitted	shift	260	{"date": "2026-02-27T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-27T14:00:00.000Z", "clockOut": "2026-02-27T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-27 22:11:53.673462
232	7	shift_submitted	shift	259	{"date": "2026-02-27T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-27T02:00:00.000Z", "clockOut": "2026-02-27T10:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-28 00:24:06.04539
233	4	shift_submitted	shift	262	{"date": "2026-02-28T00:00:00.000Z", "userId": 4, "clockIn": "2026-02-28T02:00:00.000Z", "clockOut": "2026-02-28T10:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-02-28 14:00:06.207523
234	12	shift_submitted	shift	264	{"date": "2026-03-01T00:00:00.000Z", "userId": 12, "clockIn": "2026-02-28T23:15:00.000Z", "clockOut": "2026-03-01T01:45:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "2.50", "selfService": true}	2026-03-01 01:44:58.878839
235	11	shift_submitted	shift	263	{"date": "2026-03-01T00:00:00.000Z", "userId": 11, "clockIn": "2026-02-28T23:15:00.000Z", "clockOut": "2026-03-01T01:45:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "2.50", "selfService": true}	2026-03-01 01:45:17.161081
236	7	shift_submitted	shift	265	{"date": "2026-03-01T00:00:00.000Z", "userId": 7, "clockIn": "2026-02-28T23:15:00.000Z", "clockOut": "2026-03-01T01:45:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "2.50", "selfService": true}	2026-03-01 01:45:58.858569
237	11	shift_submitted	shift	266	{"date": "2026-03-03T00:00:00.000Z", "userId": 11, "clockIn": "2026-03-03T14:00:00.000Z", "clockOut": "2026-03-03T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-02 22:02:12.383298
238	12	shift_submitted	shift	267	{"date": "2026-03-03T00:00:00.000Z", "userId": 12, "clockIn": "2026-03-03T14:00:00.000Z", "clockOut": "2026-03-03T22:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-02 22:15:31.960755
239	7	shift_submitted	shift	269	{"date": "2026-03-03T00:00:00.000Z", "userId": 7, "clockIn": "2026-03-03T14:00:00.000Z", "clockOut": "2026-03-03T22:15:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.25", "selfService": true}	2026-03-02 22:16:24.33698
240	5	shift_submitted	shift	268	{"date": "2026-03-02T00:00:00.000Z", "userId": 5, "clockIn": "2026-03-02T14:45:00.000Z", "clockOut": "2026-03-03T01:30:00.000Z", "createdBy": "tyler@fullscopeestimating.com", "totalHours": "5.75", "selfService": true}	2026-03-03 16:07:57.076218
241	5	shift_approved	shift	268	{"date": "2026-03-02T00:00:00.000Z", "userId": 5, "userName": "Tyler", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:08:16.962138
242	4	shift_submitted	shift	270	{"date": "2026-03-03T00:00:00.000Z", "userId": 4, "clockIn": "2026-03-03T02:00:00.000Z", "clockOut": "2026-03-03T10:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-03 16:18:41.18488
243	5	shift_approved	shift	245	{"date": "2026-02-24T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:36:11.297974
244	5	shift_approved	shift	250	{"date": "2026-02-25T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:36:13.050405
245	5	shift_approved	shift	254	{"date": "2026-02-26T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:36:14.249027
246	5	shift_approved	shift	258	{"date": "2026-02-27T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:36:15.60989
247	5	shift_approved	shift	262	{"date": "2026-02-28T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:36:20.195328
248	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [223, 227, 231, 241, 236]}	2026-03-03 16:36:25.569644
249	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [245, 250, 254, 258, 262]}	2026-03-03 16:36:28.93928
250	5	shift_approved	shift	244	{"date": "2026-02-23T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:42:54.546616
251	5	shift_approved	shift	247	{"date": "2026-02-25T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:42:55.693462
252	5	shift_approved	shift	252	{"date": "2026-02-26T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:42:56.693331
253	5	shift_approved	shift	257	{"date": "2026-02-27T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:42:57.953477
254	5	shift_approved	shift	261	{"date": "2026-02-28T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:43:01.871185
255	5	shift_approved	shift	264	{"date": "2026-03-01T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:43:03.196281
256	5	shifts_batch_paid	shift	\N	{"count": 6, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [244, 247, 252, 257, 261, 264]}	2026-03-03 16:43:05.494342
257	5	shift_approved	shift	220	{"date": "2026-02-17T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:43:59.749317
258	5	shift_approved	shift	224	{"date": "2026-02-18T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:44:02.307641
259	5	shift_approved	shift	228	{"date": "2026-02-19T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:44:05.153412
260	5	shift_approved	shift	234	{"date": "2026-02-20T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:44:07.487348
261	5	shift_approved	shift	240	{"date": "2026-02-21T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:44:10.767431
262	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [220, 224, 228, 234, 240]}	2026-03-03 16:44:14.762183
263	5	shift_approved	shift	242	{"date": "2026-02-23T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:51:44.00276
264	5	shift_approved	shift	249	{"date": "2026-02-25T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:51:45.620716
265	5	shift_approved	shift	253	{"date": "2026-02-26T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:51:46.87985
266	5	shift_approved	shift	256	{"date": "2026-02-26T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:51:48.053804
267	5	shift_approved	shift	259	{"date": "2026-02-27T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:51:49.177903
268	5	shift_approved	shift	265	{"date": "2026-03-01T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 16:51:50.583064
269	5	shifts_batch_paid	shift	\N	{"count": 6, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [242, 249, 253, 256, 259, 265]}	2026-03-03 16:52:05.49874
270	5	shift_approved	shift	263	{"date": "2026-03-01T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 17:55:04.512142
271	5	shift_approved	shift	260	{"date": "2026-02-27T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 17:55:06.607401
272	5	shift_approved	shift	255	{"date": "2026-02-26T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 17:55:08.186324
273	5	shift_approved	shift	248	{"date": "2026-02-25T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 17:55:09.402777
274	5	shift_approved	shift	251	{"date": "2026-02-25T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 17:55:10.80179
275	5	shift_approved	shift	246	{"date": "2026-02-24T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 17:55:11.985717
276	5	shifts_batch_paid	shift	\N	{"count": 6, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [246, 251, 248, 255, 260, 263]}	2026-03-03 17:55:14.821949
277	5	shift_approved	shift	233	{"date": "2026-02-18T00:00:00.000Z", "userId": 9, "userName": "Trevor", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 17:55:23.489464
278	5	shift_approved	shift	195	{"date": "2026-02-08T00:00:00.000Z", "userId": 9, "userName": "Trevor", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-03 17:55:24.913767
279	5	shift_updated	shift	267	{"changes": {"date": "2026-03-03", "timeBlocks": [{"tasks": "Communications review ", "endTime": "09:00", "isBreak": false, "isUnpaid": false, "startTime": "07:00"}, {"tasks": "15 min Break", "endTime": "09:15", "isBreak": true, "isUnpaid": false, "startTime": "09:00"}, {"tasks": "Email review ", "endTime": "09:15", "isBreak": false, "isUnpaid": false, "startTime": "09:00"}, {"tasks": "15 min Break", "endTime": "09:30", "isBreak": true, "isUnpaid": false, "startTime": "09:15"}, {"tasks": "do out bound call for 140-EG-2026-0046-Kinsman, 129-EG-2026-0026-Delaney, 120-EG-2025-201-Octavio", "endTime": "11:30", "isBreak": false, "isUnpaid": false, "startTime": "09:30"}, {"tasks": "Recreate Bid ", "endTime": "12:15", "isBreak": false, "isUnpaid": false, "startTime": "11:30"}, {"tasks": "15 min Break", "endTime": "12:30", "isBreak": true, "isUnpaid": false, "startTime": "12:15"}, {"tasks": "Review emails ", "endTime": "14:30", "isBreak": false, "isUnpaid": false, "startTime": "12:30"}, {"tasks": "Review and explore AI ", "endTime": "15:00", "isBreak": false, "isUnpaid": false, "startTime": "14:30"}], "totalHours": "8.00", "clockInTime": "2026-03-03T14:00:00.000Z", "clockOutTime": "2026-03-03T22:15:00.000Z"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-03-03 17:55:52.499296
280	7	shift_submitted	shift	275	{"date": "2026-03-04T00:00:00.000Z", "userId": 7, "clockIn": "2026-03-04T02:00:00.000Z", "clockOut": "2026-03-04T10:15:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.25", "selfService": true}	2026-03-03 22:16:22.541964
281	4	shift_submitted	shift	274	{"date": "2026-03-04T00:00:00.000Z", "userId": 4, "clockIn": "2026-03-04T02:00:00.000Z", "clockOut": "2026-03-04T10:15:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.25", "selfService": true}	2026-03-03 22:16:31.391685
282	11	shift_submitted	shift	273	{"date": "2026-03-04T00:00:00.000Z", "userId": 11, "clockIn": "2026-03-04T14:00:00.000Z", "clockOut": "2026-03-04T22:15:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.25", "selfService": true}	2026-03-03 22:16:35.77823
283	12	shift_submitted	shift	271	{"date": "2026-03-04T00:00:00.000Z", "userId": 12, "clockIn": "2026-03-04T22:00:00.000Z", "clockOut": "2026-03-04T05:45:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-04 13:45:22.045798
284	11	shift_submitted	shift	276	{"date": "2026-03-04T00:00:00.000Z", "userId": 11, "clockIn": "2026-03-04T14:00:00.000Z", "clockOut": "2026-03-04T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-04 22:30:09.959719
285	7	shift_submitted	shift	278	{"date": "2026-03-05T00:00:00.000Z", "userId": 7, "clockIn": "2026-03-05T02:00:00.000Z", "clockOut": "2026-03-05T10:30:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.50", "selfService": true}	2026-03-04 22:30:17.644863
286	12	shift_submitted	shift	277	{"date": "2026-03-05T00:00:00.000Z", "userId": 12, "clockIn": "2026-03-05T14:00:00.000Z", "clockOut": "2026-03-05T22:30:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.50", "selfService": true}	2026-03-04 22:31:34.255047
287	4	shift_submitted	shift	279	{"date": "2026-03-05T00:00:00.000Z", "userId": 4, "clockIn": "2026-03-05T03:00:00.000Z", "clockOut": "2026-03-05T10:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "7.00", "selfService": true}	2026-03-05 07:58:47.112788
288	12	shift_submitted	shift	282	{"date": "2026-03-06T00:00:00.000Z", "userId": 12, "clockIn": "2026-03-06T14:00:00.000Z", "clockOut": "2026-03-06T22:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-05 22:12:45.837196
289	4	shift_submitted	shift	283	{"date": "2026-03-06T00:00:00.000Z", "userId": 4, "clockIn": "2026-03-06T02:00:00.000Z", "clockOut": "2026-03-06T10:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-05 22:13:35.925723
290	11	shift_submitted	shift	281	{"date": "2026-03-05T00:00:00.000Z", "userId": 11, "clockIn": "2026-03-05T14:00:00.000Z", "clockOut": "2026-03-05T22:15:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.25", "selfService": true}	2026-03-05 22:19:03.350483
291	7	shift_submitted	shift	280	{"date": "2026-03-05T00:00:00.000Z", "userId": 7, "clockIn": "2026-03-05T14:00:00.000Z", "clockOut": "2026-03-05T22:45:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.75", "selfService": true}	2026-03-05 22:39:34.9582
292	12	shift_submitted	shift	284	{"date": "2026-03-06T00:00:00.000Z", "userId": 12, "clockIn": "2026-03-06T14:00:00.000Z", "clockOut": "2026-03-06T22:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-06 22:08:01.30374
293	11	shift_submitted	shift	285	{"date": "2026-03-06T00:00:00.000Z", "userId": 11, "clockIn": "2026-03-06T14:00:00.000Z", "clockOut": "2026-03-07T00:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "10.00", "selfService": true}	2026-03-07 00:06:10.242649
294	7	shift_submitted	shift	286	{"date": "2026-03-07T00:00:00.000Z", "userId": 7, "clockIn": "2026-03-07T14:00:00.000Z", "clockOut": "2026-03-07T22:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-09 02:44:43.770447
295	7	shift_submitted	shift	287	{"date": "2026-03-09T00:00:00.000Z", "userId": 7, "clockIn": "2026-03-09T02:15:00.000Z", "clockOut": "2026-03-09T03:30:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "1.25", "selfService": true}	2026-03-09 03:37:05.609886
296	5	shift_approved	shift	269	{"date": "2026-03-03T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:41:49.348542
297	5	shift_approved	shift	275	{"date": "2026-03-04T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:41:51.954188
298	5	shift_approved	shift	280	{"date": "2026-03-05T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:41:57.751788
299	5	shift_approved	shift	278	{"date": "2026-03-05T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:42:07.864872
300	5	shift_approved	shift	286	{"date": "2026-03-07T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:42:10.078173
301	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [269, 275, 280, 278, 286]}	2026-03-09 03:44:30.527207
302	5	shift_updated	shift	277	{"changes": {"date": "2026-03-05", "timeBlocks": [{"tasks": "Confirming COC received - Hanse • Confirming COC received - Wann", "endTime": "09:00", "isBreak": false, "isUnpaid": false, "startTime": "07:00"}, {"tasks": "15 min Break", "endTime": "09:15", "isBreak": true, "isUnpaid": false, "startTime": "09:00"}, {"tasks": "Calleld EG-2026-0008-Taylor • Called 136-EG-2025-202-Tran", "endTime": "11:15", "isBreak": false, "isUnpaid": false, "startTime": "09:15"}, {"tasks": "15 min Break", "endTime": "11:30", "isBreak": true, "isUnpaid": false, "startTime": "11:15"}, {"tasks": "Called Lutrick  • Edit refelt and modified estimate  • Edit replacement estimate ", "endTime": "13:00", "isBreak": false, "isUnpaid": false, "startTime": "11:30"}, {"tasks": "Huddle for today task with LJ and Tyler ", "endTime": "15:00", "isBreak": false, "isUnpaid": false, "startTime": "13:00"}, {"tasks": "Huddle for today task with LJ and Tyler ", "endTime": "15:30", "isBreak": false, "isUnpaid": false, "startTime": "15:00"}], "totalHours": "8.50", "clockInTime": "2026-03-05T14:00:00.000Z", "clockOutTime": "2026-03-05T22:00:00.000Z"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:47:11.719825
303	5	shift_approved	shift	277	{"date": "2026-03-05T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:47:36.30245
304	5	shift_approved	shift	282	{"date": "2026-03-06T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:48:15.235682
305	5	shift_approved	shift	284	{"date": "2026-03-06T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:48:16.740438
306	5	shift_approved	shift	271	{"date": "2026-03-04T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:48:18.002728
307	5	shift_approved	shift	267	{"date": "2026-03-03T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:48:19.553424
308	5	shift_reverted	shift	277	{"date": "2026-03-05T00:00:00.000Z", "userId": 12, "userName": "Girly", "revertedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:48:27.572784
309	5	shift_updated	shift	277	{"changes": {"date": "2026-03-05", "timeBlocks": [{"tasks": "Huddle for today task with LJ and Tyler ", "endTime": "08:30", "isBreak": false, "isUnpaid": false, "startTime": "08:00"}, {"tasks": "Confirming COC received - Hanse • Confirming COC received - Wann", "endTime": "02:00", "isBreak": false, "isUnpaid": false, "startTime": "00:00"}, {"tasks": "15 min Break", "endTime": "02:15", "isBreak": true, "isUnpaid": false, "startTime": "02:00"}, {"tasks": "Calleld EG-2026-0008-Taylor • Called 136-EG-2025-202-Tran", "endTime": "04:15", "isBreak": false, "isUnpaid": false, "startTime": "02:15"}, {"tasks": "15 min Break", "endTime": "04:30", "isBreak": true, "isUnpaid": false, "startTime": "04:15"}, {"tasks": "Called Lutrick  • Edit refelt and modified estimate  • Edit replacement estimate ", "endTime": "06:00", "isBreak": false, "isUnpaid": false, "startTime": "04:30"}, {"tasks": "Huddle for today task with LJ and Tyler ", "endTime": "08:00", "isBreak": false, "isUnpaid": false, "startTime": "06:00"}], "totalHours": "8.00", "clockInTime": "2026-03-05T14:00:00.000Z", "clockOutTime": "2026-03-05T22:00:00.000Z"}, "updatedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:48:42.445117
310	5	shift_approved	shift	277	{"date": "2026-03-05T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:48:44.528913
311	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [267, 271, 277, 284, 282]}	2026-03-09 03:50:45.490421
312	5	shift_approved	shift	266	{"date": "2026-03-03T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:51:30.059025
313	5	shift_approved	shift	276	{"date": "2026-03-04T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:51:31.529753
314	5	shift_approved	shift	273	{"date": "2026-03-04T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:51:33.536608
315	5	shift_approved	shift	281	{"date": "2026-03-05T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:51:34.833853
316	5	shift_approved	shift	285	{"date": "2026-03-06T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-09 03:51:36.163818
317	12	shift_submitted	shift	290	{"date": "2026-03-09T00:00:00.000Z", "userId": 12, "clockIn": "2026-03-09T14:00:00.000Z", "clockOut": "2026-03-09T22:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-09 22:01:33.927739
318	7	shift_submitted	shift	289	{"date": "2026-03-09T00:00:00.000Z", "userId": 7, "clockIn": "2026-03-09T14:00:00.000Z", "clockOut": "2026-03-09T22:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-09 22:01:51.791002
319	11	shift_submitted	shift	288	{"date": "2026-03-09T00:00:00.000Z", "userId": 11, "clockIn": "2026-03-09T14:00:00.000Z", "clockOut": "2026-03-09T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-09 22:02:13.485775
320	4	shift_submitted	shift	293	{"date": "2026-03-10T00:00:00.000Z", "userId": 4, "clockIn": "2026-03-10T02:00:00.000Z", "clockOut": "2026-03-10T10:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-10 15:09:51.508002
321	12	shift_submitted	shift	294	{"date": "2026-03-11T00:00:00.000Z", "userId": 12, "clockIn": "2026-03-11T14:00:00.000Z", "clockOut": "2026-03-11T22:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-10 21:44:18.682615
322	11	shift_submitted	shift	292	{"date": "2026-03-10T00:00:00.000Z", "userId": 11, "clockIn": "2026-03-10T14:00:00.000Z", "clockOut": "2026-03-10T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-10 21:50:40.112171
323	7	shift_submitted	shift	291	{"date": "2026-03-10T00:00:00.000Z", "userId": 7, "clockIn": "2026-03-10T14:00:00.000Z", "clockOut": "2026-03-10T22:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-10 22:03:59.818985
324	12	shift_submitted	shift	297	{"date": "2026-03-12T00:00:00.000Z", "userId": 12, "clockIn": "2026-03-12T02:00:00.000Z", "clockOut": "2026-03-12T10:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-11 21:43:13.915306
325	7	shift_submitted	shift	295	{"date": "2026-03-11T00:00:00.000Z", "userId": 7, "clockIn": "2026-03-11T14:00:00.000Z", "clockOut": "2026-03-11T22:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-11 21:43:41.821543
326	11	shift_submitted	shift	296	{"date": "2026-03-11T00:00:00.000Z", "userId": 11, "clockIn": "2026-03-11T14:00:00.000Z", "clockOut": "2026-03-11T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-11 21:50:12.629913
327	12	shift_submitted	shift	299	{"date": "2026-03-13T00:00:00.000Z", "userId": 12, "clockIn": "2026-03-13T14:00:00.000Z", "clockOut": "2026-03-13T22:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-12 21:56:40.148173
328	7	shift_submitted	shift	301	{"date": "2026-03-13T00:00:00.000Z", "userId": 7, "clockIn": "2026-03-13T14:00:00.000Z", "clockOut": "2026-03-13T22:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-12 21:57:05.734885
329	11	shift_submitted	shift	298	{"date": "2026-03-12T00:00:00.000Z", "userId": 11, "clockIn": "2026-03-12T15:00:00.000Z", "clockOut": "2026-03-12T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "7.00", "selfService": true}	2026-03-12 21:57:23.767059
330	5	shift_approved	shift	270	{"date": "2026-03-03T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-12 22:02:23.571794
331	5	shift_approved	shift	274	{"date": "2026-03-04T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-12 22:02:25.401173
332	5	shift_approved	shift	279	{"date": "2026-03-05T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-12 22:02:26.724953
333	5	shift_approved	shift	283	{"date": "2026-03-06T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-12 22:02:28.051883
334	5	shifts_batch_paid	shift	\N	{"count": 4, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [270, 274, 279, 283]}	2026-03-12 22:37:10.311803
335	4	shift_submitted	shift	300	{"date": "2026-03-13T00:00:00.000Z", "userId": 4, "clockIn": "2026-03-13T02:00:00.000Z", "clockOut": "2026-03-13T10:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-13 14:07:26.911144
336	7	shift_submitted	shift	302	{"date": "2026-03-13T00:00:00.000Z", "userId": 7, "clockIn": "2026-03-13T14:00:00.000Z", "clockOut": "2026-03-13T22:00:00.000Z", "createdBy": "lj@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-13 21:45:02.519657
337	11	shift_submitted	shift	303	{"date": "2026-03-13T00:00:00.000Z", "userId": 11, "clockIn": "2026-03-13T14:00:00.000Z", "clockOut": "2026-03-13T22:00:00.000Z", "createdBy": "rein@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-13 21:45:10.099167
338	12	shift_submitted	shift	305	{"date": "2026-03-13T00:00:00.000Z", "userId": 12, "clockIn": "2026-03-13T14:00:00.000Z", "clockOut": "2026-03-13T22:00:00.000Z", "createdBy": "girly@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-13 21:46:47.338569
339	4	shift_submitted	shift	304	{"date": "2026-03-13T00:00:00.000Z", "userId": 4, "clockIn": "2026-03-13T02:00:00.000Z", "clockOut": "2026-03-13T10:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "8.00", "selfService": true}	2026-03-13 23:54:37.22103
340	4	shift_submitted	shift	306	{"date": "2026-03-14T00:00:00.000Z", "userId": 4, "clockIn": "2026-03-14T02:00:00.000Z", "clockOut": "2026-03-14T08:00:00.000Z", "createdBy": "crista@fullscopeestimating.com", "totalHours": "5.00", "selfService": true}	2026-03-14 00:06:24.333258
341	5	shift_approved	shift	290	{"date": "2026-03-09T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:07:03.466594
342	5	shift_approved	shift	294	{"date": "2026-03-11T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:07:04.580098
343	5	shift_approved	shift	297	{"date": "2026-03-12T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:07:05.782242
344	5	shift_approved	shift	299	{"date": "2026-03-13T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:07:07.044197
345	5	shift_approved	shift	305	{"date": "2026-03-13T00:00:00.000Z", "userId": 12, "userName": "Girly", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:07:08.765837
346	5	shifts_batch_paid	shift	\N	{"count": 5, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [290, 294, 297, 299, 305]}	2026-03-14 00:07:11.244663
347	5	shift_approved	shift	293	{"date": "2026-03-10T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:07:44.380716
348	5	shift_approved	shift	300	{"date": "2026-03-13T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:07:45.495356
349	5	shift_approved	shift	304	{"date": "2026-03-13T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:07:46.745783
350	5	shift_approved	shift	306	{"date": "2026-03-14T00:00:00.000Z", "userId": 4, "userName": "Crista", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:07:48.057757
351	5	shifts_batch_paid	shift	\N	{"count": 4, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [293, 300, 304, 306]}	2026-03-14 00:10:48.438208
352	5	shift_approved	shift	289	{"date": "2026-03-09T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:10:55.592341
353	5	shift_approved	shift	287	{"date": "2026-03-09T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:10:57.147064
354	5	shift_approved	shift	291	{"date": "2026-03-10T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:10:58.364012
355	5	shift_approved	shift	295	{"date": "2026-03-11T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:10:59.417463
356	5	shift_approved	shift	302	{"date": "2026-03-13T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:11:03.291525
357	5	shift_approved	shift	301	{"date": "2026-03-13T00:00:00.000Z", "userId": 7, "userName": "LJ", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:11:04.607266
358	5	shifts_batch_paid	shift	\N	{"count": 6, "markedBy": "tyler@fullscopeestimating.com", "shiftIds": [289, 287, 291, 295, 301, 302]}	2026-03-14 00:48:53.425877
359	5	shift_approved	shift	303	{"date": "2026-03-13T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:49:24.468252
360	5	shift_approved	shift	298	{"date": "2026-03-12T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:49:25.133781
361	5	shift_approved	shift	296	{"date": "2026-03-11T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:49:25.627037
362	5	shift_approved	shift	292	{"date": "2026-03-10T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:49:26.151291
363	5	shift_approved	shift	288	{"date": "2026-03-09T00:00:00.000Z", "userId": 11, "userName": "Rein", "approvedBy": "tyler@fullscopeestimating.com"}	2026-03-14 00:49:26.735245
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, invoice_number, company_name, company_address, company_city_state_zip, contact_name, job_name, previous_rcv, current_rcv, invoice_date, created_by, created_at, paid_at, notes, sent_at) FROM stdin;
1	2000	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Test Testington	10000.00	20000.00	2026-02-04	\N	2026-02-04 02:49:31.959719	\N	\N	\N
2	2001	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Test Testington	10000.00	20000.00	2026-02-04	\N	2026-02-04 02:49:43.789841	\N	\N	\N
3	2002	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	test	10000.00	20000.00	2026-02-05	\N	2026-02-05 18:30:07.09675	\N	\N	\N
4	2003	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Test	10000.00	20000.00	2026-02-05	\N	2026-02-05 18:46:14.167472	\N	\N	\N
5	2004	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	\N	33964.00	50553.00	2026-02-05	\N	2026-02-05 18:48:27.785133	\N	\N	\N
6	2005	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	test	10000.00	20000.00	2026-02-05	\N	2026-02-05 18:49:42.72306	\N	\N	\N
7	2006	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Test	35262.00	92641.00	2026-02-05	\N	2026-02-05 18:52:01.924482	\N	\N	\N
8	2007	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Test	35262.00	92641.00	2026-02-05	\N	2026-02-05 18:52:46.315236	\N	\N	\N
9	2008	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	EG-2025123 Test Testington	10000.00	20000.00	2026-02-07	\N	2026-02-07 00:52:46.739008	\N	\N	\N
15	2014	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Whincup	17285.85	19314.42	2026-03-04	\N	2026-03-04 22:18:17.252849	\N	\N	\N
16	2015	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Whincup	17285.85	19314.42	2026-03-04	\N	2026-03-04 22:18:19.888264	\N	\N	\N
17	2016	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	OCTAVIO	16644.82	18421.10	2026-03-05	\N	2026-03-05 14:07:29.320086	\N	\N	\N
18	2017	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	OCTAVIO	16644.82	18421.10	2026-03-05	\N	2026-03-05 14:07:42.020175	\N	\N	\N
19	2018	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	OCTAVIO	16644.82	18421.10	2026-03-05	\N	2026-03-05 14:07:53.030814	\N	\N	\N
20	2019	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	OCTAVIO	16644.82	18421.10	2026-03-05	\N	2026-03-05 14:07:53.047882	\N	\N	\N
21	2020	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Octavio	16644.82	18421.10	2026-03-05	\N	2026-03-05 14:08:42.882699	\N	\N	\N
22	2021	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Octavio	16644.82	18421.10	2026-03-05	\N	2026-03-05 14:08:46.985998	\N	\N	\N
23	2022	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Octavio	16644.82	18421.10	2026-03-05	\N	2026-03-05 14:08:56.065291	\N	\N	\N
24	2023	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Octavio	15558.24	17304.50	2026-03-05	\N	2026-03-05 14:10:52.547706	\N	\N	\N
25	2024	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	McMillan	55548.57	61536.18	2026-03-05	\N	2026-03-05 14:14:24.029809	\N	\N	\N
26	2025	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Hanse	15558.24	17304.50	2026-03-05	\N	2026-03-05 14:17:02.977793	\N	\N	\N
27	2026	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Clark	18321.74	24863.39	2026-03-06	\N	2026-03-06 14:16:23.510684	\N	\N	\N
28	2027	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Wienzveg	12720.26	14998.73	2026-03-10	\N	2026-03-10 20:13:20.840104	\N	\N	\N
29	2028	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Opheim	2246.45	17929.24	2026-03-12	\N	2026-03-12 18:38:08.965022	\N	\N	\N
10	2009	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	\N	10000.00	20000.00	2026-02-08	\N	2026-02-08 02:44:52.858093	\N	\N	\N
11	2010	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Test Testington	10000.00	20000.00	2026-02-08	\N	2026-02-08 21:54:12.308363	\N	\N	\N
12	2011	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Bauer	37850.57	39597.52	2026-02-23	\N	2026-02-23 18:00:34.129424	\N	\N	\N
13	2012	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Walps	18502.09	19567.01	2026-02-25	\N	2026-02-25 17:58:51.214705	\N	\N	\N
14	2013	Everguard Roofing and Repair LLC	11225 N 28th Dr	Phoenix, AZ 85029-5606	Felicia Padilla	Roberts	15908.88	17863.28	2026-02-26	\N	2026-02-26 00:06:05.747591	\N	\N	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, message, shift_id, read, created_at) FROM stdin;
16	9	shift_approved	Your shift on 2/3/2026 has been approved	91	t	2026-02-04 18:29:33.618007
5	9	shift_approved	Your shift on 2/1/2026 has been approved	71	t	2026-02-02 04:32:49.816183
6	9	shift_approved	Your shift on 1/29/2026 has been approved	34	t	2026-02-02 04:32:52.487979
8	9	shift_approved	Your shift on 2/2/2026 has been approved	78	t	2026-02-03 04:33:23.213423
23	9	shift_approved	Your shift on 2/6/2026 has been approved	106	t	2026-02-08 01:48:58.877597
77	12	shift_approved	Your shift on 2/9/2026 has been approved	199	f	2026-02-18 01:17:15.830634
78	12	shift_approved	Your shift on 2/10/2026 has been approved	203	f	2026-02-18 01:17:16.782051
12	7	shift_approved	Your shift on 2/2/2026 has been approved	73	t	2026-02-04 18:21:39.77906
14	7	shift_approved	Your shift on 2/3/2026 has been approved	87	t	2026-02-04 18:21:55.534479
79	12	shift_approved	Your shift on 2/12/2026 has been approved	211	f	2026-02-18 01:17:18.112323
76	11	shift_approved	Your shift on 2/14/2026 has been approved	219	t	2026-02-18 00:10:43.178378
72	11	shift_approved	Your shift on 2/9/2026 has been approved	200	t	2026-02-18 00:09:08.345744
17	7	shift_edited	Your shift on 2/4/2026 was edited by an administrator	94	t	2026-02-06 00:17:40.88137
73	11	shift_approved	Your shift on 2/11/2026 has been approved	208	t	2026-02-18 00:09:09.593635
74	11	shift_approved	Your shift on 2/12/2026 has been approved	210	t	2026-02-18 00:09:11.348921
75	11	shift_approved	Your shift on 2/13/2026 has been approved	212	t	2026-02-18 00:10:27.129551
80	9	shift_edited	Your shift on 2/8/2026 was edited by an administrator	195	f	2026-02-19 01:24:02.880815
81	9	shift_edited	Your shift on 2/8/2026 was edited by an administrator	195	f	2026-02-19 01:24:10.104976
82	12	shift_edited	Your shift on 2/13/2026 was edited by an administrator	213	f	2026-02-20 22:00:55.779856
83	12	shift_approved	Your shift on 2/13/2026 has been approved	213	f	2026-02-20 22:00:59.221005
84	12	shift_edited	Your shift on 2/14/2026 was edited by an administrator	218	f	2026-02-20 22:01:11.641258
85	12	shift_approved	Your shift on 2/14/2026 has been approved	218	f	2026-02-20 22:01:13.398326
86	12	shift_approved	Your shift on 2/17/2026 has been approved	222	f	2026-02-20 22:06:33.554889
87	12	shift_approved	Your shift on 2/18/2026 has been approved	226	f	2026-02-20 22:06:34.606532
88	12	shift_approved	Your shift on 2/19/2026 has been approved	230	f	2026-02-20 22:06:35.770392
89	12	shift_approved	Your shift on 2/20/2026 has been approved	237	f	2026-02-20 22:06:40.065289
90	12	shift_approved	Your shift on 2/21/2026 has been approved	238	f	2026-02-20 22:06:41.371304
95	11	shift_approved	Your shift on 2/21/2026 has been approved	239	t	2026-02-20 22:08:29.760301
91	11	shift_approved	Your shift on 2/17/2026 has been approved	221	t	2026-02-20 22:08:24.512236
92	11	shift_approved	Your shift on 2/18/2026 has been approved	225	t	2026-02-20 22:08:25.945263
93	11	shift_approved	Your shift on 2/19/2026 has been approved	229	t	2026-02-20 22:08:27.123941
94	11	shift_approved	Your shift on 2/20/2026 has been approved	235	t	2026-02-20 22:08:28.410938
65	7	shift_approved	Your shift on 2/9/2026 has been approved	197	t	2026-02-17 23:58:52.931414
66	7	shift_approved	Your shift on 2/9/2026 has been approved	196	t	2026-02-17 23:58:55.281955
67	7	shift_approved	Your shift on 2/10/2026 has been approved	205	t	2026-02-17 23:59:22.24315
68	7	shift_approved	Your shift on 2/10/2026 has been approved	202	t	2026-02-17 23:59:35.395872
69	7	shift_approved	Your shift on 2/12/2026 has been approved	209	t	2026-02-17 23:59:37.493573
70	7	shift_approved	Your shift on 2/13/2026 has been approved	214	t	2026-02-17 23:59:42.249418
71	7	shift_approved	Your shift on 2/14/2026 has been approved	217	t	2026-02-17 23:59:58.289799
18	7	shift_approved	Your shift on 2/4/2026 has been approved	94	t	2026-02-06 00:29:55.434649
24	7	shift_approved	Your shift on 2/6/2026 has been approved	99	t	2026-02-08 02:18:08.457687
25	7	shift_approved	Your shift on 2/6/2026 has been approved	98	t	2026-02-08 02:18:09.70393
7	4	shift_approved	Your shift on 1/29/2026 has been approved	29	t	2026-02-02 04:38:08.190661
9	4	shift_approved	Your shift on 1/30/2026 has been approved	74	t	2026-02-03 04:33:31.596815
10	4	shift_approved	Your shift on 1/31/2026 has been approved	75	t	2026-02-03 04:33:33.310827
13	4	shift_approved	Your shift on 2/2/2026 has been approved	76	t	2026-02-04 18:21:46.97838
15	4	shift_approved	Your shift on 2/3/2026 has been approved	88	t	2026-02-04 18:29:27.023715
19	4	shift_approved	Your shift on 2/3/2026 has been approved	93	t	2026-02-06 00:30:06.635151
20	4	shift_approved	Your shift on 2/7/2026 has been approved	107	t	2026-02-08 00:34:08.381152
21	4	shift_approved	Your shift on 2/6/2026 has been approved	100	t	2026-02-08 00:34:42.100251
22	4	shift_approved	Your shift on 2/5/2026 has been approved	96	t	2026-02-08 00:34:53.10933
103	5	shift_approved	Your shift on 3/2/2026 has been approved	268	f	2026-03-03 16:08:16.956707
107	4	shift_approved	Your shift on 2/27/2026 has been approved	258	t	2026-03-03 16:36:15.608181
109	12	shift_approved	Your shift on 2/23/2026 has been approved	244	f	2026-03-03 16:42:54.528506
110	12	shift_approved	Your shift on 2/25/2026 has been approved	247	f	2026-03-03 16:42:55.690042
111	12	shift_approved	Your shift on 2/26/2026 has been approved	252	f	2026-03-03 16:42:56.691675
112	12	shift_approved	Your shift on 2/27/2026 has been approved	257	f	2026-03-03 16:42:57.947556
113	12	shift_approved	Your shift on 2/28/2026 has been approved	261	f	2026-03-03 16:43:01.869135
114	12	shift_approved	Your shift on 3/1/2026 has been approved	264	f	2026-03-03 16:43:03.194515
132	9	shift_approved	Your shift on 2/18/2026 has been approved	233	f	2026-03-03 17:55:23.487321
133	9	shift_approved	Your shift on 2/8/2026 has been approved	195	f	2026-03-03 17:55:24.912495
134	12	shift_edited	Your shift on 3/3/2026 was edited by an administrator	267	f	2026-03-03 17:55:52.500859
115	7	shift_approved	Your shift on 2/17/2026 has been approved	220	t	2026-03-03 16:43:59.745232
116	7	shift_approved	Your shift on 2/18/2026 has been approved	224	t	2026-03-03 16:44:02.305682
117	7	shift_approved	Your shift on 2/19/2026 has been approved	228	t	2026-03-03 16:44:05.152316
118	7	shift_approved	Your shift on 2/20/2026 has been approved	234	t	2026-03-03 16:44:07.486144
119	7	shift_approved	Your shift on 2/21/2026 has been approved	240	t	2026-03-03 16:44:10.766049
120	7	shift_approved	Your shift on 2/23/2026 has been approved	242	t	2026-03-03 16:51:44.000671
121	7	shift_approved	Your shift on 2/25/2026 has been approved	249	t	2026-03-03 16:51:45.618375
122	7	shift_approved	Your shift on 2/26/2026 has been approved	253	t	2026-03-03 16:51:46.87781
123	7	shift_approved	Your shift on 2/26/2026 has been approved	256	t	2026-03-03 16:51:48.052148
124	7	shift_approved	Your shift on 2/27/2026 has been approved	259	t	2026-03-03 16:51:49.176721
125	7	shift_approved	Your shift on 3/1/2026 has been approved	265	t	2026-03-03 16:51:50.5817
126	11	shift_approved	Your shift on 3/1/2026 has been approved	263	t	2026-03-03 17:55:04.510064
127	11	shift_approved	Your shift on 2/27/2026 has been approved	260	t	2026-03-03 17:55:06.605522
128	11	shift_approved	Your shift on 2/26/2026 has been approved	255	t	2026-03-03 17:55:08.182767
129	11	shift_approved	Your shift on 2/25/2026 has been approved	248	t	2026-03-03 17:55:09.401941
130	11	shift_approved	Your shift on 2/25/2026 has been approved	251	t	2026-03-03 17:55:10.800915
131	11	shift_approved	Your shift on 2/24/2026 has been approved	246	t	2026-03-03 17:55:11.984057
140	12	shift_edited	Your shift on 3/5/2026 was edited by an administrator	277	f	2026-03-09 03:47:11.721237
141	12	shift_approved	Your shift on 3/5/2026 has been approved	277	f	2026-03-09 03:47:36.301155
142	12	shift_approved	Your shift on 3/6/2026 has been approved	282	f	2026-03-09 03:48:15.233505
143	12	shift_approved	Your shift on 3/6/2026 has been approved	284	f	2026-03-09 03:48:16.739015
144	12	shift_approved	Your shift on 3/4/2026 has been approved	271	f	2026-03-09 03:48:18.000901
145	12	shift_approved	Your shift on 3/3/2026 has been approved	267	f	2026-03-09 03:48:19.552382
146	12	shift_edited	Your shift on 3/5/2026 was edited by an administrator	277	f	2026-03-09 03:48:42.446504
147	12	shift_approved	Your shift on 3/5/2026 has been approved	277	f	2026-03-09 03:48:44.527661
152	11	shift_approved	Your shift on 3/6/2026 has been approved	285	t	2026-03-09 03:51:36.158965
151	11	shift_approved	Your shift on 3/5/2026 has been approved	281	t	2026-03-09 03:51:34.832801
150	11	shift_approved	Your shift on 3/4/2026 has been approved	273	t	2026-03-09 03:51:33.534207
149	11	shift_approved	Your shift on 3/4/2026 has been approved	276	t	2026-03-09 03:51:31.528207
148	11	shift_approved	Your shift on 3/3/2026 has been approved	266	t	2026-03-09 03:51:30.05769
135	7	shift_approved	Your shift on 3/3/2026 has been approved	269	t	2026-03-09 03:41:49.347053
136	7	shift_approved	Your shift on 3/4/2026 has been approved	275	t	2026-03-09 03:41:51.951627
137	7	shift_approved	Your shift on 3/5/2026 has been approved	280	t	2026-03-09 03:41:57.750171
138	7	shift_approved	Your shift on 3/5/2026 has been approved	278	t	2026-03-09 03:42:07.863067
139	7	shift_approved	Your shift on 3/7/2026 has been approved	286	t	2026-03-09 03:42:10.077209
57	4	shift_approved	Your shift on 2/10/2026 has been approved	201	t	2026-02-17 20:41:56.837202
58	4	shift_approved	Your shift on 2/11/2026 has been approved	206	t	2026-02-17 20:42:04.163275
59	4	shift_approved	Your shift on 2/13/2026 has been approved	215	t	2026-02-17 20:42:05.605126
60	4	shift_approved	Your shift on 2/13/2026 has been approved	216	t	2026-02-17 20:42:07.196111
61	4	shift_edited	Your shift on 2/10/2026 was edited by an administrator	201	t	2026-02-17 20:42:16.980618
62	4	shift_edited	Your shift on 2/11/2026 was edited by an administrator	206	t	2026-02-17 20:42:21.45744
63	4	shift_edited	Your shift on 2/13/2026 was edited by an administrator	215	t	2026-02-17 20:42:22.753114
64	4	shift_edited	Your shift on 2/13/2026 was edited by an administrator	216	t	2026-02-17 20:43:15.714607
96	4	shift_edited	Your shift on 2/21/2026 was edited by an administrator	241	t	2026-02-23 16:16:52.766818
97	4	shift_approved	Your shift on 2/21/2026 has been approved	241	t	2026-02-23 16:17:04.271997
98	4	shift_approved	Your shift on 2/20/2026 has been approved	236	t	2026-02-23 16:17:08.248557
99	4	shift_approved	Your shift on 2/19/2026 has been approved	231	t	2026-02-23 16:17:11.310634
100	4	shift_approved	Your shift on 2/18/2026 has been approved	227	t	2026-02-23 16:18:56.009366
101	4	shift_approved	Your shift on 2/17/2026 has been approved	223	t	2026-02-23 16:18:59.965412
102	4	shift_edited	Your shift on 2/20/2026 was edited by an administrator	241	t	2026-02-24 04:00:52.270399
104	4	shift_approved	Your shift on 2/24/2026 has been approved	245	t	2026-03-03 16:36:11.296636
105	4	shift_approved	Your shift on 2/25/2026 has been approved	250	t	2026-03-03 16:36:13.047372
106	4	shift_approved	Your shift on 2/26/2026 has been approved	254	t	2026-03-03 16:36:14.246843
108	4	shift_approved	Your shift on 2/28/2026 has been approved	262	t	2026-03-03 16:36:20.193685
153	4	shift_approved	Your shift on 3/3/2026 has been approved	270	t	2026-03-12 22:02:23.568731
154	4	shift_approved	Your shift on 3/4/2026 has been approved	274	t	2026-03-12 22:02:25.399878
155	4	shift_approved	Your shift on 3/5/2026 has been approved	279	t	2026-03-12 22:02:26.722463
156	4	shift_approved	Your shift on 3/6/2026 has been approved	283	t	2026-03-12 22:02:28.050203
157	12	shift_approved	Your shift on 3/9/2026 has been approved	290	f	2026-03-14 00:07:03.464769
158	12	shift_approved	Your shift on 3/11/2026 has been approved	294	f	2026-03-14 00:07:04.577442
159	12	shift_approved	Your shift on 3/12/2026 has been approved	297	f	2026-03-14 00:07:05.780876
160	12	shift_approved	Your shift on 3/13/2026 has been approved	299	f	2026-03-14 00:07:07.042917
161	12	shift_approved	Your shift on 3/13/2026 has been approved	305	f	2026-03-14 00:07:08.764763
162	4	shift_approved	Your shift on 3/10/2026 has been approved	293	f	2026-03-14 00:07:44.379285
163	4	shift_approved	Your shift on 3/13/2026 has been approved	300	f	2026-03-14 00:07:45.493763
164	4	shift_approved	Your shift on 3/13/2026 has been approved	304	f	2026-03-14 00:07:46.744716
165	4	shift_approved	Your shift on 3/14/2026 has been approved	306	f	2026-03-14 00:07:48.056486
166	7	shift_approved	Your shift on 3/9/2026 has been approved	289	f	2026-03-14 00:10:55.589791
167	7	shift_approved	Your shift on 3/9/2026 has been approved	287	f	2026-03-14 00:10:57.145935
168	7	shift_approved	Your shift on 3/10/2026 has been approved	291	f	2026-03-14 00:10:58.36278
169	7	shift_approved	Your shift on 3/11/2026 has been approved	295	f	2026-03-14 00:10:59.415847
170	7	shift_approved	Your shift on 3/13/2026 has been approved	302	f	2026-03-14 00:11:03.290396
171	7	shift_approved	Your shift on 3/13/2026 has been approved	301	f	2026-03-14 00:11:04.606357
172	11	shift_approved	Your shift on 3/13/2026 has been approved	303	f	2026-03-14 00:49:24.466029
173	11	shift_approved	Your shift on 3/12/2026 has been approved	298	f	2026-03-14 00:49:25.132561
174	11	shift_approved	Your shift on 3/11/2026 has been approved	296	f	2026-03-14 00:49:25.626075
175	11	shift_approved	Your shift on 3/10/2026 has been approved	292	f	2026-03-14 00:49:26.149423
176	11	shift_approved	Your shift on 3/9/2026 has been approved	288	f	2026-03-14 00:49:26.734023
\.


--
-- Data for Name: shifts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shifts (id, user_id, date, total_hours, created_at, status, clock_in_time, clock_out_time, clock_in_timestamp, clock_out_timestamp, paid_at) FROM stdin;
76	4	2026-02-02	10.25	2026-02-02 21:18:45.005173	paid	2026-02-02 00:30:00+00	2026-02-02 10:45:00+00	\N	\N	\N
88	4	2026-02-03	11.50	2026-02-03 15:30:50.09458	paid	2026-02-03 09:00:00+00	2026-02-03 20:30:00+00	\N	\N	\N
93	4	2026-02-03	5.75	2026-02-04 17:08:09.593325	paid	2026-02-02 16:00:00+00	2026-02-02 21:45:00+00	\N	\N	\N
295	7	2026-03-11	8.00	2026-03-11 14:11:32.876076	paid	2026-03-11 14:00:00+00	2026-03-11 22:00:00+00	\N	\N	2026-03-14 00:48:53.397644+00
96	4	2026-02-05	8.50	2026-02-05 17:55:23.181815	paid	2026-02-04 16:00:00+00	2026-02-05 00:30:00+00	\N	\N	\N
100	4	2026-02-06	7.75	2026-02-06 17:58:54.243452	paid	2026-02-05 16:00:00+00	2026-02-05 23:45:00+00	\N	\N	\N
107	4	2026-02-07	2.00	2026-02-07 23:43:53.65018	paid	2026-02-06 20:00:00+00	2026-02-06 22:00:00+00	\N	\N	\N
28	4	2026-01-28	8.75	2026-01-29 01:37:24.956863	paid	2026-01-28 21:00:00+00	2026-01-29 05:45:00+00	\N	\N	\N
301	7	2026-03-13	8.00	2026-03-12 17:02:41.449814	paid	2026-03-13 14:00:00+00	2026-03-13 22:00:00+00	\N	\N	2026-03-14 00:48:53.397644+00
73	7	2026-02-02	8.50	2026-02-02 13:19:11.370298	paid	2026-02-02 13:00:00+00	2026-02-01 21:16:00+00	\N	\N	\N
16	4	2026-01-27	9.75	2026-01-28 03:08:15.661112	paid	2026-01-27 15:45:00+00	2026-01-27 22:00:00+00	\N	\N	\N
29	4	2026-01-29	8.75	2026-01-29 13:04:12.493458	paid	2026-01-29 13:00:00+00	2026-01-28 21:45:00+00	\N	\N	\N
74	4	2026-01-30	5.00	2026-02-02 19:16:01.715762	paid	2026-01-29 18:00:00+00	2026-01-29 23:00:00+00	\N	\N	\N
75	4	2026-01-31	1.00	2026-02-02 21:17:10.649952	paid	2026-01-30 20:00:00+00	2026-01-30 21:00:00+00	\N	\N	\N
19	7	2026-01-27	2.00	2026-01-28 04:26:14.208558	paid	2026-01-27 22:30:00+00	2026-01-28 00:30:00+00	\N	\N	\N
99	7	2026-02-06	5.00	2026-02-06 17:28:59.047804	paid	2026-02-05 16:00:00+00	2026-02-05 21:00:00+00	\N	\N	\N
98	7	2026-02-06	10.50	2026-02-06 03:58:50.881281	paid	2026-02-05 16:45:00+00	2026-02-06 03:15:00+00	\N	\N	\N
94	7	2026-02-04	10.00	2026-02-05 02:24:10.109094	paid	2026-02-04 16:00:00+00	2026-02-05 02:00:00+00	\N	\N	\N
87	7	2026-02-03	8.00	2026-02-03 13:01:52.207372	paid	2026-02-03 14:00:00+00	2026-02-02 22:00:00+00	\N	\N	\N
78	9	2026-02-02	1.75	2026-02-03 04:13:46.053703	paid	2026-02-03 02:30:00+00	2026-02-03 04:15:00+00	\N	\N	\N
91	9	2026-02-03	1.50	2026-02-04 03:10:44.750179	paid	2026-02-04 01:45:00+00	2026-02-04 03:15:00+00	\N	\N	\N
106	9	2026-02-06	1.00	2026-02-07 00:55:19.831807	paid	2026-02-06 23:30:00+00	2026-02-07 00:30:00+00	\N	\N	\N
223	4	2026-02-17	8.50	2026-02-16 21:05:27.922099	paid	2026-02-16 18:00:00+00	2026-02-17 02:30:00+00	\N	\N	2026-03-03 16:36:25.553574+00
227	4	2026-02-18	10.25	2026-02-18 00:54:40.828657	paid	2026-02-18 00:00:00+00	2026-02-18 15:30:00+00	\N	\N	2026-03-03 16:36:25.553574+00
292	11	2026-03-10	8.00	2026-03-10 14:59:23.693658	approved	2026-03-10 14:00:00+00	2026-03-10 22:00:00+00	\N	\N	\N
231	4	2026-02-19	8.00	2026-02-18 21:46:58.519812	paid	2026-02-18 16:00:00+00	2026-02-19 00:00:00+00	\N	\N	2026-03-03 16:36:25.553574+00
236	4	2026-02-20	8.00	2026-02-19 18:11:52.491813	paid	2026-02-19 16:00:00+00	2026-02-20 00:00:00+00	\N	\N	2026-03-03 16:36:25.553574+00
288	11	2026-03-09	8.00	2026-03-09 14:52:29.661054	approved	2026-03-09 14:00:00+00	2026-03-09 22:00:00+00	\N	\N	\N
211	12	2026-02-12	8.00	2026-02-11 17:59:37.807423	paid	2026-02-11 16:00:00+00	2026-02-12 00:00:00+00	\N	\N	2026-02-20 22:01:26.444341+00
213	12	2026-02-13	8.00	2026-02-12 18:53:08.900294	paid	2026-02-13 16:00:00+00	2026-02-13 23:00:00+00	\N	\N	2026-02-20 22:01:26.444341+00
244	12	2026-02-23	8.00	2026-02-23 15:54:55.3242	paid	2026-02-23 02:00:00+00	2026-02-23 10:00:00+00	\N	\N	2026-03-03 16:43:05.469772+00
257	12	2026-02-27	8.00	2026-02-26 16:01:58.234991	paid	2026-02-27 02:00:00+00	2026-02-27 10:00:00+00	\N	\N	2026-03-03 16:43:05.469772+00
261	12	2026-02-28	8.00	2026-02-27 16:29:48.382836	paid	2026-02-28 02:00:00+00	2026-02-28 10:00:00+00	\N	\N	2026-03-03 16:43:05.469772+00
238	12	2026-02-21	8.00	2026-02-20 17:33:46.421293	paid	2026-02-20 16:00:00+00	2026-02-21 00:00:00+00	\N	\N	2026-02-20 22:06:43.951685+00
269	7	2026-03-03	8.25	2026-03-02 16:16:27.951251	paid	2026-03-03 14:00:00+00	2026-03-03 22:15:00+00	\N	\N	2026-03-09 03:44:30.496236+00
275	7	2026-03-04	8.25	2026-03-03 16:46:03.94729	paid	2026-03-04 02:00:00+00	2026-03-04 10:15:00+00	\N	\N	2026-03-09 03:44:30.496236+00
215	4	2026-02-13	8.75	2026-02-12 20:43:10.421905	paid	2026-02-13 01:00:00+00	2026-02-13 09:45:00+00	\N	\N	2026-02-17 20:47:31.819704+00
234	7	2026-02-20	8.00	2026-02-19 16:01:16.157264	paid	2026-02-19 16:00:00+00	2026-02-20 00:00:00+00	\N	\N	2026-03-03 16:44:14.747929+00
221	11	2026-02-17	8.00	2026-02-16 16:14:30.359654	paid	2026-02-16 16:00:00+00	2026-02-17 00:00:00+00	\N	\N	2026-02-20 22:08:34.398078+00
209	7	2026-02-12	8.00	2026-02-11 16:08:40.813874	paid	2026-02-11 16:00:00+00	2026-02-12 00:00:00+00	\N	\N	2026-02-18 00:04:26.590824+00
217	7	2026-02-14	8.00	2026-02-13 16:00:05.9239	paid	2026-02-13 16:00:00+00	2026-02-14 00:00:00+00	\N	\N	2026-02-18 00:04:26.590824+00
240	7	2026-02-21	8.00	2026-02-20 21:46:23.035292	paid	2026-02-20 16:00:00+00	2026-02-20 22:45:00+00	\N	\N	2026-03-03 16:44:14.747929+00
225	11	2026-02-18	8.00	2026-02-17 17:39:17.388062	paid	2026-02-17 16:00:00+00	2026-02-18 00:00:00+00	\N	\N	2026-02-20 22:08:34.398078+00
219	11	2026-02-14	8.00	2026-02-13 18:22:44.227333	paid	2026-02-13 16:00:00+00	2026-02-14 00:00:00+00	\N	\N	2026-02-18 00:10:45.949735+00
18	8	2026-01-27	2.00	2026-01-28 04:24:47.816515	approved	2026-01-27 22:30:00+00	2026-01-28 00:30:00+00	\N	\N	\N
229	11	2026-02-19	8.00	2026-02-18 17:06:22.943414	paid	2026-02-18 16:00:00+00	2026-02-19 00:00:00+00	\N	\N	2026-02-20 22:08:34.398078+00
286	7	2026-03-07	8.00	2026-03-06 16:31:36.922375	paid	2026-03-07 14:00:00+00	2026-03-07 22:00:00+00	\N	\N	2026-03-09 03:44:30.496236+00
164	4	2025-12-09	2.00	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-09 14:00:00+00	2025-12-09 16:00:00+00	2026-02-08 21:30:44.11291+00
165	4	2025-12-10	8.25	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-10 13:00:00+00	2025-12-10 21:15:00+00	2026-02-08 21:30:44.11291+00
166	4	2025-12-11	3.50	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-11 14:00:00+00	2025-12-11 17:30:00+00	2026-02-08 21:30:44.11291+00
167	4	2025-12-12	8.25	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-12 13:00:00+00	2025-12-12 21:15:00+00	2026-02-08 21:30:44.11291+00
168	4	2025-12-15	4.00	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-15 14:00:00+00	2025-12-15 18:00:00+00	2026-02-08 21:30:44.11291+00
169	4	2025-12-16	6.00	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-16 14:00:00+00	2025-12-16 20:00:00+00	2026-02-08 21:30:44.11291+00
170	4	2025-12-17	1.00	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-17 15:00:00+00	2025-12-17 16:00:00+00	2026-02-08 21:30:44.11291+00
171	4	2025-12-18	4.50	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-18 14:00:00+00	2025-12-18 18:30:00+00	2026-02-08 21:30:44.11291+00
172	4	2025-12-19	5.50	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-19 14:00:00+00	2025-12-19 19:30:00+00	2026-02-08 21:30:44.11291+00
71	9	2026-02-01	1.00	2026-02-02 01:17:36.240663	paid	2026-02-01 21:00:00+00	2026-02-01 22:00:00+00	\N	\N	\N
34	9	2026-01-29	1.50	2026-01-30 03:39:44.505256	paid	2026-01-30 02:00:00+00	2026-01-30 03:30:00+00	\N	\N	\N
27	9	2026-01-27	1.50	2026-01-28 05:10:56.50653	paid	2026-01-28 03:00:00+00	2026-01-28 04:30:00+00	\N	\N	\N
267	12	2026-03-03	8.00	2026-03-02 16:13:23.880778	paid	2026-03-03 14:00:00+00	2026-03-03 22:15:00+00	\N	\N	2026-03-09 03:50:45.443117+00
271	12	2026-03-04	8.00	2026-03-03 16:02:03.718243	paid	2026-03-04 22:00:00+00	2026-03-04 05:45:00+00	\N	\N	2026-03-09 03:50:45.443117+00
277	12	2026-03-05	8.00	2026-03-04 16:10:52.767209	paid	2026-03-05 14:00:00+00	2026-03-05 22:00:00+00	\N	\N	2026-03-09 03:50:45.443117+00
284	12	2026-03-06	8.00	2026-03-06 14:12:06.46696	paid	2026-03-06 14:00:00+00	2026-03-06 22:00:00+00	\N	\N	2026-03-09 03:50:45.443117+00
273	11	2026-03-04	8.25	2026-03-03 16:17:13.298132	approved	2026-03-04 14:00:00+00	2026-03-04 22:15:00+00	\N	\N	\N
281	11	2026-03-05	8.25	2026-03-05 14:45:49.664644	approved	2026-03-05 14:00:00+00	2026-03-05 22:15:00+00	\N	\N	\N
242	7	2026-02-23	8.00	2026-02-23 15:20:49.235117	paid	2026-02-23 02:00:00+00	2026-02-23 10:00:00+00	\N	\N	2026-03-03 16:52:05.440326+00
249	7	2026-02-25	8.00	2026-02-24 18:09:33.129762	paid	2026-02-24 16:00:00+00	2026-02-25 00:00:00+00	\N	\N	2026-03-03 16:52:05.440326+00
253	7	2026-02-26	8.00	2026-02-25 16:24:17.045756	paid	2026-02-26 14:00:00+00	2026-02-26 22:00:00+00	\N	\N	2026-03-03 16:52:05.440326+00
259	7	2026-02-27	8.00	2026-02-27 15:07:59.074815	paid	2026-02-27 02:00:00+00	2026-02-27 10:00:00+00	\N	\N	2026-03-03 16:52:05.440326+00
265	7	2026-03-01	2.50	2026-03-01 01:45:43.19998	paid	2026-02-28 23:15:00+00	2026-03-01 01:45:00+00	\N	\N	2026-03-03 16:52:05.440326+00
246	11	2026-02-24	8.00	2026-02-24 15:49:36.44042	paid	2026-02-24 14:00:00+00	2026-02-24 22:00:00+00	\N	\N	2026-03-03 17:55:14.80588+00
279	4	2026-03-05	7.00	2026-03-05 07:58:14.962589	paid	2026-03-05 03:00:00+00	2026-03-05 10:00:00+00	\N	\N	2026-03-12 22:37:10.28076+00
251	11	2026-02-25	8.00	2026-02-25 15:50:13.35208	paid	2026-02-25 14:00:00+00	2026-02-25 22:00:00+00	\N	\N	2026-03-03 17:55:14.80588+00
248	11	2026-02-25	8.00	2026-02-24 18:09:24.305299	paid	2026-02-24 16:00:00+00	2026-02-25 00:00:00+00	\N	\N	2026-03-03 17:55:14.80588+00
255	11	2026-02-26	8.00	2026-02-26 14:12:16.498577	paid	2026-02-26 14:00:00+00	2026-02-26 22:00:00+00	\N	\N	2026-03-03 17:55:14.80588+00
263	11	2026-03-01	2.50	2026-03-01 01:15:58.249271	paid	2026-02-28 23:15:00+00	2026-03-01 01:45:00+00	\N	\N	2026-03-03 17:55:14.80588+00
233	9	2026-02-18	0.75	2026-02-19 02:49:38.438901	approved	2026-02-19 02:00:00+00	2026-02-19 02:45:00+00	\N	\N	\N
290	12	2026-03-09	8.00	2026-03-09 15:46:19.071921	paid	2026-03-09 14:00:00+00	2026-03-09 22:00:00+00	\N	\N	2026-03-14 00:07:11.231722+00
294	12	2026-03-11	8.00	2026-03-10 16:06:30.037265	paid	2026-03-11 14:00:00+00	2026-03-11 22:00:00+00	\N	\N	2026-03-14 00:07:11.231722+00
300	4	2026-03-13	8.00	2026-03-12 16:12:08.793647	paid	2026-03-13 02:00:00+00	2026-03-13 10:00:00+00	\N	\N	2026-03-14 00:10:48.396124+00
173	4	2025-12-22	3.00	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-22 14:00:00+00	2025-12-22 17:00:00+00	2026-02-08 21:30:44.11291+00
174	4	2025-12-23	6.00	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-23 14:00:00+00	2025-12-23 20:00:00+00	2026-02-08 21:30:44.11291+00
175	4	2025-12-25	2.25	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-25 15:00:00+00	2025-12-25 17:15:00+00	2026-02-08 21:30:44.11291+00
176	4	2025-12-26	2.00	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-26 14:00:00+00	2025-12-26 16:00:00+00	2026-02-08 21:30:44.11291+00
177	4	2025-12-27	5.00	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-27 14:00:00+00	2025-12-27 19:00:00+00	2026-02-08 21:30:44.11291+00
178	4	2025-12-29	8.75	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-29 12:30:00+00	2025-12-29 21:15:00+00	2026-02-08 21:30:44.11291+00
179	4	2025-12-30	5.75	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-30 14:00:00+00	2025-12-30 19:45:00+00	2026-02-08 21:30:44.11291+00
180	4	2025-12-31	7.50	2026-02-08 21:27:30.773511	paid	\N	\N	2025-12-31 13:30:00+00	2025-12-31 21:00:00+00	2026-02-08 21:30:44.11291+00
181	4	2026-01-02	2.50	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-02 14:00:00+00	2026-01-02 16:30:00+00	2026-02-08 21:30:44.11291+00
182	4	2026-01-05	8.75	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-05 12:30:00+00	2026-01-05 21:15:00+00	2026-02-08 21:30:44.11291+00
183	4	2026-01-06	7.50	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-06 13:30:00+00	2026-01-06 21:00:00+00	2026-02-08 21:30:44.11291+00
184	4	2026-01-07	10.75	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-07 12:00:00+00	2026-01-07 22:45:00+00	2026-02-08 21:30:44.11291+00
185	4	2026-01-08	8.00	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-08 13:00:00+00	2026-01-08 21:00:00+00	2026-02-08 21:30:44.11291+00
186	4	2026-01-09	5.00	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-09 14:00:00+00	2026-01-09 19:00:00+00	2026-02-08 21:30:44.11291+00
187	4	2026-01-12	6.50	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-12 13:30:00+00	2026-01-12 20:00:00+00	2026-02-08 21:30:44.11291+00
188	4	2026-01-15	8.75	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-15 12:30:00+00	2026-01-15 21:15:00+00	2026-02-08 21:30:44.11291+00
189	4	2026-01-16	11.00	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-16 12:00:00+00	2026-01-16 23:00:00+00	2026-02-08 21:30:44.11291+00
190	4	2026-01-19	9.00	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-19 12:30:00+00	2026-01-19 21:30:00+00	2026-02-08 21:30:44.11291+00
191	4	2026-01-20	2.75	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-20 14:00:00+00	2026-01-20 16:45:00+00	2026-02-08 21:30:44.11291+00
192	4	2026-01-21	10.00	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-21 12:00:00+00	2026-01-21 22:00:00+00	2026-02-08 21:30:44.11291+00
193	4	2026-01-22	4.00	2026-02-08 21:27:30.773511	paid	\N	\N	2026-01-22 14:00:00+00	2026-01-22 18:00:00+00	2026-02-08 21:30:44.11291+00
194	7	2026-01-26	2.00	2026-02-08 21:31:18.072245	paid	\N	\N	2026-01-26 22:30:00+00	2026-01-27 00:30:00+00	2026-02-08 21:31:18.072245+00
289	7	2026-03-09	8.00	2026-03-09 15:12:10.469034	paid	2026-03-09 14:00:00+00	2026-03-09 22:00:00+00	\N	\N	2026-03-14 00:48:53.397644+00
287	7	2026-03-09	1.25	2026-03-09 03:37:03.675373	paid	2026-03-09 02:15:00+00	2026-03-09 03:30:00+00	\N	\N	2026-03-14 00:48:53.397644+00
268	5	2026-03-02	5.75	2026-03-02 16:16:04.729533	approved	2026-03-02 14:45:00+00	2026-03-03 01:30:00+00	\N	\N	\N
291	7	2026-03-10	8.00	2026-03-10 14:49:07.001741	paid	2026-03-10 14:00:00+00	2026-03-10 22:00:00+00	\N	\N	2026-03-14 00:48:53.397644+00
303	11	2026-03-13	8.00	2026-03-13 14:17:32.002415	approved	2026-03-13 14:00:00+00	2026-03-13 22:00:00+00	\N	\N	\N
298	11	2026-03-12	7.00	2026-03-12 15:31:55.713774	approved	2026-03-12 15:00:00+00	2026-03-12 22:00:00+00	\N	\N	\N
296	11	2026-03-11	8.00	2026-03-11 15:02:26.464687	approved	2026-03-11 14:00:00+00	2026-03-11 22:00:00+00	\N	\N	\N
280	7	2026-03-05	8.75	2026-03-05 14:03:00.505861	paid	2026-03-05 14:00:00+00	2026-03-05 22:45:00+00	\N	\N	2026-03-09 03:44:30.496236+00
241	4	2026-02-20	8.00	2026-02-20 22:00:38.734374	paid	2026-02-20 16:00:00+00	2026-02-21 00:45:00+00	\N	\N	2026-03-03 16:36:25.553574+00
199	12	2026-02-09	8.00	2026-02-09 15:02:47.497977	paid	2026-02-09 14:00:00+00	2026-02-09 20:30:00+00	\N	\N	2026-02-20 22:01:26.444341+00
203	12	2026-02-10	7.75	2026-02-10 15:05:06.113415	paid	2026-02-10 14:15:00+00	2026-02-10 22:00:00+00	\N	\N	2026-02-20 22:01:26.444341+00
218	12	2026-02-14	8.00	2026-02-13 17:02:54.948876	paid	2026-02-14 16:00:00+00	2026-02-14 23:00:00+00	\N	\N	2026-02-20 22:01:26.444341+00
245	4	2026-02-24	8.75	2026-02-23 16:21:30.846107	paid	2026-02-24 02:00:00+00	2026-02-24 10:45:00+00	\N	\N	2026-03-03 16:36:28.921191+00
250	4	2026-02-25	8.00	2026-02-24 18:18:45.72762	paid	2026-02-24 16:00:00+00	2026-02-25 00:00:00+00	\N	\N	2026-03-03 16:36:28.921191+00
254	4	2026-02-26	8.00	2026-02-25 18:24:48.291187	paid	2026-02-26 02:00:00+00	2026-02-26 10:00:00+00	\N	\N	2026-03-03 16:36:28.921191+00
258	4	2026-02-27	8.00	2026-02-27 10:41:36.579204	paid	2026-02-27 02:00:00+00	2026-02-27 10:00:00+00	\N	\N	2026-03-03 16:36:28.921191+00
278	7	2026-03-05	8.50	2026-03-04 16:12:01.7032	paid	2026-03-05 02:00:00+00	2026-03-05 10:30:00+00	\N	\N	2026-03-09 03:44:30.496236+00
262	4	2026-02-28	8.00	2026-02-28 13:59:28.579357	paid	2026-02-28 02:00:00+00	2026-02-28 10:00:00+00	\N	\N	2026-03-03 16:36:28.921191+00
222	12	2026-02-17	8.00	2026-02-16 17:34:19.263607	paid	2026-02-16 16:00:00+00	2026-02-17 00:00:00+00	\N	\N	2026-02-20 22:06:43.951685+00
226	12	2026-02-18	8.00	2026-02-17 19:06:30.286929	paid	2026-02-18 00:00:00+00	2026-02-18 08:45:00+00	\N	\N	2026-02-20 22:06:43.951685+00
230	12	2026-02-19	8.00	2026-02-18 18:09:23.141744	paid	2026-02-19 00:00:00+00	2026-02-19 07:45:00+00	\N	\N	2026-02-20 22:06:43.951685+00
237	12	2026-02-20	8.00	2026-02-19 18:15:46.178867	paid	2026-02-19 16:00:00+00	2026-02-20 00:00:00+00	\N	\N	2026-02-20 22:06:43.951685+00
282	12	2026-03-06	8.00	2026-03-05 16:00:39.080638	paid	2026-03-06 14:00:00+00	2026-03-06 22:00:00+00	\N	\N	2026-03-09 03:50:45.443117+00
266	11	2026-03-03	8.00	2026-03-02 16:11:20.133097	approved	2026-03-03 14:00:00+00	2026-03-03 22:00:00+00	\N	\N	\N
235	11	2026-02-20	8.00	2026-02-19 18:06:49.915827	paid	2026-02-19 16:00:00+00	2026-02-20 00:00:00+00	\N	\N	2026-02-20 22:08:34.398078+00
239	11	2026-02-21	8.00	2026-02-20 17:59:36.115244	paid	2026-02-20 16:00:00+00	2026-02-21 00:00:00+00	\N	\N	2026-02-20 22:08:34.398078+00
247	12	2026-02-25	8.00	2026-02-24 18:08:14.663195	paid	2026-02-24 16:00:00+00	2026-02-25 00:00:00+00	\N	\N	2026-03-03 16:43:05.469772+00
276	11	2026-03-04	8.00	2026-03-04 15:32:06.19885	approved	2026-03-04 14:00:00+00	2026-03-04 22:00:00+00	\N	\N	\N
252	12	2026-02-26	8.00	2026-02-25 16:00:49.749695	paid	2026-02-26 02:00:00+00	2026-02-26 10:00:00+00	\N	\N	2026-03-03 16:43:05.469772+00
285	11	2026-03-06	10.00	2026-03-06 15:58:44.919313	approved	2026-03-06 14:00:00+00	2026-03-07 00:00:00+00	\N	\N	\N
264	12	2026-03-01	2.50	2026-03-01 01:44:38.057247	paid	2026-02-28 23:15:00+00	2026-03-01 01:45:00+00	\N	\N	2026-03-03 16:43:05.469772+00
201	4	2026-02-10	8.50	2026-02-09 20:00:47.317451	paid	2026-02-09 18:00:00+00	2026-02-10 02:30:00+00	\N	\N	2026-02-17 20:47:31.819704+00
206	4	2026-02-11	8.25	2026-02-10 18:32:45.842023	paid	2026-02-11 13:45:00+00	2026-02-11 22:00:00+00	\N	\N	2026-02-17 20:47:31.819704+00
216	4	2026-02-13	7.00	2026-02-12 22:28:03.432412	paid	2026-02-12 16:00:00+00	2026-02-12 23:00:00+00	\N	\N	2026-02-17 20:47:31.819704+00
220	7	2026-02-17	8.00	2026-02-16 16:02:06.122235	paid	2026-02-16 16:00:00+00	2026-02-17 00:00:00+00	\N	\N	2026-03-03 16:44:14.747929+00
197	7	2026-02-09	8.50	2026-02-09 14:03:54.620397	paid	2026-02-09 01:30:00+00	2026-02-09 10:00:00+00	\N	\N	2026-02-18 00:04:26.590824+00
196	7	2026-02-09	2.25	2026-02-09 02:28:51.0016	paid	2026-02-09 01:00:00+00	2026-02-09 03:15:00+00	\N	\N	2026-02-18 00:04:26.590824+00
205	7	2026-02-10	8.00	2026-02-10 15:05:42.109284	paid	2026-02-10 02:00:00+00	2026-02-10 10:00:00+00	\N	\N	2026-02-18 00:04:26.590824+00
202	7	2026-02-10	1.25	2026-02-10 01:46:46.549823	paid	2026-02-10 01:00:00+00	2026-02-10 02:15:00+00	\N	\N	2026-02-18 00:04:26.590824+00
214	7	2026-02-13	6.00	2026-02-12 19:46:03.834265	paid	2026-02-12 17:00:00+00	2026-02-12 23:00:00+00	\N	\N	2026-02-18 00:04:26.590824+00
224	7	2026-02-18	8.00	2026-02-17 16:10:53.83206	paid	2026-02-17 16:00:00+00	2026-02-18 00:00:00+00	\N	\N	2026-03-03 16:44:14.747929+00
228	7	2026-02-19	8.00	2026-02-18 16:05:06.086213	paid	2026-02-18 16:00:00+00	2026-02-19 00:00:00+00	\N	\N	2026-03-03 16:44:14.747929+00
200	11	2026-02-09	8.00	2026-02-09 15:10:37.428546	paid	2026-02-09 14:00:00+00	2026-02-09 22:00:00+00	\N	\N	2026-02-18 00:10:45.949735+00
208	11	2026-02-11	8.00	2026-02-10 22:03:32.314166	paid	2026-02-10 14:00:00+00	2026-02-10 22:00:00+00	\N	\N	2026-02-18 00:10:45.949735+00
210	11	2026-02-12	8.00	2026-02-11 16:09:32.216249	paid	2026-02-11 16:00:00+00	2026-02-12 00:00:00+00	\N	\N	2026-02-18 00:10:45.949735+00
212	11	2026-02-13	7.00	2026-02-12 18:44:33.091769	paid	2026-02-12 16:00:00+00	2026-02-12 23:00:00+00	\N	\N	2026-02-18 00:10:45.949735+00
256	7	2026-02-26	8.00	2026-02-26 14:56:32.863861	paid	2026-02-26 02:00:00+00	2026-02-26 10:00:00+00	\N	\N	2026-03-03 16:52:05.440326+00
260	11	2026-02-27	8.00	2026-02-27 15:56:33.076133	paid	2026-02-27 14:00:00+00	2026-02-27 22:00:00+00	\N	\N	2026-03-03 17:55:14.80588+00
195	9	2026-02-08	1.50	2026-02-08 21:33:57.103653	approved	2026-02-08 20:00:00+00	2026-02-08 21:30:00+00	\N	\N	\N
270	4	2026-03-03	8.00	2026-03-02 18:00:18.418523	paid	2026-03-03 02:00:00+00	2026-03-03 10:00:00+00	\N	\N	2026-03-12 22:37:10.28076+00
274	4	2026-03-04	8.25	2026-03-03 16:19:48.091393	paid	2026-03-04 02:00:00+00	2026-03-04 10:15:00+00	\N	\N	2026-03-12 22:37:10.28076+00
283	4	2026-03-06	8.00	2026-03-05 22:12:48.842807	paid	2026-03-06 02:00:00+00	2026-03-06 10:00:00+00	\N	\N	2026-03-12 22:37:10.28076+00
297	12	2026-03-12	8.00	2026-03-11 16:00:43.572408	paid	2026-03-12 02:00:00+00	2026-03-12 10:00:00+00	\N	\N	2026-03-14 00:07:11.231722+00
293	4	2026-03-10	8.00	2026-03-10 15:09:29.068938	paid	2026-03-10 02:00:00+00	2026-03-10 10:00:00+00	\N	\N	2026-03-14 00:10:48.396124+00
302	7	2026-03-13	8.00	2026-03-13 14:06:27.891216	paid	2026-03-13 14:00:00+00	2026-03-13 22:00:00+00	\N	\N	2026-03-14 00:48:53.397644+00
299	12	2026-03-13	8.00	2026-03-12 16:03:18.392245	paid	2026-03-13 14:00:00+00	2026-03-13 22:00:00+00	\N	\N	2026-03-14 00:07:11.231722+00
305	12	2026-03-13	8.00	2026-03-13 16:00:32.680577	paid	2026-03-13 14:00:00+00	2026-03-13 22:00:00+00	\N	\N	2026-03-14 00:07:11.231722+00
304	4	2026-03-13	8.00	2026-03-13 14:23:25.122379	paid	2026-03-13 02:00:00+00	2026-03-13 10:00:00+00	\N	\N	2026-03-14 00:10:48.396124+00
306	4	2026-03-14	5.00	2026-03-14 00:05:06.160099	paid	2026-03-14 02:00:00+00	2026-03-14 08:00:00+00	\N	\N	2026-03-14 00:10:48.396124+00
\.


--
-- Data for Name: time_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.time_blocks (id, shift_id, tasks, is_break, created_at, start_time, end_time, start_timestamp, end_timestamp, is_unpaid) FROM stdin;
636	164	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-09 14:00:00+00	2025-12-09 16:00:00+00	f
637	165	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-10 13:00:00+00	2025-12-10 21:15:00+00	f
124	29	Follow up with Insurance, updated Monday and Acculynx	f	2026-01-30 05:11:24.831714	2026-01-29 13:00:00+00	2026-01-29 15:00:00+00	\N	\N	f
125	29	15 min Break	t	2026-01-30 05:11:25.457951	2026-01-29 15:00:00+00	2026-01-29 15:15:00+00	\N	\N	f
128	29	Follow up with Insurance, updated Monday and Acculynx • Ordered Measurements, reviewed Lopez for potential client (pending reply from Tyler and Mitchell)	f	2026-01-30 05:12:33.878964	2026-01-28 17:30:00+00	2026-01-28 17:30:00+00	\N	\N	f
129	29	15 min Break	t	2026-01-30 05:12:34.501123	2026-01-28 17:30:00+00	2026-01-28 17:45:00+00	\N	\N	f
131	29	15 min Break	t	2026-01-30 05:13:37.529963	2026-01-28 21:45:00+00	2026-01-28 22:00:00+00	\N	\N	f
133	29	15 min Break	t	2026-01-30 05:14:20.820575	2026-01-28 19:30:00+00	2026-01-28 19:45:00+00	\N	\N	f
638	166	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-11 14:00:00+00	2025-12-11 17:30:00+00	f
456	98	Huddle  • Sync with Tyler • Acculynx Coordinator Task • Review Notification in Acculynx 	f	2026-02-06 03:58:51.854098	2026-02-05 16:45:00+00	2026-02-05 18:45:00+00	\N	\N	f
457	98	15 min Break	t	2026-02-06 03:58:52.091511	2026-02-05 18:45:00+00	2026-02-05 19:00:00+00	\N	\N	f
306	87	recap	f	2026-02-03 13:01:52.930547	2026-02-03 13:00:00+00	2026-02-03 14:00:00+00	\N	\N	f
308	87	Scope Copying- 	f	2026-02-03 15:05:04.888002	2026-02-03 15:00:00+00	2026-02-02 16:00:00+00	\N	\N	f
462	98	Reviewing Notes for Acculynx Documentation • Training Agenda Deck • Sync with Tyler - Acculynx, Recap and Feedback 	f	2026-02-06 04:03:53.54027	2026-02-05 23:30:00+00	2026-02-06 01:00:00+00	\N	\N	f
312	87	Shadow Crista	f	2026-02-03 16:19:53.929223	2026-02-02 16:15:00+00	2026-02-02 18:00:00+00	\N	\N	f
314	87	Shadow Crista  • Profile Creation	f	2026-02-03 18:15:47.603979	2026-02-02 18:15:00+00	2026-02-02 18:45:00+00	\N	\N	f
316	87	Contract  Creation	f	2026-02-03 19:36:46.304791	2026-02-02 19:30:00+00	2026-02-02 20:00:00+00	\N	\N	f
318	87	Job Posting Materials • Quizzes Materials	f	2026-02-03 21:58:22.408414	2026-02-02 21:00:00+00	2026-02-02 22:00:00+00	\N	\N	f
463	98	15 min Break	t	2026-02-06 04:03:59.684528	2026-02-06 01:00:00+00	2026-02-06 01:15:00+00	\N	\N	f
466	99	huddle  • Review Flagged task • Review Acculynx Responses vs Monday 	f	2026-02-06 17:28:59.617407	2026-02-05 16:00:00+00	2026-02-05 18:00:00+00	\N	\N	f
467	99	15 min Break	t	2026-02-06 17:28:59.807943	2026-02-05 18:00:00+00	2026-02-05 18:15:00+00	\N	\N	f
471	99	15 min Break	t	2026-02-06 19:27:25.719451	2026-02-05 20:15:00+00	2026-02-05 20:30:00+00	\N	\N	f
327	91	Worked on callQuestions and timeClock apps	f	2026-02-04 03:10:44.819918	2026-02-04 01:45:00+00	2026-02-04 03:15:00+00	\N	\N	f
474	99	Confirming COC received - Pearson • Confirming COC received - Salamando	f	2026-02-06 21:04:31.466331	2026-02-05 20:15:00+00	2026-02-05 21:00:00+00	\N	\N	f
639	167	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-12 13:00:00+00	2025-12-12 21:15:00+00	f
640	168	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-15 14:00:00+00	2025-12-15 18:00:00+00	f
641	169	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-16 14:00:00+00	2025-12-16 20:00:00+00	f
642	170	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-17 15:00:00+00	2025-12-17 16:00:00+00	f
643	171	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-18 14:00:00+00	2025-12-18 18:30:00+00	f
247	73	Access Provisioning 	f	2026-02-02 14:45:16.02606	2026-02-02 14:30:00+00	2026-02-02 15:00:00+00	\N	\N	f
249	73	Review Overview File	f	2026-02-02 15:19:41.808613	2026-02-02 15:15:00+00	2026-02-01 16:15:00+00	\N	\N	f
251	73	15 min Break	t	2026-02-02 17:18:59.017548	2026-02-01 17:19:00+00	2026-02-01 17:34:00+00	\N	\N	f
253	73	15 min Break	t	2026-02-02 18:56:09.499829	2026-02-01 19:00:00+00	2026-02-01 19:15:00+00	\N	\N	f
255	74	15 min Break	t	2026-02-02 19:16:34.646648	2026-01-29 18:00:00+00	2026-01-29 18:15:00+00	\N	\N	f
258	74	Outbound calls to insurance	f	2026-02-02 19:17:24.447561	2026-01-29 19:15:00+00	2026-01-29 21:00:00+00	\N	\N	f
259	74	15 min Break	t	2026-02-02 19:17:33.026339	2026-01-29 21:00:00+00	2026-01-29 21:15:00+00	\N	\N	f
261	73	Supplement	f	2026-02-02 19:27:45.697828	2026-02-01 19:15:00+00	2026-02-01 21:00:00+00	\N	\N	f
263	76	15 min Break	t	2026-02-02 21:18:45.456506	2026-02-02 00:30:00+00	2026-02-02 00:45:00+00	\N	\N	f
266	76	Reviewing Monday and Emails received over the weekend	f	2026-02-02 21:19:43.957748	2026-02-02 02:45:00+00	2026-02-02 04:45:00+00	\N	\N	f
267	76	15 min Break	t	2026-02-02 21:19:45.769292	2026-02-02 04:45:00+00	2026-02-02 05:00:00+00	\N	\N	f
270	76	(Cont.) Training with LJ • Copying scope - Lopez • Copying scope - Delaney • Copying scope - Owen	f	2026-02-02 21:21:19.589807	2026-02-02 07:00:00+00	2026-02-02 09:00:00+00	\N	\N	f
272	76	Sent COC for Carungi • Confirming supplement reviewed - Short • End of day with Tyler	f	2026-02-03 00:27:51.385553	2026-02-02 09:15:00+00	2026-02-02 10:45:00+00	\N	\N	f
490	106	Worked on Time Clock	f	2026-02-07 00:55:19.991744	2026-02-06 23:30:00+00	2026-02-07 00:30:00+00	\N	\N	f
494	100	Waited on the measurements for the Owen, Seale, Bruno • Checked dropbox for Beanblossom and Previte - still not on dropbox • Reviewed email responses in Gmails • Cleared out emails on both admin and everguard	f	2026-02-07 20:24:03.194901	2026-02-05 22:45:00+00	2026-02-05 23:45:00+00	\N	\N	f
644	172	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-19 14:00:00+00	2025-12-19 19:30:00+00	f
645	173	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-22 14:00:00+00	2025-12-22 17:00:00+00	f
646	174	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-23 14:00:00+00	2025-12-23 20:00:00+00	f
647	175	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-25 15:00:00+00	2025-12-25 17:15:00+00	f
648	176	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-26 14:00:00+00	2025-12-26 16:00:00+00	f
649	177	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-27 14:00:00+00	2025-12-27 19:00:00+00	f
650	178	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-29 12:30:00+00	2025-12-29 21:15:00+00	f
651	179	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-30 14:00:00+00	2025-12-30 19:45:00+00	f
652	180	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2025-12-31 13:30:00+00	2025-12-31 21:00:00+00	f
371	93	Provided call task to LJ • Check the notification on Monday for any new projects.  • Added documents to the Dropbox for Jazo	f	2026-02-04 22:06:46.978535	2026-02-02 17:00:00+00	2026-02-02 18:00:00+00	\N	\N	f
372	93	15 min Break	t	2026-02-04 22:06:50.442582	2026-02-02 18:00:00+00	2026-02-02 18:15:00+00	\N	\N	f
103	16	Completed notes in Monday and Acculynx with Dallin calls	f	2026-01-28 03:08:15.661112	2026-01-28 01:15:00+00	2026-01-28 02:00:00+00	\N	\N	f
374	93	15 min Break	t	2026-02-04 22:08:05.268108	2026-02-02 20:00:00+00	2026-02-02 20:15:00+00	\N	\N	f
653	181	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-02 14:00:00+00	2026-01-02 16:30:00+00	f
654	182	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-05 12:30:00+00	2026-01-05 21:15:00+00	f
655	183	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-06 13:30:00+00	2026-01-06 21:00:00+00	f
656	184	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-07 12:00:00+00	2026-01-07 22:45:00+00	f
657	185	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-08 13:00:00+00	2026-01-08 21:00:00+00	f
658	186	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-09 14:00:00+00	2026-01-09 19:00:00+00	f
659	187	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-12 13:30:00+00	2026-01-12 20:00:00+00	f
660	188	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-15 12:30:00+00	2026-01-15 21:15:00+00	f
661	189	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-16 12:00:00+00	2026-01-16 23:00:00+00	f
96	16	Incoming call from Christine for Taylor.	f	2026-01-28 03:08:15.661112	2026-01-27 15:45:00+00	2026-01-27 16:00:00+00	\N	\N	f
97	16	Reviewed Monday for the next follow up calls. • Short call with Tyler via Whatsapp regarding Jazo. • Reviewed scope for the supplement (Calixto/Ryan) • Ordered Eagleview • Updated Acculynx	f	2026-01-28 03:08:15.661112	2026-01-27 16:20:00+00	2026-01-27 20:30:00+00	\N	\N	f
98	16	15 min Break	t	2026-01-28 03:08:15.661112	2026-01-27 20:30:00+00	2026-01-27 20:45:00+00	\N	\N	f
99	16	Updated Monday with information that we have for the claim • Updated status in Monday based on the email response we receive from insurance.	f	2026-01-28 03:08:15.661112	2026-01-27 20:45:00+00	2026-01-27 22:30:00+00	\N	\N	f
100	16	15 min Break	t	2026-01-28 03:08:15.661112	2026-01-27 22:30:00+00	2026-01-27 22:45:00+00	\N	\N	f
101	16	Call shadow with Dallin • Adding notes in Acculynx • Adding notes in Monday	f	2026-01-28 03:08:15.661112	2026-01-27 23:00:00+00	2026-01-28 01:00:00+00	\N	\N	f
102	16	15 min Break	t	2026-01-28 03:08:15.661112	2026-01-28 01:00:00+00	2026-01-28 01:15:00+00	\N	\N	f
662	190	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-19 12:30:00+00	2026-01-19 21:30:00+00	f
123	34	Addressed bugs and redesigned Admin Panel	f	2026-01-30 03:40:32.807486	2026-01-30 02:00:00+00	2026-01-30 03:30:00+00	\N	\N	f
126	29	Follow up with Insurance, updated Monday and Acculynx	f	2026-01-30 05:11:44.6361	2026-01-29 15:15:00+00	2026-01-28 17:15:00+00	\N	\N	f
127	29	15 min Break	t	2026-01-30 05:11:45.260066	2026-01-28 17:15:00+00	2026-01-28 17:30:00+00	\N	\N	f
130	29	Follow up with Insurance, updated Monday and Acculynx	f	2026-01-30 05:13:24.908993	2026-01-28 19:30:00+00	2026-01-28 21:45:00+00	\N	\N	f
132	29	15 min Break	t	2026-01-30 05:14:01.480699	2026-01-28 21:45:00+00	2026-01-28 22:00:00+00	\N	\N	f
105	18	Timezone test shift	f	2026-01-28 04:24:47.816515	2026-01-27 22:30:00+00	2026-01-28 00:30:00+00	\N	\N	f
106	19	Timezone test	f	2026-01-28 04:26:14.208558	2026-01-27 22:30:00+00	2026-01-28 00:30:00+00	\N	\N	f
134	29	Follow up with Insurance, updated Monday and Acculynx	f	2026-01-30 05:14:34.587171	2026-01-28 19:45:00+00	2026-01-28 21:45:00+00	\N	\N	f
663	191	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-20 14:00:00+00	2026-01-20 16:45:00+00	f
664	192	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-21 12:00:00+00	2026-01-21 22:00:00+00	f
458	98	Confirming depreciation released - lozano • Confirming COC received - minick • Sync With Tyler and Crista- Updates • Confirming COC received - Salgado	f	2026-02-06 04:00:11.368643	2026-02-05 19:00:00+00	2026-02-05 21:00:00+00	\N	\N	f
111	27	Worked on Time Clock application	f	2026-01-28 05:11:13.834204	2026-01-28 03:00:00+00	2026-01-28 04:30:00+00	\N	\N	f
112	28	Follow up with insurance for COC, Supplement (tagged on Monday)	f	2026-01-29 01:37:24.956863	2026-01-28 21:00:00+00	2026-01-28 23:30:00+00	\N	\N	f
113	28	15 min Break	t	2026-01-29 01:37:24.956863	2026-01-28 23:30:00+00	2026-01-28 23:45:00+00	\N	\N	f
114	28	Called insurance (cont) • Short meeting with Tyler	f	2026-01-29 01:37:24.956863	2026-01-28 23:45:00+00	2026-01-29 01:45:00+00	\N	\N	f
115	28	15 min Break	t	2026-01-29 01:37:24.956863	2026-01-28 01:45:00+00	2026-01-28 02:00:00+00	\N	\N	f
116	28	Updating Monday with Emails • Calling insurance • Updating and responding to Acculynx • Supplementing (Ryan)	f	2026-01-29 01:37:24.956863	2026-01-28 02:00:00+00	2026-01-28 04:00:00+00	\N	\N	f
117	28	15 min Break	t	2026-01-29 01:37:24.956863	2026-01-28 04:00:00+00	2026-01-28 04:15:00+00	\N	\N	f
118	28	Supplementing (Ryan; incomplete)	f	2026-01-29 01:37:24.956863	2026-01-28 04:15:00+00	2026-01-28 05:45:00+00	\N	\N	f
459	98	15 min Break	t	2026-02-06 04:00:16.147342	2026-02-05 21:00:00+00	2026-02-05 21:15:00+00	\N	\N	f
464	98	Audit Fullscope Email vs Acculynx/Monday	f	2026-02-06 04:04:46.984734	2026-02-06 01:15:00+00	2026-02-06 03:15:00+00	\N	\N	f
468	100	Morning agenda with Tyler and Lj • Writing supplement - Delany	f	2026-02-06 17:58:54.70763	2026-02-05 16:00:00+00	2026-02-05 18:00:00+00	\N	\N	f
469	100	15 min Break	t	2026-02-06 17:58:56.286546	2026-02-05 18:00:00+00	2026-02-05 18:15:00+00	\N	\N	f
472	99	15 min Break	t	2026-02-06 20:00:33.436834	2026-02-05 20:00:00+00	2026-02-05 20:15:00+00	\N	\N	f
665	193	LEGACY_IMPORT	f	2026-02-08 21:27:30.773511	\N	\N	2026-01-22 14:00:00+00	2026-01-22 18:00:00+00	f
668	196	Review Monday for Task  • Order Measurement for Lopez • Review Missing materials for _ Beanblossom • Review Open- Notification Acculynx  • Acculynx Email Audit • Creation of ACV, RCV and Depreciation Quizzes 	f	2026-02-09 02:28:51.57048	2026-02-09 01:00:00+00	2026-02-09 03:00:00+00	\N	\N	f
307	87	Shadow	f	2026-02-03 14:00:54.895878	2026-02-03 14:00:00+00	2026-02-03 15:00:00+00	\N	\N	f
669	196	15 min Break	t	2026-02-09 02:28:51.886211	2026-02-09 03:00:00+00	2026-02-09 03:15:00+00	\N	\N	f
311	87	15 min Break	t	2026-02-03 15:59:36.888966	2026-02-02 16:00:00+00	2026-02-02 16:15:00+00	\N	\N	f
313	87	15 min Break	t	2026-02-03 17:56:52.055784	2026-02-02 18:00:00+00	2026-02-02 18:15:00+00	\N	\N	f
315	87	Meeting with Tyler- Touch Base	f	2026-02-03 19:36:18.117682	2026-02-02 18:45:00+00	2026-02-02 19:30:00+00	\N	\N	f
317	87	15 min Break	t	2026-02-03 20:42:26.964498	2026-02-02 20:45:00+00	2026-02-02 21:00:00+00	\N	\N	f
681	197	Training 	f	2026-02-09 15:20:01.962603	2026-02-09 03:45:00+00	2026-02-09 05:45:00+00	\N	\N	f
244	71	Working on user-facing views of the time clock app	f	2026-02-02 01:17:36.308952	2026-02-01 21:00:00+00	2026-02-01 22:00:00+00	\N	\N	f
246	73	Onboarding File Review	f	2026-02-02 13:20:09.91576	2026-02-02 13:19:00+00	2026-02-02 14:30:00+00	\N	\N	f
248	73	BREAK	f	2026-02-02 14:56:59.171182	2026-02-02 15:00:00+00	2026-02-02 15:15:00+00	\N	\N	f
250	73	15 min Break	t	2026-02-02 17:16:45.636122	2026-02-02 03:15:00+00	2026-02-02 03:30:00+00	\N	\N	f
252	73	Supplements 	f	2026-02-02 17:34:59.762304	2026-02-01 17:34:00+00	2026-02-01 18:34:00+00	\N	\N	f
254	74	15 min Break	t	2026-02-02 19:16:02.172049	2026-01-30 12:30:00+00	2026-01-30 12:45:00+00	\N	\N	f
256	74	Outbound calls to Insurance	f	2026-02-02 19:16:55.56829	2026-01-29 18:00:00+00	2026-01-29 19:00:00+00	\N	\N	f
257	74	15 min Break	t	2026-02-02 19:16:56.197048	2026-01-29 19:00:00+00	2026-01-29 19:15:00+00	\N	\N	f
260	74	Writing supplement - Ryan	f	2026-02-02 19:18:01.828828	2026-01-29 21:15:00+00	2026-01-29 23:00:00+00	\N	\N	f
262	75	Follow up with insurance, Updated monday and Acculynx; Received calls from insurance for  Jazo	f	2026-02-02 21:17:11.103914	2026-01-30 20:00:00+00	2026-01-30 21:00:00+00	\N	\N	f
264	76	Confirming COC received - Parkman • Short meeting with Tyler for Today's Agenda	f	2026-02-02 21:19:08.915424	2026-02-02 00:30:00+00	2026-02-02 02:30:00+00	\N	\N	f
265	76	15 min Break	t	2026-02-02 21:19:09.707149	2026-02-02 02:30:00+00	2026-02-02 02:45:00+00	\N	\N	f
268	76	Training with Tyler, LJ and Mitchell	f	2026-02-02 21:20:22.827635	2026-02-02 04:45:00+00	2026-02-02 06:45:00+00	\N	\N	f
269	76	15 min Break	t	2026-02-02 21:20:26.187796	2026-02-02 06:45:00+00	2026-02-02 07:00:00+00	\N	\N	f
271	76	15 min Break	t	2026-02-02 21:22:50.465223	2026-02-02 09:00:00+00	2026-02-02 09:15:00+00	\N	\N	f
491	100	15 min Break	t	2026-02-07 20:07:52.28947	2026-02-05 20:15:00+00	2026-02-05 20:30:00+00	\N	\N	f
495	107	Checked notifications in Acculynx • Updated some follow up dates on Monday for the Supplementing • Added Beanblossom and Previte for sending off COC • Ordered measurements for Seale, Owen • Added additional photos for Larios in the dropbox	f	2026-02-07 23:43:53.65018	2026-02-06 20:00:00+00	2026-02-06 22:00:00+00	\N	\N	f
275	78	Invoice generator for Call Notes app	f	2026-02-03 04:13:46.290025	2026-02-03 02:30:00+00	2026-02-03 04:15:00+00	\N	\N	f
341	93	Pre-shift meeting • Review of supplement - Ryan • Today's agenda discussion	f	2026-02-04 17:08:10.024679	2026-02-02 16:00:00+00	2026-02-02 17:00:00+00	\N	\N	f
345	88	Reviewed and Responded to Acculynx • Training with LJ	f	2026-02-04 18:25:11.713159	2026-02-03 09:00:00+00	2026-02-03 11:00:00+00	\N	\N	f
346	88	(cont) Training with LJ - Copying scope	f	2026-02-04 18:25:11.713159	2026-02-03 11:00:00+00	2026-02-03 12:00:00+00	\N	\N	f
347	88	15 min Break	t	2026-02-04 18:25:11.713159	2026-02-03 12:00:00+00	2026-02-03 12:15:00+00	\N	\N	f
348	88	(cont) Training with Lj copying scope and reviewing GAF/Eagleview	f	2026-02-04 18:25:11.713159	2026-02-03 12:15:00+00	2026-02-03 14:00:00+00	\N	\N	f
349	88	15 min Break	t	2026-02-04 18:25:11.713159	2026-02-03 14:00:00+00	2026-02-03 14:15:00+00	\N	\N	f
350	88	Writing supplement - Walp	f	2026-02-04 18:25:11.713159	2026-02-03 14:15:00+00	2026-02-03 16:00:00+00	\N	\N	f
351	88	15 min Break	t	2026-02-04 18:25:11.713159	2026-02-03 16:00:00+00	2026-02-03 16:15:00+00	\N	\N	f
352	88	Writing supplement - Walp	f	2026-02-04 18:25:11.713159	2026-02-03 16:00:00+00	2026-02-03 17:30:00+00	\N	\N	f
353	88	Writing supplement - Walp	f	2026-02-04 18:25:11.713159	2026-02-03 16:15:00+00	2026-02-03 17:30:00+00	\N	\N	f
354	88	15 min Break	t	2026-02-04 18:25:11.713159	2026-02-03 17:30:00+00	2026-02-03 17:45:00+00	\N	\N	f
355	88	Updating Acculynx • Adding new projects in Dropbox • Follow up with insurance	f	2026-02-04 18:25:11.713159	2026-02-03 17:30:00+00	2026-02-03 19:00:00+00	\N	\N	f
356	88	Calling insurance with Dallin	f	2026-02-04 18:25:11.713159	2026-02-03 19:00:00+00	2026-02-03 20:30:00+00	\N	\N	f
357	88	Calling insurance with Dallin (cont)	f	2026-02-04 18:25:11.713159	2026-02-03 20:00:00+00	2026-02-03 21:00:00+00	\N	\N	f
373	93	Meeting with Tyler	f	2026-02-04 22:07:40.337256	2026-02-02 18:15:00+00	2026-02-02 20:00:00+00	\N	\N	f
402	93	Writing supplement - Walp • Writing supplement - Ryan	f	2026-02-05 17:16:27.277917	2026-02-02 20:15:00+00	2026-02-02 21:45:00+00	\N	\N	f
403	96	Meeting with Tyler • Training with LJ	f	2026-02-05 17:55:24.041762	2026-02-04 16:00:00+00	2026-02-04 18:00:00+00	\N	\N	f
404	96	15 min Break	t	2026-02-05 17:55:24.176941	2026-02-04 18:00:00+00	2026-02-04 18:15:00+00	\N	\N	f
411	96	Writing supplement - Calixto • Meeting with Lj and Tyler	f	2026-02-05 19:54:28.309853	2026-02-04 18:15:00+00	2026-02-04 20:00:00+00	\N	\N	f
412	96	15 min Break	t	2026-02-05 20:13:17.266247	2026-02-04 20:00:00+00	2026-02-04 20:15:00+00	\N	\N	f
666	194	LEGACY_IMPORT	f	2026-02-08 21:31:18.072245	\N	\N	2026-01-26 22:30:00+00	2026-01-27 00:30:00+00	f
670	197	Pre Training Huddle  • Training Huddle 	f	2026-02-09 14:03:55.249546	2026-02-09 01:00:00+00	2026-02-09 03:00:00+00	\N	\N	f
677	199	Meeting with Tyler  • Supplement overview 	f	2026-02-09 15:02:47.987102	2026-02-09 14:00:00+00	2026-02-09 15:00:00+00	\N	\N	f
678	199	15 min Break	t	2026-02-09 15:02:48.409696	2026-02-09 15:00:00+00	2026-02-09 15:15:00+00	\N	\N	f
420	96	cont. Training with LJ and Tyler • Review Delaney for scope • Supplement review - Calixto • Supplement review - Walp	f	2026-02-05 22:27:03.81576	2026-02-04 20:15:00+00	2026-02-04 22:15:00+00	\N	\N	f
421	96	15 min Break	t	2026-02-05 22:27:08.93824	2026-02-04 22:15:00+00	2026-02-04 22:30:00+00	\N	\N	f
682	197	15 min Break	t	2026-02-09 15:42:47.450209	2026-02-09 05:45:00+00	2026-02-09 06:00:00+00	\N	\N	f
687	199	Scavenger Hunt 	f	2026-02-09 17:47:59.683433	2026-02-09 15:45:00+00	2026-02-09 17:00:00+00	\N	\N	f
689	199	Business Intro  • Training 	f	2026-02-09 18:01:51.580785	2026-02-09 14:00:00+00	2026-02-09 16:00:00+00	\N	\N	f
690	199	15 min Break	t	2026-02-09 18:01:53.284883	2026-02-09 16:00:00+00	2026-02-09 16:15:00+00	\N	\N	f
426	94	Recap • Huddle with Mitchel and Tyler • Review Supplement 	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
427	94	Facilitate New Hire Interview 	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
428	94	Training Agenda Creation	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
429	94	BREAK	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
430	94	15 min Break	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
431	94	Confirming COC received - Carungi2	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
432	94	Confirming depreciation released - Clark	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
433	94	Confirming depreciation released - Lawrence	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
434	94	Confirming depreciation released - Garnica	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
435	94	Confirming depreciation released - Blue	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
436	94	Confirming depreciation released - Heise	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
437	94	WRAP UP AND DOCUMENT UPDATES	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
438	94	15 min Break	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
439	94	Sync- Adjuster Email and Take aways for Phone time	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
440	94	Confirming depreciation released - Lawarence • Lawrence a call back since routed to VM-  Initial	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
441	94	Sync with Tyler 	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
442	94	15 min Break	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
443	94	Finalizing Training Calendar Agenda	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
444	94	Gathering of Training Manuals to be consolidated  • Upload Materials to fullscope dropbox	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
445	94	Training Plan Agenda with Tyler	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
446	94	Transcribing Materials to PPT 	f	2026-02-06 00:17:40.847282	\N	\N	\N	\N	f
693	199	Scavenger hunt	f	2026-02-09 18:03:18.248473	2026-02-09 18:30:00+00	2026-02-09 20:30:00+00	\N	\N	f
694	200	Business Intro • Training	f	2026-02-09 18:03:24.816229	2026-02-09 14:00:00+00	2026-02-09 16:00:00+00	\N	\N	f
695	200	15 min Break	t	2026-02-09 18:03:29.235303	2026-02-09 16:00:00+00	2026-02-09 16:15:00+00	\N	\N	f
460	98	Confirming COC received - Carungi2 • Confirming COC received - Pearson • Confirming COC received - McGowan • Reviewing Pearsons Profile • Appraisal Discussion	f	2026-02-06 04:01:55.092494	2026-02-05 21:15:00+00	2026-02-05 23:15:00+00	\N	\N	f
461	98	15 min Break	t	2026-02-06 04:01:57.399682	2026-02-05 23:15:00+00	2026-02-05 23:30:00+00	\N	\N	f
465	96	Sending off Appraisal	f	2026-02-06 10:50:47.346333	2026-02-04 22:30:00+00	2026-02-05 00:30:00+00	\N	\N	f
470	99	Continue Reviewing Notes Acculynx vs Monday  • Confirming COC received - Saldamando • Review Supplement - Delany 	f	2026-02-06 19:27:03.232248	2026-02-05 18:15:00+00	2026-02-05 20:15:00+00	\N	\N	f
473	100	Attempted supplement for Owens - No measurement • Attempted supplement for Lopez - Wrong measurements • Attempted supplement for Larios - Needs additional picture • Review of Supplement - Delaney • Added components for Lopez in Xactimate - Waiting on measurements	f	2026-02-06 20:09:02.386877	2026-02-05 18:15:00+00	2026-02-05 20:15:00+00	\N	\N	f
698	200	Scavenger Hunt	f	2026-02-09 18:05:09.181945	2026-02-09 16:15:00+00	2026-02-09 18:15:00+00	\N	\N	f
699	200	15 min Break	t	2026-02-09 18:05:11.743188	2026-02-09 18:15:00+00	2026-02-09 18:30:00+00	\N	\N	f
701	200	Scavenger Hunt	f	2026-02-09 19:58:51.238014	2026-02-09 18:30:00+00	2026-02-09 20:00:00+00	\N	\N	f
702	200	15 min Break	t	2026-02-09 19:58:55.112634	2026-02-09 20:00:00+00	2026-02-09 20:15:00+00	\N	\N	f
492	100	Reviewed the other new project for supplementing • Attempted supplement for Seale - No measurements • Added notes on the line items for Lopez - still needing measurements • Checked acculynx for measurements - not yet on file	f	2026-02-07 20:16:49.004132	2026-02-05 20:30:00+00	2026-02-05 22:30:00+00	\N	\N	f
493	100	15 min Break	t	2026-02-07 20:16:55.867122	2026-02-05 22:30:00+00	2026-02-05 22:45:00+00	\N	\N	f
705	200	15 min Break	t	2026-02-09 20:35:22.539723	2026-02-09 20:15:00+00	2026-02-09 20:30:00+00	\N	\N	f
707	200	Scavenger Hunt Review	f	2026-02-09 21:47:40.524879	2026-02-09 20:30:00+00	2026-02-09 22:00:00+00	\N	\N	f
709	201	15 min Break	t	2026-02-10 00:01:07.47043	2026-02-09 22:00:00+00	2026-02-09 22:15:00+00	\N	\N	f
711	201	Copying scope - Tran • Updated dropbox with the new client vs old client. • Copying scope - Le • Copying scope - Lebster	f	2026-02-10 04:47:07.122767	2026-02-09 22:15:00+00	2026-02-10 00:15:00+00	\N	\N	f
712	201	15 min Break	t	2026-02-10 04:47:09.945868	2026-02-10 00:15:00+00	2026-02-10 00:30:00+00	\N	\N	f
714	203	Scavenger Hunt 	f	2026-02-10 15:05:06.599087	2026-02-10 14:15:00+00	2026-02-10 16:00:00+00	\N	\N	f
716	205	Huddle  • Notification and Email Acculynx  • Supplement Scavenger Hunt	f	2026-02-10 15:05:42.63473	2026-02-10 02:00:00+00	2026-02-10 04:00:00+00	\N	\N	f
717	205	15 min Break	t	2026-02-10 15:05:43.781748	2026-02-10 04:00:00+00	2026-02-10 04:15:00+00	\N	\N	f
719	203	15 min Break	t	2026-02-10 16:01:02.019283	2026-02-10 16:00:00+00	2026-02-10 16:15:00+00	\N	\N	f
723	203	Scavenger Hunt 	f	2026-02-10 16:17:17.415194	2026-02-10 18:15:00+00	2026-02-10 20:00:00+00	\N	\N	f
724	203	15 min Break	t	2026-02-10 16:17:20.239544	2026-02-10 20:00:00+00	2026-02-10 20:15:00+00	\N	\N	f
730	205	Confirming depreciation released - lazcano	f	2026-02-10 18:37:17.188048	2026-02-10 06:30:00+00	2026-02-10 08:30:00+00	\N	\N	f
739	205	Confirming depreciation released - lazcano • Confirming COC received - Minick • Confirming depreciation released - MInick • Confirming COC received - Carungi2 • Confirming COC received - Salamando	f	2026-02-10 19:31:23.820545	2026-02-10 06:30:00+00	2026-02-10 08:30:00+00	\N	\N	f
741	205	15 min Break	t	2026-02-10 19:38:17.466267	2026-02-10 08:30:00+00	2026-02-10 08:45:00+00	\N	\N	f
743	206	15 min Break	t	2026-02-10 20:32:26.85276	2026-02-11 18:00:00+00	2026-02-11 18:15:00+00	\N	\N	f
745	206	Cont. Writing supplement for Seale • Review on the supplement - Larios	f	2026-02-10 21:26:56.82617	2026-02-11 18:15:00+00	2026-02-11 20:15:00+00	\N	\N	f
747	206	Review on the supplement - Owen	f	2026-02-10 21:27:26.440198	2026-02-11 20:30:00+00	2026-02-11 21:30:00+00	\N	\N	f
751	208	Huddle • Supplement Scavenger Hunt	f	2026-02-10 22:03:32.798628	2026-02-11 14:00:00+00	2026-02-11 16:00:00+00	\N	\N	f
753	208	15 min Break	t	2026-02-10 22:04:40.942421	2026-02-10 16:00:00+00	2026-02-10 16:15:00+00	\N	\N	f
756	208	Call Shadowing with LJ	f	2026-02-10 22:06:03.787381	2026-02-10 18:30:00+00	2026-02-10 20:30:00+00	\N	\N	f
757	208	15 min Break	t	2026-02-10 22:06:05.490243	2026-02-10 20:30:00+00	2026-02-10 20:45:00+00	\N	\N	f
759	206	Following up with Noda, called insurance. Updated monday and checked acculynx for any reply	f	2026-02-11 01:05:58.181592	2026-02-11 21:30:00+00	2026-02-11 22:00:00+00	\N	\N	f
762	210	Photo Supplement Scavenger Hunt	f	2026-02-11 16:09:32.668226	2026-02-11 16:00:00+00	2026-02-11 18:00:00+00	\N	\N	f
764	211	15 min Break	t	2026-02-11 18:00:05.191586	2026-02-11 18:00:00+00	2026-02-11 18:15:00+00	\N	\N	f
765	210	15 min Break	t	2026-02-11 18:00:12.041408	2026-02-11 18:00:00+00	2026-02-11 18:15:00+00	\N	\N	f
671	197	15 min Break	t	2026-02-09 14:09:51.155331	2026-02-09 03:30:00+00	2026-02-09 03:45:00+00	\N	\N	f
679	200	Zoom meeting • Supplement and process overview	f	2026-02-09 15:10:37.904554	2026-02-09 14:00:00+00	2026-02-09 15:00:00+00	\N	\N	f
680	200	15 min Break	t	2026-02-09 15:10:42.639373	2026-02-09 15:00:00+00	2026-02-09 15:15:00+00	\N	\N	f
683	199	Scavenger Hunt 	f	2026-02-09 17:45:53.91297	2026-02-09 15:15:00+00	2026-02-09 15:30:00+00	\N	\N	f
684	199	15 min Break	t	2026-02-09 17:45:55.798221	2026-02-09 15:30:00+00	2026-02-09 15:45:00+00	\N	\N	f
685	200	Supplement and process overview • Scavenger Hunt 	f	2026-02-09 17:46:01.746245	2026-02-09 15:15:00+00	2026-02-09 17:15:00+00	\N	\N	f
686	200	15 min Break	t	2026-02-09 17:46:05.404178	2026-02-09 17:15:00+00	2026-02-09 17:30:00+00	\N	\N	f
688	197	Training	f	2026-02-09 17:54:42.646002	2026-02-09 06:00:00+00	2026-02-09 08:00:00+00	\N	\N	f
691	199	Scavenger Hunt	f	2026-02-09 18:02:46.20177	2026-02-09 16:15:00+00	2026-02-09 18:15:00+00	\N	\N	f
692	199	15 min Break	t	2026-02-09 18:02:47.908704	2026-02-09 18:15:00+00	2026-02-09 18:30:00+00	\N	\N	f
696	200	Business Intro • Training	f	2026-02-09 18:04:54.706306	2026-02-09 14:00:00+00	2026-02-09 16:00:00+00	\N	\N	f
697	200	15 min Break	t	2026-02-09 18:04:55.680365	2026-02-09 16:00:00+00	2026-02-09 16:15:00+00	\N	\N	f
700	197	15 min Break	t	2026-02-09 18:47:23.638957	2026-02-09 08:00:00+00	2026-02-09 08:15:00+00	\N	\N	f
703	201	Reached out to Lj for the measurements on pending eagleview orders • Writing supplement - Larios	f	2026-02-09 20:00:47.773355	2026-02-09 18:00:00+00	2026-02-09 20:00:00+00	\N	\N	f
704	201	15 min Break	t	2026-02-09 20:00:50.137934	2026-02-09 20:00:00+00	2026-02-09 20:15:00+00	\N	\N	f
706	197	Training	f	2026-02-09 21:46:04.330164	2026-02-09 08:15:00+00	2026-02-09 10:00:00+00	\N	\N	f
708	201	Updated Monday • Copy Docs - Tran&Bruno • Copying scope - Bruno • Checked status for Parkman - Sent PWI for solar • Sit in Training with the new gang	f	2026-02-09 21:56:46.67657	2026-02-09 20:15:00+00	2026-02-09 22:00:00+00	\N	\N	f
710	202	Acculynx Notification • Fullscope Email Hygiene  • Sync with Tyler 	f	2026-02-10 01:46:47.143505	2026-02-10 01:00:00+00	2026-02-10 03:00:00+00	\N	\N	f
713	201	Copying scope - Louton • Copying scope - Scheinder	f	2026-02-10 04:47:36.863734	2026-02-10 00:30:00+00	2026-02-10 02:30:00+00	\N	\N	f
720	203	Scavenger Hunt 	f	2026-02-10 16:16:20.716927	2026-02-10 16:15:00+00	2026-02-10 18:00:00+00	\N	\N	f
721	203	15 min Break	t	2026-02-10 16:16:22.541788	2026-02-10 18:00:00+00	2026-02-10 18:15:00+00	\N	\N	f
722	205	Supplement Scavenger Hunt	f	2026-02-10 16:16:36.440956	2026-02-10 04:15:00+00	2026-02-10 06:15:00+00	\N	\N	f
725	205	15 min Break	t	2026-02-10 16:55:07.131129	2026-02-10 06:15:00+00	2026-02-10 06:30:00+00	\N	\N	f
728	206	Pre-shift agenda with the new part of team • Sent COC/Added on Monday - Beck • Writing supplement - Owen	f	2026-02-10 18:32:46.292234	2026-02-11 13:45:00+00	2026-02-11 15:45:00+00	\N	\N	f
729	206	15 min Break	t	2026-02-10 18:32:47.263489	2026-02-11 15:45:00+00	2026-02-11 16:00:00+00	\N	\N	f
742	206	Cont. Writing supplement for Owen • Writing supplement - Seale	f	2026-02-10 20:32:25.041818	2026-02-11 16:00:00+00	2026-02-11 18:00:00+00	\N	\N	f
744	205	Scavenger Hunt - Photos • Supplement Review - Larios and Owen- with Mitchel and Tyler	f	2026-02-10 21:20:56.781193	2026-02-10 08:45:00+00	2026-02-10 10:00:00+00	\N	\N	f
746	206	15 min Break	t	2026-02-10 21:27:06.246526	2026-02-11 20:15:00+00	2026-02-11 20:30:00+00	\N	\N	f
750	203	Scaveger hunt • Call Shadow • Huddle with Tyler and Mitchel for review of supplement	f	2026-02-10 22:03:16.128568	2026-02-10 20:15:00+00	2026-02-10 22:00:00+00	\N	\N	f
752	208	Huddle	f	2026-02-10 22:04:25.291477	2026-02-10 14:00:00+00	2026-02-10 16:00:00+00	\N	\N	f
754	208	Supplement Scavenger Hunt	f	2026-02-10 22:05:28.23981	2026-02-10 16:15:00+00	2026-02-10 18:15:00+00	\N	\N	f
755	208	15 min Break	t	2026-02-10 22:05:35.801378	2026-02-10 18:15:00+00	2026-02-10 18:30:00+00	\N	\N	f
758	208	Photo Supplement Scavenger Hunt • Huddle Photo Supplement with Tyler and Mitchell	f	2026-02-10 22:07:05.050268	2026-02-10 20:45:00+00	2026-02-10 22:00:00+00	\N	\N	f
760	209	Scavenger Hunt - Photos vs Supplement 	f	2026-02-11 16:08:41.340284	2026-02-11 16:00:00+00	2026-02-11 18:00:00+00	\N	\N	f
761	209	15 min Break	t	2026-02-11 16:08:41.970616	2026-02-11 18:00:00+00	2026-02-11 18:15:00+00	\N	\N	f
763	211	Scavenger Hunt 	f	2026-02-11 17:59:38.222371	2026-02-11 16:00:00+00	2026-02-11 18:00:00+00	\N	\N	f
766	209	Photo Scavenger hunt	f	2026-02-11 18:17:40.450884	2026-02-11 18:15:00+00	2026-02-11 20:15:00+00	\N	\N	f
767	209	15 min Break	t	2026-02-11 18:17:43.191396	2026-02-11 20:15:00+00	2026-02-11 20:30:00+00	\N	\N	f
768	210	Photo Supplement Scavenger Hunt • Review of Photo Supplement Scavenger Hunt with Tyler • Call Shadowing with LJ	f	2026-02-11 20:12:16.725125	2026-02-11 18:15:00+00	2026-02-11 20:15:00+00	\N	\N	f
769	210	15 min Break	t	2026-02-11 20:12:22.301485	2026-02-11 20:15:00+00	2026-02-11 20:30:00+00	\N	\N	f
770	211	Scavenger hunt • Review with Tyler	f	2026-02-11 20:15:47.978515	2026-02-11 18:15:00+00	2026-02-11 20:15:00+00	\N	\N	f
771	211	15 min Break	t	2026-02-11 20:15:49.351062	2026-02-11 20:15:00+00	2026-02-11 20:30:00+00	\N	\N	f
772	209	Confirming COC received - Saldamando • Review File - for Pearson • Review File for Pending COCs	f	2026-02-11 20:43:40.770125	2026-02-11 20:30:00+00	2026-02-11 22:15:00+00	\N	\N	f
773	210	Outbound Call Shadowing with LJ	f	2026-02-11 20:43:54.016811	2026-02-11 20:30:00+00	2026-02-11 22:30:00+00	\N	\N	f
774	209	15 min Break	t	2026-02-11 21:42:25.819311	2026-02-11 22:15:00+00	2026-02-11 22:30:00+00	\N	\N	f
775	210	15 min Break	t	2026-02-11 21:58:50.580419	2026-02-11 22:30:00+00	2026-02-11 22:45:00+00	\N	\N	f
776	211	Shadow LJ calls 	f	2026-02-11 21:59:18.361203	2026-02-11 20:30:00+00	2026-02-11 22:00:00+00	\N	\N	f
777	211	15 min Break	t	2026-02-11 21:59:19.961428	2026-02-11 22:00:00+00	2026-02-11 22:15:00+00	\N	\N	f
778	210	Outbound Call Shadowing with LJ	f	2026-02-11 22:55:40.062073	2026-02-11 22:45:00+00	2026-02-12 00:00:00+00	\N	\N	f
779	209	Review Projects in Monday  • Review Activity with Tyler 	f	2026-02-11 23:56:16.01197	2026-02-11 22:30:00+00	2026-02-12 00:00:00+00	\N	\N	f
780	211	Shadow with LJ task • Huddle with Tyler	f	2026-02-12 00:00:59.653511	2026-02-11 22:15:00+00	2026-02-12 00:00:00+00	\N	\N	f
781	212	Copy Scope Shadowing with Crista • Huddle with Mitchell and Tyler	f	2026-02-12 18:44:33.771835	2026-02-12 16:00:00+00	2026-02-12 18:00:00+00	\N	\N	f
782	212	Email communication review with Tyler	f	2026-02-12 18:45:24.689352	2026-02-12 18:00:00+00	2026-02-12 19:00:00+00	\N	\N	f
783	212	15 min Break	t	2026-02-12 18:52:26.73912	2026-02-12 19:00:00+00	2026-02-12 19:15:00+00	\N	\N	f
788	214	Huddle  • Supplement Review  with Mitchel	f	2026-02-12 19:46:04.601906	2026-02-12 17:00:00+00	2026-02-12 18:00:00+00	\N	\N	f
789	214	15 min Break	t	2026-02-12 19:46:04.760923	2026-02-12 18:00:00+00	2026-02-12 18:15:00+00	\N	\N	f
790	214	Email Review from Acculynx	f	2026-02-12 19:46:38.799112	2026-02-12 18:15:00+00	2026-02-12 20:15:00+00	\N	\N	f
791	214	15 min Break	t	2026-02-12 19:46:39.710402	2026-02-12 20:15:00+00	2026-02-12 20:30:00+00	\N	\N	f
793	212	Acculynx Email review with LJ	f	2026-02-12 19:51:45.716268	2026-02-12 19:15:00+00	2026-02-12 21:15:00+00	\N	\N	f
794	212	15 min Break	t	2026-02-12 19:51:51.640594	2026-02-12 21:15:00+00	2026-02-12 21:30:00+00	\N	\N	f
795	215	Confirming depreciation released - Noda • Updating Noda - Acculynx, Monday - call took about 45mins • Cont. supplementing for Seale	f	2026-02-12 20:43:10.878289	2026-02-13 01:00:00+00	2026-02-13 03:00:00+00	\N	\N	f
796	215	15 min Break	t	2026-02-12 20:43:11.105715	2026-02-13 03:00:00+00	2026-02-13 03:15:00+00	\N	\N	f
797	215	Check Monday for updates and needed an update.	f	2026-02-12 20:43:52.527906	2026-02-13 03:15:00+00	2026-02-13 05:00:00+00	\N	\N	f
798	215	Writing supplement - Lopez • Checked for measurements for Bruno and Lopez • Reviewed Delaney if there are additional components that we can add • Went over Seale's supplement and checked if there are other line items i missed	f	2026-02-12 20:47:09.933874	2026-02-13 05:00:00+00	2026-02-13 07:00:00+00	\N	\N	f
799	215	15 min Break	t	2026-02-12 20:47:10.948376	2026-02-13 07:00:00+00	2026-02-13 07:15:00+00	\N	\N	f
800	215	15 min Break	t	2026-02-12 20:50:09.835985	2026-02-13 07:15:00+00	2026-02-13 07:30:00+00	\N	\N	f
801	215	15 min Break	t	2026-02-12 20:51:22.543444	2026-02-13 05:00:00+00	2026-02-13 05:15:00+00	\N	\N	f
802	215	15 min Break	t	2026-02-12 20:52:20.954213	2026-02-13 05:15:00+00	2026-02-13 05:30:00+00	\N	\N	f
803	215	Checked for measurements for Bruno and Lopez • Reviewed Delaney if there are additional components that we can add • Went over Seale's supplement and checked if there are other line items i missed	f	2026-02-12 20:52:28.668317	2026-02-13 05:30:00+00	2026-02-13 07:30:00+00	\N	\N	f
804	215	15 min Break	t	2026-02-12 20:52:30.062419	2026-02-13 07:30:00+00	2026-02-13 07:45:00+00	\N	\N	f
805	215	Checked acculynx for any new task that we need to do, reviewed the ones that we're waiting for depreciation and coc • Received call from Bernard regarding Lawrence for the depreciation for the claim, added notes in monday	f	2026-02-12 20:56:16.559849	2026-02-13 07:45:00+00	2026-02-13 09:45:00+00	\N	\N	f
807	212	Acculynx Email review with LJ • Supplement review huddle with Mitchell	f	2026-02-12 21:43:04.978501	2026-02-12 21:30:00+00	2026-02-12 22:30:00+00	\N	\N	f
808	212	15 min Break	t	2026-02-12 21:43:08.261466	2026-02-12 22:30:00+00	2026-02-12 22:45:00+00	\N	\N	f
809	216	Training with the New peeps - Showing them how to copy scope (overview)	f	2026-02-12 22:28:03.941213	2026-02-12 16:00:00+00	2026-02-12 18:00:00+00	\N	\N	f
810	216	Review supplements - Seale and Owens	f	2026-02-12 22:28:27.105967	2026-02-12 18:00:00+00	2026-02-12 19:00:00+00	\N	\N	f
811	216	15 min Break	t	2026-02-12 22:28:27.727934	2026-02-12 19:00:00+00	2026-02-12 19:15:00+00	\N	\N	f
812	216	Writing supplement - Begley	f	2026-02-12 22:29:20.040092	2026-02-12 19:15:00+00	2026-02-12 21:15:00+00	\N	\N	f
813	216	15 min Break	t	2026-02-12 22:29:21.291655	2026-02-12 21:15:00+00	2026-02-12 21:30:00+00	\N	\N	f
814	214	Acculynx Email Review	f	2026-02-12 22:41:03.7669	2026-02-12 20:30:00+00	2026-02-12 21:30:00+00	\N	\N	f
815	214	Email Review	f	2026-02-12 22:41:24.844767	2026-02-12 21:30:00+00	2026-02-12 23:00:00+00	\N	\N	f
816	212	15 min Break	t	2026-02-12 22:44:24.48336	2026-02-12 22:45:00+00	2026-02-12 23:00:00+00	\N	\N	f
817	216	Writing supplement - Bruno • Short catch up with Tyler	f	2026-02-12 22:44:25.39274	2026-02-12 21:30:00+00	2026-02-12 22:00:00+00	\N	\N	f
819	217	Huddle	f	2026-02-13 16:00:06.576894	2026-02-13 16:00:00+00	2026-02-13 18:00:00+00	\N	\N	f
820	217	15 min Break	t	2026-02-13 16:00:06.832671	2026-02-13 18:00:00+00	2026-02-13 18:15:00+00	\N	\N	f
822	216	15 min Break	t	2026-02-13 17:23:03.584913	2026-02-12 22:00:00+00	2026-02-12 22:15:00+00	\N	\N	f
823	216	Writing supplement - Bruno	f	2026-02-13 17:23:45.262273	2026-02-12 22:15:00+00	2026-02-12 23:00:00+00	\N	\N	f
824	219	Acculynx Email review with LJ • COC Sending • Supplement Sending	f	2026-02-13 18:22:44.682415	2026-02-13 16:00:00+00	2026-02-13 18:00:00+00	\N	\N	f
825	219	15 min Break	t	2026-02-13 18:22:46.942178	2026-02-13 18:00:00+00	2026-02-13 18:15:00+00	\N	\N	f
826	219	15 min Break	t	2026-02-13 18:22:48.176051	2026-02-13 18:15:00+00	2026-02-13 18:30:00+00	\N	\N	f
828	217	Training	f	2026-02-13 18:25:28.312695	2026-02-13 18:15:00+00	2026-02-13 20:15:00+00	\N	\N	f
829	217	15 min Break	t	2026-02-13 18:25:30.498878	2026-02-13 20:15:00+00	2026-02-13 20:30:00+00	\N	\N	f
833	219	Supplement Sending • Outbound Call shadow with LJ	f	2026-02-13 20:25:07.508504	2026-02-13 18:30:00+00	2026-02-13 20:30:00+00	\N	\N	f
834	219	15 min Break	t	2026-02-13 20:45:56.015881	2026-02-13 20:30:00+00	2026-02-13 20:45:00+00	\N	\N	f
836	217	Training	f	2026-02-13 20:46:45.203655	2026-02-13 20:30:00+00	2026-02-13 22:30:00+00	\N	\N	f
837	219	Outbound Call Note review with Tyler • Outbound Call shadow with LJ	f	2026-02-13 22:08:32.217649	2026-02-13 20:45:00+00	2026-02-13 22:45:00+00	\N	\N	f
838	219	15 min Break	t	2026-02-13 22:08:37.308335	2026-02-13 22:45:00+00	2026-02-13 23:00:00+00	\N	\N	f
839	217	Training	f	2026-02-13 22:57:34.534171	2026-02-13 22:30:00+00	2026-02-14 00:00:00+00	\N	\N	f
840	217	15 min Break	t	2026-02-13 22:57:44.700991	2026-02-13 22:30:00+00	2026-02-13 22:45:00+00	\N	\N	f
841	217	Training	f	2026-02-13 22:57:55.699661	2026-02-13 22:45:00+00	2026-02-14 00:00:00+00	\N	\N	f
842	219	Outbound Call and Notetaking shadow with LJ	f	2026-02-13 23:01:09.458094	2026-02-13 23:00:00+00	2026-02-14 00:00:00+00	\N	\N	f
845	220	Training	f	2026-02-16 16:02:06.658872	2026-02-16 16:00:00+00	2026-02-16 18:00:00+00	\N	\N	f
846	221	Acculynx Email review with LJ	f	2026-02-16 16:14:31.679599	2026-02-16 16:00:00+00	2026-02-16 18:00:00+00	\N	\N	f
847	222	Acculynx review with LJ 	f	2026-02-16 17:34:19.88859	2026-02-16 16:00:00+00	2026-02-16 18:00:00+00	\N	\N	f
848	221	15 min Break	t	2026-02-16 17:34:51.180339	2026-02-16 18:00:00+00	2026-02-16 18:15:00+00	\N	\N	f
849	222	15 min Break	t	2026-02-16 17:56:36.341124	2026-02-16 18:00:00+00	2026-02-16 18:15:00+00	\N	\N	f
850	220	15 min Break	t	2026-02-16 18:16:13.727685	2026-02-16 18:00:00+00	2026-02-16 18:15:00+00	\N	\N	f
851	222	Shadow with LJ 	f	2026-02-16 18:16:54.276133	2026-02-16 18:15:00+00	2026-02-16 20:15:00+00	\N	\N	f
852	220	Training	f	2026-02-16 19:06:03.764971	2026-02-16 18:15:00+00	2026-02-16 20:15:00+00	\N	\N	f
853	220	15 min Break	t	2026-02-16 19:06:28.204277	2026-02-16 20:15:00+00	2026-02-16 20:30:00+00	\N	\N	f
854	221	Outbound Call Shadow with Girly and LJ	f	2026-02-16 20:09:08.271592	2026-02-16 18:15:00+00	2026-02-16 20:15:00+00	\N	\N	f
855	221	15 min Break	t	2026-02-16 20:09:09.103647	2026-02-16 20:15:00+00	2026-02-16 20:30:00+00	\N	\N	f
856	222	15 min Break	t	2026-02-16 20:21:50.714736	2026-02-16 20:15:00+00	2026-02-16 20:30:00+00	\N	\N	f
857	221	15 min Break	t	2026-02-16 20:47:07.133034	2026-02-16 20:30:00+00	2026-02-16 20:45:00+00	\N	\N	f
858	223	Copying scope - Wann	f	2026-02-16 21:05:28.385844	2026-02-16 18:00:00+00	2026-02-16 19:30:00+00	\N	\N	f
859	223	15 min Break	t	2026-02-16 21:05:28.938961	2026-02-16 19:30:00+00	2026-02-16 19:45:00+00	\N	\N	f
860	223	Copying scope - Wann • Writing supplement - Wann	f	2026-02-16 21:52:08.679837	2026-02-16 19:45:00+00	2026-02-16 21:45:00+00	\N	\N	f
861	223	Supplement review - Wann	f	2026-02-16 22:18:19.370655	2026-02-16 21:45:00+00	2026-02-16 22:30:00+00	\N	\N	f
862	223	15 min Break	t	2026-02-16 22:18:22.309346	2026-02-16 22:30:00+00	2026-02-16 22:45:00+00	\N	\N	f
863	221	Outbound Call Shadow with Girly and LJ • Supplement Review Huddle with Mitchell and Tyler	f	2026-02-16 23:18:47.473362	2026-02-16 20:45:00+00	2026-02-16 22:45:00+00	\N	\N	f
864	221	Huddle with Tyler	f	2026-02-16 23:56:49.005093	2026-02-16 22:45:00+00	2026-02-17 00:00:00+00	\N	\N	f
865	220	Training - Chase calls 	f	2026-02-17 00:00:14.539094	2026-02-16 20:30:00+00	2026-02-16 22:00:00+00	\N	\N	f
866	220	15 min Break	t	2026-02-17 00:00:15.829955	2026-02-16 22:00:00+00	2026-02-16 22:15:00+00	\N	\N	f
867	220	Chase calls 	f	2026-02-17 00:00:26.105488	2026-02-16 22:15:00+00	2026-02-17 00:00:00+00	\N	\N	f
868	222	Confirming supplement received - Bauer • Confirming supplement reviewed - Ryan Octavio	f	2026-02-17 00:04:04.388713	2026-02-16 20:45:00+00	2026-02-16 22:45:00+00	\N	\N	f
1018	218	Training 	f	2026-02-20 22:01:11.581696	2026-02-15 11:30:00+00	2026-02-15 13:30:00+00	\N	\N	f
1019	218	15 min Break	t	2026-02-20 22:01:11.581696	2026-02-15 11:30:00+00	2026-02-15 11:45:00+00	\N	\N	f
1020	218	15 min Break	t	2026-02-20 22:01:11.581696	2026-02-15 13:30:00+00	2026-02-15 13:45:00+00	\N	\N	f
869	222	Shadow on how to send emails and supplements with LJ 	f	2026-02-17 00:04:53.220977	2026-02-16 22:45:00+00	2026-02-17 00:00:00+00	\N	\N	f
870	223	Writing supplement - Bruno	f	2026-02-17 00:14:15.003017	2026-02-16 22:45:00+00	2026-02-17 00:15:00+00	\N	\N	f
871	223	15 min Break	t	2026-02-17 00:14:18.245838	2026-02-17 00:15:00+00	2026-02-17 00:30:00+00	\N	\N	f
872	223	Writing supplement - Lopez • Went over Bruno and Lopez docs and component 	f	2026-02-17 13:39:14.649647	2026-02-17 00:30:00+00	2026-02-17 02:30:00+00	\N	\N	f
873	224	Training 	f	2026-02-17 16:10:54.408664	2026-02-17 16:00:00+00	2026-02-17 18:00:00+00	\N	\N	f
874	225	Email review with LJ • Supplement Review	f	2026-02-17 17:39:17.895005	2026-02-17 16:00:00+00	2026-02-17 18:00:00+00	\N	\N	f
875	224	15 min Break	t	2026-02-17 17:58:46.292761	2026-02-17 18:00:00+00	2026-02-17 18:15:00+00	\N	\N	f
876	225	Supplement review with Mitchell and Tyler	f	2026-02-17 19:04:13.920573	2026-02-17 18:00:00+00	2026-02-17 19:00:00+00	\N	\N	f
877	225	15 min Break	t	2026-02-17 19:04:16.040236	2026-02-17 19:00:00+00	2026-02-17 19:15:00+00	\N	\N	f
878	225	15 min Break	t	2026-02-17 19:04:19.224488	2026-02-17 19:15:00+00	2026-02-17 19:30:00+00	\N	\N	f
879	226	Email review with LJ  • Supplement review with the team 	f	2026-02-17 19:06:30.780457	2026-02-17 16:00:00+00	2026-02-17 18:00:00+00	\N	\N	f
880	226	Supplement review 	f	2026-02-17 19:07:15.337989	2026-02-17 18:00:00+00	2026-02-17 19:00:00+00	\N	\N	f
881	226	15 min Break	t	2026-02-17 19:07:45.247908	2026-02-17 19:00:00+00	2026-02-17 19:15:00+00	\N	\N	f
882	225	15 min Break	t	2026-02-17 19:59:42.866363	2026-02-17 19:30:00+00	2026-02-17 19:45:00+00	\N	\N	f
883	225	15 min Break	t	2026-02-17 19:59:44.446904	2026-02-17 19:45:00+00	2026-02-17 20:00:00+00	\N	\N	f
884	225	Outbound Call shadow 	f	2026-02-17 21:27:23.733114	2026-02-17 20:00:00+00	2026-02-17 22:00:00+00	\N	\N	f
885	224	Supplement Review  • Email Admin and Everguard  • Acculynx Notif 	f	2026-02-17 22:06:24.533711	2026-02-17 18:15:00+00	2026-02-17 20:15:00+00	\N	\N	f
886	224	15 min Break	t	2026-02-17 22:06:25.031677	2026-02-17 20:15:00+00	2026-02-17 20:30:00+00	\N	\N	f
887	226	Follow up calls for the project	f	2026-02-17 23:01:27.279048	2026-02-17 20:00:00+00	2026-02-17 22:00:00+00	\N	\N	f
888	226	Follow up calls	f	2026-02-17 23:01:42.692089	2026-02-17 22:00:00+00	2026-02-17 23:00:00+00	\N	\N	f
889	226	15 min Break	t	2026-02-17 23:01:44.669074	2026-02-17 23:00:00+00	2026-02-17 23:15:00+00	\N	\N	f
890	224	Outbound calls for 	f	2026-02-17 23:58:49.682321	2026-02-17 20:30:00+00	2026-02-17 22:30:00+00	\N	\N	f
891	224	15 min Break	t	2026-02-18 00:04:34.483985	2026-02-17 22:30:00+00	2026-02-17 22:45:00+00	\N	\N	f
892	224	Training	f	2026-02-18 00:05:35.119948	2026-02-17 22:45:00+00	2026-02-18 00:00:00+00	\N	\N	f
893	225	Huddle with Tyler	f	2026-02-18 00:06:00.661057	2026-02-17 22:00:00+00	2026-02-18 00:00:00+00	\N	\N	f
894	227	Checked monday for today's agenda • Checked email for new projects • Checked Acculynx for new notification that was not in the email	f	2026-02-18 00:54:41.279234	2026-02-18 00:00:00+00	2026-02-18 00:45:00+00	\N	\N	f
895	227	No available task	f	2026-02-18 00:55:11.841103	2026-02-18 00:45:00+00	2026-02-18 02:45:00+00	\N	\N	t
896	227	Checked Acculynx for any new updates • Went through the scopes that I finished yesterday for Bruno and Lopez	f	2026-02-18 00:56:24.539375	2026-02-18 02:45:00+00	2026-02-18 03:45:00+00	\N	\N	f
897	227	15 min Break	t	2026-02-18 00:56:26.397058	2026-02-18 03:45:00+00	2026-02-18 04:00:00+00	\N	\N	f
898	227	Training with the team • Scope review - Bruno and Lopez	f	2026-02-18 00:57:24.124595	2026-02-18 04:00:00+00	2026-02-18 06:00:00+00	\N	\N	f
899	227	15 min Break	t	2026-02-18 00:57:25.594543	2026-02-18 06:00:00+00	2026-02-18 06:15:00+00	\N	\N	f
900	227	No pending supplements to work on	f	2026-02-18 00:57:58.609659	2026-02-18 06:15:00+00	2026-02-18 07:30:00+00	\N	\N	t
901	227	Training with the Team • Short meet with Tyler regarding the upcoming supplements • Added New projects - Kinsman, Whincup	f	2026-02-18 01:00:51.272712	2026-02-18 07:30:00+00	2026-02-18 09:30:00+00	\N	\N	f
902	227	15 min Break	t	2026-02-18 01:00:55.796115	2026-02-18 09:30:00+00	2026-02-18 09:45:00+00	\N	\N	f
903	227	Training with Team • Writing supplement - Kinsman • Partial - Writing supplement for Trina Devine	f	2026-02-18 01:01:40.345475	2026-02-18 09:45:00+00	2026-02-18 11:30:00+00	\N	\N	f
904	227	Mommy Duties	f	2026-02-18 01:07:35.423585	2026-02-18 11:30:00+00	2026-02-18 13:30:00+00	\N	\N	t
905	226	Email review shadow with Tyler and LJ 	f	2026-02-18 01:30:29.662541	2026-02-17 23:15:00+00	2026-02-18 00:45:00+00	\N	\N	f
906	228	Emails Hygiene  • Notifs and Acculynx	f	2026-02-18 16:05:06.601745	2026-02-18 16:00:00+00	2026-02-18 18:00:00+00	\N	\N	f
907	229	Email reviews with LJ	f	2026-02-18 17:06:23.395239	2026-02-18 16:00:00+00	2026-02-18 18:00:00+00	\N	\N	f
908	227	Writing supplement - Devine	f	2026-02-18 17:12:44.243027	2026-02-18 13:30:00+00	2026-02-18 15:30:00+00	\N	\N	f
909	229	15 min Break	t	2026-02-18 18:08:19.280529	2026-02-18 18:00:00+00	2026-02-18 18:15:00+00	\N	\N	f
910	230	Confirming COC received - Delaney • Called Farm B. for project Vlahos to follow up PDF file 	f	2026-02-18 18:09:23.622336	2026-02-18 16:00:00+00	2026-02-18 18:00:00+00	\N	\N	f
911	230	15 min Break	t	2026-02-18 18:09:29.056383	2026-02-18 18:00:00+00	2026-02-18 18:15:00+00	\N	\N	f
912	228	15 min Break	t	2026-02-18 19:48:24.308615	2026-02-18 18:00:00+00	2026-02-18 18:15:00+00	\N	\N	f
913	230	15 min Break	t	2026-02-18 19:53:01.961693	2026-02-18 18:15:00+00	2026-02-18 18:30:00+00	\N	\N	f
914	230	Called pacific to check the status of COC for Carmela Carungi  • Called AMIG for best email address to send docs Project : SALAMANDO  • Called Liberty for COC feedback PROJECT: SALGADO • Confirming COC received - Bauer	f	2026-02-18 19:53:23.332826	2026-02-18 18:15:00+00	2026-02-18 19:45:00+00	\N	\N	f
915	230	15 min Break	t	2026-02-18 19:53:24.399997	2026-02-18 19:45:00+00	2026-02-18 20:00:00+00	\N	\N	f
916	229	Outbound Calls shadow • Supplement Review	f	2026-02-18 19:58:27.329819	2026-02-18 18:15:00+00	2026-02-18 20:15:00+00	\N	\N	f
917	229	15 min Break	t	2026-02-18 19:58:27.821518	2026-02-18 20:15:00+00	2026-02-18 20:30:00+00	\N	\N	f
918	230	Supplement review with the team 	f	2026-02-18 20:01:32.061383	2026-02-18 20:00:00+00	2026-02-18 22:00:00+00	\N	\N	f
919	228	Outbound call 	f	2026-02-18 20:02:29.93158	2026-02-18 18:15:00+00	2026-02-18 20:15:00+00	\N	\N	f
920	229	Supplement Review	f	2026-02-18 21:06:18.084903	2026-02-18 20:30:00+00	2026-02-18 22:30:00+00	\N	\N	f
921	229	15 min Break	t	2026-02-18 21:06:20.24394	2026-02-18 22:30:00+00	2026-02-18 22:45:00+00	\N	\N	f
922	229	15 min Break	t	2026-02-18 21:06:26.893447	2026-02-18 22:45:00+00	2026-02-18 23:00:00+00	\N	\N	f
923	228	Supplement Review - Mitchel and Tyler 	f	2026-02-18 21:33:16.886812	2026-02-18 20:15:00+00	2026-02-18 22:15:00+00	\N	\N	f
924	228	15 min Break	t	2026-02-18 21:33:18.339541	2026-02-18 22:15:00+00	2026-02-18 22:30:00+00	\N	\N	f
925	228	15 min Break	t	2026-02-18 21:33:31.149194	2026-02-18 20:15:00+00	2026-02-18 20:30:00+00	\N	\N	f
926	228	Supplement review with Mitchell and Tyler	f	2026-02-18 21:33:51.55369	2026-02-18 20:30:00+00	2026-02-18 22:30:00+00	\N	\N	f
927	228	15 min Break	t	2026-02-18 21:33:52.337513	2026-02-18 22:30:00+00	2026-02-18 22:45:00+00	\N	\N	f
928	231	Sit in training with LJ, Rein and Girly • Added photos in drop box for Lopez, Wann • Completed scope for Wann	f	2026-02-18 21:46:58.991536	2026-02-18 16:00:00+00	2026-02-18 18:00:00+00	\N	\N	f
929	231	15 min Break	t	2026-02-18 21:46:59.211025	2026-02-18 18:00:00+00	2026-02-18 18:15:00+00	\N	\N	f
930	231	Sit in training with LJ, Rein and Girly • Finalize supplement for Wann and Whincup	f	2026-02-18 21:49:00.082476	2026-02-18 18:15:00+00	2026-02-18 19:30:00+00	\N	\N	f
931	231	15 min Break	t	2026-02-18 21:49:00.766053	2026-02-18 19:30:00+00	2026-02-18 19:45:00+00	\N	\N	f
932	231	Sit in training with LJ, Rein and Girly • Review scope	f	2026-02-18 22:01:58.313303	2026-02-18 19:45:00+00	2026-02-18 21:45:00+00	\N	\N	f
933	230	15 min Break	t	2026-02-18 22:02:00.51437	2026-02-18 22:00:00+00	2026-02-18 22:15:00+00	\N	\N	f
934	231	Review scope	f	2026-02-18 22:02:12.395828	2026-02-18 21:45:00+00	2026-02-18 22:00:00+00	\N	\N	f
935	231	15 min Break	t	2026-02-18 22:02:14.327086	2026-02-18 22:00:00+00	2026-02-18 22:15:00+00	\N	\N	f
936	229	Acculynx Review	f	2026-02-18 23:53:48.680005	2026-02-18 23:00:00+00	2026-02-19 00:00:00+00	\N	\N	f
937	228	Outbound	f	2026-02-19 00:49:45.192767	2026-02-18 22:45:00+00	2026-02-19 00:00:00+00	\N	\N	f
939	195	Improved time clock app, payroll section and Manage Invoices	f	2026-02-19 01:24:09.832638	2026-02-08 20:00:00+00	2026-02-08 21:30:00+00	\N	\N	f
942	233	Added search feature to Monday section, and Supplement changes on Call Questions app. Added + Lunch feature to Time Clock app	f	2026-02-19 02:49:38.557976	2026-02-19 02:00:00+00	2026-02-19 02:45:00+00	\N	\N	f
943	230	Email Review with the team 	f	2026-02-19 09:30:48.150981	2026-02-18 22:15:00+00	2026-02-18 23:45:00+00	\N	\N	f
944	231	Sit in training with LJ, Rein and Girly	f	2026-02-19 13:58:23.463538	2026-02-18 22:15:00+00	2026-02-19 00:00:00+00	\N	\N	f
945	234	Email Hygiene Acculynx Vs Gmail   • Monday Scrub for due today	f	2026-02-19 16:01:16.652377	2026-02-19 16:00:00+00	2026-02-19 18:00:00+00	\N	\N	f
946	234	15 min Break	t	2026-02-19 16:01:41.898409	2026-02-19 18:00:00+00	2026-02-19 18:15:00+00	\N	\N	f
947	235	Acculynx Communication review • Supplement Review	f	2026-02-19 18:06:50.350007	2026-02-19 16:00:00+00	2026-02-19 18:00:00+00	\N	\N	f
948	236	Copy scope for Steinberg • Supplementing for Foam - Steinberg	f	2026-02-19 18:11:53.036092	2026-02-19 16:00:00+00	2026-02-19 18:00:00+00	\N	\N	f
949	236	Cont. Supplementing for Foam - Steinberg	f	2026-02-19 18:14:38.592446	2026-02-19 18:00:00+00	2026-02-19 18:15:00+00	\N	\N	f
950	236	15 min Break	t	2026-02-19 18:14:39.344933	2026-02-19 18:15:00+00	2026-02-19 18:30:00+00	\N	\N	f
951	237	Supplement for Platinum 	f	2026-02-19 18:15:46.644043	2026-02-19 16:00:00+00	2026-02-19 18:00:00+00	\N	\N	f
952	237	15 min Break	t	2026-02-19 18:15:53.866307	2026-02-19 18:00:00+00	2026-02-19 18:15:00+00	\N	\N	f
953	237	Supplemet for platinum 	f	2026-02-19 18:16:24.17781	2026-02-19 18:00:00+00	2026-02-19 18:15:00+00	\N	\N	f
954	237	15 min Break	t	2026-02-19 18:16:26.159892	2026-02-19 18:15:00+00	2026-02-19 18:30:00+00	\N	\N	f
955	235	15 min Break	t	2026-02-19 18:24:48.932911	2026-02-19 18:00:00+00	2026-02-19 18:15:00+00	\N	\N	f
956	234	Monday Scub 	f	2026-02-19 20:36:11.776354	2026-02-19 18:15:00+00	2026-02-19 20:15:00+00	\N	\N	f
957	234	15 min Break	t	2026-02-19 20:36:13.996334	2026-02-19 20:15:00+00	2026-02-19 20:30:00+00	\N	\N	f
958	235	Communication review • Outbound call shadow	f	2026-02-19 20:42:32.655919	2026-02-19 18:15:00+00	2026-02-19 20:15:00+00	\N	\N	f
959	235	30 min Lunch	t	2026-02-19 20:42:34.067349	2026-02-19 20:15:00+00	2026-02-19 20:45:00+00	\N	\N	f
960	237	15 min Break	t	2026-02-19 20:44:23.403229	2026-02-19 18:30:00+00	2026-02-19 18:45:00+00	\N	\N	f
961	237	Confirming supplement reviewed - Lan Thi Tran	f	2026-02-19 20:45:19.997232	2026-02-19 18:30:00+00	2026-02-19 20:30:00+00	\N	\N	f
962	237	15 min Break	t	2026-02-19 20:45:23.144504	2026-02-19 20:30:00+00	2026-02-19 20:45:00+00	\N	\N	f
963	237	Email Review	f	2026-02-19 20:45:42.047111	2026-02-19 20:30:00+00	2026-02-19 20:45:00+00	\N	\N	f
964	237	15 min Break	t	2026-02-19 20:45:42.66632	2026-02-19 20:45:00+00	2026-02-19 21:00:00+00	\N	\N	f
965	237	30 min Lunch	t	2026-02-19 22:16:22.906925	2026-02-19 21:00:00+00	2026-02-19 21:30:00+00	\N	\N	f
966	235	15 min Break	t	2026-02-19 22:32:00.618153	2026-02-19 20:15:00+00	2026-02-19 20:30:00+00	\N	\N	f
967	235	Email Review	f	2026-02-19 22:32:29.705897	2026-02-19 20:30:00+00	2026-02-19 21:30:00+00	\N	\N	f
968	235	30 min Lunch	t	2026-02-19 22:32:40.107593	2026-02-19 21:30:00+00	2026-02-19 22:00:00+00	\N	\N	f
969	235	Communication review	f	2026-02-19 23:47:02.21684	2026-02-19 22:00:00+00	2026-02-20 00:00:00+00	\N	\N	f
970	236	Sit in training with the team	f	2026-02-20 00:00:31.584084	2026-02-19 18:30:00+00	2026-02-19 20:30:00+00	\N	\N	f
971	236	15 min Break	t	2026-02-20 00:00:33.487207	2026-02-19 20:30:00+00	2026-02-19 20:45:00+00	\N	\N	f
972	237	Email review with LJ and tyler 	f	2026-02-20 00:00:45.259964	2026-02-19 21:30:00+00	2026-02-19 23:00:00+00	\N	\N	f
973	236	Sit in with the team • Copying scope - Tackett	f	2026-02-20 00:00:54.344205	2026-02-19 20:45:00+00	2026-02-19 22:45:00+00	\N	\N	f
974	236	15 min Break	t	2026-02-20 00:00:57.292902	2026-02-19 22:45:00+00	2026-02-19 23:00:00+00	\N	\N	f
975	237	Email Review 	f	2026-02-20 00:00:58.84249	2026-02-19 23:00:00+00	2026-02-20 00:00:00+00	\N	\N	f
976	236	Sit in with the Team - Comms training	f	2026-02-20 00:01:17.534138	2026-02-19 23:00:00+00	2026-02-20 00:00:00+00	\N	\N	f
977	234	Monday Scrubbing update 	f	2026-02-20 00:01:56.105432	2026-02-19 20:30:00+00	2026-02-19 22:30:00+00	\N	\N	f
978	234	15 min Break	t	2026-02-20 00:01:56.837808	2026-02-19 22:30:00+00	2026-02-19 22:45:00+00	\N	\N	f
979	234	Project Review with Tyler 	f	2026-02-20 00:02:15.942022	2026-02-19 22:45:00+00	2026-02-20 00:00:00+00	\N	\N	f
980	238	Supplement review with the team 	f	2026-02-20 17:33:47.012833	2026-02-20 16:00:00+00	2026-02-20 17:30:00+00	\N	\N	f
981	238	15 min Break	t	2026-02-20 17:33:47.598707	2026-02-20 17:30:00+00	2026-02-20 17:45:00+00	\N	\N	f
982	239	Communication Review • Damage ID huddle	f	2026-02-20 17:59:36.45261	2026-02-20 16:00:00+00	2026-02-20 18:00:00+00	\N	\N	f
983	239	15 min Break	t	2026-02-20 17:59:37.846872	2026-02-20 18:00:00+00	2026-02-20 18:15:00+00	\N	\N	f
984	238	Creating damage report for platinium with the team 	f	2026-02-20 19:00:22.290942	2026-02-20 17:45:00+00	2026-02-20 19:00:00+00	\N	\N	f
985	238	15 min Break	t	2026-02-20 19:00:23.557173	2026-02-20 19:00:00+00	2026-02-20 19:15:00+00	\N	\N	f
986	239	Supplement Review • Outbound call shadow	f	2026-02-20 20:07:55.683595	2026-02-20 18:15:00+00	2026-02-20 20:15:00+00	\N	\N	f
987	239	15 min Break	t	2026-02-20 20:07:57.473597	2026-02-20 20:15:00+00	2026-02-20 20:30:00+00	\N	\N	f
988	239	Acculynx Review • Outbound call shadow	f	2026-02-20 21:01:49.979709	2026-02-20 20:30:00+00	2026-02-20 22:30:00+00	\N	\N	f
989	239	30 min Lunch	t	2026-02-20 21:01:58.877825	2026-02-20 22:30:00+00	2026-02-20 23:00:00+00	\N	\N	f
990	240	Huddle	f	2026-02-20 21:46:23.576025	2026-02-20 16:00:00+00	2026-02-20 18:00:00+00	\N	\N	f
991	240	15 min Break	t	2026-02-20 21:46:23.691155	2026-02-20 18:00:00+00	2026-02-20 18:15:00+00	\N	\N	f
992	240	Email Audit • Monday Audit 	f	2026-02-20 21:46:38.846978	2026-02-20 18:15:00+00	2026-02-20 20:15:00+00	\N	\N	f
993	240	15 min Break	t	2026-02-20 21:46:39.64431	2026-02-20 20:15:00+00	2026-02-20 20:30:00+00	\N	\N	f
994	240	Outbound calls	f	2026-02-20 21:46:53.281888	2026-02-20 20:30:00+00	2026-02-20 22:30:00+00	\N	\N	f
995	240	15 min Break	t	2026-02-20 21:59:04.41166	2026-02-20 22:30:00+00	2026-02-20 22:45:00+00	\N	\N	f
996	239	Outbound Call Shadow • Week review	f	2026-02-20 21:59:13.731847	2026-02-20 23:00:00+00	2026-02-21 00:00:00+00	\N	\N	f
997	238	Confirming COC received - Boucher	f	2026-02-20 21:59:59.365439	2026-02-20 19:15:00+00	2026-02-20 21:00:00+00	\N	\N	f
998	238	15 min Break	t	2026-02-20 22:00:12.762321	2026-02-20 21:00:00+00	2026-02-20 21:15:00+00	\N	\N	f
999	238	Confirming COC received - Carmela Carungi	f	2026-02-20 22:00:35.111506	2026-02-20 21:00:00+00	2026-02-20 23:00:00+00	\N	\N	f
1002	238	Email Review 	f	2026-02-20 22:00:44.217849	2026-02-20 23:00:00+00	2026-02-21 00:00:00+00	\N	\N	f
1006	213	Review supplement with Mitchele 	f	2026-02-20 22:00:55.674215	2026-02-14 09:00:00+00	2026-02-14 11:00:00+00	\N	\N	f
1007	213	15 min Break	t	2026-02-20 22:00:55.674215	2026-02-14 11:00:00+00	2026-02-14 11:15:00+00	\N	\N	f
1008	213	Review supplemet with Mitchele 	f	2026-02-20 22:00:55.674215	2026-02-14 11:00:00+00	2026-02-14 11:45:00+00	\N	\N	f
1009	213	15 min Break	t	2026-02-20 22:00:55.674215	2026-02-14 11:45:00+00	2026-02-14 12:00:00+00	\N	\N	f
1010	213	Aqulinks email review 	f	2026-02-20 22:00:55.674215	2026-02-14 12:00:00+00	2026-02-14 14:00:00+00	\N	\N	f
1011	213	15 min Break	t	2026-02-20 22:00:55.674215	2026-02-14 14:00:00+00	2026-02-14 14:15:00+00	\N	\N	f
1012	213	Aqulinks email review 	f	2026-02-20 22:00:55.674215	2026-02-14 14:15:00+00	2026-02-14 16:00:00+00	\N	\N	f
1015	218	Acculynx email review with Tyler 	f	2026-02-20 22:01:11.581696	2026-02-15 09:00:00+00	2026-02-15 11:00:00+00	\N	\N	f
1016	218	15 min Break	t	2026-02-20 22:01:11.581696	2026-02-15 11:00:00+00	2026-02-15 11:15:00+00	\N	\N	f
1017	218	15 min Break	t	2026-02-20 22:01:11.581696	2026-02-15 11:15:00+00	2026-02-15 11:30:00+00	\N	\N	f
1021	218	Call shadow with LJ 	f	2026-02-20 22:01:11.581696	2026-02-15 13:45:00+00	2026-02-15 15:00:00+00	\N	\N	f
1022	218	Call Shadow with LJ	f	2026-02-20 22:01:11.581696	2026-02-15 15:00:00+00	2026-02-15 16:00:00+00	\N	\N	f
1023	242	Huddle  • Acculynx Notification • Email Hygiene- Fullscope   • Email Hygiene- Fullscope  Everguard	f	2026-02-23 15:20:50.21439	2026-02-22 16:00:00+00	2026-02-22 18:00:00+00	\N	\N	f
1024	242	15 min Break	t	2026-02-23 15:20:50.709519	2026-02-22 18:00:00+00	2026-02-22 18:15:00+00	\N	\N	f
1025	242	15 min Break	t	2026-02-23 15:21:07.068566	2026-02-23 04:00:00+00	2026-02-23 04:15:00+00	\N	\N	f
1028	244	Confirming supplement reviewed - Tim Owen • Follow up supplement status - William and Genie Roberts  • Follow up status of Supplemet - Ryan Octavio  • Confirming supplement received - Boucher • Confirming COC received - Delaney	f	2026-02-23 15:54:55.69637	2026-02-23 02:00:00+00	2026-02-23 04:00:00+00	\N	\N	f
1029	244	15 min Break	t	2026-02-23 15:54:57.02707	2026-02-23 04:00:00+00	2026-02-23 04:15:00+00	\N	\N	f
1037	245	Sit in with the team in Zoom.	f	2026-02-23 16:21:31.793825	2026-02-24 02:00:00+00	2026-02-24 04:00:00+00	\N	\N	f
1038	245	15 min Break	t	2026-02-23 17:37:02.949161	2026-02-24 04:00:00+00	2026-02-24 04:15:00+00	\N	\N	f
1039	242	Review Supplement 	f	2026-02-23 17:53:19.926127	2026-02-23 04:15:00+00	2026-02-23 06:15:00+00	\N	\N	f
1040	242	30 min Lunch	t	2026-02-23 17:53:29.74482	2026-02-23 06:15:00+00	2026-02-23 06:45:00+00	\N	\N	f
1041	242	15 min Break	t	2026-02-23 17:53:36.396432	2026-02-23 06:15:00+00	2026-02-23 06:30:00+00	\N	\N	f
1042	244	Supplement review with the team 	f	2026-02-23 18:23:41.886631	2026-02-23 04:15:00+00	2026-02-23 06:15:00+00	\N	\N	f
1043	245	Meeting with tyler. • Review on Devine • Added Steinberg and Junker in monday • Review - Steinberg	f	2026-02-23 18:23:48.399738	2026-02-24 04:15:00+00	2026-02-24 06:15:00+00	\N	\N	f
1044	244	Supplement review with the team 	f	2026-02-23 18:23:56.346903	2026-02-23 06:15:00+00	2026-02-23 06:30:00+00	\N	\N	f
1045	244	15 min Break	t	2026-02-23 18:23:58.190708	2026-02-23 06:30:00+00	2026-02-23 06:45:00+00	\N	\N	f
1046	245	15 min Break	t	2026-02-23 18:24:16.925751	2026-02-24 06:15:00+00	2026-02-24 06:30:00+00	\N	\N	f
1049	244	Monday Update 	f	2026-02-23 18:49:11.105315	2026-02-23 06:45:00+00	2026-02-23 08:45:00+00	\N	\N	f
1051	242	Monday Info Update 	f	2026-02-23 20:00:23.472749	2026-02-23 06:30:00+00	2026-02-23 08:30:00+00	\N	\N	f
1052	242	15 min Break	t	2026-02-23 20:35:58.133556	2026-02-23 08:30:00+00	2026-02-23 08:45:00+00	\N	\N	f
1053	244	15 min Break	t	2026-02-23 20:36:36.842995	2026-02-23 08:45:00+00	2026-02-23 09:00:00+00	\N	\N	f
1055	244	15 min Break	t	2026-02-23 20:37:23.631084	2026-02-23 08:30:00+00	2026-02-23 08:45:00+00	\N	\N	f
1056	245	Sit in with the team in Zoom	f	2026-02-23 20:37:42.867914	2026-02-24 06:30:00+00	2026-02-24 08:30:00+00	\N	\N	f
1057	245	15 min Break	t	2026-02-23 20:37:44.193378	2026-02-24 08:30:00+00	2026-02-24 08:45:00+00	\N	\N	f
1060	242	Monday Update info • Follow Back for Easler 	f	2026-02-23 21:54:37.672258	2026-02-23 08:45:00+00	2026-02-23 10:00:00+00	\N	\N	f
1061	244	Confirmation of the receipt of final Bill - Easler  • Monday Update 	f	2026-02-23 21:55:04.280653	2026-02-23 08:45:00+00	2026-02-23 10:00:00+00	\N	\N	f
1062	245	Copying scope - Johnston • Writing supplement - Johnston • Writing supplement - Kinsman	f	2026-02-23 22:46:20.475307	2026-02-24 08:45:00+00	2026-02-24 10:45:00+00	\N	\N	f
1063	241	Training with the team	f	2026-02-24 04:00:51.640227	2026-02-21 09:00:00+00	2026-02-21 11:00:00+00	\N	\N	f
1064	241	15 min Break	t	2026-02-24 04:00:51.640227	2026-02-21 11:00:00+00	2026-02-21 11:15:00+00	\N	\N	f
1065	241	Training with the team	f	2026-02-24 04:00:51.640227	2026-02-21 11:15:00+00	2026-02-21 13:15:00+00	\N	\N	f
1066	241	15 min Break	t	2026-02-24 04:00:51.640227	2026-02-21 13:15:00+00	2026-02-21 13:30:00+00	\N	\N	f
1067	241	Training with the team	f	2026-02-24 04:00:51.640227	2026-02-21 13:30:00+00	2026-02-21 15:30:00+00	\N	\N	f
1068	241	15 min Break	t	2026-02-24 04:00:51.640227	2026-02-21 15:30:00+00	2026-02-21 15:45:00+00	\N	\N	f
1069	241	Training with the team	f	2026-02-24 04:00:51.640227	2026-02-21 15:45:00+00	2026-02-21 17:45:00+00	\N	\N	f
1070	246	Email communication review • Confirming COC call shadow	f	2026-02-24 15:49:37.158047	2026-02-24 14:00:00+00	2026-02-24 16:00:00+00	\N	\N	f
1071	246	15 min Break	t	2026-02-24 15:49:55.79493	2026-02-24 16:00:00+00	2026-02-24 16:15:00+00	\N	\N	f
1072	246	Supplement review	f	2026-02-24 15:50:11.23762	2026-02-24 16:15:00+00	2026-02-24 18:15:00+00	\N	\N	f
1073	246	15 min Break	t	2026-02-24 15:50:11.635194	2026-02-24 18:15:00+00	2026-02-24 18:30:00+00	\N	\N	f
1074	246	Monday Update	f	2026-02-24 15:50:26.193318	2026-02-24 18:30:00+00	2026-02-24 20:30:00+00	\N	\N	f
1075	246	15 min Break	t	2026-02-24 15:50:27.383615	2026-02-24 20:30:00+00	2026-02-24 20:45:00+00	\N	\N	f
1076	246	Monday Update	f	2026-02-24 15:50:45.603945	2026-02-24 20:45:00+00	2026-02-24 21:45:00+00	\N	\N	f
1077	246	15 min Break	t	2026-02-24 15:50:48.594849	2026-02-24 21:45:00+00	2026-02-24 22:00:00+00	\N	\N	f
1078	247	Supplement review with the team	f	2026-02-24 18:08:15.111604	2026-02-24 16:00:00+00	2026-02-24 18:00:00+00	\N	\N	f
1079	247	15 min Break	t	2026-02-24 18:08:15.340099	2026-02-24 18:00:00+00	2026-02-24 18:15:00+00	\N	\N	f
1080	248	Call Listening • Monday Update	f	2026-02-24 18:09:24.841253	2026-02-24 16:00:00+00	2026-02-24 18:00:00+00	\N	\N	f
1081	248	15 min Break	t	2026-02-24 18:09:25.013624	2026-02-24 18:00:00+00	2026-02-24 18:15:00+00	\N	\N	f
1082	249	Huddle  • Email Audit  • Supplement Review  • Call Listening	f	2026-02-24 18:09:33.619561	2026-02-24 16:00:00+00	2026-02-24 18:00:00+00	\N	\N	f
1083	249	15 min Break	t	2026-02-24 18:09:35.999108	2026-02-24 18:00:00+00	2026-02-24 18:15:00+00	\N	\N	f
1084	250	Zoom with the team • Review supplement - Kinsman • Review supplement - Johnston • Listened to adjuster call	f	2026-02-24 18:18:46.152475	2026-02-24 16:00:00+00	2026-02-24 18:00:00+00	\N	\N	f
1085	250	15 min Break	t	2026-02-24 18:18:46.753765	2026-02-24 18:00:00+00	2026-02-24 18:15:00+00	\N	\N	f
1086	248	Outbound call shadow • Monday Update	f	2026-02-24 20:09:20.428087	2026-02-24 18:15:00+00	2026-02-24 20:15:00+00	\N	\N	f
1087	248	15 min Break	t	2026-02-24 20:12:34.705792	2026-02-24 20:15:00+00	2026-02-24 20:30:00+00	\N	\N	f
1088	247	Do outbound call 	f	2026-02-24 20:14:26.584788	2026-02-24 18:15:00+00	2026-02-24 20:15:00+00	\N	\N	f
1089	247	15 min Break	t	2026-02-24 20:14:32.082721	2026-02-24 20:15:00+00	2026-02-24 20:30:00+00	\N	\N	f
1090	248	Monday Update • Communication review	f	2026-02-24 20:47:55.98519	2026-02-24 20:30:00+00	2026-02-24 22:00:00+00	\N	\N	f
1091	248	30 min Lunch	t	2026-02-24 20:48:08.66506	2026-02-24 22:00:00+00	2026-02-24 22:30:00+00	\N	\N	f
1092	249	Outbound Calls  • Notification Review  • Monday Update 	f	2026-02-24 22:02:55.36882	2026-02-24 18:15:00+00	2026-02-24 20:15:00+00	\N	\N	f
1093	249	15 min Break	t	2026-02-24 22:02:56.102275	2026-02-24 20:15:00+00	2026-02-24 20:30:00+00	\N	\N	f
1094	249	Repair Video Review  • Acculynx Note and Update Review  • PM pending action item review 	f	2026-02-24 22:03:38.457204	2026-02-24 20:30:00+00	2026-02-24 22:30:00+00	\N	\N	f
1095	249	15 min Break	t	2026-02-24 22:03:44.718877	2026-02-24 22:30:00+00	2026-02-24 22:45:00+00	\N	\N	f
1096	250	Zoom with the team	f	2026-02-24 22:06:50.693689	2026-02-24 18:15:00+00	2026-02-24 20:00:00+00	\N	\N	f
1097	250	15 min Break	t	2026-02-24 22:06:51.567798	2026-02-24 20:00:00+00	2026-02-24 20:15:00+00	\N	\N	f
1098	250	Completed supplement for Kinsman • Added supp docs to dropbox • Updated monday • Zoom with the team • Watched the video repair for Bruno and Begley	f	2026-02-24 22:08:18.327728	2026-02-24 20:15:00+00	2026-02-24 22:00:00+00	\N	\N	f
1099	247	Email review with the team and monday update 	f	2026-02-24 22:30:43.555222	2026-02-24 20:30:00+00	2026-02-24 22:30:00+00	\N	\N	f
1100	247	15 min Break	t	2026-02-24 22:30:44.810737	2026-02-24 22:30:00+00	2026-02-24 22:45:00+00	\N	\N	f
1101	249	Huddle 	f	2026-02-24 22:47:35.026986	2026-02-24 22:45:00+00	2026-02-25 00:00:00+00	\N	\N	f
1102	247	Email Review 	f	2026-02-24 22:49:44.796336	2026-02-24 22:45:00+00	2026-02-25 00:00:00+00	\N	\N	f
1103	250	15 min Break	t	2026-02-24 23:06:12.142052	2026-02-24 22:00:00+00	2026-02-24 22:15:00+00	\N	\N	f
1104	248	Monday Update	f	2026-02-24 23:12:40.270588	2026-02-24 22:30:00+00	2026-02-25 00:00:00+00	\N	\N	f
1105	251	Monday Update	f	2026-02-25 15:50:13.799982	2026-02-25 14:00:00+00	2026-02-25 16:00:00+00	\N	\N	f
1106	251	15 min Break	t	2026-02-25 16:00:45.092994	2026-02-25 16:00:00+00	2026-02-25 16:15:00+00	\N	\N	f
1107	252	do Outbound 	f	2026-02-25 16:00:50.196128	2026-02-26 02:00:00+00	2026-02-26 04:00:00+00	\N	\N	f
1108	252	15 min Break	t	2026-02-25 16:00:50.83696	2026-02-26 04:00:00+00	2026-02-26 04:15:00+00	\N	\N	f
1109	253	Acculynx Vs Monday  • Admin Email  • Outbound assist 	f	2026-02-25 16:24:17.53827	2026-02-26 14:00:00+00	2026-02-26 16:00:00+00	\N	\N	f
1110	253	15 min Break	t	2026-02-25 16:24:17.899012	2026-02-26 16:00:00+00	2026-02-26 16:15:00+00	\N	\N	f
1111	253	Outbound Audit 	f	2026-02-25 16:24:30.383405	2026-02-26 16:15:00+00	2026-02-26 18:15:00+00	\N	\N	f
1112	251	Monday Update • Huddle with Tyler	f	2026-02-25 18:11:22.06474	2026-02-25 16:15:00+00	2026-02-25 18:15:00+00	\N	\N	f
1113	250	Zoom with the team	f	2026-02-25 18:23:18.764428	2026-02-24 22:15:00+00	2026-02-25 00:00:00+00	\N	\N	f
1114	254	Zoom with the team	f	2026-02-25 18:24:48.716935	2026-02-26 02:00:00+00	2026-02-26 04:00:00+00	\N	\N	f
1115	254	15 min Break	t	2026-02-25 18:24:49.283948	2026-02-26 04:00:00+00	2026-02-26 04:15:00+00	\N	\N	f
1116	254	Zoom with the team	f	2026-02-25 18:25:10.452945	2026-02-26 04:15:00+00	2026-02-26 06:00:00+00	\N	\N	f
1117	252	Confirming supplement reviewed - Tran • Confirming supplement reviewed - Clark • Confirming depreciation released - Delaney	f	2026-02-25 18:47:53.645779	2026-02-26 04:15:00+00	2026-02-26 06:15:00+00	\N	\N	f
1118	252	15 min Break	t	2026-02-25 18:47:55.896293	2026-02-26 06:15:00+00	2026-02-26 06:30:00+00	\N	\N	f
1119	252	Review emails	f	2026-02-25 18:48:13.464277	2026-02-26 06:15:00+00	2026-02-26 06:45:00+00	\N	\N	f
1120	252	15 min Break	t	2026-02-25 18:48:14.328384	2026-02-26 06:45:00+00	2026-02-26 07:00:00+00	\N	\N	f
1121	254	Zoom with the team	f	2026-02-25 18:48:52.078828	2026-02-26 06:00:00+00	2026-02-26 07:00:00+00	\N	\N	f
1122	254	15 min Break	t	2026-02-25 18:48:54.50167	2026-02-26 07:00:00+00	2026-02-26 07:15:00+00	\N	\N	f
1123	251	Monday Update	f	2026-02-25 19:17:13.469981	2026-02-25 18:15:00+00	2026-02-25 19:45:00+00	\N	\N	f
1124	251	15 min Break	t	2026-02-25 19:17:15.234815	2026-02-25 19:45:00+00	2026-02-25 20:00:00+00	\N	\N	f
1125	251	15 min Break	t	2026-02-25 19:18:26.913706	2026-02-25 18:45:00+00	2026-02-25 19:00:00+00	\N	\N	f
1126	251	Monday Update	f	2026-02-25 19:18:43.072729	2026-02-25 19:00:00+00	2026-02-25 20:00:00+00	\N	\N	f
1127	251	30 min Lunch	t	2026-02-25 20:13:30.055139	2026-02-25 21:00:00+00	2026-02-25 21:30:00+00	\N	\N	f
1128	253	Monday Scrubbing Manual Output 	f	2026-02-25 20:41:36.700985	2026-02-26 18:15:00+00	2026-02-26 20:15:00+00	\N	\N	f
1129	253	15 min Break	t	2026-02-25 20:41:49.523202	2026-02-26 18:15:00+00	2026-02-26 18:30:00+00	\N	\N	f
1130	253	Monday Scrubbing Manual Output	f	2026-02-25 20:41:57.400104	2026-02-26 18:30:00+00	2026-02-26 20:30:00+00	\N	\N	f
1131	252	Monday update 	f	2026-02-25 20:42:36.378677	2026-02-26 07:00:00+00	2026-02-26 08:45:00+00	\N	\N	f
1132	252	30 min Lunch	t	2026-02-25 20:43:55.76661	2026-02-26 08:45:00+00	2026-02-26 09:15:00+00	\N	\N	f
1133	251	30 min Lunch	t	2026-02-25 20:44:13.644799	2026-02-25 20:45:00+00	2026-02-25 21:15:00+00	\N	\N	f
1134	254	Updating project data • Zoom with Team	f	2026-02-25 21:37:57.787762	2026-02-26 07:15:00+00	2026-02-26 09:00:00+00	\N	\N	f
1135	254	15 min Break	t	2026-02-25 21:37:59.951924	2026-02-26 09:00:00+00	2026-02-26 09:15:00+00	\N	\N	f
1136	253	15 min Break	t	2026-02-25 22:04:23.904476	2026-02-26 20:30:00+00	2026-02-26 20:45:00+00	\N	\N	f
1137	253	Review for Pending action items 	f	2026-02-25 22:04:39.461475	2026-02-26 20:45:00+00	2026-02-26 22:00:00+00	\N	\N	f
1138	252	Monday update	f	2026-02-25 22:05:05.904116	2026-02-26 09:15:00+00	2026-02-26 10:00:00+00	\N	\N	f
1139	251	Monday Update	f	2026-02-25 22:05:45.728926	2026-02-25 21:15:00+00	2026-02-25 22:00:00+00	\N	\N	f
1140	254	Zoom with Team • Updating project data - Monday and Excel	f	2026-02-25 22:13:46.437339	2026-02-26 09:15:00+00	2026-02-26 10:00:00+00	\N	\N	f
1141	255	Monday Update	f	2026-02-26 14:12:16.93231	2026-02-26 14:00:00+00	2026-02-26 16:00:00+00	\N	\N	f
1142	256	Backlog Audit for Monday 	f	2026-02-26 14:56:33.383696	2026-02-26 02:00:00+00	2026-02-26 04:00:00+00	\N	\N	f
1143	256	15 min Break	t	2026-02-26 16:01:23.432648	2026-02-26 04:00:00+00	2026-02-26 04:15:00+00	\N	\N	f
1144	257	Monday update 	f	2026-02-26 16:01:58.684393	2026-02-27 02:00:00+00	2026-02-27 04:00:00+00	\N	\N	f
1145	257	15 min Break	t	2026-02-26 16:01:59.077397	2026-02-27 04:00:00+00	2026-02-27 04:15:00+00	\N	\N	f
1146	256	Monday Audit 	f	2026-02-26 16:25:40.361964	2026-02-26 04:15:00+00	2026-02-26 06:15:00+00	\N	\N	f
1147	256	15 min Break	t	2026-02-26 16:26:09.877325	2026-02-26 06:15:00+00	2026-02-26 06:30:00+00	\N	\N	f
1148	255	15 min Break	t	2026-02-26 17:16:01.496631	2026-02-26 16:00:00+00	2026-02-26 16:15:00+00	\N	\N	f
1149	255	Monday Update	f	2026-02-26 17:17:29.13821	2026-02-26 16:15:00+00	2026-02-26 18:15:00+00	\N	\N	f
1150	255	15 min Break	t	2026-02-26 18:15:19.825138	2026-02-26 18:15:00+00	2026-02-26 18:30:00+00	\N	\N	f
1151	257	Do outbound 111 - EG-2025-299 - Carungi2 129 - EG-20260026 - Delaney 116 - EG-2025-293 - Heise140 - EG-20260046 - Kinsman • Monday Update 	f	2026-02-26 18:15:59.795124	2026-02-27 04:15:00+00	2026-02-27 06:15:00+00	\N	\N	f
1152	257	15 min Break	t	2026-02-26 18:16:00.644206	2026-02-27 06:15:00+00	2026-02-27 06:30:00+00	\N	\N	f
1153	255	Monday Update	f	2026-02-26 20:06:52.441598	2026-02-26 18:30:00+00	2026-02-26 20:30:00+00	\N	\N	f
1154	255	30 min Lunch	t	2026-02-26 20:06:54.533546	2026-02-26 20:30:00+00	2026-02-26 21:00:00+00	\N	\N	f
1155	257	Monday update 	f	2026-02-26 21:12:17.86625	2026-02-27 06:30:00+00	2026-02-27 08:30:00+00	\N	\N	f
1156	257	Monday update	f	2026-02-26 21:12:30.356138	2026-02-27 08:30:00+00	2026-02-27 09:15:00+00	\N	\N	f
1157	257	30 min Lunch	t	2026-02-26 21:12:31.622088	2026-02-27 09:15:00+00	2026-02-27 09:45:00+00	\N	\N	f
1158	257	Monday Update 	f	2026-02-26 21:14:21.592907	2026-02-27 08:30:00+00	2026-02-27 10:00:00+00	\N	\N	f
1159	256	Monday Audit 	f	2026-02-26 21:15:53.047986	2026-02-26 06:30:00+00	2026-02-26 08:30:00+00	\N	\N	f
1160	256	15 min Break	t	2026-02-26 21:15:54.047587	2026-02-26 08:30:00+00	2026-02-26 08:45:00+00	\N	\N	f
1161	256	Monday Audit 	f	2026-02-26 21:16:06.414176	2026-02-26 08:45:00+00	2026-02-26 10:00:00+00	\N	\N	f
1162	257	30 min Lunch	t	2026-02-26 21:16:33.187815	2026-02-27 09:15:00+00	2026-02-27 09:45:00+00	\N	\N	f
1163	257	Monday update 	f	2026-02-26 21:28:01.276905	2026-02-27 09:15:00+00	2026-02-27 09:45:00+00	\N	\N	f
1164	257	15 min Break	t	2026-02-26 21:28:02.03141	2026-02-27 09:45:00+00	2026-02-27 10:00:00+00	\N	\N	f
1165	255	Monday Update	f	2026-02-26 21:32:11.546013	2026-02-26 21:00:00+00	2026-02-26 22:00:00+00	\N	\N	f
1166	258	Zoom with Team • Continuation with Monday task	f	2026-02-27 10:41:37.011217	2026-02-27 02:00:00+00	2026-02-27 04:00:00+00	\N	\N	f
1167	258	15 min Break	t	2026-02-27 10:41:37.503241	2026-02-27 04:00:00+00	2026-02-27 04:15:00+00	\N	\N	f
1168	258	Zoom with Team • Continuation with Monday task	f	2026-02-27 10:41:47.187132	2026-02-27 04:15:00+00	2026-02-27 06:00:00+00	\N	\N	f
1169	258	15 min Break	t	2026-02-27 10:41:47.945993	2026-02-27 06:00:00+00	2026-02-27 06:15:00+00	\N	\N	f
1170	258	Zoom with Team • Continuation with Monday task	f	2026-02-27 10:41:56.894607	2026-02-27 06:15:00+00	2026-02-27 08:00:00+00	\N	\N	f
1171	258	15 min Break	t	2026-02-27 10:41:57.584494	2026-02-27 08:00:00+00	2026-02-27 08:15:00+00	\N	\N	f
1172	258	Zoom with Team • Continuation with Monday task	f	2026-02-27 10:42:07.012597	2026-02-27 08:15:00+00	2026-02-27 10:00:00+00	\N	\N	f
1173	259	Email Audit  • Task Assignment for Outbound	f	2026-02-27 15:07:59.745301	2026-02-27 02:00:00+00	2026-02-27 04:00:00+00	\N	\N	f
1174	259	15 min Break	t	2026-02-27 15:07:59.949902	2026-02-27 04:00:00+00	2026-02-27 04:15:00+00	\N	\N	f
1175	260	Monday Update • Email Communication review	f	2026-02-27 15:56:33.508758	2026-02-27 14:00:00+00	2026-02-27 16:00:00+00	\N	\N	f
1176	260	15 min Break	t	2026-02-27 15:56:33.64161	2026-02-27 16:00:00+00	2026-02-27 16:15:00+00	\N	\N	f
1177	261	Monday Update 	f	2026-02-27 16:29:48.751094	2026-02-28 02:00:00+00	2026-02-28 04:00:00+00	\N	\N	f
1178	261	15 min Break	t	2026-02-27 16:29:50.007773	2026-02-28 04:00:00+00	2026-02-28 04:15:00+00	\N	\N	f
1179	260	Outbound Call - Owen • Outbound Call - Ryan • Outbound Call - Tran	f	2026-02-27 17:05:12.574514	2026-02-27 16:15:00+00	2026-02-27 18:15:00+00	\N	\N	f
1180	260	15 min Break	t	2026-02-27 18:08:50.603494	2026-02-27 18:15:00+00	2026-02-27 18:30:00+00	\N	\N	f
1181	261	Confirming COC received - 109-EG-2025-217- John/Brandy Clark- • Confirming supplement reviewed - 130-EG-2026-0061-Owen	f	2026-02-27 18:09:51.633405	2026-02-28 04:15:00+00	2026-02-28 06:00:00+00	\N	\N	f
1182	261	15 min Break	t	2026-02-27 18:09:52.856622	2026-02-28 06:00:00+00	2026-02-28 06:15:00+00	\N	\N	f
1183	259	Monday audit 	f	2026-02-27 19:08:06.45379	2026-02-27 04:15:00+00	2026-02-27 06:15:00+00	\N	\N	f
1184	259	15 min Break	t	2026-02-27 19:08:07.304973	2026-02-27 06:15:00+00	2026-02-27 06:30:00+00	\N	\N	f
1185	259	Monday Audit 	f	2026-02-27 19:08:22.120104	2026-02-27 06:30:00+00	2026-02-27 08:30:00+00	\N	\N	f
1186	260	Outbound call shadow • Monday audit	f	2026-02-27 19:54:22.666441	2026-02-27 18:30:00+00	2026-02-27 20:30:00+00	\N	\N	f
1187	260	30 min Lunch	t	2026-02-27 19:54:24.257503	2026-02-27 20:30:00+00	2026-02-27 21:00:00+00	\N	\N	f
1188	261	outbound for 120-EG-2025-201-Ryan 136-EG-2025-202-Tran • Monday update 	f	2026-02-27 20:47:09.498636	2026-02-28 06:15:00+00	2026-02-28 08:15:00+00	\N	\N	f
1189	261	outbound for 104-EG-2025-287-Hanse 105-EG-2025-289-Carungi	f	2026-02-27 20:47:26.266183	2026-02-28 08:15:00+00	2026-02-28 08:45:00+00	\N	\N	f
1190	261	30 min Lunch	t	2026-02-27 20:47:27.107952	2026-02-28 08:45:00+00	2026-02-28 09:15:00+00	\N	\N	f
1191	259	15 min Break	t	2026-02-27 21:23:49.089769	2026-02-27 08:30:00+00	2026-02-27 08:45:00+00	\N	\N	f
1192	259	Monday Audit 	f	2026-02-27 21:23:55.51401	2026-02-27 08:45:00+00	2026-02-27 10:00:00+00	\N	\N	f
1193	261	Recap task for today 	f	2026-02-27 21:25:47.244036	2026-02-28 09:15:00+00	2026-02-28 10:00:00+00	\N	\N	f
1194	260	Monday Audit • Task Recap	f	2026-02-27 21:29:32.040581	2026-02-27 21:00:00+00	2026-02-27 22:00:00+00	\N	\N	f
1195	262	Zoom with team - Cont. of Monday task	f	2026-02-28 13:59:29.174396	2026-02-28 02:00:00+00	2026-02-28 04:00:00+00	\N	\N	f
1196	262	15 min Break	t	2026-02-28 13:59:29.191396	2026-02-28 04:00:00+00	2026-02-28 04:15:00+00	\N	\N	f
1197	262	Zoom with team - Cont. of Monday task	f	2026-02-28 13:59:32.66989	2026-02-28 04:15:00+00	2026-02-28 06:00:00+00	\N	\N	f
1198	262	15 min Break	t	2026-02-28 13:59:35.838867	2026-02-28 06:00:00+00	2026-02-28 06:15:00+00	\N	\N	f
1199	262	Zoom with team - Cont. of Monday task • Quick meeting with Mitchell	f	2026-02-28 13:59:47.97889	2026-02-28 06:15:00+00	2026-02-28 08:00:00+00	\N	\N	f
1200	262	15 min Break	t	2026-02-28 13:59:48.780674	2026-02-28 08:00:00+00	2026-02-28 08:15:00+00	\N	\N	f
1201	262	Zoom with team - Cont. of Monday task • Quick meeting with Tyler	f	2026-02-28 14:00:03.876769	2026-02-28 08:15:00+00	2026-02-28 10:00:00+00	\N	\N	f
1202	263	Copying Scope Shadow with Tyler • Copying scope - Ochoa	f	2026-03-01 01:15:58.695516	2026-02-28 23:15:00+00	2026-03-01 01:15:00+00	\N	\N	f
1203	264	Writing supplement - SD7 - Swieca	f	2026-03-01 01:44:38.506659	2026-02-28 23:15:00+00	2026-03-01 01:15:00+00	\N	\N	f
1204	264	Supplement writing 	f	2026-03-01 01:44:55.931912	2026-03-01 01:15:00+00	2026-03-01 01:45:00+00	\N	\N	f
1205	263	Copy Scope Shadow	f	2026-03-01 01:45:11.87103	2026-03-01 01:15:00+00	2026-03-01 01:45:00+00	\N	\N	f
1206	265	Scope Copy for Steve Downs	f	2026-03-01 01:45:43.704178	2026-02-28 23:15:00+00	2026-03-01 01:15:00+00	\N	\N	f
1207	265	Scope Copy for Steve Downs	f	2026-03-01 01:45:55.688845	2026-03-01 01:15:00+00	2026-03-01 01:45:00+00	\N	\N	f
1208	266	Email Communication review • Copying scope - KASUBOSKE	f	2026-03-02 16:11:20.561114	2026-03-03 14:00:00+00	2026-03-03 16:00:00+00	\N	\N	f
1209	266	15 min Break	t	2026-03-02 16:11:21.10644	2026-03-03 16:00:00+00	2026-03-03 16:15:00+00	\N	\N	f
1212	268	15 min Break	t	2026-03-02 16:16:04.807392	2026-03-02 14:45:00+00	2026-03-02 15:00:00+00	\N	\N	f
1213	269	Email and Notification • Notification Readout 	f	2026-03-02 16:16:28.60312	2026-03-03 14:00:00+00	2026-03-03 16:00:00+00	\N	\N	f
1214	269	15 min Break	t	2026-03-02 16:16:29.879501	2026-03-03 16:00:00+00	2026-03-03 16:15:00+00	\N	\N	f
1217	268	Reviewing comms questions 	f	2026-03-02 16:16:46.165338	2026-03-02 14:45:00+00	2026-03-02 16:15:00+00	\N	\N	f
1218	268	15 min Break	t	2026-03-02 16:16:53.707826	2026-03-02 16:15:00+00	2026-03-02 16:30:00+00	\N	\N	f
1219	268	15 min Break	t	2026-03-02 17:32:39.184826	2026-03-02 16:45:00+00	2026-03-02 17:00:00+00	\N	\N	f
1220	268	yolvi call	f	2026-03-02 17:33:02.211364	2026-03-02 17:00:00+00	2026-03-02 17:15:00+00	\N	\N	t
1221	268	reviewed with LJ • Review with Crista/Rein	f	2026-03-02 17:34:29.825957	2026-03-02 17:15:00+00	2026-03-02 17:30:00+00	\N	\N	f
1222	266	SUPPLEMENT TRAINING	f	2026-03-02 17:52:39.633603	2026-03-03 16:15:00+00	2026-03-03 18:00:00+00	\N	\N	f
1223	266	15 min Break	t	2026-03-02 17:52:41.441142	2026-03-03 18:00:00+00	2026-03-03 18:15:00+00	\N	\N	f
1224	270	Writing supplement - Kasuboske • Sit in with Rein	f	2026-03-02 18:00:18.857319	2026-03-03 02:00:00+00	2026-03-03 04:00:00+00	\N	\N	f
1225	270	15 min Break	t	2026-03-02 18:00:18.952938	2026-03-03 04:00:00+00	2026-03-03 04:15:00+00	\N	\N	f
1226	270	Sit in with Rein	f	2026-03-02 18:00:26.341296	2026-03-03 04:15:00+00	2026-03-03 06:00:00+00	\N	\N	f
1227	270	15 min Break	t	2026-03-02 18:00:28.065442	2026-03-03 06:00:00+00	2026-03-03 06:15:00+00	\N	\N	f
1228	268	Cleaning up glass in backyard  • phone call with mom & mitchell 	f	2026-03-02 18:36:26.165585	2026-03-02 17:30:00+00	2026-03-02 18:30:00+00	\N	\N	t
1229	269	Confirming COC received - Clark	f	2026-03-02 18:41:09.983988	2026-03-03 16:15:00+00	2026-03-03 18:15:00+00	\N	\N	f
1233	266	Writing supplement - TRAINING1	f	2026-03-02 19:43:40.162408	2026-03-03 18:15:00+00	2026-03-03 19:45:00+00	\N	\N	f
1234	266	30 min Lunch	t	2026-03-02 19:43:43.699725	2026-03-03 19:45:00+00	2026-03-03 20:15:00+00	\N	\N	f
1235	270	Sit in with Rein	f	2026-03-02 20:16:24.678407	2026-03-03 06:15:00+00	2026-03-03 08:00:00+00	\N	\N	f
1236	270	15 min Break	t	2026-03-02 20:16:25.621415	2026-03-03 08:00:00+00	2026-03-03 08:15:00+00	\N	\N	f
1237	268	reviewing with LJ and Girly 	f	2026-03-02 20:50:42.469548	2026-03-02 18:30:00+00	2026-03-02 19:00:00+00	\N	\N	f
1238	266	Copying scope - Training2	f	2026-03-02 22:01:43.649076	2026-03-03 20:15:00+00	2026-03-03 22:15:00+00	\N	\N	f
1239	269	Outbound calls and Review 	f	2026-03-02 22:14:11.669686	2026-03-03 18:15:00+00	2026-03-03 20:15:00+00	\N	\N	f
1240	269	15 min Break	t	2026-03-02 22:14:12.713718	2026-03-03 20:15:00+00	2026-03-03 20:30:00+00	\N	\N	f
1242	269	15 min Break	t	2026-03-02 22:15:21.541914	2026-03-03 18:15:00+00	2026-03-03 18:30:00+00	\N	\N	f
1244	269	Outbound calls 	f	2026-03-02 22:15:34.970457	2026-03-03 18:30:00+00	2026-03-03 20:30:00+00	\N	\N	f
1245	269	15 min Break	t	2026-03-02 22:15:52.661601	2026-03-03 20:30:00+00	2026-03-03 20:45:00+00	\N	\N	f
1246	269	Acculynx Update  • Gemini exploration	f	2026-03-02 22:16:17.872485	2026-03-03 20:45:00+00	2026-03-03 22:15:00+00	\N	\N	f
1247	268	lifting weights 	f	2026-03-03 15:56:44.052961	2026-03-02 19:00:00+00	2026-03-02 20:15:00+00	\N	\N	t
1248	271	Confirming depreciation released - 105-EG-2025-289-Carungi • Confirming depreciation released - 134-EG-2025-288-Jazo	f	2026-03-03 16:02:04.067252	2026-03-04 14:00:00+00	2026-03-04 16:00:00+00	\N	\N	f
1249	271	15 min Break	t	2026-03-03 16:02:04.570701	2026-03-04 16:00:00+00	2026-03-04 16:15:00+00	\N	\N	f
1250	268	reviwing acculynx  • explore AI 	f	2026-03-03 16:06:31.08646	2026-03-02 20:15:00+00	2026-03-02 22:00:00+00	\N	\N	f
1251	268	????	f	2026-03-03 16:07:14.355402	2026-03-02 22:00:00+00	2026-03-03 00:00:00+00	\N	\N	t
1252	268	???	f	2026-03-03 16:07:27.863043	2026-03-03 00:00:00+00	2026-03-03 00:30:00+00	\N	\N	t
1253	268	Parents Material Order 	f	2026-03-03 16:07:46.244837	2026-03-03 00:30:00+00	2026-03-03 01:30:00+00	\N	\N	f
1257	273	Copying scope - Training 3 • Writing supplement - Training 3	f	2026-03-03 16:17:13.623734	2026-03-04 14:00:00+00	2026-03-04 16:00:00+00	\N	\N	f
1258	273	15 min Break	t	2026-03-03 16:17:16.371099	2026-03-04 16:00:00+00	2026-03-04 16:15:00+00	\N	\N	f
1259	270	Sit in with Rein	f	2026-03-03 16:18:04.88928	2026-03-03 08:15:00+00	2026-03-03 10:00:00+00	\N	\N	f
1260	274	Supplementing with Rein	f	2026-03-03 16:19:48.410698	2026-03-04 02:00:00+00	2026-03-04 04:00:00+00	\N	\N	f
1261	274	15 min Break	t	2026-03-03 16:19:49.667381	2026-03-04 04:00:00+00	2026-03-04 04:15:00+00	\N	\N	f
1262	274	Supplementing with Rein	f	2026-03-03 16:20:10.300665	2026-03-04 02:00:00+00	2026-03-04 03:00:00+00	\N	\N	f
1263	274	15 min Break	t	2026-03-03 16:20:11.050558	2026-03-04 03:00:00+00	2026-03-04 03:15:00+00	\N	\N	f
1264	275	Acculynx Review	f	2026-03-03 16:46:04.323218	2026-03-04 02:00:00+00	2026-03-04 04:00:00+00	\N	\N	f
1265	275	15 min Break	t	2026-03-03 16:46:29.040572	2026-03-04 04:00:00+00	2026-03-04 04:15:00+00	\N	\N	f
1266	267	Communications review 	f	2026-03-03 17:55:52.459074	2026-03-04 07:00:00+00	2026-03-04 09:00:00+00	\N	\N	f
1267	267	15 min Break	t	2026-03-03 17:55:52.459074	2026-03-04 09:00:00+00	2026-03-04 09:15:00+00	\N	\N	f
1268	267	Email review 	f	2026-03-03 17:55:52.459074	2026-03-04 09:00:00+00	2026-03-04 09:15:00+00	\N	\N	f
1269	267	15 min Break	t	2026-03-03 17:55:52.459074	2026-03-04 09:15:00+00	2026-03-04 09:30:00+00	\N	\N	f
1270	267	do out bound call for 140-EG-2026-0046-Kinsman, 129-EG-2026-0026-Delaney, 120-EG-2025-201-Octavio	f	2026-03-03 17:55:52.459074	2026-03-04 09:30:00+00	2026-03-04 11:30:00+00	\N	\N	f
1271	267	Recreate Bid 	f	2026-03-03 17:55:52.459074	2026-03-04 11:30:00+00	2026-03-04 12:15:00+00	\N	\N	f
1272	267	15 min Break	t	2026-03-03 17:55:52.459074	2026-03-04 12:15:00+00	2026-03-04 12:30:00+00	\N	\N	f
1273	267	Review emails 	f	2026-03-03 17:55:52.459074	2026-03-04 12:30:00+00	2026-03-04 14:30:00+00	\N	\N	f
1274	267	Review and explore AI 	f	2026-03-03 17:55:52.459074	2026-03-03 14:30:00+00	2026-03-03 15:00:00+00	\N	\N	f
1275	271	Email review	f	2026-03-03 18:05:41.203304	2026-03-04 16:15:00+00	2026-03-04 18:00:00+00	\N	\N	f
1276	271	15 min Break	t	2026-03-03 18:05:51.298459	2026-03-04 18:00:00+00	2026-03-04 18:15:00+00	\N	\N	f
1277	275	Acculynx Update 	f	2026-03-03 18:21:26.658302	2026-03-04 04:15:00+00	2026-03-04 06:15:00+00	\N	\N	f
1278	275	15 min Break	t	2026-03-03 18:21:28.263731	2026-03-04 06:15:00+00	2026-03-04 06:30:00+00	\N	\N	f
1279	274	Supplementing with Rein • Meeting with the team	f	2026-03-03 18:45:31.823331	2026-03-04 03:15:00+00	2026-03-04 05:00:00+00	\N	\N	f
1280	274	15 min Break	t	2026-03-03 18:45:32.886663	2026-03-04 05:00:00+00	2026-03-04 05:15:00+00	\N	\N	f
1281	274	Supplementing with Rein • Copying scope - Kasuboske	f	2026-03-03 18:46:07.775064	2026-03-04 05:15:00+00	2026-03-04 06:45:00+00	\N	\N	f
1282	274	15 min Break	t	2026-03-03 18:46:08.566324	2026-03-04 06:45:00+00	2026-03-04 07:00:00+00	\N	\N	f
1283	275	Confirming supplement received - Whincup • Confirming supplement received - Taylor	f	2026-03-03 18:51:22.973538	2026-03-04 06:30:00+00	2026-03-04 08:30:00+00	\N	\N	f
1284	275	15 min Break	t	2026-03-03 18:51:24.651091	2026-03-04 08:30:00+00	2026-03-04 08:45:00+00	\N	\N	f
1285	273	Copying scope - Training 4	f	2026-03-03 19:16:25.778227	2026-03-04 16:15:00+00	2026-03-04 18:15:00+00	\N	\N	f
1286	273	30 min Lunch	t	2026-03-03 19:16:26.815892	2026-03-04 18:15:00+00	2026-03-04 18:45:00+00	\N	\N	f
1287	274	Writing supplement - Kasuboske	f	2026-03-03 19:22:02.276665	2026-03-04 07:00:00+00	2026-03-04 09:00:00+00	\N	\N	f
1288	271	Scope of work template	f	2026-03-03 20:03:17.997469	2026-03-04 18:00:00+00	2026-03-04 18:15:00+00	\N	\N	f
1289	271	15 min Break	t	2026-03-03 20:03:18.642964	2026-03-04 18:15:00+00	2026-03-04 18:30:00+00	\N	\N	f
1290	271	out bound call 105-EG-2025-289-Carungi   • Scope of work template	f	2026-03-03 20:04:09.586081	2026-03-04 18:30:00+00	2026-03-04 20:00:00+00	\N	\N	f
1291	271	30 min Lunch	t	2026-03-03 20:04:11.289312	2026-03-04 20:00:00+00	2026-03-04 20:30:00+00	\N	\N	f
1292	273	Writing supplement - TRAINING 4	f	2026-03-03 21:30:22.911904	2026-03-04 18:45:00+00	2026-03-04 20:45:00+00	\N	\N	f
1293	273	15 min Break	t	2026-03-03 21:30:24.88675	2026-03-04 20:45:00+00	2026-03-04 21:00:00+00	\N	\N	f
1294	273	Reviewing Supplements 	f	2026-03-03 21:30:52.680713	2026-03-04 21:00:00+00	2026-03-04 22:00:00+00	\N	\N	f
1295	275	Acculyx Notes	f	2026-03-03 22:16:17.767094	2026-03-04 08:45:00+00	2026-03-04 10:15:00+00	\N	\N	f
1296	274	Supplementing with Rein • EOS	f	2026-03-03 22:16:26.859618	2026-03-04 09:00:00+00	2026-03-04 10:15:00+00	\N	\N	f
1297	271	Confirming depreciation released - Jazo • Estimate tempate 	f	2026-03-03 22:17:59.607013	2026-03-04 20:30:00+00	2026-03-04 21:45:00+00	\N	\N	f
1298	276	Copying scope - Wienzveg	f	2026-03-04 15:32:06.947876	2026-03-04 14:00:00+00	2026-03-04 15:00:00+00	\N	\N	f
1299	276	Writing supplement - Wienzveg	f	2026-03-04 15:32:21.145084	2026-03-04 15:00:00+00	2026-03-04 16:00:00+00	\N	\N	f
1300	276	15 min Break	t	2026-03-04 15:32:25.80214	2026-03-04 16:00:00+00	2026-03-04 16:15:00+00	\N	\N	f
1302	278	15 min Break	t	2026-03-04 16:12:02.515632	2026-03-05 04:00:00+00	2026-03-05 04:15:00+00	\N	\N	f
1303	278	Acculynx Notes  • Admin Email  • Everguard Email  • Monday Audit 	f	2026-03-04 16:12:02.666042	2026-03-05 02:00:00+00	2026-03-05 04:00:00+00	\N	\N	f
1305	278	Outbound calls and documentation 	f	2026-03-04 16:12:21.030299	2026-03-05 04:15:00+00	2026-03-05 06:15:00+00	\N	\N	f
1306	276	Writing supplement - Wienzveg	f	2026-03-04 17:59:08.16972	2026-03-04 16:15:00+00	2026-03-04 17:45:00+00	\N	\N	f
1307	276	15 min Break	t	2026-03-04 17:59:12.937107	2026-03-04 17:45:00+00	2026-03-04 18:00:00+00	\N	\N	f
1308	278	15 min Break	t	2026-03-04 18:16:09.109455	2026-03-05 06:15:00+00	2026-03-05 06:30:00+00	\N	\N	f
1311	276	Writing Supplement shadow with Crista • Supplement Review	f	2026-03-04 18:53:16.832697	2026-03-04 18:00:00+00	2026-03-04 20:00:00+00	\N	\N	f
1312	276	30 min Lunch	t	2026-03-04 18:53:17.311781	2026-03-04 20:00:00+00	2026-03-04 20:30:00+00	\N	\N	f
1313	278	Cash Bid Template creation	f	2026-03-04 19:24:26.436405	2026-03-05 06:30:00+00	2026-03-05 08:30:00+00	\N	\N	f
1314	278	15 min Break	t	2026-03-04 19:24:27.704709	2026-03-05 08:30:00+00	2026-03-05 08:45:00+00	\N	\N	f
1315	276	Supplement review	f	2026-03-04 21:45:20.153164	2026-03-04 20:30:00+00	2026-03-04 22:00:00+00	\N	\N	f
1316	278	Monday and Acculynx Note Update 	f	2026-03-04 22:30:12.645822	2026-03-05 08:45:00+00	2026-03-05 10:30:00+00	\N	\N	f
1320	279	Supplementing with Rein	f	2026-03-05 07:58:15.678595	2026-03-05 03:00:00+00	2026-03-05 05:00:00+00	\N	\N	f
1321	279	15 min Break	t	2026-03-05 07:58:15.880959	2026-03-05 05:00:00+00	2026-03-05 05:15:00+00	\N	\N	f
1322	279	Supplementing with Rein	f	2026-03-05 07:58:24.724946	2026-03-05 05:15:00+00	2026-03-05 07:00:00+00	\N	\N	f
1323	279	15 min Break	t	2026-03-05 07:58:24.973297	2026-03-05 07:00:00+00	2026-03-05 07:15:00+00	\N	\N	f
1324	279	Supplementing with Rein	f	2026-03-05 07:58:30.945119	2026-03-05 07:15:00+00	2026-03-05 09:00:00+00	\N	\N	f
1325	279	15 min Break	t	2026-03-05 07:58:34.858757	2026-03-05 09:00:00+00	2026-03-05 09:15:00+00	\N	\N	f
1326	279	Supplementing with Rein	f	2026-03-05 07:58:41.679948	2026-03-05 09:15:00+00	2026-03-05 10:00:00+00	\N	\N	f
1327	280	Email • Notification  • Monday 	f	2026-03-05 14:03:01.371231	2026-03-05 14:00:00+00	2026-03-05 16:00:00+00	\N	\N	f
1328	280	15 min Break	t	2026-03-05 14:03:01.601517	2026-03-05 16:00:00+00	2026-03-05 16:15:00+00	\N	\N	f
1329	281	Email Communication Review	f	2026-03-05 14:45:50.406758	2026-03-05 14:00:00+00	2026-03-05 16:00:00+00	\N	\N	f
1330	281	15 min Break	t	2026-03-05 15:22:20.551046	2026-03-05 16:00:00+00	2026-03-05 16:15:00+00	\N	\N	f
1331	282	Email review with LJ 	f	2026-03-05 16:00:39.669601	2026-03-06 14:00:00+00	2026-03-06 16:00:00+00	\N	\N	f
1332	282	15 min Break	t	2026-03-05 16:00:41.118316	2026-03-06 16:00:00+00	2026-03-06 16:15:00+00	\N	\N	f
1333	282	Confirming depreciation released - 110-EG-2025-290-Bauer • Confirming depreciation released - 129-EG-2026-0026-Delaney • Confirming depreciation released - 134-EG-2025-288-Jazo • Reinspectio email confirmation 090-EG-2025-286-Boucher	f	2026-03-05 18:11:18.006576	2026-03-06 16:15:00+00	2026-03-06 18:00:00+00	\N	\N	f
1334	282	30 min Lunch	t	2026-03-05 18:11:28.794626	2026-03-06 18:00:00+00	2026-03-06 18:30:00+00	\N	\N	f
1335	282	Invoice edit 	f	2026-03-05 19:21:45.79373	2026-03-06 18:00:00+00	2026-03-06 19:30:00+00	\N	\N	f
1336	282	30 min Lunch	t	2026-03-05 19:21:49.563401	2026-03-06 19:30:00+00	2026-03-06 20:00:00+00	\N	\N	f
1337	280	Outbound calls assist and note taking 	f	2026-03-05 19:37:24.188	2026-03-05 16:15:00+00	2026-03-05 18:15:00+00	\N	\N	f
1338	280	15 min Break	t	2026-03-05 19:37:24.958834	2026-03-05 18:15:00+00	2026-03-05 18:30:00+00	\N	\N	f
1339	280	Cashbid Template creation 	f	2026-03-05 19:37:53.427458	2026-03-05 18:30:00+00	2026-03-05 20:30:00+00	\N	\N	f
1340	281	Review Scope • Copying scope - Siegwald2	f	2026-03-05 19:42:43.673863	2026-03-05 16:15:00+00	2026-03-05 18:15:00+00	\N	\N	f
1341	281	30 min Lunch	t	2026-03-05 19:42:50.611668	2026-03-05 18:15:00+00	2026-03-05 18:45:00+00	\N	\N	f
1342	281	Copying scope - Siegwald2	f	2026-03-05 21:21:50.771247	2026-03-05 18:45:00+00	2026-03-05 20:45:00+00	\N	\N	f
1343	281	15 min Break	t	2026-03-05 21:21:52.270626	2026-03-05 20:45:00+00	2026-03-05 21:00:00+00	\N	\N	f
1344	282	Template for estimates	f	2026-03-05 22:02:34.635609	2026-03-06 20:00:00+00	2026-03-06 22:00:00+00	\N	\N	f
1345	281	Writing supplement - Siegwald2	f	2026-03-05 22:12:44.515607	2026-03-05 21:00:00+00	2026-03-05 22:15:00+00	\N	\N	f
1346	283	Sit in with the team	f	2026-03-05 22:12:49.578173	2026-03-06 02:00:00+00	2026-03-06 04:00:00+00	\N	\N	f
1347	283	15 min Break	t	2026-03-05 22:12:49.690778	2026-03-06 04:00:00+00	2026-03-06 04:15:00+00	\N	\N	f
1348	283	Sit in with the team	f	2026-03-05 22:12:52.015902	2026-03-06 04:15:00+00	2026-03-06 06:00:00+00	\N	\N	f
1349	283	15 min Break	t	2026-03-05 22:12:55.545605	2026-03-06 06:00:00+00	2026-03-06 06:15:00+00	\N	\N	f
1350	283	Sit in with the team	f	2026-03-05 22:12:57.778569	2026-03-06 06:15:00+00	2026-03-06 08:00:00+00	\N	\N	f
1351	283	Sit in with the team • Supplementing with Rein	f	2026-03-05 22:13:08.19646	2026-03-06 08:00:00+00	2026-03-06 10:00:00+00	\N	\N	f
1352	283	15 min Break	t	2026-03-05 22:13:17.322553	2026-03-06 08:00:00+00	2026-03-06 08:15:00+00	\N	\N	f
1353	283	Sit in with the team • Supplementing with Rein	f	2026-03-05 22:13:30.097321	2026-03-06 08:15:00+00	2026-03-06 10:00:00+00	\N	\N	f
1354	280	15 min Break	t	2026-03-05 22:39:09.087102	2026-03-05 20:30:00+00	2026-03-05 20:45:00+00	\N	\N	f
1355	280	Update notes with Tyler 	f	2026-03-05 22:39:30.257385	2026-03-05 20:45:00+00	2026-03-05 22:45:00+00	\N	\N	f
1356	284	Email review with LJ 	f	2026-03-06 14:12:07.065712	2026-03-06 14:00:00+00	2026-03-06 16:00:00+00	\N	\N	f
1357	285	Writing supplement - Siegwald2 • Review image for supplement for Lopez	f	2026-03-06 15:58:46.010114	2026-03-06 14:00:00+00	2026-03-06 16:00:00+00	\N	\N	f
1358	285	15 min Break	t	2026-03-06 15:58:46.18131	2026-03-06 16:00:00+00	2026-03-06 16:15:00+00	\N	\N	f
1359	286	Monday Review  • Admin Email and Everguard Review 	f	2026-03-06 16:31:37.351537	2026-03-07 14:00:00+00	2026-03-07 16:00:00+00	\N	\N	f
1360	286	15 min Break	t	2026-03-06 16:31:38.56878	2026-03-07 16:00:00+00	2026-03-07 16:15:00+00	\N	\N	f
1361	284	15 min Break	t	2026-03-06 16:31:41.678143	2026-03-06 16:00:00+00	2026-03-06 16:15:00+00	\N	\N	f
1362	286	Initial Update Readout  • Monday waiting for build audit	f	2026-03-06 17:00:21.676995	2026-03-07 16:15:00+00	2026-03-07 18:15:00+00	\N	\N	f
1363	286	15 min Break	t	2026-03-06 17:00:23.425566	2026-03-07 18:15:00+00	2026-03-07 18:30:00+00	\N	\N	f
1364	284	Confirming supplement received - 143-EG-20260053-Wienzveg • Confirming depreciation released - EG-2025-287: Lisa Hans • Update for reinspection - 130-EG-2026-0061-Owen	f	2026-03-06 18:17:07.429994	2026-03-06 16:15:00+00	2026-03-06 18:15:00+00	\N	\N	f
1365	284	15 min Break	t	2026-03-06 18:17:11.106336	2026-03-06 18:15:00+00	2026-03-06 18:30:00+00	\N	\N	f
1366	285	Copying scope - Mielcarek	f	2026-03-06 19:05:52.557804	2026-03-06 16:15:00+00	2026-03-06 18:15:00+00	\N	\N	f
1367	285	15 min Break	t	2026-03-06 19:05:53.44037	2026-03-06 18:15:00+00	2026-03-06 18:30:00+00	\N	\N	f
1368	285	Copying scope - Demski	f	2026-03-06 20:01:15.377301	2026-03-06 18:30:00+00	2026-03-06 20:30:00+00	\N	\N	f
1369	285	30 min Lunch	t	2026-03-06 20:01:15.965008	2026-03-06 20:30:00+00	2026-03-06 21:00:00+00	\N	\N	f
1370	286	Outbound calls 	f	2026-03-06 21:51:07.105068	2026-03-07 18:30:00+00	2026-03-07 20:30:00+00	\N	\N	f
1371	286	Notations pending for notes 	f	2026-03-06 21:51:36.290359	2026-03-07 20:30:00+00	2026-03-07 22:00:00+00	\N	\N	f
1372	286	15 min Break	t	2026-03-06 21:51:43.214083	2026-03-07 20:30:00+00	2026-03-07 20:45:00+00	\N	\N	f
1373	286	notation for acculynx 	f	2026-03-06 21:52:02.054002	2026-03-07 20:45:00+00	2026-03-07 22:00:00+00	\N	\N	f
1374	284	Email Review 	f	2026-03-06 22:07:45.384028	2026-03-06 18:30:00+00	2026-03-06 20:00:00+00	\N	\N	f
1375	284	Communication Review 	f	2026-03-06 22:08:00.536754	2026-03-06 20:00:00+00	2026-03-06 22:00:00+00	\N	\N	f
1376	285	Writing supplement - Demski	f	2026-03-07 00:05:40.37937	2026-03-06 21:00:00+00	2026-03-06 22:00:00+00	\N	\N	f
1377	285	Writing supplement - Demski • Reviewed supplement with Tyler	f	2026-03-07 00:05:59.878223	2026-03-06 22:00:00+00	2026-03-07 00:00:00+00	\N	\N	f
1378	287	Acculynx Notification • New Business Venture	f	2026-03-09 03:37:04.203763	2026-03-09 02:15:00+00	2026-03-09 03:30:00+00	\N	\N	f
1386	277	Huddle for today task with LJ and Tyler 	f	2026-03-09 03:48:42.388649	2026-03-06 08:00:00+00	2026-03-06 08:30:00+00	\N	\N	f
1387	277	Confirming COC received - Hanse • Confirming COC received - Wann	f	2026-03-09 03:48:42.388649	2026-03-06 00:00:00+00	2026-03-06 02:00:00+00	\N	\N	f
1388	277	15 min Break	t	2026-03-09 03:48:42.388649	2026-03-06 02:00:00+00	2026-03-06 02:15:00+00	\N	\N	f
1389	277	Calleld EG-2026-0008-Taylor • Called 136-EG-2025-202-Tran	f	2026-03-09 03:48:42.388649	2026-03-06 02:15:00+00	2026-03-06 04:15:00+00	\N	\N	f
1390	277	15 min Break	t	2026-03-09 03:48:42.388649	2026-03-06 04:15:00+00	2026-03-06 04:30:00+00	\N	\N	f
1391	277	Called Lutrick  • Edit refelt and modified estimate  • Edit replacement estimate 	f	2026-03-09 03:48:42.388649	2026-03-06 04:30:00+00	2026-03-06 06:00:00+00	\N	\N	f
1392	277	Huddle for today task with LJ and Tyler 	f	2026-03-09 03:48:42.388649	2026-03-06 06:00:00+00	2026-03-06 08:00:00+00	\N	\N	f
1393	288	Copying scope - BARIE	f	2026-03-09 14:52:30.092891	2026-03-09 14:00:00+00	2026-03-09 14:15:00+00	\N	\N	f
1394	288	Writing supplement - BARIE	f	2026-03-09 14:52:50.771474	2026-03-09 14:15:00+00	2026-03-09 15:00:00+00	\N	\N	f
1395	288	Writing supplement - BARIE	f	2026-03-09 14:52:50.938269	2026-03-09 14:15:00+00	2026-03-09 15:00:00+00	\N	\N	f
1396	288	Writing supplement - BARIE	f	2026-03-09 14:53:26.507573	2026-03-09 14:15:00+00	2026-03-09 15:30:00+00	\N	\N	f
1397	289	Notification	f	2026-03-09 15:12:11.011591	2026-03-09 14:00:00+00	2026-03-09 16:00:00+00	\N	\N	f
1398	289	15 min Break	t	2026-03-09 15:12:11.11659	2026-03-09 16:00:00+00	2026-03-09 16:15:00+00	\N	\N	f
1399	290	Confirming depreciation released - 134-EG-2025-288-Jazo • 090-EG-2025-286-Boucher- ask for update of reinspection 	f	2026-03-09 15:46:19.521848	2026-03-09 14:00:00+00	2026-03-09 15:45:00+00	\N	\N	f
1400	290	15 min Break	t	2026-03-09 15:46:21.332164	2026-03-09 15:45:00+00	2026-03-09 16:00:00+00	\N	\N	f
1401	288	15 min Break	t	2026-03-09 16:15:21.500925	2026-03-09 16:00:00+00	2026-03-09 16:15:00+00	\N	\N	f
1402	289	Acculynx Note Update 	f	2026-03-09 17:29:14.56767	2026-03-09 16:15:00+00	2026-03-09 18:15:00+00	\N	\N	f
1403	289	15 min Break	t	2026-03-09 17:29:16.046252	2026-03-09 18:15:00+00	2026-03-09 18:30:00+00	\N	\N	f
1404	288	Writing supplement - Judice	f	2026-03-09 17:55:24.238879	2026-03-09 16:15:00+00	2026-03-09 18:15:00+00	\N	\N	f
1405	290	Communication review 	f	2026-03-09 17:56:50.73527	2026-03-09 16:00:00+00	2026-03-09 18:00:00+00	\N	\N	f
1406	290	15 min Break	t	2026-03-09 17:56:51.823252	2026-03-09 18:00:00+00	2026-03-09 18:15:00+00	\N	\N	f
1407	288	15 min Break	t	2026-03-09 18:46:19.751604	2026-03-09 18:15:00+00	2026-03-09 18:30:00+00	\N	\N	f
1408	289	Dealmachine Audit 	f	2026-03-09 20:03:36.167487	2026-03-09 18:30:00+00	2026-03-09 20:30:00+00	\N	\N	f
1409	288	Writing supplement - Judice • Writing supplement - Siegwald2 • Writing supplement - Lopez1	f	2026-03-09 20:13:03.573014	2026-03-09 18:30:00+00	2026-03-09 20:30:00+00	\N	\N	f
1410	288	30 min Lunch	t	2026-03-09 20:13:17.565896	2026-03-09 20:30:00+00	2026-03-09 21:00:00+00	\N	\N	f
1411	290	Checking for potential leads	f	2026-03-09 20:45:57.943364	2026-03-09 18:15:00+00	2026-03-09 20:15:00+00	\N	\N	f
1412	290	checking for potential leads	f	2026-03-09 20:46:13.501704	2026-03-09 20:15:00+00	2026-03-09 20:45:00+00	\N	\N	f
1413	290	15 min Break	t	2026-03-09 20:46:14.886285	2026-03-09 20:45:00+00	2026-03-09 21:00:00+00	\N	\N	f
1414	288	30 min Lunch	t	2026-03-09 20:56:32.923066	2026-03-09 20:00:00+00	2026-03-09 20:30:00+00	\N	\N	f
1415	288	Copying scope - PHAM • Writing supplement - PHAM	f	2026-03-09 20:56:54.414249	2026-03-09 20:30:00+00	2026-03-09 22:00:00+00	\N	\N	f
1416	289	Update Acculynx Notification	f	2026-03-09 22:01:20.871565	2026-03-09 20:30:00+00	2026-03-09 22:00:00+00	\N	\N	f
1417	289	15 min Break	t	2026-03-09 22:01:31.343588	2026-03-09 20:30:00+00	2026-03-09 20:45:00+00	\N	\N	f
1418	290	Checking for potential leads	f	2026-03-09 22:01:32.315977	2026-03-09 21:00:00+00	2026-03-09 22:00:00+00	\N	\N	f
1419	289	Update acculynx Notification	f	2026-03-09 22:01:46.016984	2026-03-09 20:45:00+00	2026-03-09 22:00:00+00	\N	\N	f
1420	291	Review Admin Email  • Review Acculynx Notes 	f	2026-03-10 14:49:07.41437	2026-03-10 14:00:00+00	2026-03-10 16:00:00+00	\N	\N	f
1421	291	15 min Break	t	2026-03-10 14:49:07.937544	2026-03-10 16:00:00+00	2026-03-10 16:15:00+00	\N	\N	f
1422	292	Copying scope - GHONDOS	f	2026-03-10 14:59:24.121656	2026-03-10 14:00:00+00	2026-03-10 15:00:00+00	\N	\N	f
1423	293	Supplementing with Rein	f	2026-03-10 15:09:29.412047	2026-03-10 02:00:00+00	2026-03-10 04:00:00+00	\N	\N	f
1424	293	15 min Break	t	2026-03-10 15:09:30.104012	2026-03-10 04:00:00+00	2026-03-10 04:15:00+00	\N	\N	f
1425	293	Supplementing with Rein	f	2026-03-10 15:09:33.880274	2026-03-10 04:15:00+00	2026-03-10 06:00:00+00	\N	\N	f
1426	293	15 min Break	t	2026-03-10 15:09:36.430748	2026-03-10 06:00:00+00	2026-03-10 06:15:00+00	\N	\N	f
1427	293	Supplementing with Rein	f	2026-03-10 15:09:40.473966	2026-03-10 06:15:00+00	2026-03-10 08:00:00+00	\N	\N	f
1428	293	15 min Break	t	2026-03-10 15:09:44.880465	2026-03-10 08:00:00+00	2026-03-10 08:15:00+00	\N	\N	f
1429	293	Supplementing with Rein	f	2026-03-10 15:09:48.888142	2026-03-10 08:15:00+00	2026-03-10 10:00:00+00	\N	\N	f
1430	292	Writing supplement - PHAM	f	2026-03-10 15:45:23.481962	2026-03-10 15:00:00+00	2026-03-10 16:00:00+00	\N	\N	f
1431	292	15 min Break	t	2026-03-10 15:45:24.202689	2026-03-10 16:00:00+00	2026-03-10 16:15:00+00	\N	\N	f
1432	294	142-EG-20260104: Kasuboske- confirm the code coverage 	f	2026-03-10 16:06:30.565626	2026-03-11 14:00:00+00	2026-03-11 16:00:00+00	\N	\N	f
1433	294	meeting with Mitchell 	f	2026-03-10 16:24:49.197435	2026-03-11 16:00:00+00	2026-03-11 16:30:00+00	\N	\N	f
1434	294	15 min Break	t	2026-03-10 16:25:54.999033	2026-03-11 16:30:00+00	2026-03-11 16:45:00+00	\N	\N	f
1435	292	Writing supplement - PHAM • Supplement review - Siegwald	f	2026-03-10 16:58:54.213491	2026-03-10 16:15:00+00	2026-03-10 18:15:00+00	\N	\N	f
1436	291	How to send invoice  • Outbound calls 	f	2026-03-10 17:13:52.420249	2026-03-10 16:15:00+00	2026-03-10 18:15:00+00	\N	\N	f
1437	291	15 min Break	t	2026-03-10 17:14:00.583248	2026-03-10 18:15:00+00	2026-03-10 18:30:00+00	\N	\N	f
1438	294	 028-EG-2025-140-Lutrick- check PWI  • Confirming depreciation released - 110-EG-2025-290-Bauer • Confirming depreciation released - 129-EG-2026-0026-Delaney	f	2026-03-10 17:55:33.270264	2026-03-11 16:45:00+00	2026-03-11 18:00:00+00	\N	\N	f
1439	292	30 min Lunch	t	2026-03-10 18:05:20.645359	2026-03-10 18:15:00+00	2026-03-10 18:45:00+00	\N	\N	f
1440	294	30 min Lunch	t	2026-03-10 18:05:25.046469	2026-03-11 18:00:00+00	2026-03-11 18:30:00+00	\N	\N	f
1441	292	Sent Supplement for Demski and Siegwald	f	2026-03-10 19:23:00.732004	2026-03-10 18:45:00+00	2026-03-10 19:30:00+00	\N	\N	f
1442	294	Communication review 	f	2026-03-10 20:50:56.411921	2026-03-11 18:30:00+00	2026-03-11 20:30:00+00	\N	\N	f
1443	294	Communication review 	f	2026-03-10 20:51:07.242275	2026-03-11 20:30:00+00	2026-03-11 20:45:00+00	\N	\N	f
1444	294	15 min Break	t	2026-03-10 20:51:07.672774	2026-03-11 20:45:00+00	2026-03-11 21:00:00+00	\N	\N	f
1445	292	Writing supplement - PHAM • Supplement update - Owen	f	2026-03-10 20:52:18.605768	2026-03-10 19:30:00+00	2026-03-10 20:45:00+00	\N	\N	f
1446	292	15 min Break	t	2026-03-10 20:52:21.610542	2026-03-10 20:45:00+00	2026-03-10 21:00:00+00	\N	\N	f
1447	294	Template check 	f	2026-03-10 21:44:18.235766	2026-03-11 21:00:00+00	2026-03-11 22:00:00+00	\N	\N	f
1448	292	Writing supplement - PHAM	f	2026-03-10 21:50:32.81253	2026-03-10 21:00:00+00	2026-03-10 22:00:00+00	\N	\N	f
1449	291	30 min Lunch	t	2026-03-10 22:02:38.084153	2026-03-10 18:15:00+00	2026-03-10 18:45:00+00	\N	\N	f
1450	291	Send Supplement - Siegwald and Demeski • Update acculynx base on calloutcome	f	2026-03-10 22:03:34.610282	2026-03-10 18:45:00+00	2026-03-10 20:45:00+00	\N	\N	f
1451	291	15 min Break	t	2026-03-10 22:03:35.56836	2026-03-10 20:45:00+00	2026-03-10 21:00:00+00	\N	\N	f
1452	291	Template review for cashbids 	f	2026-03-10 22:03:49.403081	2026-03-10 21:00:00+00	2026-03-10 23:00:00+00	\N	\N	f
1453	295	Review Admin emails • Review Notification	f	2026-03-11 14:11:33.350287	2026-03-11 14:00:00+00	2026-03-11 16:00:00+00	\N	\N	f
1454	295	15 min Break	t	2026-03-11 14:11:34.290442	2026-03-11 16:00:00+00	2026-03-11 16:15:00+00	\N	\N	f
1455	296	Writing supplement - Pham	f	2026-03-11 15:02:26.885817	2026-03-11 14:00:00+00	2026-03-11 15:00:00+00	\N	\N	f
1456	296	Copying scope - MANNEY	f	2026-03-11 15:53:41.092741	2026-03-11 15:00:00+00	2026-03-11 16:00:00+00	\N	\N	f
1457	296	15 min Break	t	2026-03-11 15:54:09.275523	2026-03-11 16:00:00+00	2026-03-11 16:15:00+00	\N	\N	f
1458	297	Confirming supplement received - 144-EG-20260111: Siegwald	f	2026-03-11 16:00:44.084701	2026-03-12 02:00:00+00	2026-03-12 04:00:00+00	\N	\N	f
1459	297	15 min Break	t	2026-03-11 16:00:44.926301	2026-03-12 04:00:00+00	2026-03-12 04:15:00+00	\N	\N	f
1460	295	Acculynx Note Review 	f	2026-03-11 17:18:51.790486	2026-03-11 16:15:00+00	2026-03-11 18:15:00+00	\N	\N	f
1461	297	Confirming supplement received - 110-EG-2025-290-Bauer	f	2026-03-11 17:53:13.872018	2026-03-12 04:15:00+00	2026-03-12 06:00:00+00	\N	\N	f
1462	297	15 min Break	t	2026-03-11 17:53:14.654546	2026-03-12 06:00:00+00	2026-03-12 06:15:00+00	\N	\N	f
1463	296	Writing supplement - LUTES	f	2026-03-11 18:16:22.960496	2026-03-11 16:15:00+00	2026-03-11 18:00:00+00	\N	\N	f
1464	296	30 min Lunch	t	2026-03-11 18:16:29.365682	2026-03-11 18:00:00+00	2026-03-11 18:30:00+00	\N	\N	f
1465	297	Communication revview 	f	2026-03-11 19:30:35.694549	2026-03-12 06:15:00+00	2026-03-12 07:30:00+00	\N	\N	f
1466	297	30 min Lunch	t	2026-03-11 19:30:36.44709	2026-03-12 07:30:00+00	2026-03-12 08:00:00+00	\N	\N	f
1467	296	Copying scope - GONDOS • Writing supplement - GONDOS • Copying scope - MANEGOLD	f	2026-03-11 20:02:02.173202	2026-03-11 18:30:00+00	2026-03-11 20:30:00+00	\N	\N	f
1468	296	15 min Break	t	2026-03-11 20:02:04.752641	2026-03-11 20:30:00+00	2026-03-11 20:45:00+00	\N	\N	f
1469	295	Outbound calls 	f	2026-03-11 21:42:51.543669	2026-03-11 18:15:00+00	2026-03-11 20:15:00+00	\N	\N	f
1470	295	30 min Lunch	t	2026-03-11 21:42:52.230805	2026-03-11 20:15:00+00	2026-03-11 20:45:00+00	\N	\N	f
1471	295	15 min Break	t	2026-03-11 21:43:05.810872	2026-03-11 18:15:00+00	2026-03-11 18:30:00+00	\N	\N	f
1472	297	Template edits  • Communication review	f	2026-03-11 21:43:11.37167	2026-03-12 08:00:00+00	2026-03-12 10:00:00+00	\N	\N	f
1473	295	Review Emails and Notes 	f	2026-03-11 21:43:20.322233	2026-03-11 18:30:00+00	2026-03-11 20:30:00+00	\N	\N	f
1474	295	30 min Lunch	t	2026-03-11 21:43:21.789058	2026-03-11 20:30:00+00	2026-03-11 21:00:00+00	\N	\N	f
1475	295	Read out 	f	2026-03-11 21:43:29.700524	2026-03-11 21:00:00+00	2026-03-11 23:00:00+00	\N	\N	f
1476	296	Copying scope - GAIO	f	2026-03-11 21:50:00.552902	2026-03-11 20:45:00+00	2026-03-11 22:00:00+00	\N	\N	f
1477	298	Copying scope - TUCKER	f	2026-03-12 15:31:56.144739	2026-03-12 15:00:00+00	2026-03-12 15:30:00+00	\N	\N	f
1478	299	Communication review	f	2026-03-12 16:03:18.891066	2026-03-13 14:00:00+00	2026-03-13 16:00:00+00	\N	\N	f
1479	299	15 min Break	t	2026-03-12 16:03:22.585071	2026-03-13 16:00:00+00	2026-03-13 16:15:00+00	\N	\N	f
1480	298	Writing supplement - GAIO	f	2026-03-12 16:07:37.732303	2026-03-12 15:30:00+00	2026-03-12 17:00:00+00	\N	\N	f
1481	298	15 min Break	t	2026-03-12 16:07:39.403493	2026-03-12 17:00:00+00	2026-03-12 17:15:00+00	\N	\N	f
1482	300	Writing supplement - Gondos • Writing supplement - Manegold	f	2026-03-12 16:12:09.14261	2026-03-13 02:00:00+00	2026-03-13 04:00:00+00	\N	\N	f
1483	300	15 min Break	t	2026-03-12 16:12:12.671689	2026-03-13 04:00:00+00	2026-03-13 04:15:00+00	\N	\N	f
1484	299	Confirming supplement reviewed - 144-EG-20260111: Siegwald • Update of reinspection 090-EG-2025-286-Boucher	f	2026-03-12 16:58:07.333357	2026-03-13 16:15:00+00	2026-03-13 18:00:00+00	\N	\N	f
1485	299	15 min Break	t	2026-03-12 17:02:08.090613	2026-03-13 18:00:00+00	2026-03-13 18:15:00+00	\N	\N	f
1486	301	Review Notes  • Review Admin Email 	f	2026-03-12 17:02:41.928051	2026-03-13 14:00:00+00	2026-03-13 16:00:00+00	\N	\N	f
1487	301	15 min Break	t	2026-03-12 17:02:42.21974	2026-03-13 16:00:00+00	2026-03-13 16:15:00+00	\N	\N	f
1488	298	Copying scope - LANG	f	2026-03-12 17:40:30.629687	2026-03-12 17:15:00+00	2026-03-12 17:45:00+00	\N	\N	f
1489	300	Writing supplement - Manegold • Supplementing with Rein	f	2026-03-12 18:11:53.887138	2026-03-13 04:15:00+00	2026-03-13 06:00:00+00	\N	\N	f
1490	300	15 min Break	t	2026-03-12 18:11:54.692905	2026-03-13 06:00:00+00	2026-03-13 06:15:00+00	\N	\N	f
1491	298	Writing supplement - Manney	f	2026-03-12 18:45:12.207812	2026-03-12 17:45:00+00	2026-03-12 18:45:00+00	\N	\N	f
1492	298	15 min Break	t	2026-03-12 18:45:18.154503	2026-03-12 18:45:00+00	2026-03-12 19:00:00+00	\N	\N	f
1493	298	30 min Lunch	t	2026-03-12 19:03:01.647461	2026-03-12 19:00:00+00	2026-03-12 19:30:00+00	\N	\N	f
1494	299	Called statefarm for Junker and Steinberg	f	2026-03-12 19:05:11.526912	2026-03-13 18:15:00+00	2026-03-13 19:00:00+00	\N	\N	f
1495	299	30 min Lunch	t	2026-03-12 19:05:12.132223	2026-03-13 19:00:00+00	2026-03-13 19:30:00+00	\N	\N	f
1496	298	Supplement review with Tyler	f	2026-03-12 20:29:33.450351	2026-03-12 19:30:00+00	2026-03-12 21:00:00+00	\N	\N	f
1497	298	15 min Break	t	2026-03-12 20:29:42.306583	2026-03-12 21:00:00+00	2026-03-12 21:15:00+00	\N	\N	f
1498	298	15 min Break	t	2026-03-12 21:54:04.948151	2026-03-12 21:30:00+00	2026-03-12 21:45:00+00	\N	\N	f
1499	299	Supplement review 	f	2026-03-12 21:56:05.173624	2026-03-13 19:30:00+00	2026-03-13 21:00:00+00	\N	\N	f
1500	299	15 min Break	t	2026-03-12 21:56:07.506199	2026-03-13 21:00:00+00	2026-03-13 21:15:00+00	\N	\N	f
1501	301	Note Review  • Feedback update - Acculynx	f	2026-03-12 21:56:09.699184	2026-03-13 16:15:00+00	2026-03-13 18:15:00+00	\N	\N	f
1502	301	30 min Lunch	t	2026-03-12 21:56:10.598679	2026-03-13 18:15:00+00	2026-03-13 18:45:00+00	\N	\N	f
1503	299	Supplement review	f	2026-03-12 21:56:27.561439	2026-03-13 21:00:00+00	2026-03-13 21:30:00+00	\N	\N	f
1504	299	15 min Break	t	2026-03-12 21:56:28.766446	2026-03-13 21:30:00+00	2026-03-13 21:45:00+00	\N	\N	f
1505	299	Supplement review 	f	2026-03-12 21:56:39.6896	2026-03-13 21:45:00+00	2026-03-13 22:00:00+00	\N	\N	f
1506	301	Platinum Roofing Access  • Platinum outbound calls  • Generate Invoice 	f	2026-03-12 21:56:47.710933	2026-03-13 18:45:00+00	2026-03-13 20:45:00+00	\N	\N	f
1507	301	30 min Lunch	t	2026-03-12 21:56:48.991769	2026-03-13 20:45:00+00	2026-03-13 21:15:00+00	\N	\N	f
1508	301	Supplement Review 	f	2026-03-12 21:57:01.044833	2026-03-13 21:15:00+00	2026-03-13 22:00:00+00	\N	\N	f
1509	298	Supplement review	f	2026-03-12 21:57:05.880556	2026-03-12 21:45:00+00	2026-03-12 22:00:00+00	\N	\N	f
1510	302	Admin Email Review  • Acculynx Notification Review 	f	2026-03-13 14:06:28.382412	2026-03-13 14:00:00+00	2026-03-13 16:00:00+00	\N	\N	f
1511	302	15 min Break	t	2026-03-13 14:06:29.148712	2026-03-13 16:00:00+00	2026-03-13 16:15:00+00	\N	\N	f
1512	300	Supplementing with Rein	f	2026-03-13 14:07:08.19921	2026-03-13 06:15:00+00	2026-03-13 08:00:00+00	\N	\N	f
1513	300	15 min Break	t	2026-03-13 14:07:08.728866	2026-03-13 08:00:00+00	2026-03-13 08:15:00+00	\N	\N	f
1514	300	Supplementing with Rein • Review of supplement	f	2026-03-13 14:07:23.534539	2026-03-13 08:15:00+00	2026-03-13 10:00:00+00	\N	\N	f
1515	303	Team huddle with Tyler	f	2026-03-13 14:17:32.439783	2026-03-13 14:00:00+00	2026-03-13 14:15:00+00	\N	\N	f
1516	304	Pre-shift huddle	f	2026-03-13 14:23:25.628679	2026-03-13 02:00:00+00	2026-03-13 02:30:00+00	\N	\N	f
1517	303	Copying scope - DUNN	f	2026-03-13 14:54:41.640518	2026-03-13 14:30:00+00	2026-03-13 15:00:00+00	\N	\N	f
1518	303	Writing supplement - DUNN	f	2026-03-13 14:55:52.837107	2026-03-13 15:00:00+00	2026-03-13 16:00:00+00	\N	\N	f
1519	303	15 min Break	t	2026-03-13 14:55:58.362801	2026-03-13 16:00:00+00	2026-03-13 16:15:00+00	\N	\N	f
1520	305	Started at 10: 06pm  • Shadow on LJ task 	f	2026-03-13 16:00:33.161051	2026-03-13 14:00:00+00	2026-03-13 14:15:00+00	\N	\N	f
1521	305	15 min Break	t	2026-03-13 16:00:34.677608	2026-03-13 14:15:00+00	2026-03-13 14:30:00+00	\N	\N	f
1522	305	15 min Break	t	2026-03-13 16:00:49.782796	2026-03-13 16:00:00+00	2026-03-13 16:15:00+00	\N	\N	f
1523	302	Confirming supplement received - Demski • Confirming supplement received - Barie • Confirming depreciation released - Delaney	f	2026-03-13 16:18:09.76078	2026-03-13 16:15:00+00	2026-03-13 18:15:00+00	\N	\N	f
1524	305	Confirming supplement reviewed - 001 - Steinber 20 mins • Confirming supplement reviewed - 002 - Junker 20 mins • Confirming supplement reviewed - 146-EG-20260076: Demski 5 mins • 129-EG-2026-0026-Delaney Status of depreciation 5 mins • Confirming supplement received - 147-EG-20260149: Barie 5 mins	f	2026-03-13 17:43:17.332795	2026-03-13 16:15:00+00	2026-03-13 18:00:00+00	\N	\N	f
1525	303	Writing supplement - DUNN	f	2026-03-13 17:44:26.729425	2026-03-13 16:15:00+00	2026-03-13 17:00:00+00	\N	\N	f
1526	303	Writing supplement - LANG	f	2026-03-13 17:44:48.582903	2026-03-13 17:00:00+00	2026-03-13 18:00:00+00	\N	\N	f
1527	303	30 min Lunch	t	2026-03-13 17:44:51.452823	2026-03-13 18:00:00+00	2026-03-13 18:30:00+00	\N	\N	f
1528	305	Creating notes for acculynx to discuss with Tyler	f	2026-03-13 18:30:53.315562	2026-03-13 18:00:00+00	2026-03-13 18:30:00+00	\N	\N	f
1529	305	30 min Lunch	t	2026-03-13 18:30:54.745131	2026-03-13 18:30:00+00	2026-03-13 19:00:00+00	\N	\N	f
1530	302	30 min Lunch	t	2026-03-13 19:03:52.908673	2026-03-13 18:15:00+00	2026-03-13 18:45:00+00	\N	\N	f
1531	303	30 min Lunch	t	2026-03-13 19:11:57.35708	2026-03-13 18:00:00+00	2026-03-13 18:30:00+00	\N	\N	f
1532	302	Copy Docs -  Delgado • Copy Docs -  Robertson • Review 16 Projects waiting for Build 	f	2026-03-13 19:27:24.878616	2026-03-13 18:45:00+00	2026-03-13 20:45:00+00	\N	\N	f
1533	303	Writing supplement - DUNN	f	2026-03-13 19:32:06.025934	2026-03-13 18:30:00+00	2026-03-13 19:30:00+00	\N	\N	f
1534	303	Copying scope - ROBERTSON	f	2026-03-13 19:51:58.370756	2026-03-13 19:30:00+00	2026-03-13 20:00:00+00	\N	\N	f
1535	303	15 min Break	t	2026-03-13 20:36:50.271541	2026-03-13 20:00:00+00	2026-03-13 20:15:00+00	\N	\N	f
1536	304	Supplementing with Rein	f	2026-03-13 21:33:07.625031	2026-03-13 02:30:00+00	2026-03-13 04:00:00+00	\N	\N	f
1537	304	15 min Break	t	2026-03-13 21:33:10.545158	2026-03-13 04:00:00+00	2026-03-13 04:15:00+00	\N	\N	f
1538	304	Writing supplement - Tucker • Supplementing with Rein	f	2026-03-13 21:33:36.590423	2026-03-13 04:15:00+00	2026-03-13 06:00:00+00	\N	\N	f
1539	304	15 min Break	t	2026-03-13 21:33:37.195404	2026-03-13 06:00:00+00	2026-03-13 06:15:00+00	\N	\N	f
1540	304	Supplementing with Rein	f	2026-03-13 21:33:49.390542	2026-03-13 06:15:00+00	2026-03-13 08:00:00+00	\N	\N	f
1541	304	Supplementing with Rein • Review of supplement	f	2026-03-13 21:34:09.570223	2026-03-13 08:00:00+00	2026-03-13 10:00:00+00	\N	\N	f
1542	304	15 min Break	t	2026-03-13 21:34:22.663602	2026-03-13 10:00:00+00	2026-03-13 10:15:00+00	\N	\N	f
1543	304	15 min Break	t	2026-03-13 21:34:37.835678	2026-03-13 08:00:00+00	2026-03-13 08:15:00+00	\N	\N	f
1544	304	Supplementing with Rein • Review on Supplement - Rein's • Review on Supplement - Tucker (partial) • Post shift meeting	f	2026-03-13 21:35:23.275721	2026-03-13 08:15:00+00	2026-03-13 10:00:00+00	\N	\N	f
1545	303	Supplement review  • Team huddle	f	2026-03-13 21:35:24.328446	2026-03-13 20:15:00+00	2026-03-13 22:00:00+00	\N	\N	f
1546	302	15 min Break	t	2026-03-13 21:44:32.929128	2026-03-13 20:45:00+00	2026-03-13 21:00:00+00	\N	\N	f
1547	302	Acculynx Notes- for 9 Projects 	f	2026-03-13 21:44:51.877925	2026-03-13 21:00:00+00	2026-03-13 23:00:00+00	\N	\N	f
1548	305	Shadow on LJ task 	f	2026-03-13 21:46:33.344352	2026-03-13 19:00:00+00	2026-03-13 21:00:00+00	\N	\N	f
1549	305	Huddle with the team 	f	2026-03-13 21:46:46.8882	2026-03-13 21:00:00+00	2026-03-13 22:00:00+00	\N	\N	f
1550	306	Supplementing with Rein	f	2026-03-14 00:05:06.611052	2026-03-14 02:00:00+00	2026-03-14 04:00:00+00	\N	\N	f
1551	306	15 min Break	t	2026-03-14 00:05:07.239709	2026-03-14 04:00:00+00	2026-03-14 04:15:00+00	\N	\N	f
1552	306	Supplementing with Rein	f	2026-03-14 00:05:11.659461	2026-03-14 04:15:00+00	2026-03-14 06:00:00+00	\N	\N	f
1553	306	Rest	f	2026-03-14 00:06:09.039778	2026-03-14 06:00:00+00	2026-03-14 07:00:00+00	\N	\N	t
1554	306	Supplementing with Rein	f	2026-03-14 00:06:21.843518	2026-03-14 07:00:00+00	2026-03-14 08:00:00+00	\N	\N	f
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, name, created_at, role, status, last_login) FROM stdin;
7	lj@fullscopeestimating.com	$2a$10$OzeiH/yd3Nk5TxV2snTeb.ZhxdA8gbZ52qHopiXHk2ZIAEhHsYjbG	LJ	2026-01-28 04:18:44.969742	user	active	\N
8	dallin@fullscopeestimating.com	$2a$10$HH4NSl5PyU99IWU7xZIzauTA97R3702LvCNFT1NVjl1YNAGWkBMsS	Dallin	2026-01-28 04:22:30.686256	user	active	\N
9	trevor@fullscopeestimating.com	$2a$10$b2nuYMDtCg//UVK9jGHjAOnBoQMh72/IPgZSktHEiqNdylpsmE09W	Trevor	2026-01-28 04:31:46.186504	user	active	\N
4	crista@fullscopeestimating.com	$2a$10$11NVtefItRpZ2S31ZfxCCOV4UyDlIOZVdaYNqEbUrM/pa1eJYoAGu	Crista	2026-01-27 04:59:22.978979	user	active	\N
10	mitchell@fullscopeestimating.com	$2a$10$h6BOh6VVinupqXe.LKzci.x5vBsTUVtf.GVai7F/qoRIHW0X264UO	Mitchell	2026-02-07 00:42:14.861622	admin	active	\N
5	tyler@fullscopeestimating.com	$2a$10$11NVtefItRpZ2S31ZfxCCOV4UyDlIOZVdaYNqEbUrM/pa1eJYoAGu	Tyler	2026-01-27 05:02:02.797121	admin	active	\N
11	rein@fullscopeestimating.com	$2a$10$Q0YlPpWOXM4xvx//WUuyqu5VVe9qKCiVpv/ICkH9oAVrCwbuArNrm	Rein	2026-02-09 13:26:54.44413	user	active	\N
12	girly@fullscopeestimating.com	$2a$10$e6cCUpjwnuu/j9yQAJ9oDejZUDfJQ675sDqlO316uGuD5yqZZgbrW	Girly	2026-02-09 13:27:41.261462	user	active	\N
\.


--
-- Name: activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_log_id_seq', 363, true);


--
-- Name: invoice_number_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoice_number_seq', 2000, false);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 29, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 176, true);


--
-- Name: shifts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shifts_id_seq', 306, true);


--
-- Name: time_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.time_blocks_id_seq', 1554, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 12, true);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: shifts shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_pkey PRIMARY KEY (id);


--
-- Name: time_blocks time_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_blocks
    ADD CONSTRAINT time_blocks_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_activity_log_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_log_admin ON public.activity_log USING btree (admin_id);


--
-- Name: idx_activity_log_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_log_created ON public.activity_log USING btree (created_at DESC);


--
-- Name: idx_invoices_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_company ON public.invoices USING btree (company_name);


--
-- Name: idx_invoices_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_created_by ON public.invoices USING btree (created_by);


--
-- Name: idx_invoices_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_date ON public.invoices USING btree (invoice_date);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, read);


--
-- Name: idx_shifts_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shifts_date ON public.shifts USING btree (date);


--
-- Name: idx_shifts_date_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shifts_date_user ON public.shifts USING btree (date, user_id);


--
-- Name: idx_shifts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shifts_status ON public.shifts USING btree (status);


--
-- Name: idx_shifts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shifts_user_id ON public.shifts USING btree (user_id);


--
-- Name: idx_shifts_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shifts_user_status ON public.shifts USING btree (user_id, status);


--
-- Name: idx_time_blocks_shift_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_time_blocks_shift_id ON public.time_blocks USING btree (shift_id);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: activity_log activity_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: invoices invoices_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: notifications notifications_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shifts shifts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shifts
    ADD CONSTRAINT shifts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: time_blocks time_blocks_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_blocks
    ADD CONSTRAINT time_blocks_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict SbnJBWIHywme5MHxMQ2cKyZzSl2nzf7CglgP7sV2vign73XiGbqvteBD7jAOLKl

