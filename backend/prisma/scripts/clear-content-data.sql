-- One-time cleanup before the churchId-on-content-tables migration.
-- MinistryGroup, Event, Sermon, Announcement, Giving, Prayer and FeedPost
-- are about to get a required churchId column, but existing rows (mostly
-- the old globally-seeded ministry groups) have no church to belong to.
--
-- CASCADE also truncates: MinistryMember, MinistryMessage,
-- EventRegistration, LiveService, FeedComment, FeedLike — anything with a
-- foreign key pointing at one of these tables.
TRUNCATE TABLE "MinistryGroup", "Event", "Sermon", "Announcement", "Giving", "Prayer", "FeedPost" CASCADE;
