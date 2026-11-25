-- PostgreSQL Schema Reference for database 'rytc'
-- Schema: public, Table: student

CREATE TABLE IF NOT EXISTS public.student (
    sid integer NOT NULL,
    sname text NOT NULL,
    phon integer NOT NULL,
    CONSTRAINT student_pkey PRIMARY KEY (sid)
);

-- Example Insert Data
-- INSERT INTO public.student (sid, sname, phon) VALUES (1001, 'สมชาย ใจดี', 812345678);
