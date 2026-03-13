-- Migration 010: Ratings Table
-- Post-ride ratings between riders and drivers. Each participant in a booking
-- can rate the other exactly once.

BEGIN;

CREATE TABLE ratings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID NOT NULL,
    rater_id        UUID NOT NULL,
    ratee_id        UUID NOT NULL,

    score           SMALLINT NOT NULL,
    comment         TEXT,
    is_anonymous    BOOLEAN NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ratings_booking FOREIGN KEY (booking_id)
        REFERENCES bookings (id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_rater FOREIGN KEY (rater_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_ratee FOREIGN KEY (ratee_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_ratings_score CHECK (score >= 1 AND score <= 5),
    CONSTRAINT chk_ratings_self CHECK (rater_id != ratee_id),
    CONSTRAINT uq_ratings_booking_rater UNIQUE (booking_id, rater_id)
);

CREATE INDEX idx_ratings_booking ON ratings (booking_id);
CREATE INDEX idx_ratings_rater ON ratings (rater_id);
CREATE INDEX idx_ratings_ratee ON ratings (ratee_id);
CREATE INDEX idx_ratings_ratee_score ON ratings (ratee_id, score);
CREATE INDEX idx_ratings_created ON ratings (created_at);

COMMIT;
