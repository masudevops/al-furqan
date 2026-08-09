# Offline strategy

Quran.Foundation Developer Terms last updated 2025-06-13 prohibit caching or storing QF Content longer than one week unless expressly permitted. Al-Furqan therefore does not ship permanent Quran downloads or a full offline corpus in this milestone.

Planned safe PWA work: cache only the application shell and an offline explanation page; never precache Quran API responses. Any short-lived runtime Quran cache must expire within the documented window, support version invalidation/corrections, expose removal/repair, and be reviewed against current terms before release. Full-copy recovery, downloaded audio, or extended offline Quran requires explicit Foundation permission and owner confirmation.
