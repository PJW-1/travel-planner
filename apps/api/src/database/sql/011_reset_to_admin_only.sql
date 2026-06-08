USE travel;

-- Reset script for local development.
-- This removes seeded/demo/app data and leaves only admin accounts in `users`.

DELETE FROM community_route_bookmarks;
DELETE FROM community_route_comments;
DELETE FROM community_route_likes;
DELETE FROM route_tags;
DELETE FROM community_routes;

DELETE FROM favorites;

DELETE FROM video_extracted_places;
DELETE FROM video_extractions;

DELETE FROM trip_stops;
DELETE FROM trip_days;
DELETE FROM trip_analyses;
DELETE FROM trips;

DELETE FROM trend_snapshots;
DELETE FROM places;

DELETE FROM users
WHERE role <> 'admin';
