-- One-time cleanup before the churchId-on-User migration.
-- User is about to get a required churchId column, but existing test
-- members have no church to belong to — so they (and everything that
-- references them) get cleared here rather than the migration failing.
--
-- CASCADE also truncates: Giving, Prayer, SermonNote, FeedPost, FeedComment,
-- FeedLike, MinistryMember, MinistryMessage, EventRegistration — anything
-- with a foreign key pointing at User. MinistryGroup, Event, Sermon,
-- LiveService and Announcement have no FK to User and are left untouched.
TRUNCATE TABLE "User" CASCADE;
